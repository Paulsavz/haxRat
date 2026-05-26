import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const delivery = new Hono()

// GET /delivery/zones — all active delivery zones (public)
delivery.get('/zones', async (c) => {
  try {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('fee', { ascending: true })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /delivery/zones error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /delivery/zones/all — all zones including inactive (admin)
delivery.get('/zones/all', authenticate, requireAdmin, async (c) => {
  try {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /delivery/zones/all error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /delivery/zones — create zone (admin)
delivery.post('/zones', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { name, regions, fee, min_days, max_days } = body

    if (!name || !regions || fee === undefined) {
      return c.json({ success: false, message: 'name, regions, and fee are required' }, 400)
    }

    const { data, error } = await supabase
      .from('delivery_zones')
      .insert({ name, regions, fee, min_days: min_days ?? 1, max_days: max_days ?? 3, is_active: true })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (err) {
    console.error('POST /delivery/zones error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /delivery/zones/:id — update zone (admin)
delivery.put('/zones/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    delete body.id

    const { data, error } = await supabase
      .from('delivery_zones')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return c.json({ success: false, message: 'Delivery zone not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('PUT /delivery/zones/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// DELETE /delivery/zones/:id — delete zone (admin)
delivery.delete('/zones/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { error } = await supabase.from('delivery_zones').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true, message: 'Delivery zone deleted' })
  } catch (err) {
    console.error('DELETE /delivery/zones/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default delivery
