import { Request, Response } from "express";
import catchAsync from "../utils/catch-async";
import { AuthRequestUser } from "../types/auth-user.types";
import httpStatus from "http-status";
import { requestAuthService } from "../service/auth-service";

export const authLogin = catchAsync(async (req: Request, res: Response) => {
  const reqUser: AuthRequestUser = req.body;

  const token = await requestAuthService(reqUser);

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
  });

  res.status(httpStatus.OK).send(`login successful`);
});
