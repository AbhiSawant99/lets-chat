import { Schema, Document, model } from "mongoose";

export interface UserType {
  name: string;
  email: string;
  password?: string;
  oauthProvider: String;
  oauthId: String;
}

const userSchema = new Schema(
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
    password: String,
    oauthProvider: String,
    oauthId: String,
  },
  { timestamps: true }
);

export default model<UserType>("User", userSchema);
