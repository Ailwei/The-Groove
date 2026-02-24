import { Response } from "express";
import { db } from "../firebase/firestore";
import { AuthRequest } from "../middleWare/middleWare";

export const deleteMessageController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { grooveId, chatId, messageId } = req.body;

    if (!userId || !grooveId || !chatId || !messageId) {
      console.log({
  grooveId,
  chatId,
  messageId,
  fullPath: `grooves/${grooveId}/chats/${chatId}/messages/${messageId}`
});

      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const messageRef = db
      .collection("grooves")
      .doc(grooveId)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .doc(messageId);

    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) {
      return res.status(404).json({
        error: "Message not found",
      });
    }

    const messageData = messageSnap.data();
    if (messageData?.senderId !== userId) {
      return res.status(403).json({
        error: "Not authorized to delete this message",
      });
    }

    await messageRef.delete();

    return res.status(200).json({
      message: "Message deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};