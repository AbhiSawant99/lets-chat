import { Socket } from "socket.io";
import { userConnections } from "@/controller/socket-controller";
import { logger } from "@/logger";

export const disconnectSocketService = (socket: Socket) => {
  const connectedUser = userConnections.get(socket.data.userId);
  if (!connectedUser) return;
  const userCurrentSockets = connectedUser?.socketIds ?? [];
  const filtered = userCurrentSockets.filter((id) => id !== socket.id);
  if (filtered.length === 0) {
    userConnections.delete(socket.data.userId);
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
  socket.broadcast.emit("online_users", Array.from(userConnections.keys()));
};
