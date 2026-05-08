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
    const currentToken = await getToken(messaging, {
      vapidKey: "BJ25i8tJsnRj00v1q10akCIZFZOGoPWNpMDDwdRWbyg2YQR9L1rfpYPGseuWihzWjZVRgia15ulSUZPfuv_jjBg" 
    });

    if (currentToken) {
      console.log('>>> [FIREBASE] FCM Token received:', currentToken);
      return currentToken;
    } else {
      console.log('>>> [FIREBASE] No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('>>> [FIREBASE] An error occurred while retrieving token:', err);
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
