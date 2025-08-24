import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createUserService } from "../service/user-service";
import { UserModel } from "../model/user-model";
import { IUser } from "../types/user.types";

export const googlePassportMiddleware = () => {
  return new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const existingUser = await UserModel.findOne({ oauthId: profile.id });

      if (!existingUser) {
        const newUser: IUser = {
          name: profile.displayName || "",
          email: profile.emails?.[0].value || "",
          username: "",
          oauthProvider: "google",
          oauthId: profile.id || "",
        };

        createUserService(newUser);
      }

      return done(null, profile);
    }
  );
};
