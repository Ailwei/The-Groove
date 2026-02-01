import { db } from "../firebase/firestore";
import admin from "firebase-admin";

export async function createGrooveChatGroup(
  grooveId: string,
  creatorUserId: string
): Promise<{ chatId: string }> {
  if (!grooveId || !creatorUserId) {
    throw new Error("grooveId and creatorUserId are required");
  }

  const grooveRef = db.collection("grooves").doc(grooveId);

  const chatRef = grooveRef.collection("chats").doc();
  await chatRef.set({
    grooveId,
    createdBy: creatorUserId,
    members: [creatorUserId],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
await grooveRef.update({
  chatId: chatRef.id,
})
  return { chatId: chatRef.id };
}
