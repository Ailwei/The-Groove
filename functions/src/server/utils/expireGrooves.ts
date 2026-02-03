import * as admin from 'firebase-admin';
import { deleteGrooveAndData } from './deleteChatGroup';

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

  if (snapshot.empty) return;

  await Promise.all(
    snapshot.docs.map(doc =>
      deleteGrooveAndData(doc.id)
        .catch(err => {
          console.error(`Failed to delete groove ${doc.id}`, err);
        })
    )
  );
};
