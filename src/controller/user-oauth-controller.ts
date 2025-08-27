import { AppError } from "@/AppError";
import { setUser } from "@/service/auth-service";
import { AuthUser } from "@/types/auth-user.types";
import catchAsync from "@/utils/catch-async";
import type { Request, Response } from "express";
import { UserModel } from "@/model/user-model";

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

    const token = setUser({
      id: existingUser._id.toString(),
      displayName: existingUser.name,
      email: existingUser.email,
      photo: existingUser.photo || "",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
    });

    if (existingUser.username) {
      res.redirect("http://localhost:5173/chat");
    } else {
      res.redirect("http://localhost:5173/username-form");
    }
  }
);
