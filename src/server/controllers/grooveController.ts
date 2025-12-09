import { Response } from "express";
import admin from "firebase-admin";
import { db } from "../firebase/firestore";
import { getDistanceFromLatLonInM } from "../utils/geo";
import { sendNearbyNotifications } from "../utils/sendNotifications";
import axios from "axios";
import { AuthRequest } from "../middleWare/middleWare";

const RADIUS_METERS = 20;

async function addSupporter(
  grooveRef: FirebaseFirestore.DocumentReference,
  userId: string,
  username: string
) {
  const doc = await grooveRef.get();
  if (!doc.exists) return null;

  const grooveData = doc.data();
  if (!grooveData) return null;

  console.log("owner:", grooveData.userId);
  console.log("support requester:", userId);

  if (grooveData.userId === userId) {
    console.log("Owner cannot support their own groove");
    return null;
  }

  await grooveRef.update({
    supporters: admin.firestore.FieldValue.arrayUnion({ userId, username }),
  });

  const updatedDoc = await grooveRef.get();
  return updatedDoc.data()?.supporters?.length || 0;
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

    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1)
    }
    const startAtTimestamp = admin.firestore.Timestamp.fromDate(start);
    const expiresAtTimestamp = admin.firestore.Timestamp.fromDate(end);


    const snapshot = await db.collection("grooves").get();
    let existingGroove: any = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      const distance = getDistanceFromLatLonInM(
        lat,
        lng,
        data.coordinates.lat,
        data.coordinates.lng
      );
      if (distance < RADIUS_METERS) {
        existingGroove = { id: doc.id, ...data };
      }
    });

    const resolveLocationName = async (lat: number, lng: number) => {
      try {
        const res = await axios.get(
          "https://nominatim.openstreetmap.org/reverse",
          { params: { lat, lon: lng, format: "json" }, headers: { "User-Agent": "TheGrooveApp/1.0" } }
        );
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

      const totalSupports = await addSupporter(grooveRef, userId, username);

      return res.status(200).json({
        message: "Groove already exists at this location — support added",
        grooveId: existingGroove.id,
        totalSupports,
        existingGroove,
        requiresConfirmation: false,
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
    };

    const docRef = await db.collection("grooves").add(newGroove);
    sendNearbyNotifications(newGroove);

    return res.status(201).json({
      message: "Groove tagged successfully",
      grooveId: docRef.id,
      totalSupports: 1,
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
    snapshot.forEach(doc => grooves.push({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ grooves });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const supportGrooveController = async (req: AuthRequest, res: Response) => {
  const { grooveId } = req.body;
  const userId = req.user?.userId;
  const username = req.user?.username;

  if (!grooveId || !userId || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveDoc = await grooveRef.get();

    if (!grooveDoc.exists) return res.status(404).json({ error: "Groove not found" });

    const grooveData = grooveDoc.data();
    if (!grooveData) return res.status(500).json({ error: "Invalid groove data" });

    if (grooveData.userId === userId) {
      return res.status(400).json({ error: "You cannot support your own groove" });
    }

    const alreadySupported = grooveData.supporters?.some((s: any) => s.userId === userId);

    if (alreadySupported) {
      return res.status(400).json({
        error: "You have already supported this groove",
        totalSupports: grooveData.supporters.length,
      });
    }

    const totalSupports = await addSupporter(grooveRef, userId, username);

    return res.status(200).json({
      message: "Groove supported successfully",
      totalSupports,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
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

        supportCount: data.supporters?.length || 0,
      };
    });

    return res.json({ grooves });

  } catch (err: any) {
    console.error("🔥 Error fetching user grooves:", err);
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
