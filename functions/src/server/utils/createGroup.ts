import { db } from "../firebase/firestore";

export async function createGrooveChatGroup(
  grooveId: string,
  creatorUserId: string
): Promise<void> {
  if (!grooveId || !creatorUserId) {
    throw new Error("grooveId and creatorUserId are required");
  }

  const grooveRef = db.collection("grooves").doc(grooveId);

  const chatRef = grooveRef.collection("chat").doc("group");
  const chatSnap = await chatRef.get();

  if (chatSnap.exists) return;

  await chatRef.set({
    grooveId,
    createdBy: creatorUserId,
    members: [creatorUserId],
    createdAt: new Date(),
  });
}
