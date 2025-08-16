import cookieParser from "cookie-parser";
import { NextFunction } from "express";
import { DefaultEventsMap, ExtendedError, Socket } from "socket.io";
import jwt from "jsonwebtoken";

export const webSocketMiddleware = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  next: (err?: ExtendedError | undefined) => void
) => {
  const parseCookie = cookieParser();
  // Build fake req/res objects for cookie-parser
  const req: any = { headers: { cookie: socket.request.headers.cookie } };
  const res: any = {};

  // Run cookie-parser on them
  parseCookie(req, res, (err: any) => {
    if (err) {
      return next(new Error("Failed to parse cookies"));
    }

    const token = req.cookies?.token; // <-- your cookie name

    if (!token) {
      return next(new Error("Token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;
      socket.data.userId = decoded.id;
      socket.data.username = decoded.displayName;
      socket.data.online = true;
      next();
    } catch (e) {
      next(new Error("Authentication failed"));
    }
  });
};
