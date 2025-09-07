import { Server as IOServer, Socket } from "socket.io";
import { logger } from "@/logger";
import {
  UserConnection,
  userConnections,
} from "@/controller/socket-controller";
import { PrivateChatModel } from "@/model/private-chat-model";
import { MessageModel } from "@/model/message.model";
import { IUser } from "@/types/user.types";
import { IMessage } from "@/types/message.types";
import { IPrivateChat } from "@/types/chat-room.types";
import { findUserById } from "@/service/user-service";

export const joinPrivateRoom = (io: IOServer, socket: Socket, room: string) => {
  const roomParts = room.split("_");

  const userId1 = roomParts[1];
  const userId2 = roomParts[2];

  if (
    userId1 &&
    userId2 &&
    (userId1 === socket.data.userId || userId2 === socket.data.userId)
  ) {
    removeSocketFromRooms(io, socket);
    socket.join(room);
    logger.info(
      `${socket.data.username} id:${socket.data.userId} joined room: ${room}`
    );

    sendRoomDetails(room, socket);
  } else {
    logger.error(`user ${socket.data.userId} tried joining room ${room}`);
  }
};

const createPrivateChatRoom = async (room: string) => {
  const roomParts = room.split("_");

  const userId1 = roomParts[1];
  const userId2 = roomParts[2];
  const existingChatRoom = await PrivateChatModel.findOne({ roomString: room });

  if (!existingChatRoom) {
    const newChat = await PrivateChatModel.create({
      roomString: room,
      participants: [userId1, userId2],
    });
    return newChat;
  }

  return existingChatRoom;
};

const sendRoomDetails = async (room: string, socket: Socket): Promise<void> => {
  const existingChatRoom = await PrivateChatModel.findOne({ roomString: room });

  if (!existingChatRoom) {
    socket.emit("chat_history", []);
  } else {
    const existingPrivateMessages = await MessageModel.find({
      chatRoomId: existingChatRoom.id,
    })
      .populate<{ sender: IUser }>("sender")
      .lean();

    if (existingPrivateMessages) {
      const messages = existingPrivateMessages.map((messageData) => {
        return {
          id: messageData._id,
          from: messageData.sender.name,
          message:
            messageData.status === "deleted"
              ? "This message was deleted"
              : messageData.content,
          status: messageData.status,
          createdAt: messageData.createdAt,
        };
      });
      socket.emit("chat_history", messages);
    }
  }
};

const removeSocketFromRooms = (io: IOServer, socket: Socket) => {
  const senderSocketId = socket.id;

  const targetSocket = io.sockets.sockets.get(senderSocketId);

  const joinedRooms = targetSocket && targetSocket.rooms;

  if (joinedRooms) {
    joinedRooms.forEach((joinedRoom) => {
      if (joinedRoom !== socket.id) {
        // remove from all rooms except his own socket
        socket.leave(joinedRoom);
      }
    });
  }
};

export const privateMessageService = async (
  io: IOServer,
  socket: Socket,
  toPrivateRoom: string,
  message: string
) => {
  const sender = userConnections.get(socket.data.userId);

  const savedMessage: IMessage | undefined = await saveMessage(
    toPrivateRoom,
    message,
    socket,
    sender
  );

  if (!savedMessage) return;

  await PrivateChatModel.findOneAndUpdate(
    { roomString: toPrivateRoom },
    {
      lastMessage: savedMessage._id,
    }
  );

  io.to(toPrivateRoom).emit("receive_private_message", {
    id: savedMessage._id,
    chatId: savedMessage.chatRoomId,
    from: sender?.username,
    message,
    status: savedMessage.status,
    createdAt: savedMessage.createdAt,
    readBy: savedMessage.readBy,
  });

  sender?.socketIds.forEach((toSocketId) => {
    io.to(toSocketId).emit("receive_private_message_list", {
      id: savedMessage._id,
      chatId: savedMessage.chatRoomId,
      from: sender?.username,
      message,
      status: savedMessage.status,
      createdAt: savedMessage.createdAt,
      readBy: savedMessage.readBy,
    });
  });

  const receiverUserId = getReceiverFromPrivateRoom(
    toPrivateRoom,
    sender?.userId
  );

  if (!receiverUserId) return;

  const receiver = userConnections.get(receiverUserId);
  if (!receiver) return;

  const receiverSocketIds: string[] = receiver.socketIds;

  const isReceiverInRoom = receiverSocketIds.some((socketId) => {
    const targetSocket = io.sockets.sockets.get(socketId);

    return targetSocket?.rooms.has(toPrivateRoom);
  });

  if (!isReceiverInRoom) {
    receiverSocketIds.forEach((toSocketId) => {
      io.to(toSocketId).emit("receive_private_notification", {
        id: savedMessage._id,
        chatId: savedMessage.chatRoomId,
        from: sender?.username,
        message,
        status: savedMessage.status,
        createdAt: savedMessage.createdAt,
        readBy: savedMessage.readBy,
      });
    });
  }
};

