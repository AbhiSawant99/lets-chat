import { Server, Socket } from "socket.io";
import { logger } from "@/logger";
import {
  deletePrivateMessage,
  joinPrivateRoom,
  privateMessageService,
} from "@/service/private-chat-service";
import { disconnectSocketService } from "@/service/disconnect-socket-service";
import { getUserChatService } from "@/service/get-user-chat-service";
import {
  makeMessageSeen,
  maskHistoryMessageSeen,
} from "@/service/message-service";
const users: Record<string, string> = {};

export interface UserConnection {
  userId: string;
  socketIds: string[];
  username: string;
  online: boolean;
}

export const userConnections = new Map<string, UserConnection>();

export const socketController = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    let user = userConnections.get(socket.data.userId);

    if (!user) {
      logger.info(`A user connected - socket ID: ${socket.id}`);
      user = {
        userId: socket.data.userId,
        socketIds: [socket.id],
        username: socket.data.username,
        online: true,
      };
    } else {
      logger.info(
        `user ${user.username} connected again to socket ID: ${socket.id}`
      );
      user = {
        ...user,
        socketIds: [...user.socketIds, socket.id],
        online: true,
      };
    }

    userConnections.set(socket.data.userId, user);

    socket.broadcast.emit("online_users", Array.from(userConnections.keys()));

    getUserChatService(io, socket, user);

    socket.on("mark_message_seen", ({ toPrivateRoom, message }) =>
      makeMessageSeen(toPrivateRoom, message, socket, io)
    );

    socket.on("mark_history_message_seen", ({ toPrivateRoom }) =>
      maskHistoryMessageSeen(toPrivateRoom, io, socket)
    );

    socket.on("typing", ({ roomId, username }) => {
      socket.to(roomId).emit("typing", username);
    });

    socket.on("stopTyping", ({ roomId, username }) => {
      socket.to(roomId).emit("stopTyping", username);
    });

    socket.on("join", (username: string) => {
      users[socket.id] = username;
      logger.info(`${username} joined`);
    });

    socket.on("join_private_room", (room: string) =>
      joinPrivateRoom(io, socket, room)
    );

    socket.on("send_message", ({ room, message }) => {
      io.to(room).emit("receive_message", {
        user: users[socket.id],
        message,
      });
    });

    socket.on("private_message", ({ toPrivateRoom, message }) =>
      privateMessageService(io, socket, toPrivateRoom, message)
    );

    socket.on("delete_private_message", ({ toPrivateRoom, messageId }) => {
      deletePrivateMessage(toPrivateRoom, messageId, socket, io);
    });

    socket.on("disconnect", () => disconnectSocketService(socket));

    //? useful for debugging catch any socket events
    // socket.onAny((event, ...args) => {
    //   console.log(event, args);
    // });
  });
};
