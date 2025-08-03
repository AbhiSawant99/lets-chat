import { Request, Response } from "express";
import User from "../model/user-model";
import catchAsync from "../utils/catch-async";

export const user_create_post = catchAsync(
  async (req: Request, res: Response, next: Function) => {
    const user = await User.create(req.body);
    res.status(201).send(user);
  }
);
