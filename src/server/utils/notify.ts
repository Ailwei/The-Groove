import { admin, db } from "../firebase/firestore";
import { getDistanceFromLatLonInM } from "../shared/geo";

type SupportedGroovePayload = {
  grooveId: string;
  ownerId: string;
  supportCount: number;
};

const SUPPORT_MILESTONES = [3, 10, 25, 50, 100];


type NotificationFrequency = 'all' | 'important' | 'owner' | 'groove';

async function canNotifyUser(
  user: any,
  type: NotificationFrequency = 'all'
) {
  if (!Array.isArray(user?.deviceTokens) || user.deviceTokens.length === 0) return false;

  if (!user?.settings || user.settings.notificationsEnabled !== true) return false;

  const freq: NotificationFrequency = user.settings.notificationFrequency || 'all';

  switch (type) {
    case 'all': return freq === 'all';
    case 'important': return freq === 'all' || freq === 'important';
    case 'owner': return freq === 'all' || freq === 'owner';
    case 'groove': return freq === 'all' || freq === 'groove';
    default: return false;
  }
}
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
    
    if (!(await canNotifyUser(user, 'all'))) continue;

    for (const token of user.deviceTokens) {
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

export const sendSupportedGroovesNotifications = async (
  payload: SupportedGroovePayload & { message?: string }
) => {
  const { supportCount, ownerId, message } = payload;

  if (!SUPPORT_MILESTONES.includes(supportCount)) {
    return 0;
  }

  const ownerDoc = await db.collection("users").doc(ownerId).get();
  if (!ownerDoc.exists) {
    return 0;
  }

  const owner = ownerDoc.data();
  if (!(await canNotifyUser(owner, 'important'))) return 0;

  if (!owner?.deviceTokens?.length) {
    return 0;
  }

  let sentCount = 0;

  for (const token of owner.deviceTokens) {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: "🔥 Your Groove Is Gaining Support!",
          body: message
            ? `"${message}" has reached ${supportCount} supporters!`
            : `Your groove has reached ${supportCount} supporters!`,
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
      console.error(`FCM error sending notification to token ${token}:`, err);
    }
  }
  return sentCount;
};

export const notifyOwnerOnSupport = async (
  grooveId: string,
  ownerId: string,
  supporterUsername: string
) => {
  const ownerDoc = await db.collection("users").doc(ownerId).get();
  if (!ownerDoc.exists) return 0;

  const owner = ownerDoc.data();
  if (!(await canNotifyUser(owner, 'important'))) return 0;
  if (!owner?.deviceTokens?.length) return 0;

  let sentCount = 0;
  const invalidTokens: string[] = [];

  for (const token of owner.deviceTokens) {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: "🔥 Someone supported your Groove!",
          body: `${supporterUsername} just supported your groove.`,
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
    } catch (err: any) {
      console.error(`FCM error sending support notification to token ${token}:`, err);

      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-argument'
      ) {
        invalidTokens.push(token);
      }
    }
  }

  if (invalidTokens.length > 0) {
    const updatedTokens = owner.deviceTokens.filter(
      (t: string) => !invalidTokens.includes(t)
    );
    await db.collection("users").doc(ownerId).update({ deviceTokens: updatedTokens });
    console.log(`Removed invalid tokens for user ${ownerId}:`, invalidTokens);
  }

  return sentCount;
};
