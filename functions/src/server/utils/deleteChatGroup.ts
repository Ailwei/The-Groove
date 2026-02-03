import * as admin from 'firebase-admin';

const db = admin.firestore();

export const deleteGrooveAndData = async (grooveId: string) => {
  const grooveRef = db.collection('grooves').doc(grooveId);

  await admin.firestore().recursiveDelete(grooveRef);
};
