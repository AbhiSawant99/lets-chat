import httpStatus from "http-status";
import bycrypt from "bcrypt";
import { Request } from "express";
import fs from "fs";
import path from "path";
import { IUser } from "@/types/user.types";
import { AppError } from "@/AppError";
import { UserModel } from "@/model/user-model";
import { AuthUser } from "@/types/auth-user.types";
import { uploadToCloudinary } from "@/utils/image-upload";
import { logger } from "@/logger";
import {
  deleteUserCache,
  getUserCache,
  setUserCache,
} from "@/utils/user-cache";

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
    // const photoUrl = saveLocalUpload(req.file);
    existingUser.username = username;
    let photoUrl = "";

    if (req.file?.buffer) {
      const result = await uploadToCloudinary(
        req.file?.buffer,
        "chat_app_uploads"
      );
      photoUrl = result.secure_url;

      if (photoUrl) {
        existingUser.photo = photoUrl;
      }
    }

    await existingUser?.save();

    if (photoUrl && oldUserPhoto) {
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

export async function findUserById(userId: string) {
  // Check cache
  const cached = getUserCache(userId);
  if (cached) return cached;

  // Fetch from DB
  const user = await UserModel.findById(userId).lean();
  if (!user) return null;

  const result = {
    id: userId,
    name: user.name,
    username: user.username,
    photo: user.photo,
  };

  // Store in cache
  setUserCache(userId, result);

  return result;
}

export async function updateUser(
  userId: string,
  updates: Partial<{ username: string; photo: string }>
) {
  const updated = await UserModel.findByIdAndUpdate(userId, updates, {
    new: true,
  })
    .select("name username photo")
    .lean();

  if (updated) {
    // invalidate old cache and replace
    deleteUserCache(userId);
    setUserCache(userId, {
      id: updated.id,
      name: updated.name,
      username: updated.username,
      photo: updated.photo,
    });
  }

  return updated;
}
