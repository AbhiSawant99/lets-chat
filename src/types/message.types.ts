import { Types } from "mongoose";

export interface IMessage {
  chatRoomId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "file";
  readBy?: Types.ObjectId[];
}
