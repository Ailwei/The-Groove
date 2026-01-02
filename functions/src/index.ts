import cors from "cors";
import express from "express";
import * as functions from "firebase-functions";

import app from "../src/server/index"


app.use(cors({ origin: true }));
app.use(express.json());

export const api = functions.https.onRequest(app);
