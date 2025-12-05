import { Request, Response } from "express";
import { db } from "../firebase/firestore";

export const reportController = async (req: Request, res: Response) => {
  const { grooveId, reporterId, reason } = req.body;

  if (!grooveId || !reporterId || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.collection("reports").add({
      grooveId,
      reporterId,
      reason,
      createdAt: Date.now()
    });

    return res.status(201).json({ message: "Report submitted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
