import { Request, Response } from "express";
import { db } from "../firebase/firestore";

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        await userRef.delete();
        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error("Error deleting account:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
