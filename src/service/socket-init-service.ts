import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

export const initSocket = (server: any) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: FRONTEND_URL,
      credentials: true,
    },
  });
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
