import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const categories = new Hono()

// GET /categories — all active categories
categories.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return c.json({ success: true, data })
  } catch (err) {
    console.error('GET /categories error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /categories — create (admin)
categories.post('/', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { name, slug, icon, image_url, parent_id, sort_order } = body

    if (!name || !slug) {
      return c.json({ success: false, message: 'name and slug are required' }, 400)
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, icon, image_url, parent_id, sort_order: sort_order ?? 0, is_active: true })
      .select()
      .single()

    if (error) throw error

    return c.json({ success: true, data }, 201)
  } catch (err) {
    console.error('POST /categories error:', err)
    if (err.code === '23505') return c.json({ success: false, message: 'Slug already exists' }, 409)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /categories/:id — update (admin)
categories.put('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    delete body.id

    const { data, error } = await supabase
      .from('categories')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return c.json({ success: false, message: 'Category not found' }, 404)

    return c.json({ success: true, data })
  } catch (err) {
    console.error('PUT /categories/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// DELETE /categories/:id — delete (admin)
categories.delete('/:id', authenticate, requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error

    return c.json({ success: true, message: 'Category deleted' })
  } catch (err) {
    console.error('DELETE /categories/:id error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default categories
