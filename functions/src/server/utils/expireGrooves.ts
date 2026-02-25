import { db, admin } from "../firebase/firestore";

export const deleteExpiredGrooves = async () => {
  const now = admin.firestore.Timestamp.now();
  const snapshot = await db.collection("grooves").where("expiresAt", "<=", now).get();

  if (snapshot.empty) {
    console.log("No expired grooves.");
    return;
  }

  for (const doc of snapshot.docs) {
    const grooveId = doc.id;
    console.log(`Deleting groove: ${grooveId}`);

    const chatSnap = await db.collection("groove_chats").where("grooveId", "==", grooveId).get();
    await Promise.all(chatSnap.docs.map(d => d.ref.delete()));

    const supportSnap = await db.collection("supports").where("grooveId", "==", grooveId).get();
    await Promise.all(supportSnap.docs.map(d => d.ref.delete()));

    await doc.ref.delete();

    console.log(`Deleted groove ${grooveId} and its related data.`);
  }

  console.log(`Deleted ${snapshot.size} expired grooves.`);
};