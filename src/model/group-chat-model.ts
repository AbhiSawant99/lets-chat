import { Schema, model, Types } from "mongoose";
import { IChatRoom, IGroupChat } from "../types/chat-room.types";

const groupChatSchema = new Schema<IGroupChat>(
  {
    name: {
      type: String,
      trim: true,
      required: function () {
        return this.isGroup; // group chats require a name
      },
    },
    isGroup: {
      type: Boolean,
      default: false,
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
