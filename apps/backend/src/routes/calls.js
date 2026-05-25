'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { createRoom, createToken, deleteRoom } = require('../services/daily');
const { notifyAdmins, notifyUser } = require('../services/notifications');

/**
 * POST /calls/request
 * Customer requests a video/audio call with support.
 */
router.post('/request', authenticate, async (req, res, next) => {
  try {
    const { type = 'video', notes } = req.body;

    if (!['video', 'audio'].includes(type)) {
      throw new ValidationError('type must be "video" or "audio"');
    }

    // Check for existing pending/active call from user
    const { data: existingCall } = await supabase
      .from('calls')
      .select('id, status')
      .eq('customer_id', req.user.id)
      .in('status', ['pending', 'active'])
      .maybeSingle();

    if (existingCall) {
      return error(res, 'You already have a pending or active call', 409);
    }

    // Create Daily.co room
    let room = null;
    let roomName = null;
    let roomUrl = null;

    // Generate a temp ID for the room before DB insert
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      room = await createRoom(tempId);
      roomName = room.name;
      roomUrl = room.url;
    } catch (dailyErr) {
      console.error('[Calls] Failed to create Daily.co room:', dailyErr.message);
      // Proceed without room — admins can retry
    }

    const { data: call, error: createError } = await supabase
      .from('calls')
      .insert({
        customer_id: req.user.id,
        type,
        status: 'pending',
        daily_room_name: roomName,
        daily_room_url: roomUrl,
        notes: notes || null,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    // Notify all admins via socket + push
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('call:requested', {
        call_id: call.id,
        customer: {
          id: req.user.id,
          full_name: req.user.full_name,
          email: req.user.email,
        },
        type,
        room_url: roomUrl,
      });
    }

    await notifyAdmins(
      'Call Request',
      `${req.user.full_name || req.user.email} is requesting a ${type} call.`,
      { call_id: call.id, type: 'call_request' },
      'call',
      call.id
    );

    return success(res, {
      call_id: call.id,
      status: 'pending',
      type,
      room_url: roomUrl,
      message: 'Your call request has been submitted. A support agent will join shortly.',
    }, 'Call requested', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /calls/:id/accept
 * Admin accepts a call — generates tokens for both parties.
 */
router.put('/:id/accept', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: call, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !call) throw new NotFoundError('Call not found');

    if (call.status !== 'pending') {
      return error(res, `Cannot accept a call with status "${call.status}"`, 400);
    }

    // Generate tokens
    let adminToken = null;
    let customerToken = null;

    if (call.daily_room_name) {
      try {
        [adminToken, customerToken] = await Promise.all([
          createToken(call.daily_room_name, req.user.id, true),
          createToken(call.daily_room_name, call.customer_id, false),
        ]);
      } catch (tokenErr) {
        console.error('[Calls] Failed to generate tokens:', tokenErr.message);
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'active',
        accepted_by: req.user.id,
        accepted_at: new Date().toISOString(),
        customer_token: customerToken,
        admin_token: adminToken,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Notify customer via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${call.customer_id}`).emit('call:accepted', {
        call_id: id,
        room_url: call.daily_room_url,
        token: customerToken,
        staff: { id: req.user.id, full_name: req.user.full_name },
      });
    }

    await notifyUser(
      call.customer_id,
      'Call Accepted',
      'A support agent has joined your call. Tap to join.',
      { call_id: id, room_url: call.daily_room_url, type: 'call_accepted' },
      'call',
      id
    );

    return success(res, {
      call: updated,
      room_url: call.daily_room_url,
      token: adminToken,
    }, 'Call accepted');
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /calls/:id/decline
 * Admin declines a call request.
 */
router.put('/:id/decline', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: call, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !call) throw new NotFoundError('Call not found');

    if (call.status !== 'pending') {
      return error(res, `Cannot decline a call with status "${call.status}"`, 400);
    }

    const { data: updated, error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'declined',
        declined_by: req.user.id,
        decline_reason: reason || null,
        ended_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Cleanup Daily.co room
    if (call.daily_room_name) {
      deleteRoom(call.daily_room_name).catch(() => {});
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${call.customer_id}`).emit('call:declined', {
        call_id: id,
        reason: reason || null,
      });
    }

    await notifyUser(
      call.customer_id,
      'Call Unavailable',
      reason || 'Our team is currently unavailable. Please try again later or use chat support.',
      { call_id: id, type: 'call_declined' },
      'call',
      id
    );

    return success(res, updated, 'Call declined');
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /calls/:id/end
 * End a call and record duration.
 */
router.put('/:id/end', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'support'].includes(req.user.role);

    const { data: call, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !call) throw new NotFoundError('Call not found');

    if (!isAdmin && call.customer_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    if (!['pending', 'active'].includes(call.status)) {
      return error(res, 'Call is already ended', 400);
    }

    const endedAt = new Date();
    let durationSeconds = null;
    if (call.accepted_at) {
      durationSeconds = Math.floor((endedAt - new Date(call.accepted_at)) / 1000);
    }

    const { data: updated, error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'ended',
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Cleanup Daily.co room
    if (call.daily_room_name) {
      deleteRoom(call.daily_room_name).catch(() => {});
    }

    // Notify other party
    const otherParty = isAdmin ? call.customer_id : call.accepted_by;
    if (otherParty) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${otherParty}`).emit('call:ended', {
          call_id: id,
          duration_seconds: durationSeconds,
          ended_by: req.user.id,
        });
      }
    }

    return success(res, {
      call: updated,
      duration_seconds: durationSeconds,
    }, 'Call ended');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /calls
 * Call history (admin: all; customer: own).
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const isAdmin = ['admin', 'support'].includes(req.user.role);

    let query = supabase
      .from('calls')
      .select(
        `id, type, status, daily_room_url, notes, requested_at, accepted_at, ended_at,
         duration_seconds, decline_reason, created_at,
         customer:users!calls_customer_id_fkey(id, full_name, email, phone),
         accepted_by_user:users!calls_accepted_by_fkey(id, full_name)`,
        { count: 'exact' }
      )
      .order('requested_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('customer_id', req.user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error: dbError } = await query.range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    return paginated(res, data, count, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
