import { AppError } from "../AppError";
import { setUser } from "../service/auth";
import { createUserService } from "../service/user-service";
import { AuthUser } from "../types/auth-user";
import catchAsync from "../utils/catch-async";
import type { Request, Response } from "express";
import User, { UserType } from "../model/user-model";

export const googleUserSuccessfulLogin = catchAsync(
  async (req: Request, res: Response) => {
    const user: AuthUser | undefined = req.user;

    if (!user) {
      throw new AppError("user not found");
    }

    const existingUser = await User.findOne({ oauthId: user.id });

    if (!existingUser) {
      const newUser: UserType = {
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
