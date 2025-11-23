import { Request, Response } from "express";
import { db } from "../firebase/firestore";


export const resetPasswordController = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing required fields: token, newPassword" });
  }

  try {
    const tokenSnapshot = await db
      .collection("passwordResetRequests")
      .where("token", "==", token)
      .get();

    if (tokenSnapshot.empty) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const resetDoc = tokenSnapshot.docs[0];
    const data = resetDoc.data();

    if (Date.now() > data.expiresAt) {
      return res.status(400).json({ error: "Token expired" });
    }

    await db.collection("users").doc(data.userId).update({
      password: newPassword
    });

    await db.collection("passwordResetRequests").doc(resetDoc.id).delete();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
