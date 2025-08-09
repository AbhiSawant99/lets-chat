import { Types } from "mongoose";

export interface IChatRoom {
  name?: string;
  isGroup: boolean;
  participants: Types.ObjectId[];
  admins?: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
}
