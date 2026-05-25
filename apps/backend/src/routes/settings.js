'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * GET /settings
 * Get store settings. Public read.
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error: dbError } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    if (dbError || !data) {
      // Return sensible defaults if no settings row exists
      return success(res, {
        store_name: '',
        store_email: '',
        store_phone: '',
        store_address: '',
        store_logo_url: null,
        currency: 'NGN',
        currency_symbol: '₦',
        meta_title: '',
        meta_description: '',
        support_chat_enabled: true,
        support_calls_enabled: true,
        min_order_amount: 0,
        maintenance_mode: false,
      });
    }

    // Strip admin-only fields for public view
    const { webhook_secret, paystack_secret_key, ...publicSettings } = data;
    return success(res, publicSettings);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /settings
 * Update store settings (admin only). Uses upsert since there is one row.
 */
router.put('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const allowed = [
      'store_name', 'store_email', 'store_phone', 'store_address',
      'store_logo_url', 'currency', 'currency_symbol',
      'meta_title', 'meta_description',
      'support_chat_enabled', 'support_calls_enabled',
      'min_order_amount', 'maintenance_mode',
      'social_links', 'about_text', 'return_policy',
      'privacy_policy', 'terms_of_service',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updates.updated_at = new Date().toISOString();

    // Check if settings row exists
    const { data: existing } = await supabase
      .from('store_settings')
      .select('id')
      .single();

    let result;
    if (existing) {
      const { data, error: updateError } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = data;
    } else {
      const { data, error: insertError } = await supabase
        .from('store_settings')
        .insert({ ...updates })
        .select()
        .single();

      if (insertError) throw insertError;
      result = data;
    }

    const { webhook_secret, paystack_secret_key, ...safeResult } = result;
    return success(res, safeResult, 'Settings updated');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
