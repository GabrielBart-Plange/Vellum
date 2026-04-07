import * as admin from 'firebase-admin';
import * as fs from 'fs';

if (!admin.apps.length) {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    if (serviceAccountJson) {
      // Clean the JSON string if it was appended with extra characters or improperly formatted
      let cleanJson = serviceAccountJson.trim();
      
      // Remove leading/trailing single quotes if they exist (added by PowerShell)
      if (cleanJson.startsWith("'") && cleanJson.endsWith("'")) {
        cleanJson = cleanJson.substring(1, cleanJson.length - 1).trim();
      }
      
      // Remove leading/trailing double quotes if they exist
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
        try {
          cleanJson = JSON.parse(cleanJson);
        } catch (e) {
          cleanJson = cleanJson.substring(1, cleanJson.length - 1).trim();
        }
      }
      
      const serviceAccount = typeof cleanJson === 'string' ? JSON.parse(cleanJson) : cleanJson;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[firebase-admin] Initialized via JSON string.');
    } else if (serviceAccountPath) {
      // Manually read the file to ensure it's loaded correctly in all environments
      if (fs.existsSync(serviceAccountPath)) {
        const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[firebase-admin] Initialized via file path: ' + serviceAccountPath);
      } else {
        // Fallback to applicationDefault if file exists check fails but env var is there
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('[firebase-admin] Initialized via applicationDefault (path: ' + serviceAccountPath + ').');
      }
    } else {
      console.warn('[firebase-admin] No credentials found. Admin SDK will not initialize.');
    }
  } catch (e) {
    console.error('[firebase-admin] Failed to initialize Firebase Admin:', e);
  }
}

const app = admin.apps[0] ?? null;
export const adminDb = app ? admin.firestore() : null as any;
export const adminAuth = app ? admin.auth() : null as any;
