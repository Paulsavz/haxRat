import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const notifications = new Hono()

// GET /notifications — current user's notifications
notifications.get('/', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const { page = '1', limit = '30', unread } = c.req.query()

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (unread === 'true') query = query.eq('is_read', false)

    const { data, error, count } = await query
    if (error) throw error

    return c.json({
      success: true,
      data,
      meta: { total: count, page: pageNum, limit: limitNum, pages: Math.ceil(count / limitNum) },
    })
  } catch (err) {
    console.error('GET /notifications error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /notifications/:id/read — mark one notification as read
notifications.put('/:id/read', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return c.json({ success: true, message: 'Notification marked as read' })
  } catch (err) {
    console.error('PUT /notifications/:id/read error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// PUT /notifications/read-all — mark all as read for current user
notifications.put('/read-all', authenticate, async (c) => {
  try {
    const user = c.get('user')

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    return c.json({ success: true, message: 'All notifications marked as read' })
  } catch (err) {
    console.error('PUT /notifications/read-all error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /notifications — send a notification (admin broadcast or targeted)
notifications.post('/', authenticate, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const { user_id, title, body: notifBody, type, data } = body

    if (!title || !type) {
      return c.json({ success: false, message: 'title and type are required' }, 400)
    }

    // If user_id is provided send to that user; otherwise broadcast to all customers
    if (user_id) {
      const { data: notif, error } = await supabase
        .from('notifications')
        .insert({ user_id, title, body: notifBody, type, data: data || {}, is_read: false })
        .select()
        .single()

      if (error) throw error
      return c.json({ success: true, data: notif }, 201)
    } else {
      // Broadcast: fetch all customer IDs
      const { data: customers, error: custErr } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer')

      if (custErr) throw custErr

      const notifRows = (customers || []).map((cu) => ({
        user_id: cu.id,
        title,
        body: notifBody,
        type,
        data: data || {},
        is_read: false,
      }))

      if (notifRows.length > 0) {
        const { error: insertErr } = await supabase.from('notifications').insert(notifRows)
        if (insertErr) throw insertErr
      }

      return c.json({ success: true, message: `Notification sent to ${notifRows.length} customers` })
    }
  } catch (err) {
    console.error('POST /notifications error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default notifications
