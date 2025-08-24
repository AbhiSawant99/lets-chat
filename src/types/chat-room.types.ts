import { Document, Types } from "mongoose";

export interface IChatRoom extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
}

export interface IGroupChat extends IChatRoom {
  name: string;
  admins: Types.ObjectId[];
}

export interface IPrivateChat extends IChatRoom {
  roomString: string;
}
