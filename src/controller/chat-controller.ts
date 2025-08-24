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
import { getRoomId } from "../utils/chat-utils";

export const getChatController = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;
    const chatId = req.query.chatId;

    if (!(user && user.id)) {
      throw new AppError("User not found", httpStatus.UNAUTHORIZED);
    }

    if (typeof chatId !== "string") {
      throw new AppError(
        `chatId should be a string, received - ${typeof chatId}`,
        httpStatus.BAD_REQUEST
      );
    }

    const privateChat = await PrivateChatModel.findById(chatId)
      .populate<{ lastMessage: IMessage }>("lastMessage")
      .lean();

    if (!privateChat) return;

    const recipient = privateChat.participants.find(
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

    const sender = await UserModel.findById(privateChat?.lastMessage?.sender);

    const privateChatWithStatus = {
      id: privateChat._id,
      roomId: privateChat.roomString,
      lastMessage: {
        id: privateChat.lastMessage._id,
        from: sender?.name,
        message: privateChat.lastMessage.content,
        status: privateChat.lastMessage.status,
        createdAt: privateChat.lastMessage.createdAt,
        readBy: privateChat.lastMessage.readBy,
        chatId: privateChat.lastMessage.chatRoomId,
      },
      userId: recipientConnectionDetails?.userId,
      username: recipientConnectionDetails?.username,
      socketId: recipientConnectionDetails?.socketIds,
      online: isParticipantOnline,
    };

    res.json(privateChatWithStatus);
  }
);

export const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const currentUser: AuthUser | undefined = req.user;
  const searchTerm = req.query.search;

  if (typeof searchTerm !== "string") {
    throw new AppError(
      `searchTerm should be a string, received - ${typeof searchTerm}`,
      httpStatus.BAD_REQUEST
    );
  }

  if (!(currentUser && currentUser.id)) {
    throw new AppError("user id not found", httpStatus.BAD_REQUEST);
  }

  const regex = new RegExp(searchTerm, "i");
  const usersList = await UserModel.find({
    _id: { $ne: currentUser.id },
    $or: [{ name: regex }, { username: regex }],
  });

  const chatList = usersList.map((user) => {
    return {
      username: user.name,
      userId: user.id,
      online: userConnections.has(user.id),
      roomId: getRoomId(currentUser.id ?? "", user.id),
    };
  });

  res.send(chatList);
});
