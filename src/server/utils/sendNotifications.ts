import { db } from "../firebase/firestore";
import { getDistanceFromLatLonInM } from "./geo";
import admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

export interface Groove {
  coordinates: { lat: number; lng: number };
  message?: string;
  isImportant?: boolean; 
}

export const sendNearbyNotifications = async (newGroove: Groove) => {
  const usersSnapshot = await db.collection("users").get();

  usersSnapshot.forEach((userDoc) => {
    const user = userDoc.data();
    if (!user.deviceToken || !user.location) return;

    if (!user.notificationsEnabled) return;

    const frequency = user.notificationFrequency || "all";

    if (frequency === "off") return;

    if (frequency === "important" && !newGroove.isImportant) return;

    const distance = getDistanceFromLatLonInM(
      newGroove.coordinates.lat,
      newGroove.coordinates.lng,
      user.location.lat,
      user.location.lng
    );

    if (distance > 500) return;

    const message = {
      token: user.deviceToken,
      notification: {
        title: newGroove.isImportant
          ? "🔥 IMPORTANT GROOVE NEARBY!"
          : "🔥 Groove Nearby!",
        body:
          newGroove.message ||
          (newGroove.isImportant
            ? "This groove is getting HOT!"
            : "A new groove is heating up near you!")
      }
    };

    admin
      .messaging()
      .send(message)
      .then(() => console.log(`Notification sent to ${user.username}`))
      .catch((err) => console.error("FCM error:", err));
  });
};
