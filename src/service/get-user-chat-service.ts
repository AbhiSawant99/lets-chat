import { Server as IOServer, Socket } from "socket.io";
import { AuthUser } from "../types/auth-user.types";
import { IChatRoom } from "../types/chat-room.types";
import { PrivateChatModel } from "../model/private-chat-model";
import { AppError } from "../AppError";
import { GroupChatModel } from "../model/group-chat-model";
import {
  UserConnection,
  userConnections,
} from "../controller/socket-controller";
import { UserModel } from "../model/user-model";
import { IMessage } from "../types/message.types";
import { getRoomId } from "../utils/chat-utils";

export const getUserChatService = async (
  io: IOServer,
  socket: Socket,
  user?: UserConnection
) => {
  if (!(user && user.userId)) return [];

  const privateChats = await PrivateChatModel.find({
    participants: user.userId,
  })
    .populate<{ lastMessage: IMessage }>("lastMessage")
    .lean();

  const groupChats = await GroupChatModel.find({ participants: user.userId });

  const privateChatsWithStatus = await Promise.all(
    privateChats.map(async (chat) => {
      let recipient: string | undefined;

      if (
        chat.participants?.length > 0 &&
        chat.participants[0]?.toString() === chat.participants[1]?.toString()
      ) {
        recipient = chat.participants[0].toString();
      } else {
        recipient = chat.participants
          .find((participant) => participant.toString() !== user.userId)
          ?.toString();
      }

      const recipientDetails = recipient
        ? await UserModel.findById(recipient).lean()
        : null;

      const recipientConnectionDetails =
        recipient && userConnections.get(recipient)
          ? userConnections.get(recipient)
          : {
              userId: recipientDetails?._id,
              socketIds: [],
              username: recipientDetails?.name,
              online: false,
            };

      const isParticipantOnline = recipientConnectionDetails?.online ?? false;

      return {
        id: chat._id,
        roomId: chat.roomString,
        lastMessage: chat.lastMessage
          ? {
              id: chat.lastMessage._id,
              message: chat.lastMessage.content,
              createdAt: chat.lastMessage.createdAt,
              status: chat.lastMessage.status,
              readBy: chat.lastMessage.readBy,
            }
          : undefined,
        userId: recipientConnectionDetails?.userId,
        username: recipientConnectionDetails?.username,
        socketId: recipientConnectionDetails?.socketIds,
        online: isParticipantOnline,
      };
    })
  );

  if (privateChatsWithStatus.length === 0) {
    let userFirstChatDetails = userConnections.get(user.userId);

    if (!(userFirstChatDetails && userFirstChatDetails.userId)) return;

    const userFirstChat = await PrivateChatModel.create({
      roomString: getRoomId(
        userFirstChatDetails.userId,
        userFirstChatDetails.userId
      ),
      participants: [userFirstChatDetails.userId, userFirstChatDetails.userId],
    });

    privateChatsWithStatus.push({
      id: userFirstChat.id,
      roomId: userFirstChat.roomString,
      userId: userFirstChatDetails.userId,
      username: userFirstChatDetails?.username,
      socketId: userFirstChatDetails?.socketIds,
      online: userFirstChatDetails?.online,
      lastMessage: undefined,
    });
  }

  const chats = [...privateChatsWithStatus, ...groupChats];

  socket.emit("chats", chats);
};
