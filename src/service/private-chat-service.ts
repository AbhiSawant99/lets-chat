import { Server as IOServer, Socket } from "socket.io";
import { logger } from "../logger";
import {
  UserConnection,
  userConnections,
} from "../controller/socket-controller";
import { PrivateChatModel } from "../model/private-chat-model";
import { MessageModel } from "../model/message.model";
import { IUser } from "../types/user.types";
import { IMessage } from "../types/message.types";

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

    createPrivateChatRoom(room, userId1, userId2, socket);
  } else {
    logger.error(`user ${socket.data.userId} tried joining room ${room}`);
  }
};

const createPrivateChatRoom = async (
  room: string,
  userId1: string,
  userId2: string,
  socket: Socket
): Promise<void> => {
  const existingChatRoom = await PrivateChatModel.findOne({ roomString: room });

  if (!existingChatRoom) {
    await PrivateChatModel.create({
      roomString: room,
      participants: [userId1, userId2],
    });
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
          message: messageData.content,
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

  const savedMessage = await saveMessage(toPrivateRoom, message, sender);

  if (!savedMessage) return;

  io.to(toPrivateRoom).emit("receive_private_message", {
    id: savedMessage._id,
    from: sender?.username,
    message,
    status: savedMessage.status,
    createdAt: savedMessage.createdAt,
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
        from: sender?.username,
        message,
        status: savedMessage.status,
        createdAt: savedMessage.createdAt,
      });
    });
  }

  await PrivateChatModel.findOneAndUpdate(
    { roomString: toPrivateRoom },
    {
      lastMessage: savedMessage._id,
    }
  );
};

const saveMessage = async (
  toPrivateRoom: string,
  message: string,
  sender?: UserConnection
): Promise<IMessage | undefined> => {
  const chat = await PrivateChatModel.findOne({ roomString: toPrivateRoom });

  if (!chat || !sender) return;

  const savedMessage = await MessageModel.create({
    chatRoomId: chat.id,
    sender: sender.userId,
    content: message,
  });

  return savedMessage;
};

function getReceiverFromPrivateRoom(roomId: string, senderId?: string) {
  const [_, user1, user2] = roomId.split("_"); // ex: private_12_15

  if (!user1 || !user2) return null;
  return user1 === senderId ? user2 : user1;
}
