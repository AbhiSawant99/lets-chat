import { Types } from "mongoose";

export interface IMessage {
  chatRoomId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "file";
  receivers?: Types.ObjectId[];
  readBy?: Types.ObjectId[];
}
