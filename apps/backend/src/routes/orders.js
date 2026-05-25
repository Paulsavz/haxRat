'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { createNotification, notifyAdmins, notifyUser } = require('../services/notifications');

/**
 * GET /orders
 * List orders. Customers see their own; admins see all with optional filters.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      status,
      payment_status,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order: sortDir = 'desc',
      customer_id,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const isAdmin = ['admin', 'support'].includes(req.user.role);

    let query = supabase
      .from('orders')
      .select(
        `id, order_number, status, payment_status, subtotal, delivery_fee,
         discount_amount, total, delivery_address, notes, created_at, updated_at,
         users(id, full_name, email, phone),
         order_items(id, quantity, unit_price, total_price, products(id, name, slug, images))`,
        { count: 'exact' }
      );

    if (!isAdmin) {
      query = query.eq('user_id', req.user.id);
    } else {
      if (customer_id) {
        query = query.eq('user_id', customer_id);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    const allowedSorts = ['created_at', 'total', 'status', 'updated_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
    const ascending = sortDir === 'asc';

    const { data, count, error: dbError } = await query
      .order(sortField, { ascending })
      .range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    return paginated(res, data, count, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /orders/:id
 * Get a single order (customer: own; admin: any).
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'support'].includes(req.user.role);

    const { data, error: dbError } = await supabase
      .from('orders')
      .select(
        `*, users(id, full_name, email, phone),
         order_items(id, quantity, unit_price, total_price, products(id, name, slug, images, price)),
         order_status_history(id, status, note, created_at, users(id, full_name))`
      )
      .eq('id', id)
      .single();

    if (dbError || !data) throw new NotFoundError('Order not found');

    if (!isAdmin && data.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    return success(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /orders
 * Create a new order.
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      items,
      delivery_address,
      delivery_zone_id,
      coupon_code,
      notes,
      payment_method,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('items array is required and cannot be empty');
    }
    if (!delivery_address) {
      throw new ValidationError('delivery_address is required');
    }

    // Validate and fetch products
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', productIds)
      .eq('is_active', true);

    if (productError) throw productError;

    const productMap = {};
    for (const p of products || []) {
      productMap[p.id] = p;
    }

    // Validate each item
    const validatedItems = [];
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        throw new ValidationError(`Product ${item.product_id} not found or unavailable`);
      }
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        throw new ValidationError(`Invalid quantity for product ${product.name}`);
      }
      if (product.stock_quantity < qty) {
        throw new ValidationError(
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`
        );
      }
      validatedItems.push({
        product_id: product.id,
        quantity: qty,
        unit_price: product.price,
        total_price: product.price * qty,
      });
    }

    // Calculate subtotal
    const subtotal = validatedItems.reduce((sum, i) => sum + i.total_price, 0);

    // Fetch delivery fee
    let deliveryFee = 0;
    if (delivery_zone_id) {
      const { data: zone } = await supabase
        .from('delivery_zones')
        .select('fee')
        .eq('id', delivery_zone_id)
        .eq('is_active', true)
        .single();
      if (zone) deliveryFee = zone.fee;
    }

    // Validate and apply coupon
    let discountAmount = 0;
    let couponId = null;
    if (coupon_code) {
      const now = new Date().toISOString();
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .lte('starts_at', now)
        .single();

      if (couponError || !coupon) {
        throw new ValidationError('Invalid or expired coupon code');
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new ValidationError('Coupon has expired');
      }
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        throw new ValidationError('Coupon usage limit reached');
      }
      if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
        throw new ValidationError(
          `Minimum order amount for this coupon is ${coupon.minimum_order_amount}`
        );
      }

      if (coupon.type === 'percentage') {
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else if (coupon.type === 'fixed') {
        discountAmount = Math.min(coupon.value, subtotal);
      }

      discountAmount = Math.round(discountAmount * 100) / 100;
      couponId = coupon.id;
    }

    const total = Math.max(0, subtotal + deliveryFee - discountAmount);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        order_number: orderNumber,
        status: 'placed',
        payment_status: 'pending',
        payment_method: payment_method || 'paystack',
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        total,
        delivery_address,
        delivery_zone_id: delivery_zone_id || null,
        coupon_id: couponId,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Decrement stock quantities
    await Promise.allSettled(
      validatedItems.map(async (item) => {
        const product = productMap[item.product_id];
        await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', item.product_id);
      })
    );

    // Increment coupon usage count
    if (couponId) {
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId }).catch(() => {
        // Fallback manual increment
        supabase
          .from('coupons')
          .select('usage_count')
          .eq('id', couponId)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('coupons')
                .update({ usage_count: (data.usage_count || 0) + 1 })
                .eq('id', couponId);
            }
          });
      });
    }

    // Create status history entry
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'placed',
      note: 'Order placed by customer',
      created_by: req.user.id,
    });

    // Send notifications
    await Promise.allSettled([
      createNotification(req.user.id, 'Order Placed', `Your order ${orderNumber} has been placed successfully.`, 'order', order.id),
      notifyAdmins('New Order', `New order ${orderNumber} received. Total: ${total}`, { order_id: order.id, type: 'new_order' }, 'order', order.id),
    ]);

    // Fetch full order
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*, products(id, name, slug, images))')
      .eq('id', order.id)
      .single();

    return success(res, fullOrder, 'Order created successfully', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /orders/:id/status
 * Update order status (admin only).
 */
