import express from "express";
import mongoose from "mongoose";
import http, { METHODS } from "http";
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
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const PORT = process.env.PORT || 3000;
const dbURI: string = process.env.MONGODB_URI ?? "";

const app = express();

const server = http.createServer(app);
const io = new Server(server);

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

app.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  req.logOut(() => {
    res.redirect("http://localhost:5173/login");
  });
});

app.use("/auth", authRoutes);

io.on("connection", (socket) => {
  logger.info("A user connected", socket.id);
});

app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  res.status(error.statusCode).json({
    status: error.statusCode,
    message: errorMessage,
  });
});
