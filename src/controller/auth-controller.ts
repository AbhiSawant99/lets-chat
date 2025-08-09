import { Request, Response } from "express";
import catchAsync from "../utils/catch-async";
import { AuthRequestUser } from "../types/auth-user.types";
import httpStatus from "http-status";
import { requestAuthService } from "../service/auth-service";

export const authLogin = catchAsync(async (req: Request, res: Response) => {
  const reqUser: AuthRequestUser = req.body;
  await requestAuthService(reqUser);
  res.status(httpStatus.CREATED).send(`login successful`);
});
