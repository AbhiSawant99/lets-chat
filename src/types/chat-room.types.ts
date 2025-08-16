import { Types } from "mongoose";

export interface IChatRoom {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
}

export interface IGroupChat extends IChatRoom {
  name?: string;
  isGroup: boolean;
  admins?: Types.ObjectId[];
}

export interface IPrivateChat extends IChatRoom {
  roomString: string;
}
