import express from "express";
import {
  authLogin,
  authLogout,
  getAuthUser,
} from "../controller/auth-controller";
import { createUser } from "../controller/user-controller";
import { verifyJWT } from "../service/auth-service";

const authRoutes = express.Router();

authRoutes.post("/login", authLogin);

authRoutes.get("/user", verifyJWT, getAuthUser);

authRoutes.post("/sign-up", createUser);

authRoutes.post("/logout", verifyJWT, authLogout);

export default authRoutes;
