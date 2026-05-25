'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { notifyUser } = require('../services/notifications');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

const paystackClient = axios.create({
  baseURL: PAYSTACK_API,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * POST /payments/paystack/initialize
 * Initialize a Paystack payment and get the authorization URL.
 */
router.post('/paystack/initialize', authenticate, async (req, res, next) => {
  try {
    const { order_id, callback_url } = req.body;

    if (!order_id) throw new ValidationError('order_id is required');

    if (!PAYSTACK_SECRET) {
      return error(res, 'Payment service is not configured', 503);
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, users(email, full_name)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) throw new NotFoundError('Order not found');

    if (order.user_id !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    if (order.payment_status === 'paid') {
      return error(res, 'Order has already been paid', 409);
    }

    const amountInKobo = Math.round(order.total * 100); // Paystack uses kobo

    const reference = `${order.order_number}-${Date.now()}`;

    const response = await paystackClient.post('/transaction/initialize', {
      email: order.users.email,
      amount: amountInKobo,
      reference,
      callback_url: callback_url || process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.users.full_name,
        custom_fields: [
          {
            display_name: 'Order Number',
            variable_name: 'order_number',
            value: order.order_number,
          },
        ],
      },
    });

    const { authorization_url, access_code } = response.data.data;

    // Store reference on the order
    await supabase
      .from('orders')
      .update({ payment_reference: reference, updated_at: new Date().toISOString() })
      .eq('id', order_id);

    return success(res, {
      authorization_url,
      access_code,
      reference,
      amount: order.total,
    }, 'Payment initialized');
  } catch (err) {
    if (err.response) {
      return error(res, err.response.data?.message || 'Paystack error', 400);
    }
    next(err);
  }
});

/**
 * POST /payments/paystack/verify
 * Verify a Paystack payment by reference.
 */
router.post('/paystack/verify', authenticate, async (req, res, next) => {
  try {
    const { reference } = req.body;

    if (!reference) throw new ValidationError('reference is required');

    if (!PAYSTACK_SECRET) {
      return error(res, 'Payment service is not configured', 503);
    }

    const response = await paystackClient.get(`/transaction/verify/${encodeURIComponent(reference)}`);
    const transaction = response.data.data;

    if (transaction.status !== 'success') {
      return error(res, `Payment not successful. Status: ${transaction.status}`, 400);
    }

    // Find order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (orderError || !order) {
      return error(res, 'Order not found for this payment reference', 404);
    }

    if (order.user_id !== req.user.id && !['admin', 'support'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    if (order.payment_status === 'paid') {
      return success(res, { order_id: order.id, payment_status: 'paid' }, 'Payment already verified');
    }

    // Verify amount matches
    const paidAmountInNaira = transaction.amount / 100;
    if (Math.abs(paidAmountInNaira - order.total) > 1) {
      return error(res, 'Payment amount mismatch', 400);
    }

    // Update order payment status
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: order.status === 'placed' ? 'confirmed' : order.status,
        payment_channel: transaction.channel,
        paid_at: transaction.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add status history if status changed
    if (order.status === 'placed') {
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'confirmed',
        note: 'Payment confirmed via Paystack',
        created_by: req.user.id,
      });
    }

    // Notify customer
    await notifyUser(
      order.user_id,
      'Payment Successful',
      `Your payment for order ${order.order_number} has been received.`,
      { order_id: order.id, type: 'payment_success' },
      'order',
      order.id
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.user_id}`).emit('order:payment_confirmed', {
        order_id: order.id,
        order_number: order.order_number,
        payment_status: 'paid',
      });
    }

    return success(res, {
      order_id: order.id,
      order_number: order.order_number,
      payment_status: 'paid',
      order: updated,
    }, 'Payment verified successfully');
  } catch (err) {
    if (err.response) {
      return error(res, err.response.data?.message || 'Paystack verification failed', 400);
    }
    next(err);
  }
});

/**
 * POST /payments/paystack/webhook
 * Handle Paystack webhook events with HMAC signature verification.
 */
router.post('/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'];
    if (!PAYSTACK_SECRET || !signature) {
      return res.status(400).json({ message: 'Invalid webhook' });
    }

    const body = req.body;
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(Buffer.isBuffer(body) ? body : JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(Buffer.isBuffer(body) ? body.toString() : body);

    // Acknowledge immediately
    res.status(200).json({ received: true });

    // Process event asynchronously
    setImmediate(async () => {
      try {
        if (event.event === 'charge.success') {
          const { reference, amount, metadata, channel, paid_at } = event.data;
          const orderId = metadata?.order_id;

          if (!orderId) return;

          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (!order || order.payment_status === 'paid') return;

          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: order.status === 'placed' ? 'confirmed' : order.status,
              payment_channel: channel,
              paid_at,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (order.status === 'placed') {
            await supabase.from('order_status_history').insert({
              order_id: orderId,
              status: 'confirmed',
              note: 'Payment confirmed via Paystack webhook',
            });
          }

          await notifyUser(
            order.user_id,
            'Payment Confirmed',
            `Your payment for order ${order.order_number} has been confirmed.`,
            { order_id: orderId, type: 'payment_success' },
            'order',
            orderId
          );

          const io = global._io;
          if (io) {
            io.to(`user:${order.user_id}`).emit('order:payment_confirmed', {
              order_id: orderId,
              order_number: order.order_number,
              payment_status: 'paid',
            });
          }
        }

        if (event.event === 'refund.processed') {
          const { transaction_reference } = event.data;
          if (transaction_reference) {
            const { data: order } = await supabase
              .from('orders')
              .select('*')
              .eq('payment_reference', transaction_reference)
              .single();

            if (order) {
              await supabase
                .from('orders')
                .update({ payment_status: 'refunded', updated_at: new Date().toISOString() })
                .eq('id', order.id);
            }
          }
        }
      } catch (webhookErr) {
        console.error('[Paystack Webhook] Processing error:', webhookErr.message);
      }
    });
  } catch (err) {
    console.error('[Paystack Webhook] Error:', err.message);
    res.status(200).json({ received: true }); // Always ack to prevent retries
  }
});

module.exports = router;
