import { MessageModel } from "../model/message.model";
import { Server as IOServer, Socket } from "socket.io";
import mongoose, { Types } from "mongoose";
import { PrivateChatModel } from "../model/private-chat-model";
import { IUser } from "../types/user.types";
import { responseMessage } from "../types/message.types";

export const makeMessageSeen = async (
  toPrivateRoom: string,
  message: responseMessage,
  socket: Socket,
  io: IOServer
) => {
  await MessageModel.updateOne(
    { _id: message.id, readBy: { $ne: socket.data.userId } },
    { $push: { readBy: socket.data.userId } }
  );

  const seenMessage = await MessageModel.findById(message.id);

  if (!seenMessage) return;

  const chatRoom = await PrivateChatModel.findById(seenMessage.chatRoomId);

  if (!chatRoom) {
    io.to(toPrivateRoom).emit("message_seen", {
      id: seenMessage._id,
      from: message.from,
      message: seenMessage.content,
      status: seenMessage.status,
      createdAt: seenMessage.createdAt,
      readBy: seenMessage.readBy,
    });
    return;
  }

  if (
    seenMessage.readBy &&
    seenMessage.readBy.length >= chatRoom.participants.length
  ) {
    seenMessage.status = "seen";
    await seenMessage.save();
  }

  io.to(toPrivateRoom).emit("message_seen", {
    id: seenMessage._id,
    from: message.from,
    message: seenMessage.content,
    status: seenMessage.status,
    createdAt: seenMessage.createdAt,
    readBy: seenMessage.readBy,
    chatId: seenMessage.chatRoomId,
  });
};

export const maskHistoryMessageSeen = async (
  toPrivateRoom: string,
  io: IOServer,
  socket: Socket
) => {
  const chatRoom = await PrivateChatModel.findOne({
    roomString: toPrivateRoom,
  });

  const messagesToUpdate = await MessageModel.find({
    chatRoomId: chatRoom?.id,
    status: "sent",
  });

  await MessageModel.updateMany(
    { chatRoomId: chatRoom?.id, readBy: { $ne: socket.data.userId } },
    {
      $push: {
        readBy: socket.data.userId,
      },
      $set: {
        status: "seen",
      },
    }
  );

  const seenMessages = await MessageModel.find({
    _id: { $in: messagesToUpdate.map((m) => m._id) },
  })
    .populate<{ sender: IUser }>("sender")
    .lean();

  if (seenMessages) {
    const messages = seenMessages.map((messageData) => {
      return {
        id: messageData._id,
        from: messageData.sender.name,
        message: messageData.content,
        status: messageData.status,
        createdAt: messageData.createdAt,
        readBy: messageData.readBy,
        chatId: messageData.chatRoomId,
      };
    });
    io.to(toPrivateRoom).emit("history_message_seen", messages);
  }
};
