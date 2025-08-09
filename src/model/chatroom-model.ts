import { Schema, model, Types } from "mongoose";
import { IChatRoom } from "../types/chat-room.types";

const chatRoomSchema = new Schema<IChatRoom>(
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

export const ChatRoomModel = model<IChatRoom>("ChatRoom", chatRoomSchema);
