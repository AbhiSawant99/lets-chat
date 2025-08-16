import { Schema, model } from "mongoose";
import { IPrivateChat } from "../types/chat-room.types";

const privateChatSchema = new Schema<IPrivateChat>(
  {
    roomString: {
      type: String,
      unique: true,
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export const PrivateChatModel = model<IPrivateChat>(
  "PrivateChat",
  privateChatSchema
);
