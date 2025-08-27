import { Schema, model } from "mongoose";
import { IGroupChat } from "@/types/chat-room.types";

const groupChatSchema = new Schema<IGroupChat>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export const GroupChatModel = model<IGroupChat>("GroupChat", groupChatSchema);
