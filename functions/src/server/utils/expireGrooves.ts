import * as admin from 'firebase-admin';
import { deleteGrooveChat } from './deleteChatGroup';

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
    return;
  }

  for (const doc of snapshot.docs) {
    const grooveId = doc.id;
    await deleteGrooveChat(grooveId);

    await doc.ref.delete();
  }

};
