import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
    // Or you can use admin.credential.applicationDefault() if in a managed environment
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
