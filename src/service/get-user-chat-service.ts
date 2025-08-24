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
        roomString: chat.roomString,
        lastMessage: chat.lastMessage
          ? {
              id: chat.lastMessage._id,
              message: chat.lastMessage.content,
              createdAt: chat.lastMessage.createdAt,
              status: chat.lastMessage.status,
            }
          : undefined,
        userId: recipientConnectionDetails?.userId,
        username: recipientConnectionDetails?.username,
        socketId: recipientConnectionDetails?.socketIds,
        online: isParticipantOnline,
      };
    })
  );

  const chats = [...privateChatsWithStatus, ...groupChats];

  socket.emit("chats", chats);
};
