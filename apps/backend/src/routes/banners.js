'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * GET /banners
 * List all active banners, ordered by display_order.
 */
router.get('/', async (req, res, next) => {
  try {
    const now = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('banners')
      .select('id, title, subtitle, image_url, cta_text, cta_link, display_order, created_at')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('display_order', { ascending: true });

    if (dbError) throw dbError;

    return success(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /banners
 * Create a banner (admin only).
 */
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      image_url,
      cta_text,
      cta_link,
      display_order,
      starts_at,
      expires_at,
      is_active,
    } = req.body;

    if (!title || !image_url) {
      throw new ValidationError('title and image_url are required');
    }

    const { data, error: dbError } = await supabase
      .from('banners')
      .insert({
        title,
        subtitle: subtitle || null,
        image_url,
        cta_text: cta_text || null,
        cta_link: cta_link || null,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : 0,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return success(res, data, 'Banner created', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /banners/:id
 * Update a banner (admin only).
 */
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = [
      'title', 'subtitle', 'image_url', 'cta_text', 'cta_link',
      'display_order', 'starts_at', 'expires_at', 'is_active',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;
    if (!data) throw new NotFoundError('Banner not found');

    return success(res, data, 'Banner updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /banners/:id
 * Delete a banner (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    return success(res, null, 'Banner deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
