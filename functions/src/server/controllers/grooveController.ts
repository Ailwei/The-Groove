import { Response } from "express";
import admin from "firebase-admin";
import { db } from "../firebase/firestore";
import { getDistanceFromLatLonInM } from "../shared/geo";
import { sendNearbyNotifications, sendSupportedGroovesNotifications, notifyOwnerOnSupport } from "../utils/notify";
import axios from "axios";
import { AuthRequest } from "../middleWare/middleWare";
import { createGrooveChatGroup } from "../utils/createGroup";

const RADIUS_METERS = 20;
const IMPORTANT_SUPPORT_THRESHOLD = 3;
const CRITICAL_SUPPORT_THRESHOLD = 5;

async function addSupporter(
  grooveRef: FirebaseFirestore.DocumentReference,
  userId: string,
  username: string
) {
  const doc = await grooveRef.get();
  if (!doc.exists) return 0;

  const grooveData = doc.data();
  if (!grooveData) return 0;

  const ownerId = grooveData.userId;

  if (ownerId === userId) return 0;

  await grooveRef.update({
    supporters: admin.firestore.FieldValue.arrayUnion({ userId, username }),
  });

  const updatedDoc = await grooveRef.get();
  const updatedData = updatedDoc.data();
  if (!updatedData) return 0;

  return (updatedData.supporters || [])
    .filter((s: any) => s.userId !== ownerId)
    .length;
}

