'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /admin/dashboard
 * Summary stats for the admin panel.
 */
router.get('/dashboard', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [
      revenueTodayResult,
      ordersTodayResult,
      activeChatsResult,
      pendingOrdersResult,
      totalCustomersResult,
      recentOrdersResult,
    ] = await Promise.all([
      // Revenue today (paid orders)
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', todayISO)
        .eq('payment_status', 'paid'),

      // Orders today
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),

      // Active/open chats
      supabase
        .from('chats')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'pending']),

      // Pending orders (placed but not confirmed)
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['placed', 'confirmed', 'processing']),

      // Total customers
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'customer'),

      // Recent orders
      supabase
        .from('orders')
        .select(
          `id, order_number, status, payment_status, total, created_at,
           users(id, full_name, email)`
        )
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const revenueToday = (revenueTodayResult.data || []).reduce(
      (sum, o) => sum + (o.total || 0),
      0
    );

    return success(res, {
      revenue_today: revenueToday,
      orders_today: ordersTodayResult.count || 0,
      active_chats: activeChatsResult.count || 0,
      pending_orders: pendingOrdersResult.count || 0,
      total_customers: totalCustomersResult.count || 0,
      recent_orders: recentOrdersResult.data || [],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/customers
 * List all customers with their order counts and total spend.
 */
router.get('/customers', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('users')
      .select(
        `id, full_name, email, phone, created_at, updated_at,
         orders(id, total, status, payment_status)`,
        { count: 'exact' }
      )
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, count, error: dbError } = await query.range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    // Compute summary per customer
    const enriched = (data || []).map((customer) => {
      const orders = customer.orders || [];
      const totalSpend = orders
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return {
        ...customer,
        order_count: orders.length,
        total_spend: totalSpend,
        orders: undefined,
      };
    });

    return paginated(res, enriched, count, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/customers/:id
 * Get a customer profile with full order and chat history.
 */
router.get('/customers/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [userResult, ordersResult, chatsResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, full_name, email, phone, created_at, updated_at')
        .eq('id', id)
        .eq('role', 'customer')
        .single(),

      supabase
        .from('orders')
        .select(
          `id, order_number, status, payment_status, total, subtotal,
           delivery_fee, discount_amount, created_at, updated_at,
           order_items(id, quantity, unit_price, total_price, products(id, name, slug, images))`
        )
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('chats')
        .select(
          `id, status, subject, created_at, updated_at,
           assigned_to_user:users!chats_assigned_to_fkey(id, full_name),
           messages(id, content, sender_id, created_at)`
        )
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (userResult.error || !userResult.data) {
      throw new NotFoundError('Customer not found');
    }

    const orders = ordersResult.data || [];
    const totalSpend = orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return success(res, {
      customer: {
        ...userResult.data,
        order_count: orders.length,
        total_spend: totalSpend,
      },
      orders,
      chats: chatsResult.data || [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
