import express from "express";
import {
  authLogin,
  authLogout,
  checkUserName,
  getAuthUser,
  saveUserName,
} from "../controller/auth-controller";
import { createUser } from "../controller/user-controller";
import { verifyJWT } from "../service/auth-service";
import { upload } from "../utils/image-upload";

const authRoutes = express.Router();

authRoutes.post("/login", authLogin);

authRoutes.get("/user", verifyJWT, getAuthUser);

authRoutes.post("/sign-up", createUser);

authRoutes.post(
  "/sign-final-step",
  verifyJWT,
  upload.single("photo"),
  saveUserName
);

authRoutes.post("/logout", verifyJWT, authLogout);

authRoutes.get("/check-username", verifyJWT, checkUserName);

export default authRoutes;
