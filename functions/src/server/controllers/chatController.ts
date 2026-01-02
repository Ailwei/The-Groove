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
    const { grooveId } = req.body;
    const userId = req.user.userId;

    if (!grooveId || !userId) {
      return res.status(400).json({
        error: "grooveId is required",
      });
    }
    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveSnap = await grooveRef.get();

    if (!grooveSnap.exists) {
      return res.status(404).json({
        error: "Groove not found",
      });
    }
    const chatRef = grooveRef.collection("chat").doc("group");
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      return res.status(404).json({
        error: "Chat group does not exist for this groove",
      });
    }
    const chatData = chatSnap.data();

    if (chatData?.members?.includes(userId)) {
      return res.status(409).json({
        error: "User already in chat group",
      });
    }
    await chatRef.update({
      members: FieldValue.arrayUnion(userId),
    });

    return res.status(200).json({
      message: "Joined chat group successfully",
    });

  } catch (error) {
    console.error("Join chat group error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const sendMessageController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { grooveId, text } = req.body;
    const userId = req.user?.userId;

    if (!grooveId || !text || !userId) {
      return res.status(400).json({
        error: "grooveId and message text are required",
      });
    }
    const grooveRef = db.collection("grooves").doc(grooveId);
    const grooveSnap = await grooveRef.get();

    if (!grooveSnap.exists) {
      return res.status(404).json({
        error: "Groove not found",
      });
    }
    const chatRef = grooveRef.collection("chat").doc("group");
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      return res.status(404).json({
        error: "Chat group does not exist",
      });
    }
    const chatData = chatSnap.data();

    if (!chatData?.members?.includes(userId)) {
      return res.status(403).json({
        error: "User is not a member of this chat",
      });
    }
    const messageRef = grooveRef
      .collection("chat")
      .doc("messages")
      .collection("items")
      .doc();

    await messageRef.set({
      senderId: userId,
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: "Message sent successfully",
      messageId: messageRef.id,
    });

  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


export const leaveChatGroupController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { grooveId } = req.body;
    const userId = req.user?.userId;


    if (!grooveId || !userId) {
      return res.status(400).json({
        error: "grooveId is required",
      });
    }

    const chatRef = db
      .collection("grooves")
      .doc(grooveId)
      .collection("chat")
      .doc("group");

    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      return res.status(404).json({
        error: "Chat group not found",
      });
    }

    const chatData = chatSnap.data();
    if (chatData?.ownerId === userId) {
      return res.status(403).json({
        error: "Groove owner cannot leave the chat group",
      });
    }
    if (!chatData?.members?.includes(userId)) {
      return res.status(400).json({
        error: "User is not a member of this chat group",
      });
    }
    await chatRef.update({
      members: admin.firestore.FieldValue.arrayRemove(userId),
    });

    return res.status(200).json({
      message: "Successfully left the chat group",
    });

  } catch (error) {
    console.error("leaveChatGroupController error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
