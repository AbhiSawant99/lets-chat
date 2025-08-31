import cors from "cors";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

export const CORSMiddleware = cors({
  origin: FRONTEND_URL, // Adjust this to your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, // Allow cookies to be sent
});
