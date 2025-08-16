import { Server, Socket } from "socket.io";
import { logger } from "../logger";
import {
  joinPrivateRoom,
  privateMessageService,
} from "../service/private-chat-service";
import { disconnectSocketService } from "../service/disconnect-socket-service";
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
    const user = userConnections.get(socket.data.userId);

    if (!user) {
      logger.info(`A user connected - socket ID: ${socket.id}`);
      userConnections.set(socket.data.userId, {
        userId: socket.data.userId,
        socketIds: [socket.id],
        username: socket.data.username,
        online: true,
      });
    } else {
      logger.info(
        `user ${user.username} connected again to socket ID: ${socket.id}`
      );
      userConnections.set(socket.data.userId, {
        userId: socket.data.userId,
        socketIds: [...user.socketIds, socket.id],
        username: socket.data.username,
        online: true,
      });
    }

    io.emit("users", {
      users: Array.from(userConnections.values()),
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

    socket.on("disconnect", () => disconnectSocketService(socket));

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });
  });
};
