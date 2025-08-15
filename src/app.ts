import express from "express";
import mongoose from "mongoose";
import http from "http";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";
import dotenv from "dotenv";
import { logger } from "./logger";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AuthUser } from "./types/auth-user.types";

import { getUser, verifyJWT } from "./service/auth-service";
import { googleUserSuccessfulLogin } from "./controller/user-oauth-controller";
import authRoutes from "./routes/auth-routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initSocket } from "./service/socket-init-service";
import { socketController } from "./controller/socket-controller";
import chatRouter from "./routes/chat-routes";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";

dotenv.config();

const PORT = process.env.PORT || 3000;
const dbURI: string = process.env.MONGODB_URI ?? "";

const app = express();

const server = http.createServer(app);

const io = initSocket(server);

mongoose
  .connect(dbURI)
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Server started listening at PORT - ${PORT}`);
    });
  })
  .catch((error: Error) => {
    logger.error("Database connection error: ", error);
    process.exit(1); // Exit the process with failure
  });

app.use(
  cors({
    origin: "http://localhost:5173", // Adjust this to your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Allow cookies to be sent
  })
);

app.use(express.json());

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      //todo: Here you can save the user profile to your database if needed
      //? For now, we will just return the profile
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: AuthUser, done) => {
  done(null, user);
});

app.get("/", (req: Request, res: Response) => {
  if (getUser(req?.cookies?.token)) {
    res.redirect("http://localhost:5173/profile");
  } else {
    res.redirect("http://localhost:5173/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  googleUserSuccessfulLogin
);

app.get("/profile", verifyJWT, (req: Request, res: Response) => {
  res.send(req.user);
});

app.use("/auth", authRoutes);

app.use("/chat", chatRouter);

io.use((socket, next) => {
  const parseCookie = cookieParser();
  // Build fake req/res objects for cookie-parser
  const req: any = { headers: { cookie: socket.request.headers.cookie } };
  const res: any = {};

  // Run cookie-parser on them
  parseCookie(req, res, (err: any) => {
    if (err) {
      return next(new Error("Failed to parse cookies"));
    }

    const token = req.cookies?.token; // <-- your cookie name

    if (!token) {
      return next(new Error("Token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;
      socket.data.userId = decoded.id;
      socket.data.username = decoded.displayName;
      socket.data.online = true;
      next();
    } catch (e) {
      next(new Error("Authentication failed"));
    }
  });
});

socketController(io);

app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  res.status(error.statusCode).json({
    status: error.statusCode,
    message: errorMessage,
  });
});
