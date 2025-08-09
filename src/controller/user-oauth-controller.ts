import { AppError } from "../AppError";
import { setUser } from "../service/auth-service";
import { createUserService } from "../service/user-service";
import { AuthUser } from "../types/auth-user.types";
import catchAsync from "../utils/catch-async";
import type { Request, Response } from "express";
import { IUser } from "../types/user.types.";
import { UserModel } from "../model/user-model";

export const googleUserSuccessfulLogin = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;

    if (!user) {
      throw new AppError("user not found");
    }

    const existingUser = await UserModel.findOne({ oauthId: user.id });

    if (!existingUser) {
      const newUser: IUser = {
        name: user.displayName || "",
        email: user.emails?.[0].value || "",
        oauthProvider: "google",
        oauthId: user.id || "",
      };

      createUserService(newUser);
    }

    const token = user ? setUser(user) : null;

    // res.json({ token });
    res.cookie("uid", token, {
      httpOnly: true,
    });
    res.redirect("/profile");
  }
);
