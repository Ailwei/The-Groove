import { Request, Response } from "express";
import { db } from "../firebase/firestore";
import bcrypt from "bcrypt";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const { username, email, password, deviceToken } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: username, email, password" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long, include uppercase, lowercase, and a number." 
      });
    }

    const usersSnapshot = await db.collection("users")
      .where("email", "==", email.toLowerCase())
      .get();
    if (!usersSnapshot.empty) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const usernameSnapshot = await db.collection("users")
      .where("username", "==", username)
      .get();
    if (!usernameSnapshot.empty) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const docRef = await db.collection("users").add({
      username,
      email : email.toLowerCase(),
      password: hashedPassword,
      createdAt: Date.now(),
      settings: {
        locationAccuracy: "high",
        notificationFrequency: "all",
        notificationsEnabled: true,
      },
      totalTags: 0,
    });

    return res.status(201).json({
      message: "User created successfully",
      userId: docRef.id,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
export const getUserController = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ id: userDoc.id, ...userDoc.data() });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await userRef.delete();

    const groovesSnapshot = await db.collection("grooves")
      .where("userId", "==", id)
      .get();

    const batch = db.batch();
    groovesSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    const reportsSnapshot = await db.collection("reports")
      .where("reporterId", "==", id)
      .get();

    const reportBatch = db.batch();
    reportsSnapshot.forEach(doc => reportBatch.delete(doc.ref));
    await reportBatch.commit();

    return res.status(200).json({ message: "User account deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

