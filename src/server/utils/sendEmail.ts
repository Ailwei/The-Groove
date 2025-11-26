import { db } from "../firebase/firestore";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

export const sendPasswordResetOtp = async (email: string) => {
  const userSnapshot = await db.collection("users").where("email", "==", email).get();
  if (userSnapshot.empty) throw new Error("User not found");
  const userDoc = userSnapshot.docs[0];

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  await db.collection("passwordResetOTPs").add({
    userId: userDoc.id,
    otp,
    expiresAt,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"The Groove App" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Your OTP to Reset Password",
    html: `
      <p>Hello,</p>
      <p>Your OTP to reset your password is:</p>
      <h2>${otp}</h2>
      <p>This OTP expires in 10 minutes.</p>
    `,
  });

  console.log(`OTP sent to ${email}: ${otp}`);
};
