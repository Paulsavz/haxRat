import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const settings = new Hono()

// GET /settings — all store settings as a flat key-value object (public)
settings.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')

    if (error) throw error

    // Convert array of {key, value} pairs to flat object, parsing JSON values
    const settingsObj = {}
    for (const row of data || []) {
      try {
        settingsObj[row.key] = JSON.parse(row.value)
      } catch {
        settingsObj[row.key] = row.value
      }
    }

    return c.json({ success: true, data: settingsObj })
  } catch (err) {
    console.error('GET /settings error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /settings/:key — single setting by key (public)
settings.get('/:key', async (c) => {
  try {
    const key = c.req.param('key')
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')
      .eq('key', key)
      .single()

    if (error || !data) return c.json({ success: false, message: 'Setting not found' }, 404)

    let value
    try { value = JSON.parse(data.value) } catch { value = data.value }

    return c.json({ success: true, data: { key: data.key, value } })
  } catch (err) {
    console.error('GET /settings/:key error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /settings — upsert one or many settings (admin)
// Body: { key: string, value: any } OR { settings: { key: value, ... } }
settings.put('/', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()

    let pairs = []
    if (body.settings && typeof body.settings === 'object') {
      pairs = Object.entries(body.settings).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value),
      }))
    } else if (body.key !== undefined && body.value !== undefined) {
      pairs = [{ key: body.key, value: JSON.stringify(body.value) }]
    } else {
      return c.json({ success: false, message: 'Provide { key, value } or { settings: {...} }' }, 400)
    }

    const { error } = await supabase
      .from('store_settings')
      .upsert(pairs, { onConflict: 'key' })

    if (error) throw error

    return c.json({ success: true, message: 'Settings updated' })
  } catch (err) {
    console.error('PUT /settings error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default settings
