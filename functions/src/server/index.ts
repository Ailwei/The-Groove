import express from "express";
import cors from "cors";
import router from "./routes/route";
import { deleteExpiredGrooves } from "./utils/expireGrooves";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

setInterval(async () => {
  try {
    await deleteExpiredGrooves();
  } catch (error) {
    console.error("Failed to delete expired grooves:", error);
  }
}, 10 * 1000);

app.listen(3000, () => console.log("Server running on port 3000"));
export default app;