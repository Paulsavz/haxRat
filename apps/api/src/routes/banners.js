import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const banners = new Hono()

// GET /banners — all active banners (public)
banners.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /banners error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /banners/all — all banners including inactive (admin)
banners.get('/all', authenticate, requireAdmin, async (c) => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /banners/all error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /banners — create (admin)
banners.post('/', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { title, subtitle, image_url, link, sort_order, is_active } = body

    if (!title || !image_url) {
      return c.json({ success: false, message: 'title and image_url are required' }, 400)
    }

    const { data, error } = await supabase
      .from('banners')
      .insert({ title, subtitle, image_url, link, sort_order: sort_order ?? 0, is_active: is_active ?? true })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (err) {
    console.error('POST /banners error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /banners/:id — update (admin)
banners.put('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    delete body.id

    const { data, error } = await supabase
      .from('banners')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return c.json({ success: false, message: 'Banner not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('PUT /banners/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// DELETE /banners/:id — delete (admin)
banners.delete('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
    return c.json({ success: true, message: 'Banner deleted' })
  } catch (err) {
    console.error('DELETE /banners/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default banners
