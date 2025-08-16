import { Types } from "mongoose";
import { IUser } from "./user.types";

export interface IMessage {
  chatRoomId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments?: string;
  status?: messageStatus;
  readBy?: Types.ObjectId[];
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
