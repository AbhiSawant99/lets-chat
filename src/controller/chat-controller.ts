import type { Request, Response } from "express";
import { getIO } from "../service/socket-init-service";
import catchAsync from "../utils/catch-async";
import { userConnections } from "./socket-controller";

export const getChatsController = catchAsync(
  async (req: Request, res: Response) => {
    const io = getIO();

    const chats = await io.fetchSockets();

    const socketList = chats.map((s) => {
      return {
        id: s.id,
        userId: s.data.userId,
        name: s.data.username || "Anonymous",
        online: s.data.online || false,
      };
    });

    res.json(socketList);
  }
);
