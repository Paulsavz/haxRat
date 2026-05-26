import { Hono } from 'hono'
import { createHmac } from 'crypto'
import axios from 'axios'
import { supabase } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const payments = new Hono()

const PAYSTACK_BASE = 'https://api.paystack.co'

// POST /payments/paystack/initialize — init Paystack payment for an order
payments.post('/paystack/initialize', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const { order_id, callback_url } = await c.req.json()

    if (!order_id) return c.json({ success: false, message: 'order_id is required' }, 400)

    // Fetch the order
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (error || !order) return c.json({ success: false, message: 'Order not found' }, 404)

    if (order.payment_status === 'paid') {
      return c.json({ success: false, message: 'Order already paid' }, 400)
    }

    // Initialize with Paystack (amount in kobo/pesewas — multiply by 100)
    const amountInMinor = Math.round(parseFloat(order.total) * 100)

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email: user.email,
        amount: amountInMinor,
        reference: `${order.order_number}-${Date.now()}`,
        callback_url: callback_url || process.env.PAYSTACK_CALLBACK_URL || '',
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          user_id: user.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const { data: psData } = response.data

    // Store reference on the order
    await supabase
      .from('orders')
      .update({ payment_reference: psData.reference, updated_at: new Date().toISOString() })
      .eq('id', order.id)

    return c.json({
      success: true,
      data: {
        authorization_url: psData.authorization_url,
        access_code: psData.access_code,
        reference: psData.reference,
      },
    })
  } catch (err) {
    console.error('paystack/initialize error:', err?.response?.data || err.message)
    return c.json({ success: false, message: err?.response?.data?.message || err.message }, 500)
  }
})

// POST /payments/paystack/verify — verify reference, update order payment_status
payments.post('/paystack/verify', authenticate, async (c) => {
  try {
    const { reference } = await c.req.json()

    if (!reference) return c.json({ success: false, message: 'reference is required' }, 400)

    const response = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })

    const { data: txn } = response.data

    if (txn.status !== 'success') {
      return c.json({ success: false, message: `Payment not successful: ${txn.status}` }, 400)
    }

    // Find order by reference
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('payment_reference', reference)
      .single()

    if (orderErr || !order) {
      return c.json({ success: false, message: 'Order not found for this reference' }, 404)
    }

    if (order.payment_status === 'paid') {
      return c.json({ success: true, message: 'Already marked as paid', data: order })
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateErr) throw updateErr

    return c.json({ success: true, data: updated })
  } catch (err) {
    console.error('paystack/verify error:', err?.response?.data || err.message)
    return c.json({ success: false, message: err?.response?.data?.message || err.message }, 500)
  }
})

// POST /payments/paystack/webhook — HMAC-verified Paystack webhook handler
payments.post('/paystack/webhook', async (c) => {
  try {
    const signature = c.req.header('x-paystack-signature')
    const rawBody = await c.req.text()

    // Verify HMAC-SHA512 signature
    const hash = createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      return c.json({ success: false, message: 'Invalid signature' }, 400)
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'charge.success') {
      const txn = event.data
      const reference = txn.reference

      const { data: order } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('payment_reference', reference)
        .single()

      if (order && order.payment_status !== 'paid') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
      }
    }

    if (event.event === 'charge.failed') {
      const txn = event.data
      const reference = txn.reference

      const { data: order } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('payment_reference', reference)
        .single()

      if (order && order.payment_status === 'pending') {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', order.id)
      }
    }

    // Always acknowledge receipt to Paystack
    return c.json({ received: true })
  } catch (err) {
    console.error('paystack/webhook error:', err.message)
    return c.json({ received: true }) // Still acknowledge to prevent retries
  }
})

export default payments
