import { db, admin } from "../firebase/firestore";

export const deleteExpiredGrooves = async () => {
  const now = admin.firestore.Timestamp.now();
  const snapshot = await db.collection("grooves").where("expiresAt", "<", now).get();

  for (const doc of snapshot.docs) {
    const grooveId = doc.id;

    const chatSnap = await db.collection("groove_chats").where("grooveId", "==", grooveId).get();
    chatSnap.forEach(c => c.ref.delete());

    const supportSnap = await db.collection("supports").where("grooveId", "==", grooveId).get();
    supportSnap.forEach(s => s.ref.delete());

    await db.collection("grooves").doc(grooveId).delete();
  }

  console.log(`Deleted ${snapshot.size} expired grooves.`);
};
