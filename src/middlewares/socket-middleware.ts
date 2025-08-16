import cookieParser from "cookie-parser";
import { NextFunction } from "express";
import { DefaultEventsMap, ExtendedError, Socket } from "socket.io";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../AppError";
import httpStatus from "http-status";
import { logger } from "../logger";

export const webSocketMiddleware = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  next: (err?: ExtendedError | undefined) => void
) => {
  const parseCookie = cookieParser();
  // Build fake req/res objects for cookie-parser
  const req: any = { headers: { cookie: socket.request.headers.cookie } };
  const res: any = {};

  parseCookie(req, res, (err: any) => {
    if (err) {
      return next(
        new AppError("Failed to parse cookies", httpStatus.BAD_REQUEST)
      );
    }

    const token = req.cookies?.token;

    if (!token) {
      return next(new AppError("Token missing", httpStatus.UNAUTHORIZED));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;
      socket.data.userId = decoded.id;
      socket.data.username = decoded.displayName;
      socket.data.online = true;
      next();
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        logger.error(`Token Expired - ${token}`);
        return next(new AppError("TokenExpired", httpStatus.UNAUTHORIZED));
      }
      next(new AppError("Authentication failed", httpStatus.UNAUTHORIZED));
    }
  });
};
