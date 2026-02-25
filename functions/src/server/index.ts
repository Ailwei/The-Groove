import express from "express";
import cors from "cors";
import router from "./routes/route";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { deleteExpiredGrooves } from "./utils/expireGrooves";
import { defineSecret } from "firebase-functions/params";

const JWT_SECRET = defineSecret("JWT_SECRET");

const app = express();


app.use(cors({ origin: true }));
app.use(express.json());
app.use("/api", router);

export const api = onRequest(
  {
    region: "us-east1",
    secrets: [JWT_SECRET],
  },
  async (req, res) => {
    try {
      const jwtSecretValue = await JWT_SECRET.value();

    
      app(req, res);
    } catch (err) {
      console.error("Failed to access JWT_SECRET:", err);
      res.status(500).send("Internal server error");
    }
  }
);

export const scheduledDeleteExpiredGrooves = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Africa/Johannesburg",
    region: "us-east1",
  },
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