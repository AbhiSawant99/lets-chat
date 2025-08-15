import { Router } from "express";
import {
  //   connectUserController,
  getChatsController,
} from "../controller/chat-controller";
import { verifyJWT } from "../service/auth-service";

const chatRouter = Router();

chatRouter.get("/get-chats", verifyJWT, getChatsController);

// chatRouter.get("/connect-user", verifyJWT, connectUserController);

export default chatRouter;
