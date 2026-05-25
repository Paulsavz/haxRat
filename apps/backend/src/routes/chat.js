'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { notifyUser, notifyAdmins } = require('../services/notifications');

/**
 * GET /chats
 * Admins: all chats. Customers: their own chats.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const isAdmin = ['admin', 'support'].includes(req.user.role);

    let query = supabase
      .from('chats')
      .select(
        `id, status, created_at, updated_at,
         users!chats_user_id_fkey(id, full_name, email, phone),
         assigned_to_user:users!chats_assigned_to_fkey(id, full_name),
         messages(id, content, sender_id, created_at, is_read)`,
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', req.user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error: dbError } = await query.range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    // Attach unread count and last message
    const enriched = (data || []).map((chat) => {
      const msgs = chat.messages || [];
      const lastMessage = msgs[msgs.length - 1] || null;
      const unreadCount = msgs.filter(
        (m) => !m.is_read && m.sender_id !== req.user.id
      ).length;
      return {
        ...chat,
        last_message: lastMessage,
        unread_count: unreadCount,
        messages: undefined,
      };
    });

    return paginated(res, enriched, count, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /chats/:id
 * Get a chat with its messages.
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'support'].includes(req.user.role);

    const { data: chat, error: dbError } = await supabase
      .from('chats')
      .select(
        `*, users!chats_user_id_fkey(id, full_name, email, phone),
         assigned_to_user:users!chats_assigned_to_fkey(id, full_name),
         messages(id, content, sender_id, is_read, created_at, users(id, full_name, role))`
      )
      .eq('id', id)
      .order('created_at', { referencedTable: 'messages', ascending: true })
      .single();

    if (dbError || !chat) throw new NotFoundError('Chat not found');

    if (!isAdmin && chat.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    return success(res, chat);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /chats
 * Create a new chat or return existing open chat for a customer.
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subject } = req.body;
    const userId = req.user.id;

    // Check for existing open chat
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['open', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return success(res, existing, 'Existing chat returned');
    }

    // Create new chat
    const { data: chat, error: createError } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        subject: subject || null,
        status: 'open',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Notify admins of new chat
    await notifyAdmins(
      'New Support Chat',
      `${req.user.full_name || req.user.email} started a new support chat.`,
      { chat_id: chat.id, type: 'new_chat' },
      'chat',
      chat.id
    );

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('chat:new', {
        chat_id: chat.id,
        user: { id: req.user.id, full_name: req.user.full_name, email: req.user.email },
      });
    }

    return success(res, chat, 'Chat created', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /chats/:id/messages
 * Send a message in a chat.
 */
router.post('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const isAdmin = ['admin', 'support'].includes(req.user.role);

    if (!content || content.trim() === '') {
      throw new ValidationError('Message content is required');
    }

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();

    if (chatError || !chat) throw new NotFoundError('Chat not found');

    if (!isAdmin && chat.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    if (chat.status === 'closed') {
      return error(res, 'This chat is closed', 400);
    }

    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: id,
        sender_id: req.user.id,
        content: content.trim(),
        is_read: false,
      })
      .select('*, users(id, full_name, role)')
      .single();

    if (msgError) throw msgError;

    // Update chat updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${id}`).emit('chat:message', {
        chat_id: id,
        message,
      });
    }

    // Push notification to recipient
    if (isAdmin) {
      // Notify customer
      await notifyUser(
        chat.user_id,
        'New Message',
        content.length > 80 ? content.substring(0, 80) + '…' : content,
        { chat_id: id, type: 'chat_message' },
        'chat',
        id
      );
    } else {
      // Notify assigned staff or all admins
      if (chat.assigned_to) {
        await notifyUser(
          chat.assigned_to,
          'New Customer Message',
          content.length > 80 ? content.substring(0, 80) + '…' : content,
          { chat_id: id, type: 'chat_message' },
          'chat',
          id
        );
      } else {
        await notifyAdmins(
          'New Customer Message',
          content.length > 80 ? content.substring(0, 80) + '…' : content,
          { chat_id: id, type: 'chat_message' },
          'chat',
          id
        );
      }
    }

    return success(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /chats/:id/messages/read
 * Mark all messages in a chat as read for the current user.
 */
router.put('/:id/messages/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'support'].includes(req.user.role);

    const { data: chat } = await supabase
      .from('chats')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!chat) throw new NotFoundError('Chat not found');

    if (!isAdmin && chat.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    // Mark messages from other senders as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', id)
      .neq('sender_id', req.user.id)
      .eq('is_read', false);

    if (updateError) throw updateError;

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${id}`).emit('chat:messages_read', {
        chat_id: id,
        reader_id: req.user.id,
      });
    }

    return success(res, null, 'Messages marked as read');
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /chats/:id/assign
 * Assign a chat to a staff member (admin only).
 */
router.put('/:id/assign', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;

    if (!staff_id) throw new ValidationError('staff_id is required');

    // Verify staff exists and is admin/support
    const { data: staff, error: staffError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', staff_id)
      .in('role', ['admin', 'support'])
      .single();

    if (staffError || !staff) {
      return error(res, 'Staff member not found or not eligible', 404);
    }

    const { data: chat, error: updateError } = await supabase
      .from('chats')
      .update({
        assigned_to: staff_id,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!chat) throw new NotFoundError('Chat not found');

    // Notify assigned staff
    await notifyUser(
      staff_id,
      'Chat Assigned',
      `A support chat has been assigned to you.`,
      { chat_id: id, type: 'chat_assigned' },
      'chat',
      id
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${staff_id}`).emit('chat:assigned', { chat_id: id, chat });
    }

    return success(res, chat, 'Chat assigned successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
