import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!serviceAccountJson) {
    console.warn('[firebase-admin] GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Admin SDK will not initialize.');
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      console.error('[firebase-admin] Failed to parse service account JSON:', e);
    }
  }
}

const app = admin.apps[0] ?? null;
export const adminDb = app ? admin.firestore() : null as any;
export const adminAuth = app ? admin.auth() : null as any;
