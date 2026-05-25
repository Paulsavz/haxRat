'use strict';

const axios = require('axios');

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = 'https://api.daily.co/v1';

const dailyClient = axios.create({
  baseURL: DAILY_API_BASE,
  headers: {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Create a Daily.co room for a call.
 * @param {string} callId  Used to name the room uniquely.
 * @returns {Promise<{name: string, url: string, ...}>}
 */
async function createRoom(callId) {
  if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY is not set');

  const roomName = `call-${callId}`;
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 2; // 2-hour expiry

  const { data } = await dailyClient.post('/rooms', {
    name: roomName,
    privacy: 'private',
    properties: {
      exp,
      enable_chat: true,
      enable_screenshare: false,
      start_video_off: false,
      start_audio_off: false,
      max_participants: 5,
    },
  });

  return data;
}

/**
 * Create a Daily.co meeting token.
 * @param {string} roomName
 * @param {string} userId
 * @param {boolean} isOwner  Owners can kick participants and control the room.
 * @returns {Promise<string>}  The token string.
 */
async function createToken(roomName, userId, isOwner = false) {
  if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY is not set');

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 2; // 2-hour expiry

  const { data } = await dailyClient.post('/meeting-tokens', {
    properties: {
      room_name: roomName,
      user_id: String(userId),
      is_owner: isOwner,
      exp,
      enable_recording: isOwner ? 'cloud' : undefined,
    },
  });

  return data.token;
}

/**
 * Delete a Daily.co room (cleanup after call ends).
 * @param {string} roomName
 */
async function deleteRoom(roomName) {
  if (!DAILY_API_KEY) return;

  try {
    await dailyClient.delete(`/rooms/${roomName}`);
  } catch (err) {
    // Non-critical — log and continue
    console.error('[Daily] Failed to delete room:', err.message);
  }
}

module.exports = { createRoom, createToken, deleteRoom };
