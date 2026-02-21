import express from "express";
import cors from "cors";
import router from "./routes/route";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { deleteExpiredGrooves } from "./utils/expireGrooves";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/api", router);

export const api = onRequest(
  { secrets: ["JWT_SECRET"], region: "us-central1" },
  app
);

export const scheduledDeleteExpiredGrooves = onSchedule(
  { schedule: "every 1 minutes", timeZone: "Africa/Johannesburg", region: "africa-south1" },
  async () => {
    console.log("Running groove cleanup...");
    try {
      await deleteExpiredGrooves();
      console.log("Finished groove cleanup.");
    } catch (err) {
      console.error("Failed to delete expired grooves:", err);
    }
  }
);