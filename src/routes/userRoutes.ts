import express from "express";
import { user_create_post } from "../controller/userController";

const router = express.Router();

router.post("/create", user_create_post);

export default router;
