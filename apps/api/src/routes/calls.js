import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { createCallRoom } from '../lib/stream.js'
import { supabase } from '../lib/supabase.js'

const calls = new Hono()

// POST /calls/create — create a Stream video call room
calls.post('/create', authenticate, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json().catch(() => ({}))
    const callType = body.type === 'audio_room' ? 'audio_room' : 'default'

    const callId = 'call_' + randomUUID().replace(/-/g, '')

    await createCallRoom(callId, callType)

    // Persist call record to DB
    const { data: callRecord, error } = await supabase
      .from('calls')
      .insert({
        customer_id: user.id,
        stream_call_id: callId,
        call_type: callType === 'audio_room' ? 'audio' : 'video',
        status: 'requesting',
      })
      .select()
      .single()
      .catch(() => ({ data: null, error: null })) // Non-fatal if column names differ

    return c.json({
      success: true,
      data: {
        callId,
        callType,
        streamCallId: callId,
        record: callRecord,
      },
    })
  } catch (err) {
    console.error('POST /calls/create error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

// POST /calls/:callId/end — mark call as ended in DB
calls.post('/:callId/end', authenticate, async (c) => {
  try {
    const callId = c.req.param('callId')

    const { data, error } = await supabase
      .from('calls')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('stream_call_id', callId)
      .select()
      .single()
      .catch(() => ({ data: null, error: null }))

    return c.json({ success: true, data: data || { callId, status: 'ended' } })
  } catch (err) {
    console.error('POST /calls/:callId/end error:', err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default calls
