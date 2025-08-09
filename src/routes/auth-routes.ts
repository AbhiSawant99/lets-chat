import express from "express";
import { authLogin } from "../controller/auth-controller";
import { createUser } from "../controller/user-controller";

const authRoutes = express.Router();

authRoutes.post("/login", authLogin);

authRoutes.post("/sign-up", createUser);

export default authRoutes;
