importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBJ3EnTeDTCFDiJStPRafEcQkUSWQcx2ic",
  authDomain: "omini-6e4eb.firebaseapp.com",
  projectId: "omini-6e4eb",
  storageBucket: "omini-6e4eb.firebasestorage.app",
  messagingSenderId: "63070864769",
  appId: "1:63070864769:web:6fefbb27444fd83d221480",
  measurementId: "G-JN5GH11GTD"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
