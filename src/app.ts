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
import { AuthUser } from "./types/auth-user";

import userRoutes from "./routes/user-routes";

dotenv.config();

const PORT = process.env.PORT || 3000;
const dbURI: string = process.env.MONGODB_URI ?? "";

const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

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
  //todo: this will go to UI later
  res.send("<a href='/auth/google'>Login with Google</a>");
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
  (req: Request, res: Response) => {
    res.redirect("/profile");
  }
);

app.get("/profile", (req: Request, res: Response) => {
  const expressUser: AuthUser | undefined = req.user;

  if (!expressUser) {
    return res.status(401).send("Unauthorized");
  }

  res.send(`
    <h1>Welcome ${expressUser.displayName}</h1><br />
    <img src="${
      expressUser.photos ? expressUser.photos[0].value : ""
    }" alt="Profile Picture" /><br />
    <a href="/logout">Logout</a>`);
});

app.get("/logout", (req: Request, res: Response) => {
  req.logOut(() => {
    res.redirect("/");
  });
});

const server = http.createServer(app);

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

app.use(express.json());

app.use(userRoutes);

app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  error.statusCode = error.statusCode || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  res.status(error.statusCode).json({
    status: error.statusCode,
    message: errorMessage,
  });
});
