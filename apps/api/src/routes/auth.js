import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'
import {
  generateChatToken,
  generateVideoToken,
  upsertStreamUser,
  streamChat,
} from '../lib/stream.js'
import { randomUUID } from 'crypto'

const auth = new Hono()

// POST /auth/stream-token
// Returns Stream chat + video tokens for the authenticated user
auth.post('/stream-token', authenticate, async (c) => {
  try {
    const user = c.get('user')

    // Ensure the user exists in Stream
    await upsertStreamUser(user)

    // Update stream_user_id in users table
    await supabase
      .from('users')
      .update({ stream_user_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    const chatToken = generateChatToken(user.id)
    const videoToken = generateVideoToken(user.id)

    return c.json({
      success: true,
      data: {
        chatToken,
        videoToken,
        userId: user.id,
        apiKey: process.env.STREAM_API_KEY,
      },
    })
  } catch (err) {
    console.error('stream-token error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /auth/register-guest
// Creates a guest Stream user and returns a chat token
auth.post('/register-guest', async (c) => {
  try {
    const body = await c.req.json()
    const { name, phone } = body

    if (!name) {
      return c.json({ success: false, message: 'name is required' }, 400)
    }

    const guestId = 'guest_' + randomUUID().replace(/-/g, '')

    await streamChat.upsertUser({
      id: guestId,
      name: name || 'Guest',
      phone: phone || '',
      role: 'user',
    })

    const chatToken = generateChatToken(guestId)

    return c.json({
      success: true,
      data: {
        chatToken,
        userId: guestId,
        apiKey: process.env.STREAM_API_KEY,
      },
    })
  } catch (err) {
    console.error('register-guest error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /auth/me — return the authenticated user's profile
auth.get('/me', authenticate, async (c) => {
  const user = c.get('user')
  return c.json({ success: true, data: user })
})

// POST /auth/update-fcm — update FCM token in users table
auth.post('/update-fcm', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { fcm_token } = body

    if (!fcm_token) {
      return c.json({ success: false, message: 'fcm_token is required' }, 400)
    }

    const { error } = await supabase
      .from('users')
      .update({ fcm_token, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) throw error

    return c.json({ success: true, message: 'FCM token updated' })
  } catch (err) {
    console.error('update-fcm error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default auth
