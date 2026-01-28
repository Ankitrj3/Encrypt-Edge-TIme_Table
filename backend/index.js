import { onRequest } from "firebase-functions/v2/https";
import { app } from "./src/server.js";

// Create and export the Cloud Function
export const api = onRequest(app);
