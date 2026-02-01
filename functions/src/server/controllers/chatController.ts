import { Response } from "express";
import { db } from "../firebase/firestore";
import { AuthRequest } from "../middleWare/middleWare";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";


export const joinChatGroupController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { grooveId, chatId } = req.body;
    const userId = req.user.userId;

    console.log("grooveid", grooveId, "chatid", chatId)

    if (!grooveId || !chatId || !userId) {
      return res.status(400).json({ error: "grooveId and chatId are required" });
    }

    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveSnap = await grooveRef.get();
    if (!grooveSnap.exists) return res.status(404).json({ error: "Groove not found" });


    const chatRef = grooveRef.collection("chats").doc(chatId); 
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return res.status(404).json({ error: "Chat group not found" });

    const chatData = chatSnap.data();
    if (chatData?.members?.includes(userId)) {
      return res.status(200).json({ sucess: "Welcome Back!!" });
    }

    await chatRef.update({
      members: FieldValue.arrayUnion(userId),
    });

    return res.status(201).json({ message: "Joined chat group successfully" });

  } catch (error) {
    console.error("Join chat group error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessageController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { grooveId, chatId, text } = req.body;
    const userId = req.user?.userId;

    if (!grooveId || !chatId || !text || !userId) {
      return res.status(400).json({ error: "grooveId, chatId, and message text are required" });
    }

    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveSnap = await grooveRef.get();
    if (!grooveSnap.exists) return res.status(404).json({ error: "Groove not found" });

  
    const chatRef = grooveRef.collection("chats").doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return res.status(404).json({ error: "Chat group not found" });

    const chatData = chatSnap.data();
    if (!chatData?.members?.includes(userId)) {
      return res.status(403).json({ error: "User is not a member of this chat" });
    }

    const messageRef = chatRef.collection("messages").doc(); 
    await messageRef.set({
      senderId: userId,
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ message: "Message sent successfully", messageId: messageRef.id });

  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const fetchMessagesController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { grooveId, chatId, limit = "50", lastMessageId } = req.query;
    console.log("FetchMessages called with:", { grooveId, chatId, limit, lastMessageId, userId });

    if (!grooveId || !chatId || !userId) {
      return res.status(400).json({ error: "grooveId, chatId, and authenticated userId are required" });
    }

    const grooveRef = db.collection("grooves").doc(String(grooveId));
    const grooveSnap = await grooveRef.get();
    if (!grooveSnap.exists) {
      console.warn("Groove not found:", grooveId);
      return res.status(404).json({ error: `Groove not found: ${grooveId}` });
    }

    const chatRef = grooveRef.collection("chats").doc(String(chatId));
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      console.warn("Chat group not found:", chatId);
      return res.status(404).json({ error: `Chat group not found: ${chatId}` });
    }

    const chatData = chatSnap.data();
    if (!chatData?.members?.includes(userId)) {
      console.warn("User not in chat members:", userId, chatData?.members);
      return res.status(403).json({ error: "You are not a member of this chat group" });
    }

    let messagesQuery = chatRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(Number(limit));

    if (lastMessageId) {
      const lastMessageSnap = await chatRef.collection("messages").doc(String(lastMessageId)).get();
      if (lastMessageSnap.exists) messagesQuery = messagesQuery.startAfter(lastMessageSnap);
      else console.warn("lastMessageId not found:", lastMessageId);
    }

    const messagesSnap = await messagesQuery.get();
    console.log(`Fetched ${messagesSnap.size} messages from chat: ${chatId}`);
if (messagesSnap.empty) {
  return res.status(200).json({
    messages: [],
    noMessages: true,
  });
}
    const senderIds = Array.from(new Set(messagesSnap.docs.map(doc => doc.data().senderId)));
    const usersSnap = await db.getAll(...senderIds.map(id => db.collection("users").doc(id)));
    const usersMap: Record<string, string> = {};
    usersSnap.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData) usersMap[userDoc.id] = userData.username || "Unknown";
    });

    const messages = messagesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        senderName: usersMap[data.senderId] || "Unknown",
        text: data.text,
        chatId,
        createdAt: data.createdAt?.toDate() ?? new Date(),
      };
    });

    return res.status(200).json({ messages });
    

  } catch (error: any) {
    console.error("Fetch messages error:", error.message, error.stack);
    if (error.code) console.error("Firestore error code:", error.code);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};


export const leaveChatGroupController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { grooveId, chatId } = req.body;
    const userId = req.user?.userId;

    if (!grooveId || !chatId || !userId) {
      return res.status(400).json({ error: "grooveId and chatId are required" });
    }

    const chatRef = db.collection("grooves").doc(grooveId).collection("chats").doc(chatId); // CHANGED
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return res.status(404).json({ error: "Chat group not found" });

    const chatData = chatSnap.data();
    if (chatData?.ownerId === userId) return res.status(403).json({ error: "Owner cannot leave chat" });
    if (!chatData?.members?.includes(userId)) return res.status(400).json({ error: "Not a member" });

    await chatRef.update({
      members: admin.firestore.FieldValue.arrayRemove(userId),
    });

    return res.status(200).json({ message: "Successfully left the chat group" });

  } catch (error) {
    console.error("leaveChatGroupController error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const getChatGroupsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const groovesSnap = await db.collection("grooves").get();

    const chats: any[] = [];
    let totalUnread = 0;

    for (const grooveDoc of groovesSnap.docs) {
      const grooveData = grooveDoc.data();
      const grooveId = grooveDoc.id;

      const chatsSnap = await db
        .collection("grooves")
        .doc(grooveId)
        .collection("chats")
        .where("members", "array-contains", userId)
        .get();

      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data();

        const lastReadAt =
          chatData.lastReadAt?.[userId]?.toDate() ?? new Date(0);

        const messagesSnap = await db
          .collection("grooves")
          .doc(grooveId)
          .collection("chats")
          .doc(chatDoc.id)
          .collection("messages")
          .where("createdAt", ">", lastReadAt)
          .get();

        const unreadCount = messagesSnap.docs.filter(
          msg => msg.data().senderId && msg.data().senderId !== userId
        ).length;

        totalUnread += unreadCount;

        chats.push({
          grooveId,
          chatId: chatDoc.id,
          grooveLocation: grooveData.location || "Groove Chat",
          members: chatData.members || [],
          createdAt: chatData.createdAt?.toDate() ?? null,
          createdBy: chatData.createdBy || null,
          unreadCount,
        });
      }
    }

    return res.status(200).json({
      chats,
      totalUnread,
    });

  } catch (error) {
    console.error("getChatGroupsController error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markChatAsReadController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { grooveId, chatId } = req.body;

    if (!userId || !grooveId || !chatId) {
      return res.status(400).json({ error: "Missing data" });
    }

    const chatRef = db
      .collection("grooves")
      .doc(grooveId)
      .collection("chats")
      .doc(chatId);

    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    await chatRef.update({
      [`lastReadAt.${userId}`]: new Date(),
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("markChatAsRead error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


