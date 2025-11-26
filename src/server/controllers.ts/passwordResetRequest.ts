import { Request, Response } from "express";
import { db } from "../firebase/firestore";
import crypto from "crypto";
import { sendPasswordResetOtp } from "../utils/sendEmail";

export const requestPasswordResetController = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const userSnapshot = await db.collection("users").where("email", "==", email).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnapshot.docs[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 30 * 60 * 1000;

    await db.collection("passwordResetRequests").add({
      userId: userDoc.id,
      token,
      expiresAt,
    });

    await sendPasswordResetOtp(email);

    console.log(`Password reset token for ${email}: ${token}`);

    return res.status(200).json({ message: "Password reset requested. Check your email for OTP." });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