const saveMessage = async (
  toPrivateRoom: string,
  message: string,
  socket: Socket,
  sender?: UserConnection
): Promise<IMessage | undefined> => {
  if (!sender) return;

  let chat = await PrivateChatModel.findOne({ roomString: toPrivateRoom });

  if (!chat) {
    const newChat = await createPrivateChatRoom(toPrivateRoom);

    chat = new PrivateChatModel(newChat);

    emitChatCreated(chat, socket, sender);
  }

  const savedMessage = await MessageModel.create({
    chatRoomId: chat.id,
    sender: sender.userId,
    content: message,
  });

  return savedMessage;
};

const emitChatCreated = async (
  chat: IPrivateChat,
  socket: Socket,
  sender: UserConnection
) => {
  const receiverId = getReceiverFromPrivateRoom(chat.roomString, sender.userId);

  if (!receiverId) return;

  const receiverDetails = await findUserById(receiverId);

  if (receiverDetails) {
    const receiverOnline = userConnections.get(receiverId)?.online;
    socket.emit("chat_created", {
      id: chat.id,
      roomId: chat.roomString,
      lastMessage: undefined,
      userId: receiverDetails.id,
      username: receiverDetails.name,
      photo: receiverDetails.photo ?? "",
      online: receiverOnline,
    });
  }
};

function getReceiverFromPrivateRoom(roomId: string, senderId?: string) {
  const [_, user1, user2] = roomId.split("_"); // ex: private_12_15

  if (!user1 || !user2) return null;
  return user1 === senderId ? user2 : user1;
}

export const deletePrivateMessage = async (
  toPrivateRoom: string,
  messageId: string,
  socket: Socket,
  io: IOServer
) => {
  const sender = userConnections.get(socket.data.userId);

  if (!sender) return;

  const userId = userConnections.get(socket.data.userId);

  const message = await MessageModel.findById(messageId);

  if (!message) {
    socket.emit("errorMessage", { error: "Message does not exist" });
    return;
  }

  if (!message.sender.equals(userId?.userId ?? "")) {
    socket.emit("errorMessage", {
      error: "You are not authorized to delete this message",
    });
    return;
  }

  const deletedMessage = await MessageModel.findByIdAndUpdate(
    messageId,
    {
      status: "deleted",
    },
    { new: true }
  );

  if (!deletedMessage) return;

  io.to(toPrivateRoom).emit("message_deleted_private", {
    id: deletedMessage._id,
    chatId: deletedMessage.chatRoomId,
    from: sender?.username,
    message: "This message was deleted",
    status: deletedMessage.status,
    createdAt: deletedMessage.createdAt,
    readBy: deletedMessage.readBy,
  });

  sender?.socketIds.forEach((toSocketId) => {
    io.to(toSocketId).emit("message_deleted_private_list", {
      id: deletedMessage._id,
      chatId: deletedMessage.chatRoomId,
      from: sender?.username,
      message: "This message was deleted",
      status: deletedMessage.status,
      createdAt: deletedMessage.createdAt,
      readBy: deletedMessage.readBy,
    });
  });

  const receiverUserId = getReceiverFromPrivateRoom(
    toPrivateRoom,
    sender?.userId
  );

  if (!receiverUserId) return;

  const receiver = userConnections.get(receiverUserId);
  if (!receiver) return;

  const receiverSocketIds: string[] = receiver.socketIds;

  receiverSocketIds.forEach((toSocketId) => {
    io.to(toSocketId).emit("message_deleted_private_notification", {
      id: deletedMessage._id,
      chatId: deletedMessage.chatRoomId,
      from: sender?.username,
      message: "This message was deleted",
      status: deletedMessage.status,
      createdAt: deletedMessage.createdAt,
      readBy: deletedMessage.readBy,
    });
  });
};
