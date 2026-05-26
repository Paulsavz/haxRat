import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { streamChat } from '../lib/stream.js'

const orders = new Hono()

// GET /orders — customer sees own orders; admin sees all with optional ?status filter
orders.get('/', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const { status, page = '1', limit = '20' } = c.req.query()

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(name, images))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const isAdmin = ['admin', 'support'].includes(user.role)
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw error

    return c.json({
      success: true,
      data,
      meta: { total: count, page: pageNum, limit: limitNum, pages: Math.ceil(count / limitNum) },
    })
  } catch (err) {
    console.error('GET /orders error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /orders/:id — single order with items
orders.get('/:id', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    const isAdmin = ['admin', 'support'].includes(user.role)

    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(name, images, slug)), order_status_history(*)')
      .eq('id', id)

    if (!isAdmin) query = query.eq('user_id', user.id)

    const { data, error } = await query.single()
    if (error || !data) return c.json({ success: false, message: 'Order not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /orders/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /orders — create order
orders.post('/', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { items, address, coupon_code, delivery_zone_id, payment_method, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, message: 'Order must contain at least one item' }, 400)
    }
    if (!address) {
      return c.json({ success: false, message: 'Delivery address is required' }, 400)
    }

    // Validate stock and collect product data
    const productIds = items.map((i) => i.product_id)
    const { data: productRows, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, images, stock, is_active')
      .in('id', productIds)

    if (prodErr) throw prodErr

    const productMap = Object.fromEntries(productRows.map((p) => [p.id, p]))

    for (const item of items) {
      const product = productMap[item.product_id]
      if (!product || !product.is_active) {
        return c.json({ success: false, message: `Product ${item.product_id} not found or inactive` }, 400)
      }
      if (product.stock < item.quantity) {
        return c.json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        }, 400)
      }
    }

    // Calculate subtotal
    let subtotal = 0
    const orderItems = items.map((item) => {
      const product = productMap[item.product_id]
      const unitPrice = parseFloat(product.price)
      const totalPrice = unitPrice * item.quantity
      subtotal += totalPrice
      return {
        product_id: item.product_id,
        product_name: product.name,
        product_image: product.images?.[0] || null,
        variant: item.variant || null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      }
    })

    // Delivery fee from zone
    let deliveryFee = 0
    if (delivery_zone_id) {
      const { data: zone } = await supabase
        .from('delivery_zones')
        .select('fee')
        .eq('id', delivery_zone_id)
        .eq('is_active', true)
        .single()
      if (zone) deliveryFee = parseFloat(zone.fee)
    }

    // Coupon discount
    let discount = 0
    let couponId = null
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (coupon) {
        const now = new Date()
        const expired = coupon.expires_at && new Date(coupon.expires_at) < now
        const maxed = coupon.max_uses != null && coupon.uses_count >= coupon.max_uses
        const minOk = subtotal >= (coupon.min_order_amount || 0)

        if (!expired && !maxed && minOk) {
          if (coupon.discount_type === 'percentage') {
            discount = (subtotal * parseFloat(coupon.discount_value)) / 100
          } else {
            discount = Math.min(parseFloat(coupon.discount_value), subtotal)
          }
          couponId = coupon.id
        }
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount)

    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'placed',
        payment_status: 'pending',
        payment_method: payment_method || null,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        coupon_id: couponId,
        address,
        delivery_zone_id: delivery_zone_id || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderErr) throw orderErr

    // Insert order items
    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })))

    if (itemsErr) throw itemsErr

    // Decrement stock
    for (const item of items) {
      await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity }).catch(() => {
        // fallback if rpc not defined
        supabase
          .from('products')
          .update({ stock: productMap[item.product_id].stock - item.quantity })
          .eq('id', item.product_id)
      })
    }

    // Increment coupon uses
    if (couponId) {
      await supabase.rpc('increment', { table: 'coupons', column: 'uses_count', id: couponId }).catch(() => {
        supabase.from('coupons').update({ uses_count: supabase.raw('uses_count + 1') }).eq('id', couponId)
      })
    }

    // Send Stream chat system message to admin channel
    try {
      const channelId = `support_${user.id}`
      const channel = streamChat.channel('messaging', channelId, {
        members: [user.id],
        created_by_id: user.id,
      })
      await channel.getOrCreate()
      await channel.sendMessage({
        text: `New order placed: ${order.order_number} — Total: ${total.toFixed(2)}`,
        type: 'system',
        user_id: 'system',
      })
    } catch (streamErr) {
      // Non-fatal: stream notification failure should not block order creation
      console.warn('Stream notification failed:', streamErr.message)
    }

    return c.json({ success: true, data: order }, 201)
  } catch (err) {
    console.error('POST /orders error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /orders/:id/status — update status (admin), notify via Stream
orders.put('/:id/status', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { status, note } = await c.req.json()

    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, message: 'Invalid status' }, 400)
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, users(id, name, email)')
      .single()

    if (error || !order) return c.json({ success: false, message: 'Order not found' }, 404)

    // Add status history note if provided
    if (note) {
      await supabase.from('order_status_history').insert({
        order_id: id,
        status,
        note,
        created_by: c.get('user').id,
      })
    }

    // Stream chat notification to customer
    try {
      const customerId = order.user_id
      const channelId = `support_${customerId}`
      const channel = streamChat.channel('messaging', channelId)
      await channel.getOrCreate()
      await channel.sendMessage({
        text: `Your order ${order.order_number} status has been updated to: ${status.toUpperCase()}`,
        type: 'system',
        user_id: 'system',
      })
    } catch (streamErr) {
      console.warn('Stream status notification failed:', streamErr.message)
    }

    return c.json({ success: true, data: order })
  } catch (err) {
    console.error('PUT /orders/:id/status error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /orders/:id/cancel — cancel if status=placed (customer)
orders.post('/:id/cancel', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')

    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) return c.json({ success: false, message: 'Order not found' }, 404)

    const isAdmin = ['admin', 'support'].includes(user.role)
    if (!isAdmin && existing.user_id !== user.id) {
      return c.json({ success: false, message: 'Forbidden' }, 403)
    }

    if (existing.status !== 'placed') {
      return c.json({ success: false, message: `Cannot cancel an order with status "${existing.status}"` }, 400)
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data: order })
  } catch (err) {
    console.error('POST /orders/:id/cancel error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default orders
