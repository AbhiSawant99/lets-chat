import { AppError } from "@/AppError";
import { setUser } from "@/service/auth-service";
import { AuthUser } from "@/types/auth-user.types";
import catchAsync from "@/utils/catch-async";
import type { Request, Response } from "express";
import { UserModel } from "@/model/user-model";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

export const googleUserSuccessfulLogin = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;

    if (!user) {
      throw new AppError("user not found");
    }

    const existingUser = await UserModel.findOne({ oauthId: user.id });

    if (!existingUser) {
      return;
    }

    setUser(
      {
        id: existingUser._id.toString(),
        displayName: existingUser.name,
        username: existingUser.username || "",
        email: existingUser.email,
        photo: existingUser.photo || "",
      },
      res
    );

    if (existingUser.username) {
      res.redirect(`${FRONTEND_URL}/chat`);
    } else {
      res.redirect(`${FRONTEND_URL}/username-form`);
    }
  }
);
