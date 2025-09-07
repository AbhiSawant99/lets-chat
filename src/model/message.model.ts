import { Schema, model, Types } from "mongoose";
import { IMessage, messageStatus } from "@/types/message.types";

const messageSchema = new Schema<IMessage>(
  {
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    attachments: {
      type: String,
    },
    status: {
      type: String,
      enum: ["sent", "seen", "deleted"],
      default: "sent",
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const MessageModel = model<IMessage>("Message", messageSchema);
