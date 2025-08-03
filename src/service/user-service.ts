import { AppError } from "../AppError";
import User, { UserType } from "../model/user-model";
import httpStatus from "http-status";
import bycrypt from "bcrypt";

export const createUserService = async (requestUser: UserType) => {
  if (!requestUser.name || !requestUser.email) {
    throw new AppError("All fields are required", httpStatus.BAD_REQUEST);
  }
  const existingUser = await User.findOne({ email: requestUser.email });

  if (existingUser) {
    throw new AppError("User already exists", httpStatus.CONFLICT);
  }

  if (requestUser.password) {
    const hashedPassword = await bycrypt.hash(requestUser.password, 10);
    requestUser.password = hashedPassword;
  }

  await User.create(requestUser);
};
