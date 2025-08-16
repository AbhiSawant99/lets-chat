import cors from "cors";
import session from "express-session";

export const CORSMiddleware = cors({
  origin: "http://localhost:5173", // Adjust this to your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, // Allow cookies to be sent
});

export const sessionMiddleware = session({
  secret: "secret",
  resave: false,
  saveUninitialized: true,
});
