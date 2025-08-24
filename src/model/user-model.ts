import { Schema, Document, model } from "mongoose";
import { IUser } from "../types/user.types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    oauthProvider: String,
    oauthId: String,
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", userSchema);
