import { Request, Response } from "express";
import { db } from "../firebase/firestore";
import { AuthRequest } from "../middleWare/middleWare";

export const updateLocationController = async (req: AuthRequest, res: Response) => {
  try {
    const { location } = req.body;
    const userId = req.user?.userId;

    if (!userId || !location?.lat || !location?.lng) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRef = db.collection("users").doc(userId);

    await userRef.set(
      {
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ message: "Location updated successfully" });
  } catch (err) {
    console.error("Error updating location:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
