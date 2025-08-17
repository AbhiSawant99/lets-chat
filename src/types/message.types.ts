import { Types } from "mongoose";
import { IUser } from "./user.types";

export interface IMessage {
  _id: string;
  chatRoomId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments?: string;
  status?: messageStatus;
  readBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export enum messageStatus {
  "sent",
  "seen",
}

export interface responseMessage {
  content: string;
  attachments?: string;
  status?: messageStatus;
  readBy?: Types.ObjectId[];
  sender: IUser;
}
