import { Request, Response } from "express";
import { db } from "../firebase/firestore";

export const saveTokenController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { deviceToken } = req.body;

  if (!deviceToken) {
    return res.status(400).json({ error: "Missing deviceToken" });
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const existingTokens = userData?.deviceTokens || [];

    if (!existingTokens.includes(deviceToken)) {
      existingTokens.push(deviceToken);
    }

    console.log("Updating user:", userId, "with tokens:", existingTokens);

    await userRef.update({
      deviceTokens: existingTokens,
      lastUpdated: new Date(),
    });

    return res.json({ message: "Device token updated", deviceTokens: existingTokens });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
export default saveTokenController