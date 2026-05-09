import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const publicVapidKey = 'BK9znUJ6gFOJFnu1JPdOn8WFm1ccoBRJzhVpbmPVTEd1903in3aAvkP48eVKz6exKcz4dJD6a15uK33ooHfvmwo';
const privateVapidKey = 'lpGXRAbOMGF7EOyzGfgyOFA4xbdgw4p4UEVv3AJPtrk';

webpush.setVapidDetails(
  'mailto:support@schoolgo.edu',
  publicVapidKey,
  privateVapidKey
);

export const sendNativePush = async (subscription: any, title: string, body: string, data?: any) => {
  if (!subscription) {
    console.warn('>>> [WEBPUSH] No subscription provided. Skipping.');
    return;
  }

  try {
    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: data || {}
      }
    });

    await webpush.sendNotification(subscription, payload);
    console.log('>>> [WEBPUSH] Successfully sent notification.');
  } catch (error: any) {
    console.error('>>> [WEBPUSH] Error sending notification:', error.statusCode || error.message);
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.warn('>>> [WEBPUSH] Subscription has expired or is no longer valid.');
    }
  }
};
