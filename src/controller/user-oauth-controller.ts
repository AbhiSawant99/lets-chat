import { AppError } from "../AppError";
import { setUser } from "../service/auth-service";
import { createUserService } from "../service/user-service";
import { AuthUser } from "../types/auth-user.types";
import catchAsync from "../utils/catch-async";
import type { Request, Response } from "express";
import { IUser } from "../types/user.types";
import { UserModel } from "../model/user-model";

export const googleUserSuccessfulLogin = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;

    if (!user) {
      throw new AppError("user not found");
    }

    let existingUser = await UserModel.findOne({ oauthId: user.id });

    if (!existingUser) {
      const newUser: IUser = {
        name: user.displayName || "",
        email: user.emails?.[0].value || "",
        oauthProvider: "google",
        oauthId: user.id || "",
      };

      existingUser = await createUserService(newUser);
    }

    const token = setUser({
      id: existingUser._id.toString(),
      displayName: existingUser.name,
      emails: [{ value: existingUser.email }],
      photos: [],
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
    });

    res.redirect("http://localhost:5173/chat");
  }
);
