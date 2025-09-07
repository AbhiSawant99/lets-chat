import { Request, Response } from "express";
import catchAsync from "@/utils/catch-async";
import httpStatus from "http-status";
import * as userService from "@/service/user-service";
import { IUser } from "@/types/user.types";
import { setUser } from "@/service/auth-service";
import { AuthUser } from "@/types/auth-user.types";
import { AppError } from "@/AppError";

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const reqUser: IUser = req.body;

  const existingUser = await userService.createUserService(reqUser);

  setUser(
    {
      id: existingUser._id.toString(),
      displayName: existingUser.name,
      email: existingUser.email,
      photo: existingUser.photo || "",
    },
    res
  );

  res
    .status(httpStatus.CREATED)
    .send(`user ${reqUser.name} created successfully`);
});

export const updateUserController = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;
    const updateData: Partial<IUser> = req.body;

    if (!user?.id) {
      throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
    }

    const updatedUser = await userService.updateUserService(
      user.id,
      updateData,
      req
    );

    setUser(
      {
        id: updatedUser.id,
        displayName: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        photo: updatedUser.photo || "",
      },
      res
    );

    res.status(httpStatus.OK).json({
      user: {
        id: updatedUser.id,
        displayName: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        photo: updatedUser.photo || "",
      },
    });
  }
);
