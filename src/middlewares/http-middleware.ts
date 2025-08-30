import cors from "cors";
import session from "express-session";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

export const CORSMiddleware = cors({
  origin: FRONTEND_URL, // Adjust this to your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, // Allow cookies to be sent
});

export const sessionMiddleware = session({
  secret: "secret",
  resave: false,
  saveUninitialized: true,
});
