import { admin } from '../firebase/firestore';
import { db } from '../firebase/firestore';
import { getDistanceFromLatLonInM } from './geo';
interface Groove {
  coordinates: { lat: number; lng: number };
  message?: string;
}

export const sendNearbyNotifications = async (newGroove: Groove) => {
  const usersSnapshot = await db.collection('users').get();

  usersSnapshot.forEach(userDoc => {
    const user = userDoc.data();
    if (!user.deviceToken || !user.location) return;

    const distance = getDistanceFromLatLonInM(
      newGroove.coordinates.lat,
      newGroove.coordinates.lng,
      user.location.lat,
      user.location.lng
    );

    if (distance <= 500) {
      const message = {
        token: user.deviceToken,
        notification: {
          title: '🔥 Groove Nearby!',
          body: newGroove.message || 'A new groove is heating up near you!',
        },
      };

      admin.messaging()
        .send(message)
        .then(() => console.log(`Notification sent to ${user.username}`))
        .catch(err => console.error('FCM error:', err));
    }
  });
};
