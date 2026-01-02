import { db } from "../firebase/firestore";

export const deleteGrooveChat = async (grooveId: string) => {
  const grooveRef = db.collection("grooves").doc(grooveId);

  const messagesRef = grooveRef
    .collection("chat")
    .doc("group")
    .collection("messages");

  const messagesSnapshot = await messagesRef.get();
  const batch = db.batch();

  messagesSnapshot.forEach((msg) => batch.delete(msg.ref));

  batch.delete(grooveRef.collection("chat").doc("group"));

  await batch.commit();
};
