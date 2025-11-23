import  {Response, Request } from "express";
import admin from 'firebase-admin';
import { db } from "../firebase/firestore";
import { getDistanceFromLatLonInM } from "../utils/geo";
import { sendNearbyNotifications } from "../utils/sendNotifications";
import axios from "axios";
import { AuthRequest } from "../middleWare/middleWare";
const RADIUS_METERS = 50;

export const tagGrooveController = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
  const {username, lat, lng, vibe, message, startTime, endTime } = req.body;

  if (!lat || !lng || !vibe || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const startAtTimestamp = admin.firestore.Timestamp.fromDate(new Date(startTime));
    const expiresAtTimestamp = admin.firestore.Timestamp.fromDate(new Date(endTime));

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
          {
            params: { lat, lon: lng, format: "json" },
            headers: { "User-Agent": "TheGrooveApp/1.0" },
          }
        );

        const address = res.data.address;
        if (!address) return "Unknown";

        return address.road
          ? `${address.road}, ${address.suburb || address.city || ""}`.trim()
          : address.suburb || address.city || "Unknown";
      } catch (err) {
        console.error("Reverse geocode failed:", err);
        return "Unknown";
      }
    };

    if (existingGroove) {
      const supporters = existingGroove.supporters || [];

      if (!supporters.some((s: any) => s.userId === userId)) {
        supporters.push({ userId, username });
      }

      await db.collection("grooves").doc(existingGroove.id).update({
        supporters,
        vibe,
        message: message || existingGroove.message,
        updatedAt: admin.firestore.Timestamp.now(),
        startAt: startAtTimestamp,
        expiresAt: expiresAtTimestamp,
      });



      return res.status(200).json({
        message: "Groove updated successfully",
        grooveId: existingGroove.id,
        totalSupports: supporters.length,
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
    });

  } catch (error: any) {
    console.error("tagGrooveController caught error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getGroovesController = async (req: Request, res: Response) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await db
      .collection("grooves")
      .where("expiresAt", ">", now)
      .get();

    const grooves: any[] = [];
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data());
      grooves.push({ id: doc.id, ...doc.data() });
    });


    return res.status(200).json({ grooves });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const supportGrooveController = async (req: Request, res: Response) => {
  const { grooveId, userId, username } = req.body;

  if (!grooveId || !userId || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveDoc = await grooveRef.get();

    if (!grooveDoc.exists) {
      return res.status(404).json({ error: "Groove not found" });
    }

    const supporters = grooveDoc.data()?.supporters || [];

    if (supporters.some((s: { userId: any }) => s.userId === userId)) {
      return res
        .status(400)
        .json({ error: "User already supported this groove" });
    }

    supporters.push({ userId, username });

    await grooveRef.update({ supporters });

    return res.status(200).json({
      message: "Groove supported successfully",
      totalSupports: supporters.length,
      supportedBy: supporters.map((s: { username: any }) => s.username),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
