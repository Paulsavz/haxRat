'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * POST /coupons/validate
 * Public endpoint: validate a coupon code for a given subtotal.
 */
router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) throw new ValidationError('coupon code is required');

    const orderSubtotal = parseFloat(subtotal) || 0;
    const now = new Date().toISOString();

    const { data: coupon, error: dbError } = await supabase
      .from('coupons')
      .select(
        'id, code, type, value, description, minimum_order_amount, max_discount_amount, usage_limit, usage_count, expires_at, is_active'
      )
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .lte('starts_at', now)
      .single();

    if (dbError || !coupon) {
      return error(res, 'Invalid or expired coupon code', 400);
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return error(res, 'This coupon has expired', 400);
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return error(res, 'This coupon has reached its usage limit', 400);
    }

    if (coupon.minimum_order_amount && orderSubtotal < coupon.minimum_order_amount) {
      return error(
        res,
        `Minimum order amount of ${coupon.minimum_order_amount} required for this coupon`,
        400
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderSubtotal * coupon.value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, orderSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return success(res, {
      coupon_id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
      discount_amount: discountAmount,
      free_delivery: coupon.type === 'free_delivery',
    }, 'Coupon is valid');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /coupons
 * List all coupons (admin only).
 */
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_active } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, count, error: dbError } = await query.range(offset, offset + limitNum - 1);

    if (dbError) throw dbError;

    return paginated(res, data, count, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /coupons
 * Create a coupon (admin only).
 */
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      code,
      type,
      value,
      description,
      minimum_order_amount,
      max_discount_amount,
      usage_limit,
      starts_at,
      expires_at,
      is_active,
    } = req.body;

    if (!code || !type || value === undefined) {
      throw new ValidationError('code, type and value are required');
    }

    const validTypes = ['percentage', 'fixed', 'free_delivery'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`type must be one of: ${validTypes.join(', ')}`);
    }

    if ((type === 'percentage' || type === 'fixed') && parseFloat(value) <= 0) {
      throw new ValidationError('value must be greater than 0');
    }

    const { data, error: dbError } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase().trim(),
        type,
        value: parseFloat(value),
        description: description || null,
        minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
        max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
        usage_limit: usage_limit ? parseInt(usage_limit, 10) : null,
        usage_count: 0,
        starts_at: starts_at || new Date().toISOString(),
        expires_at: expires_at || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return error(res, 'A coupon with this code already exists', 409);
      }
      throw dbError;
    }

    return success(res, data, 'Coupon created', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /coupons/:id
 * Update a coupon (admin only).
 */
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = [
      'code', 'type', 'value', 'description', 'minimum_order_amount',
      'max_discount_amount', 'usage_limit', 'starts_at', 'expires_at', 'is_active',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.code) {
      updates.code = updates.code.toUpperCase().trim();
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;
    if (!data) throw new NotFoundError('Coupon not found');

    return success(res, data, 'Coupon updated');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /coupons/:id
 * Delete a coupon (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    return success(res, null, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
