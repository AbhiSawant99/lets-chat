import { Server, Socket } from "socket.io";
import { logger } from "../logger";
const users: Record<string, string> = {};

interface UserConnection {
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

    socket.on("join_room", (room: string) => {
      socket.join(room);
      logger.info(`${users[socket.id]} joined room: ${room}`);
    });

    socket.on("send_message", ({ room, message }) => {
      io.to(room).emit("receive_message", {
        user: users[socket.id],
        message,
      });
    });

    socket.on("private_message", ({ toUserId, message }) => {
      const toSocket = userConnections.get(toUserId);

      if (!toSocket) return;

      const toSocketIds: string[] = toSocket ? toSocket?.socketIds : [];

      const sender = userConnections.get(socket.data.userId);

      const senderSocketIds: string[] = sender?.socketIds ?? [];

      toSocketIds.forEach((toSocketId) => {
        io.to(toSocketId).emit("receive_private_message", {
          from: sender?.username,
          message,
        });
      });

      senderSocketIds.forEach((senderSocket) => {
        io.to(senderSocket).emit("receive_private_message", {
          from: "You",
          message,
        });
      });
    });

    socket.on("disconnect", () => {
      const connectedUser = userConnections.get(socket.data.userId);
      if (!connectedUser) return;
      const userCurrentSockets = user?.socketIds ?? [];
      const filtered = userCurrentSockets.filter((id) => id !== socket.id);
      if (filtered.length === 0) {
        userConnections.set(socket.data.userId, {
          userId: socket.data.userId,
          socketIds: [],
          username: socket.data.username,
          online: false,
        });
      } else {
        userConnections.set(socket.data.userId, {
          userId: socket.data.userId,
          socketIds: [...filtered],
          username: socket.data.username,
          online: true,
        });
      }
      logger.info(
        `${connectedUser.username} disconnected from socket - ${socket.id}`
      );
      socket.broadcast.emit("users", {
        users: Array.from(userConnections.values()),
      });
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });
  });
};
