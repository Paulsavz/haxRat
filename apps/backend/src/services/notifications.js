'use strict';

const supabase = require('../config/supabase');
const { getMessaging } = require('../config/firebase');

/**
 * Send a push notification to a single FCM token.
 * @param {string} fcmToken
 * @param {string} title
 * @param {string} body
 * @param {Object} [data]
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  const messaging = getMessaging();
  if (!messaging || !fcmToken) return;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        notification: { sound: 'default', priority: 'high' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };
    const result = await messaging.send(message);
    return result;
  } catch (err) {
    console.error('[FCM] Failed to send push notification:', err.message);
  }
}

/**
 * Create a notification record in the database.
 * @param {string} userId
 * @param {string} title
 * @param {string} body
 * @param {string} type  e.g. 'order', 'chat', 'call', 'promo'
 * @param {string|null} referenceId
 */
async function createNotification(userId, title, body, type, referenceId = null) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      body,
      type,
      reference_id: referenceId,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Notifications] DB insert error:', error.message);
    return null;
  }
  return data;
}

/**
 * Notify all admin/support users with a push notification and DB record.
 * @param {string} title
 * @param {string} body
 * @param {Object} [data]
 * @param {string} [type]
 * @param {string|null} [referenceId]
 */
async function notifyAdmins(title, body, data = {}, type = 'system', referenceId = null) {
  const { data: admins, error } = await supabase
    .from('users')
    .select('id, fcm_token')
    .in('role', ['admin', 'support']);

  if (error || !admins) {
    console.error('[Notifications] Failed to fetch admins:', error?.message);
    return;
  }

  await Promise.allSettled(
    admins.map(async (admin) => {
      await createNotification(admin.id, title, body, type, referenceId);
      if (admin.fcm_token) {
        await sendPushNotification(admin.fcm_token, title, body, data);
      }
    })
  );
}

/**
 * Notify a specific user with a push notification and DB record.
 * @param {string} userId
 * @param {string} title
 * @param {string} body
 * @param {Object} [data]
 * @param {string} [type]
 * @param {string|null} [referenceId]
 */
async function notifyUser(userId, title, body, data = {}, type = 'system', referenceId = null) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, fcm_token')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('[Notifications] User not found:', userId);
    return;
  }

  await createNotification(userId, title, body, type, referenceId);
  if (user.fcm_token) {
    await sendPushNotification(user.fcm_token, title, body, data);
  }
}

module.exports = {
  sendPushNotification,
  createNotification,
  notifyAdmins,
  notifyUser,
};
