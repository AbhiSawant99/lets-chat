import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createUserService } from "@/service/user-service";
import { UserModel } from "@/model/user-model";
import { IUser } from "@/types/user.types";
import { downloadImage } from "@/utils/download-image";

const API_URL = process.env.API_URL ?? "";

export const googlePassportMiddleware = () => {
  return new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${API_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const existingUser = await UserModel.findOne({ oauthId: profile.id });

      if (!existingUser) {
        let localPhotoPath = null;
        if (profile.photos && profile.photos.length > 0) {
          const photoUrl = profile.photos[0].value;
          const savePhotoResult = await downloadImage(photoUrl);
          localPhotoPath = savePhotoResult.secure_url;
        }

        const newUser: IUser = {
          name: profile.displayName || "",
          email: profile.emails?.[0].value || "",
          username: "",
          oauthProvider: "google",
          oauthId: profile.id || "",
          photo: localPhotoPath ?? undefined,
        };

        await createUserService(newUser);
      }

      return done(null, profile);
    }
  );
};
