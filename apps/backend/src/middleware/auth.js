'use strict';

const supabase = require('../config/supabase');
const { AuthError, ForbiddenError } = require('../utils/errors');

/**
 * Verify the Supabase JWT from the Authorization header.
 * Attaches { id, email, role, ...profile } to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new AuthError('Invalid or expired token');
    }

    // Fetch the extended profile from the users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback: use minimal data from auth
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer',
      };
    } else {
      req.user = {
        ...profile,
        email: user.email,
      };
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require admin or support role.
 * Must be used after `authenticate`.
 */
function requireAdmin(req, res, next) {
  if (!req.user) return next(new AuthError());
  if (!['admin', 'support'].includes(req.user.role)) {
    return next(new ForbiddenError('Admin or support access required'));
  }
  next();
}

/**
 * Require non-customer role (admin or support staff).
 * Must be used after `authenticate`.
 */
function requireStaff(req, res, next) {
  if (!req.user) return next(new AuthError());
  if (req.user.role === 'customer') {
    return next(new ForbiddenError('Staff access required'));
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireStaff };
