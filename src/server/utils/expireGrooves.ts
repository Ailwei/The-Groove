import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const deleteExpiredGrooves = async () => {
  const now = new Date();

  const snapshot = await db
    .collection('grooves')
    .where('expiresAt', '<', now)
    .get();

  if (snapshot.empty) {
    console.log("No expired grooves found.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${snapshot.size} expired grooves`);
};
