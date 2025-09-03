import { Request, Response } from "express";
import catchAsync from "@/utils/catch-async";
import { AuthRequestUser, AuthUser } from "@/types/auth-user.types";
import httpStatus from "http-status";
import { requestAuthService, setUser } from "@/service/auth-service";
import { UserModel } from "@/model/user-model";
import { getIO } from "@/service/socket-init-service";
import { userConnections } from "./socket-controller";
import { AppError } from "@/AppError";
import { saveUsernameService } from "@/service/user-service";

export const authLogin = catchAsync(async (req: Request, res: Response) => {
  const reqUser: AuthRequestUser = req.body;

  const existingUser = await requestAuthService(reqUser);

  if (!existingUser) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: "User not found",
    });
  }

  setUser(
    {
      id: existingUser._id.toString(),
      displayName: existingUser.name,
      email: existingUser.email,
      photo: existingUser.photo || "",
    },
    res
  );

  res.status(httpStatus.OK).json({
    message: "Login successful",
    user: {
      id: existingUser.id,
      displayName: existingUser.name,
      email: existingUser.email,
      photo: existingUser.photo || "",
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
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
      email: user.email,
      photo: user.photo || "",
    },
  });
});

export const saveUserName = catchAsync(async (req: Request, res: Response) => {
  const user: AuthUser | undefined = req.user;
  const { username } = req.body;
  const usernameRegex = /^[A-Za-z0-9_]{4,}$/;

  if (!user) {
    throw new AppError("usernot found", httpStatus.BAD_REQUEST);
  }

  if (!username) {
    throw new AppError("username is required", httpStatus.BAD_REQUEST);
  }

  if (!usernameRegex.test(username)) {
    throw new AppError(
      `Not a valid username: ${username}`,
      httpStatus.BAD_REQUEST
    );
  }

  const updatedUser = await saveUsernameService(user, username, req);

  if (updatedUser) {
    res.status(httpStatus.OK).json({
      user: {
        id: updatedUser.id,
        displayName: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.photo || "",
      },
    });
  }
});

export const checkUserName = catchAsync(async (req: Request, res: Response) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      return res
        .status(400)
        .json({ available: false, message: "Username is required" });
    }

    const existingUser = await UserModel.findOne({ username: username });

    if (existingUser) {
      return res.json({ available: false, message: "Username already taken" });
    }

    return res.json({ available: true, message: "Username available" });
  } catch (err) {
    res.status(500).json({ available: false, message: "Server error" });
  }
});
