import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const coupons = new Hono()

// GET /coupons — list all coupons (admin)
coupons.get('/', authenticate, requireAdmin, async (c) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /coupons error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /coupons/validate — check if a coupon code is valid (authenticated customers)
coupons.post('/validate', authenticate, async (c) => {
  try {
    const { code, order_amount } = await c.req.json()

    if (!code) return c.json({ success: false, message: 'code is required' }, 400)

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !coupon) return c.json({ success: false, message: 'Invalid or expired coupon code' }, 404)

    const now = new Date()
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return c.json({ success: false, message: 'Coupon has expired' }, 400)
    }

    if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses) {
      return c.json({ success: false, message: 'Coupon usage limit reached' }, 400)
    }

    const amount = parseFloat(order_amount || 0)
    if (amount < (coupon.min_order_amount || 0)) {
      return c.json({
        success: false,
        message: `Minimum order amount for this coupon is ${coupon.min_order_amount}`,
      }, 400)
    }

    let discount = 0
    if (coupon.discount_type === 'percentage') {
      discount = (amount * parseFloat(coupon.discount_value)) / 100
    } else {
      discount = Math.min(parseFloat(coupon.discount_value), amount)
    }

    return c.json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: parseFloat(discount.toFixed(2)),
      },
    })
  } catch (err) {
    console.error('POST /coupons/validate error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /coupons — create coupon (admin)
coupons.post('/', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = body

    if (!code || !discount_type || discount_value === undefined) {
      return c.json({ success: false, message: 'code, discount_type, and discount_value are required' }, 400)
    }
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return c.json({ success: false, message: 'discount_type must be "percentage" or "fixed"' }, 400)
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        discount_type,
        discount_value,
        min_order_amount: min_order_amount ?? 0,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        is_active: true,
        uses_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (err) {
    console.error('POST /coupons error:', err)
    if (err.code === '23505') return c.json({ success: false, message: 'Coupon code already exists' }, 409)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /coupons/:id — update coupon (admin)
coupons.put('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    delete body.id

    const { data, error } = await supabase
      .from('coupons')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return c.json({ success: false, message: 'Coupon not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('PUT /coupons/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// DELETE /coupons/:id — delete coupon (admin)
coupons.delete('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true, message: 'Coupon deleted' })
  } catch (err) {
    console.error('DELETE /coupons/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default coupons
