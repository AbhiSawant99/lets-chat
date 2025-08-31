import { Request, Response } from "express";
import catchAsync from "@/utils/catch-async";
import httpStatus from "http-status";
import * as userService from "@/service/user-service";
import { IUser } from "@/types/user.types";
import { setUser } from "@/service/auth-service";

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
