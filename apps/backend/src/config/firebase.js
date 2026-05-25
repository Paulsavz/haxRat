'use strict';

const admin = require('firebase-admin');

let firebaseApp = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountEnv) {
    console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase] Admin SDK initialised');
    return firebaseApp;
  } catch (err) {
    console.error('[Firebase] Failed to initialise Admin SDK:', err.message);
    return null;
  }
}

function getMessaging() {
  const app = getFirebaseApp();
  if (!app) return null;
  return admin.messaging(app);
}

// Initialise eagerly so errors surface at startup
getFirebaseApp();

module.exports = { getFirebaseApp, getMessaging };
