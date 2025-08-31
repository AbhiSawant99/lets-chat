import { Server as IOServer, Socket } from "socket.io";
import { PrivateChatModel } from "@/model/private-chat-model";
import {
  UserConnection,
  userConnections,
} from "@/controller/socket-controller";
import { IMessage } from "@/types/message.types";
import { getRoomId } from "@/utils/chat-utils";
import { findUserById } from "@/service/user-service";

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
    .sort({ "lastMessage.createdAt": -1 }) // newest first
    .lean();

  const privateChatsWithStatus = await Promise.all(
    privateChats.map(async (chat) => {
      let recipient: string | undefined;

      if (chat.participants?.length === 1) {
        recipient = chat.participants[0].toString();
      } else {
        recipient = chat.participants
          .find((participant) => participant.toString() !== user.userId)
          ?.toString();
      }

      const recipientDetails = recipient ? await findUserById(recipient) : null;

      const recipientConnectionDetails =
        recipient && userConnections.get(recipient)
          ? userConnections.get(recipient)
          : {
              userId: recipientDetails?.id,
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
        photo: recipientDetails?.photo,
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
      participants: [userFirstChatDetails.userId],
    });

    const userDetails = await findUserById(user.userId);

    privateChatsWithStatus.push({
      id: userFirstChat.id,
      roomId: userFirstChat.roomString,
      userId: userFirstChatDetails.userId,
      username: userFirstChatDetails?.username,
      socketId: userFirstChatDetails?.socketIds,
      online: userFirstChatDetails?.online,
      photo: userDetails?.photo || "",
      lastMessage: undefined,
    });

    socket.emit("chats", privateChatsWithStatus);
  } else {
    const sortedPrivateChat = privateChatsWithStatus.sort((a, b) => {
      return (
        new Date(b.lastMessage?.createdAt || 0).getTime() -
        new Date(a.lastMessage?.createdAt || 0).getTime()
      );
    });
    socket.emit("chats", sortedPrivateChat);
  }
};
