import { Request, Response } from "express";
import User from "../model/userModel";
import catchAsync from "../utils/catchAsync";

export const user_create_post = catchAsync(
  async (req: Request, res: Response, next: Function) => {
    const user = await User.create(req.body);
    res.status(201).send(user);
  }
);