router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      throw new ValidationError(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, users(id, full_name, fcm_token)')
      .eq('id', id)
      .single();

    if (fetchError || !order) throw new NotFoundError('Order not found');

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add status history
    await supabase.from('order_status_history').insert({
      order_id: id,
      status,
      note: note || null,
      created_by: req.user.id,
    });

    // Emit real-time socket event (io is attached to req.app)
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.user_id}`).emit('order:status_updated', {
        order_id: id,
        order_number: order.order_number,
        status,
        note,
      });
    }

    // Push notification to customer
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is being processed.',
      shipped: 'Your order is on the way!',
      delivered: 'Your order has been delivered. Enjoy!',
      cancelled: 'Your order has been cancelled.',
    };

    const notifBody = statusMessages[status] || `Order status updated to ${status}.`;
    await notifyUser(
      order.user_id,
      `Order ${order.order_number} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      notifBody,
      { order_id: id, type: 'order_status' },
      'order',
      id
    );

    return success(res, updated, 'Order status updated');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /orders/:id/cancel
 * Customer cancels their own order (only if status is 'placed').
 */
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(product_id, quantity)')
      .eq('id', id)
      .single();

    if (fetchError || !order) throw new NotFoundError('Order not found');

    const isAdmin = ['admin', 'support'].includes(req.user.role);
    if (!isAdmin && order.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    if (!isAdmin && order.status !== 'placed') {
      throw new ValidationError('Only orders with status "placed" can be cancelled');
    }

    // Restore stock
    await Promise.allSettled(
      (order.order_items || []).map(async (item) => {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity + item.quantity })
            .eq('id', item.product_id);
        }
      })
    );

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from('order_status_history').insert({
      order_id: id,
      status: 'cancelled',
      note: reason || 'Cancelled by customer',
      created_by: req.user.id,
    });

    // Notify admins
    await notifyAdmins(
      'Order Cancelled',
      `Order ${order.order_number} has been cancelled.`,
      { order_id: id, type: 'order_cancelled' },
      'order',
      id
    );

    return success(res, updated, 'Order cancelled successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /orders/:id/invoice
 * Generate invoice data for an order.
 */
router.get('/:id/invoice', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'support'].includes(req.user.role);

    const { data: order, error: dbError } = await supabase
      .from('orders')
      .select(
        `*, users(id, full_name, email, phone),
         order_items(id, quantity, unit_price, total_price, products(id, name, slug)),
         coupons(code, type, value)`
      )
      .eq('id', id)
      .single();

    if (dbError || !order) throw new NotFoundError('Order not found');

    if (!isAdmin && order.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    const invoice = {
      invoice_number: `INV-${order.order_number}`,
      order_number: order.order_number,
      issued_at: new Date().toISOString(),
      order_date: order.created_at,
      store: settings || {},
      customer: order.users,
      items: order.order_items,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      discount_amount: order.discount_amount,
      coupon: order.coupons || null,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      delivery_address: order.delivery_address,
      status: order.status,
    };

    return success(res, invoice);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
