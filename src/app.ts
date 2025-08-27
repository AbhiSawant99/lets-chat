import express from "express";
import mongoose from "mongoose";
import http from "http";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/AppError";
import dotenv from "dotenv";
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
import {
  CORSMiddleware,
  sessionMiddleware,
} from "@/middlewares/http-middleware";
import { webSocketMiddleware } from "@/middlewares/socket-middleware";
import { googlePassportMiddleware } from "@/middlewares/passport-middleware";

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

app.use(CORSMiddleware);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
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
    res.redirect("http://localhost:5173/profile");
  } else {
    res.redirect("http://localhost:5173");
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
