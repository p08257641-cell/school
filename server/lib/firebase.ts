import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'server', 'config', 'firebase-service-account.json');

let messaging: admin.messaging.Messaging | null = null;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    messaging = admin.messaging();
    console.log('>>> [FIREBASE] Firebase Admin initialized successfully.');
  } catch (err) {
    console.error('>>> [FIREBASE] Failed to initialize Firebase Admin:', err);
  }
} else {
  console.warn('>>> [FIREBASE] Service account file not found. Push notifications will be disabled.');
}

export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
  if (!messaging) {
    console.warn('>>> [FIREBASE] Messaging not initialized. Skipping notification.');
    return;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: token,
    };

    const response = await messaging.send(message);
    console.log('>>> [FIREBASE] Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('>>> [FIREBASE] Error sending message:', error);
    throw error;
  }
};
