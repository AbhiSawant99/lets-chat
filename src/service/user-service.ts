import { AppError } from "../AppError";
import httpStatus from "http-status";
import bycrypt from "bcrypt";
import { IUser } from "../types/user.types";
import { UserModel } from "../model/user-model";
import { AuthUser } from "../types/auth-user.types";
import { Request } from "express";
import fs from "fs";
import { saveLocalUpload } from "../utils/image-upload";
import path from "path";
import { logger } from "../logger";

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

  return await UserModel.create(requestUser);
};

export const saveUsernameService = async (
  user: AuthUser,
  username: string,
  req: Request
): Promise<IUser | undefined> => {
  const existingUser = await UserModel.findById(user.id);

  if (!existingUser) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const oldUserPhoto = existingUser.photo;

  try {
    const photoUrl = saveLocalUpload(req.file);
    existingUser.username = username;
    existingUser.photo = photoUrl ?? undefined;

    await existingUser?.save();

    if (oldUserPhoto) {
      const oldPath = path.join(process.cwd(), oldUserPhoto);
      fs.unlink(oldPath, (err) => {
        if (err) logger.error("Failed to delete old photo:", err);
      });
    }

    return existingUser;
  } catch (err) {
    if (req.file) {
      // if something goes wrong, delete saved photo
      fs.unlinkSync(req.file.path);
    }
    throw new AppError("Could not save data", httpStatus.INTERNAL_SERVER_ERROR);
  }
};
