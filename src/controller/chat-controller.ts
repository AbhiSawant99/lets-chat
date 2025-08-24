import type { Request, Response } from "express";
import catchAsync from "../utils/catch-async";
import { UserConnection, userConnections } from "./socket-controller";
import { AuthUser } from "../types/auth-user.types";
import { PrivateChatModel } from "../model/private-chat-model";
import { GroupChatModel } from "../model/group-chat-model";
import { UserModel } from "../model/user-model";
import { AppError } from "../AppError";
import httpStatus from "http-status";
import { IMessage } from "../types/message.types";

export const getChatsController = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;
    if (!(user && user.id)) {
      throw new AppError("User not found", httpStatus.UNAUTHORIZED);
    }

    const privateChats = await PrivateChatModel.find({ participants: user.id })
      .populate<{ lastMessage: IMessage }>("lastMessage")
      .lean();

    const groupChats = await GroupChatModel.find({ participants: user.id });

    const privateChatsWithStatus = await Promise.all(
      privateChats.map(async (chat) => {
        const recipient = chat.participants.find(
          (participant) => participant.toString() !== user.id
        );

        const recipientDetails = recipient
          ? await UserModel.findById(recipient.toString()).lean()
          : null;

        const recipientConnectionDetails = recipient
          ? userConnections.get(recipient.toString())
          : {
              userId: recipientDetails?._id,
              socketIds: [],
              username: recipientDetails?.name,
              online: false,
            };

        const isParticipantOnline = recipientConnectionDetails?.online ?? false;

        return {
          roomString: chat.roomString,
          lastMessage: chat.lastMessage,
          userId: recipientConnectionDetails?.userId,
          username: recipientConnectionDetails?.username,
          socketId: recipientConnectionDetails?.socketIds,
          online: isParticipantOnline,
        };
      })
    );

    const chats = [...privateChatsWithStatus, ...groupChats];

    res.json(chats);
  }
);
