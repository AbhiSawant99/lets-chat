import { AppError } from "../AppError";
import httpStatus from "http-status";
import bycrypt from "bcrypt";
import { IUser } from "../types/user.types";
import { UserModel } from "../model/user-model";

export const createUserService = async (requestUser: IUser) => {
  if (!requestUser.name || !requestUser.email) {
    throw new AppError("All fields are required", httpStatus.BAD_REQUEST);
  }
  const existingUser = await UserModel.findOne({ email: requestUser.email });

  if (existingUser) {
    throw new AppError("User already exists", httpStatus.CONFLICT);
  }

  if (requestUser.password) {
    const hashedPassword = await bycrypt.hash(requestUser.password, 10);
    requestUser.password = hashedPassword;
  }

  await UserModel.create(requestUser);
};
