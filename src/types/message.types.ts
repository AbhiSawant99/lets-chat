import { Types } from "mongoose";
import { IUser } from "./user.types";

export interface IMessage {
  _id: string;
  chatRoomId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments?: string;
  status: messageStatus;
  readBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type messageStatus = "sent" | "seen" | "deleted";

export interface responseMessage {
  id: string;
  content: string;
  attachments?: string;
  status?: messageStatus;
  readBy?: Types.ObjectId[];
  from: string;
}
