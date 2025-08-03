import express from "express";
import { user_create_post } from "../controller/user-controller";

const router = express.Router();

router.post("/create", user_create_post);

export default router;
