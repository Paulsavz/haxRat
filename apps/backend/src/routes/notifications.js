'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { success, paginated } = require('../utils/response');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

/**
 * GET /notifications
 * Get the current user's notifications, paginated.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (unread_only === 'true' || unread_only === '1') {
      query = query.eq('is_read', false);
    }

    const { data, count, error: dbError } = await query.range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    const unreadCount = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    return res.status(200).json({
      success: true,
      message: 'Success',
      data,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((count || 0) / limitNum),
      },
      unread_count: unreadCount.count || 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /notifications/read
 * Mark all of the current user's notifications as read.
 */
router.put('/read', authenticate, async (req, res, next) => {
  try {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (updateError) throw updateError;

    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /notifications/:id/read
 * Mark a single notification as read.
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: notif, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !notif) throw new NotFoundError('Notification not found');

    if (notif.user_id !== req.user.id) {
      throw new ForbiddenError('Access denied');
    }

    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return success(res, updated, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
