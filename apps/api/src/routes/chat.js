import { Hono } from 'hono'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { streamChat, generateChatToken, upsertStreamUser } from '../lib/stream.js'

const chat = new Hono()

// POST /chat/channel — create or get a Stream chat channel between customer and admin/support
chat.post('/channel', authenticate, async (c) => {
  try {
    const user = c.get('user')

    // Ensure the user exists in Stream before creating a channel
    await upsertStreamUser(user)

    const channelId = `support_${user.id}`

    // Create or get the messaging channel
    const channel = streamChat.channel('messaging', channelId, {
      name: `Support — ${user.name || user.email || user.id}`,
      members: [user.id],
      created_by_id: user.id,
    })

    await channel.getOrCreate()

    const chatToken = generateChatToken(user.id)

    return c.json({
      success: true,
      data: {
        channelId,
        channelType: 'messaging',
        chatToken,
        apiKey: process.env.STREAM_API_KEY,
      },
    })
  } catch (err) {
    console.error('POST /chat/channel error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// GET /chat/channels — list all support channels (admin)
chat.get('/channels', authenticate, requireAdmin, async (c) => {
  try {
    const { page = '1', limit = '20' } = c.req.query()
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)))
    const offset = (pageNum - 1) * limitNum

    // Query Stream for all messaging channels with id prefix 'support_'
    const filter = { type: 'messaging', id: { $autocomplete: 'support_' } }
    const sort = [{ last_message_at: -1 }]
    const options = { limit: limitNum, offset }

    const channels = await streamChat.queryChannels(filter, sort, options)

    return c.json({
      success: true,
      data: channels.map((ch) => ({
        id: ch.id,
        cid: ch.cid,
        name: ch.data?.name,
        member_count: ch.data?.member_count,
        last_message_at: ch.data?.last_message_at,
        created_at: ch.data?.created_at,
      })),
      meta: { page: pageNum, limit: limitNum },
    })
  } catch (err) {
    console.error('GET /chat/channels error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default chat