async function updateGrooveImportance(grooveRef: FirebaseFirestore.DocumentReference) {
  const doc = await grooveRef.get();
  if (!doc.exists) return;

  const grooveData = doc.data();
  if (!grooveData) return;

  const supporterCount = (grooveData.supporters || [])
    .filter((s: any) => s.userId !== grooveData.userId)
    .length

  let isImportant = false;

  if (supporterCount >= CRITICAL_SUPPORT_THRESHOLD) isImportant = true;
  else if (supporterCount >= IMPORTANT_SUPPORT_THRESHOLD) isImportant = true;

  await grooveRef.update({ isImportant });
  return isImportant;
}
export const tagGrooveController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username;

  if (!userId || !username) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }

  const { lat, lng, vibe, message, startTime, endTime } = req.body;
  if (!lat || !lng || !vibe || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let start = new Date(startTime);
    let end = new Date(endTime);
    if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);

    const startAtTimestamp = admin.firestore.Timestamp.fromDate(start);
    const expiresAtTimestamp = admin.firestore.Timestamp.fromDate(end);

    const snapshot = await db.collection("grooves").get();
    let existingGroove: any = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      const distance = getDistanceFromLatLonInM(lat, lng, data.coordinates.lat, data.coordinates.lng);
      if (distance < RADIUS_METERS) existingGroove = { id: doc.id, ...data };
    });

    const resolveLocationName = async (lat: number, lng: number) => {
      try {
        const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
          params: { lat, lon: lng, format: "json" },
          headers: { "User-Agent": "TheGrooveApp/1.0" }
        });
        const address = res.data.address;
        if (!address) return "Unknown";
        return address.road
          ? `${address.road}, ${address.suburb || address.city || ""}`.trim()
          : address.suburb || address.city || "Unknown";
      } catch {
        return "Unknown";
      }
    };

    if (existingGroove) {
  const grooveRef = db.collection("grooves").doc(existingGroove.id);

  if (existingGroove.userId === userId) {
    return res.status(200).json({
      action: "OWN_GROOVE",
      message: "You already own this groove",
    });
  }

  const alreadySupported = existingGroove.supporters?.some(
    (s: any) => s.userId === userId
  );

  if (alreadySupported) {
    return res.status(200).json({
      action: "ALREADY_SUPPORTED",
      message: "You have already supported this groove",
    });
  }

  const totalSupports = await addSupporter(grooveRef, userId, username);
  const isImportant = await updateGrooveImportance(grooveRef);

  await notifyOwnerOnSupport(existingGroove.id, existingGroove.userId, username);

  return res.status(200).json({
    action: "SUPPORTED_VIA_TAG",
    message: "Groove already exists — support added",
    grooveId: existingGroove.id,
    totalSupports,
    isImportant,
  });
}


    const locationName = await resolveLocationName(lat, lng);
    const newGroove = {
      userId,
      coordinates: { lat, lng },
      vibe,
      message: message || "",
      location: locationName,
      createdAt: admin.firestore.Timestamp.now(),
      startAt: startAtTimestamp,
      expiresAt: expiresAtTimestamp,
      supporters: [],
      isImportant: false,
    };

    const docRef = await db.collection("grooves").add(newGroove);
    await createGrooveChatGroup(docRef.id, userId);
    const isImportant = await updateGrooveImportance(docRef);
    const notificationText = `${username} tagged a new groove: ${message || "Check it out!"}`;

    await sendNearbyNotifications({
      coordinates: { lat, lng },
      notificationMsg: notificationText,
    });
    return res.status(201).json({
  action: "CREATED_NEW",
  message: "Groove created successfully",
  grooveId: docRef.id,
});


  } catch (error: any) {
    console.error("tagGrooveController error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getGroovesController = async (_req: any, res: Response) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await db.collection("grooves").where("expiresAt", ">", now).get();

    const grooves: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const supportCount = (data.supporters || [])
        .filter((s: any) => s.userId !== data.userId)
        .length;

      grooves.push({
        id: doc.id,
        ...data,
        chatId: data.chatId || null,
        supportCount,
      });
    });

    return res.status(200).json({ grooves });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const supportGrooveController = async (req: AuthRequest, res: Response) => {
  const { grooveId, userLat, userLng } = req.body;
  const userId = req.user?.userId;
  const username = req.user?.username;

  if (!grooveId || !userId || !username || !userLat || !userLng) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveDoc = await grooveRef.get();

    if (!grooveDoc.exists) {
      return res.status(404).json({ error: "Groove not found" });
    }

    const grooveData = grooveDoc.data();
    if (!grooveData) {
      return res.status(500).json({ error: "Invalid groove data" });
    }

    const distance = getDistanceFromLatLonInM(
      userLat,
      userLng,
      grooveData.coordinates.lat,
      grooveData.coordinates.lng
    );

    if (distance > RADIUS_METERS) {
      return res.status(400).json({
        error: `Too far away to support (max ${RADIUS_METERS} meters)`,
      });
    }

    if (grooveData.userId === userId) {
      return res.status(403).json({ error: "Cannot support own groove" });
    }

    const alreadySupported = grooveData.supporters?.some(
      (s: any) => s.userId === userId
    );

    // ✅ IMPORTANT CHANGE
    if (alreadySupported) {
      return res.status(200).json({
        action: "SUPPORTED_EXISTING",
        message: "You already support this groove",
        grooveId,
        totalSupports: grooveData.supporters.length,
        isImportant: grooveData.isImportant ?? false,
      });
    }

    // New support
    const totalSupports = await addSupporter(grooveRef, userId, username);
    const isImportant = await updateGrooveImportance(grooveRef);

    await notifyOwnerOnSupport(grooveId, grooveData.userId, username);
    await sendSupportedGroovesNotifications({
      grooveId,
      ownerId: grooveData.userId,
      supportCount: totalSupports,
    });

    return res.status(200).json({
      action: "SUPPORTED_NEW",
      message: "Groove supported successfully",
      grooveId,
      totalSupports,
      isImportant,
    });

  } catch (error: any) {
    console.error("supportGrooveController error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserGroovesController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const snapshot = await db.collection("grooves")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const grooves = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        coordinates: data.coordinates,
        vibe: data.vibe,
        message: data.message || "",
        location: data.location || "Unknown",

        taggedAt: data.createdAt ? data.createdAt.toDate() : null,
        startTime: data.startAt ? data.startAt.toDate() : null,
        endTime: data.expiresAt ? data.expiresAt.toDate() : null,

        supportCount: (data.supporters || [])
          .filter((s: any) => s.userId !== data.userId)
          .length,
      };
    });

    return res.json({ grooves });

  } catch (err: any) {
    console.error("Error fetching user grooves:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteGrooveController = async (req: AuthRequest, res: Response) => {
  const { grooveId } = req.body;
  const userId = req.user?.userId;

  if (!grooveId || !userId) {
    return res.status(400).json({ error: "Required field missing" });
  }

  try {
    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveDoc = await grooveRef.get();

    if (!grooveDoc.exists) {
      return res.status(404).json({ error: "Groove not found" });
    }

    const grooveData = grooveDoc.data();
    if (!grooveData) {
      return res.status(500).json({ error: "Invalid groove data" });
    }

    if (grooveData.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own groove" });
    }

    await grooveRef.delete();

    return res.status(200).json({ message: "Groove deleted successfully" });
  } catch (error: any) {
    console.error("deleteGrooveController error:", error);
    return res.status(500).json({ error: error.message });
  }
};
