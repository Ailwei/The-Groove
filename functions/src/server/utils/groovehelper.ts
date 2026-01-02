import admin from "firebase-admin";
import { db } from "../firebase/firestore";

export interface Groove {
  id: string;
  userId: string;
  vibe: string;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  [key: string]: any;
}

export const getUserGrooveStats = async (userId: string) => {
  const now = admin.firestore.Timestamp.now();
  
  const snapshot = await db
    .collection("grooves")
    .where("userId", "==", userId)
    .where("expiresAt", ">", now)
    .get();

  const grooves: Groove[] = [];
  snapshot.forEach(doc => {
    grooves.push({ id: doc.id, ...doc.data() } as Groove);
  });

  const totalTags = grooves.length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeek = grooves.filter(g => g.createdAt.toDate() > oneWeekAgo).length;

  const hotSpots = grooves.filter(g => g.vibe === "very-busy").length;

  return { totalTags, thisWeek, hotSpots };
};
