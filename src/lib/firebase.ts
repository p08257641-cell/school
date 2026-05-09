import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBJ3EnTeDTCFDiJStPRafEcQkUSWQcx2ic",
  authDomain: "omini-6e4eb.firebaseapp.com",
  projectId: "omini-6e4eb",
  storageBucket: "omini-6e4eb.firebasestorage.app",
  messagingSenderId: "63070864769",
  appId: "1:63070864769:web:6fefbb27444fd83d221480",
  measurementId: "G-JN5GH11GTD"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestForToken = async () => {
  if (!messaging) return null;

  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('>>> [FIREBASE] Notification permission was NOT granted:', permission);
        return null;
      }
    }

    // Attempt to get token
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: "BJ25i8tJsnRj00v1q10akCIZFZOGoPWNpMDDwdRWbyg2YQR9L1rfpYPGseuWihzWjZVRgia15ulSUZPfuv_jjBg" 
      });

      if (currentToken) {
        console.log('>>> [FIREBASE] FCM Token received successfully');
        return currentToken;
      } else {
        console.warn('>>> [FIREBASE] No registration token available.');
        return null;
      }
    } catch (tokenErr: any) {
      console.error('>>> [FIREBASE] getToken error details:', {
        message: tokenErr.message,
        code: tokenErr.code,
        stack: tokenErr.stack
      });
      return null;
    }
  } catch (err: any) {
    console.error('>>> [FIREBASE] General error in requestForToken:', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
