'use strict';

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * POST /auth/verify-otp
 * Verify a Supabase OTP and return the user profile.
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, phone, token, type } = req.body;

    if (!token || !type) {
      throw new ValidationError('token and type are required');
    }

    let verifyResult;
    if (type === 'sms' || type === 'phone') {
      if (!phone) throw new ValidationError('phone is required for sms OTP');
      verifyResult = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    } else {
      if (!email) throw new ValidationError('email is required for email OTP');
      verifyResult = await supabase.auth.verifyOtp({ email, token, type });
    }

    const { data, error: otpError } = verifyResult;
    if (otpError) {
      return error(res, otpError.message, 400);
    }

    const { user, session } = data;

    // Upsert user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          phone: user.phone || null,
          role: 'customer',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (profileError) {
      console.error('[Auth] Profile upsert error:', profileError.message);
    }

    return success(res, {
      user: profile || { id: user.id, email: user.email },
      session,
    }, 'OTP verified successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/update-fcm
 * Update the FCM token for push notifications.
 */
router.post('/update-fcm', authenticate, async (req, res, next) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) throw new ValidationError('fcm_token is required');

    const { error: updateError } = await supabase
      .from('users')
      .update({ fcm_token, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    if (updateError) {
      return error(res, 'Failed to update FCM token', 500);
    }

    return success(res, null, 'FCM token updated');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user profile.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      return error(res, 'User profile not found', 404);
    }

    // Remove sensitive fields
    const { fcm_token, ...safeProfile } = profile;
    return success(res, safeProfile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
