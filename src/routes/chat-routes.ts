import { Router } from "express";
import { getChatsController } from "../controller/chat-controller";
import { verifyJWT } from "../service/auth-service";

const chatRouter = Router();

chatRouter.get("/get-chats", verifyJWT, getChatsController);

export default chatRouter;
