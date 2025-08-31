import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import http from "http";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/AppError";
import { logger } from "@/logger";

import passport from "passport";
import { AuthUser } from "@/types/auth-user.types";

import { getUser, verifyJWT } from "@/service/auth-service";
import { googleUserSuccessfulLogin } from "@/controller/user-oauth-controller";
import authRoutes from "@/routes/auth-routes";

import cookieParser from "cookie-parser";
import { initSocket } from "@/service/socket-init-service";
import { socketController } from "@/controller/socket-controller";
import chatRouter from "@/routes/chat-routes";
import { CORSMiddleware } from "@/middlewares/http-middleware";
import { webSocketMiddleware } from "@/middlewares/socket-middleware";
import { googlePassportMiddleware } from "@/middlewares/passport-middleware";

const PORT = process.env.PORT || 3000;
const dbURI: string = process.env.MONGODB_URI ?? "";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

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

app.use(CORSMiddleware);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(passport.initialize());
app.use(cookieParser());

passport.use(googlePassportMiddleware());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: AuthUser, done) => {
  done(null, user);
});

app.get("/", (req: Request, res: Response) => {
  if (getUser(req?.cookies?.token)) {
    res.redirect(`${FRONTEND_URL}/profile`);
  } else {
    res.redirect(FRONTEND_URL);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  googleUserSuccessfulLogin
);

app.get("/profile", verifyJWT, (req: Request, res: Response) => {
  res.send(req.user);
});

app.use("/auth", authRoutes);

app.use("/chat", chatRouter);

io.use(webSocketMiddleware);

socketController(io);

app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  res.status(error.statusCode).json({
    status: error.statusCode,
    message: errorMessage,
  });
});
