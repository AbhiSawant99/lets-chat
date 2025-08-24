import { Types } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  username: string;
  password?: string;
  oauthProvider: String;
  oauthId: String;
}
