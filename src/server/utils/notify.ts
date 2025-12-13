import { admin, db } from "../firebase/firestore";
import { getDistanceFromLatLonInM } from "./geo"; 

export const sendNearbyNotifications = async (groove: { coordinates: { lat: number; lng: number }, notificationMsg: string }) => {

  const usersSnapshot = await db.collection("users").get();

  let sentCount = 0;

  for (const doc of usersSnapshot.docs) {
    const user = doc.data();

    if (!user.deviceTokens || user.deviceTokens.length === 0) {
      continue;
    }

    if (!user.location) {
      continue;
    }

    const distance = getDistanceFromLatLonInM(
      groove.coordinates.lat,
      groove.coordinates.lng,
      user.location.lat,
      user.location.lng
    );

    const RADIUS_METERS = 5000;
    if (distance > RADIUS_METERS) {
      continue;
    }

    for (const token of user.deviceTokens) {
      console.log("token", token)
      try {
        await admin.messaging().send({
          token,
          notification: {
            title: "🔥 New Groove Nearby!",
            body: groove.notificationMsg,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "default",
              sound: "default",
            },
          },
        });
        sentCount++;
      } catch (err) {
        console.error(`FCM error for ${user.username}`, err);
      }
    }
  }
  return sentCount;
};
