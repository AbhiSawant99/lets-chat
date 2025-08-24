import jwt, { TokenExpiredError } from "jsonwebtoken";
import { AuthRequestUser, AuthUser } from "../types/auth-user.types";
import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catch-async";
import { AppError } from "../AppError";
import httpStatus from "http-status";
import bycrypt from "bcrypt";
import { UserModel } from "../model/user-model";

export const setUser = (user: AuthUser) => {
  return jwt.sign(
    {
      id: user.id,
      displayName: user.displayName,
      emails: user.emails,
      photos: user.photos,
    },
    process.env.JWT_SECRET || "",
    {
      expiresIn: "24h",
    }
  );
};

export const getUser = (token: string): AuthUser | null => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as AuthUser;
    return decoded;
  } catch (error) {
    logger.error("Error verifying token: ", error);
    return null;
  }
};

export const verifyJWT = catchAsync(
  (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token; // Get token from cookies
    logger.debug("Verifying JWT...");

    if (!token) {
      logger.warn("No token provided");
      throw new AppError("Unauthorized user", httpStatus.UNAUTHORIZED);
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as AuthUser;
      req.user = decoded;
      next();
    } catch (err: unknown) {
      if (err instanceof TokenExpiredError) {
        next(new AppError("TokenExpired", httpStatus.UNAUTHORIZED));
      }

      next(new AppError("AuthenticationError", httpStatus.UNAUTHORIZED));
    }
  }
);

export const requestAuthService = async (loginData: AuthRequestUser) => {
  const { email, password } = loginData;

  const existingUser = await UserModel.findOne({ email: email });

  if (!existingUser) {
    throw new AppError(
      "Username or password incorrect",
      httpStatus.UNAUTHORIZED
    );
  }

  const isMatch = await bycrypt.compare(password, existingUser.password || "");

  if (!isMatch) {
    throw new AppError(
      "Username or password incorrect",
      httpStatus.UNAUTHORIZED
    );
  }

  return existingUser;
};
