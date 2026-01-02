import { Request, Response } from "express";
import { db } from "../firebase/firestore";
import { AuthRequest } from "../middleWare/middleWare";
export const reportController = async (req: AuthRequest, res: Response) => {
  const { grooveId, reason } = req.body;
  const reporterId = req.user?.userId;

  if (!grooveId || !reporterId || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingReportQuery = await db
      .collection("reports")
      .where("grooveId", "==", grooveId)
      .where("reporterId", "==", reporterId)
      .get();

    if (!existingReportQuery.empty) {
      return res.status(400).json({ error: "You have already reported this groove." });
    }

    await db.collection("reports").add({
      grooveId,
      reporterId,
      reason,
      createdAt: Date.now(),
    });

    return res.status(201).json({ message: "Report submitted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
