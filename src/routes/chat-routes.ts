import { Router } from "express";
import { getChatController, searchUsers } from "../controller/chat-controller";
import { verifyJWT } from "../service/auth-service";

const chatRouter = Router();

chatRouter.get("/get-chat", verifyJWT, getChatController);

chatRouter.get("/search-users", verifyJWT, searchUsers);

export default chatRouter;
