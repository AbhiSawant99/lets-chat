import { Types } from "mongoose";

export interface FriendshipType {
  userOne: Types.ObjectId;
  userTwo: Types.ObjectId;
  status: FriendShipStatus;
}

export enum FriendShipStatus {
  "friends",
  "blocked",
}
