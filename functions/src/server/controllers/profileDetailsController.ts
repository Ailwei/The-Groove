import { Request, Response } from "express";
import { getUserGrooveStats } from "../utils/groovehelper";
import { db } from "../firebase/firestore";

export const getProfileController = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const userData = userDoc.data();

    const memberSince = userData?.createdAt
      ? typeof userData.createdAt.toDate === "function"
        ? userData.createdAt.toDate().toISOString()
        : new Date(userData.createdAt).toISOString()
      : null;

    const grooveStats = await getUserGrooveStats(userId);

    return res.status(200).json({
      username: userData?.username,
      email: userData?.email,
      memberSince,
      ...grooveStats
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
