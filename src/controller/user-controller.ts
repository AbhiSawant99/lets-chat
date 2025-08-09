import { Request, Response } from "express";
import catchAsync from "../utils/catch-async";
import httpStatus from "http-status";
import * as userService from "../service/user-service";
import { IUser } from "../types/user.types.";

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const reqUser: IUser = req.body;

  await userService.createUserService(reqUser);

  res
    .status(httpStatus.CREATED)
    .send(`user ${reqUser.name} created successfully`);
});
