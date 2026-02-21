import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const deleteCollectionByGrooveId = async (collectionName: string, grooveId: string) => {
  const snapshot = await db.collection(collectionName).where("grooveId", "==", grooveId).get();
  if (snapshot.empty) return;

  const batchSize = 500;
  const chunks: admin.firestore.QueryDocumentSnapshot[][] = [];

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    chunks.push(snapshot.docs.slice(i, i + batchSize));
  }

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
};

export const deleteGrooveAndData = async (grooveId: string) => {
  try {
    await deleteCollectionByGrooveId("groove_tags", grooveId);
    await deleteCollectionByGrooveId("groove_chats", grooveId);
    await deleteCollectionByGrooveId("supports", grooveId);

    await db.collection("grooves").doc(grooveId).delete();

    console.log(`Deleted groove ${grooveId} and all related data`);
  } catch (err) {
    console.error(` Failed to delete groove ${grooveId}:`, err);
  }
};


export const deleteExpiredGrooves = async () => {
  const now = new Date();

  const snapshot = await db.collection("grooves").where("expiresAt", "<", now).get();

  if (snapshot.empty) {
    console.log("No expired grooves to delete");
    return;
  }

  await Promise.all(
    snapshot.docs.map(doc =>
      deleteGrooveAndData(doc.id)
    )
  );

  console.log(`Deleted ${snapshot.size} expired grooves`);
};
