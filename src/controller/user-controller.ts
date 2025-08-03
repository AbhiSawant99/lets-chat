import { Request, Response } from "express";
import User, { UserType } from "../model/user-model";
import catchAsync from "../utils/catch-async";
import httpStatus from "http-status";
import { AppError } from "../AppError";
import bycrypt from "bcrypt";
import { createUserService } from "../service/user-service";

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const reqUser: UserType = req.body;

  if (!reqUser.name || !reqUser.email) {
    throw new AppError("All fields are required", httpStatus.BAD_REQUEST);
  }
  const existingUser = await User.findOne({ email: reqUser.email });

  if (existingUser) {
    throw new AppError("User already exists", httpStatus.CONFLICT);
  }

  if (reqUser.password) {
    const hashedPassword = await bycrypt.hash(reqUser.password, 10);
    reqUser.password = hashedPassword;
  }

  createUserService(reqUser);

  res
    .status(httpStatus.CREATED)
    .send(`user ${reqUser.name} created successfully`);
});
