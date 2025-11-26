import { Response, Request } from "express";
import { db } from "../firebase/firestore";
import bcrypt from "bcrypt";

export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: "All fields required" });

  const userSnapshot = await db.collection("users").where("email", "==", email).get();
  if (userSnapshot.empty) return res.status(404).json({ error: "User not found" });
  const userDoc = userSnapshot.docs[0];

  const otpSnapshot = await db.collection("passwordResetOTPs")
    .where("userId", "==", userDoc.id)
    .where("otp", "==", otp)
    .get();

  if (otpSnapshot.empty) return res.status(400).json({ error: "Invalid OTP" });

  const otpDoc = otpSnapshot.docs[0];
  if (Date.now() > otpDoc.data().expiresAt) return res.status(400).json({ error: "OTP expired" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.collection("users").doc(userDoc.id).update({ password: hashedPassword });

  await db.collection("passwordResetOTPs").doc(otpDoc.id).delete();

  return res.json({ message: "Password successfully reset!" });
};
