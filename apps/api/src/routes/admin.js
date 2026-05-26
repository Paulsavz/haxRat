import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const admin = new Hono()

// GET /admin/dashboard — aggregated stats
admin.get('/dashboard', authenticate, requireAdmin, async (c) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    // Orders today
    const { count: ordersToday } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayISO)

    // Revenue today (paid orders)
    const { data: revenueRows } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', todayISO)

    const revenueToday = (revenueRows || []).reduce((sum, o) => sum + parseFloat(o.total || 0), 0)

    // Pending orders count
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'placed')

    // Total customers
    const { count: totalCustomers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')

    // Active chats (from Supabase chats table)
    const { count: activeChats } = await supabase
      .from('chats')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total revenue (all time)
    const { data: allRevenueRows } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')

    const totalRevenue = (allRevenueRows || []).reduce((sum, o) => sum + parseFloat(o.total || 0), 0)

    // Total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    // Recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total, created_at, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(5)

    return c.json({
      success: true,
      data: {
        orders_today: ordersToday || 0,
        revenue_today: parseFloat(revenueToday.toFixed(2)),
        pending_orders: pendingOrders || 0,
        total_customers: totalCustomers || 0,
        active_chats: activeChats || 0,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_products: totalProducts || 0,
        recent_orders: recentOrders || [],
      },
    })
  } catch (err) {
    console.error('GET /admin/dashboard error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default admin
