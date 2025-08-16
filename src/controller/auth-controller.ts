import { Request, Response } from "express";
import catchAsync from "../utils/catch-async";
import { AuthRequestUser, AuthUser } from "../types/auth-user.types";
import httpStatus from "http-status";
import { requestAuthService, setUser } from "../service/auth-service";
import { UserModel } from "../model/user-model";
import { getIO } from "../service/socket-init-service";
import { userConnections } from "./socket-controller";

export const authLogin = catchAsync(async (req: Request, res: Response) => {
  const reqUser: AuthRequestUser = req.body;

  const existingUser = await requestAuthService(reqUser);

  if (!existingUser) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: "User not found",
    });
  }

  const token = setUser({
    id: existingUser._id.toString(),
    displayName: existingUser.name,
    emails: [{ value: existingUser.email }],
    photos: [],
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
  });

  res.status(httpStatus.OK).json({
    message: "Login successful",
    user: {
      id: existingUser.id,
      displayName: existingUser.name,
      email: existingUser.email,
      photos: [],
    },
  });
});

export const authLogout = catchAsync(async (req: Request, res: Response) => {
  const user: AuthUser = req.user ?? {};

  if (user && user.id) {
    const io = getIO();
    const userSockets = userConnections.get(user.id)?.socketIds;

    userSockets?.forEach((userSocket) => {
      io.sockets.sockets.get(userSocket)?.disconnect(true);
    });

    userConnections.delete(user.id);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.status(httpStatus.OK).json({
    message: "Logout successful",
  });
});

export const getAuthUser = catchAsync(async (req: Request, res: Response) => {
  const user: AuthUser | undefined = req.user;

  if (!user) {
    return;
  }

  res.status(httpStatus.OK).json({
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.emails?.[0].value,
      photos: user.photos || [],
    },
  });
});
