import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createUserService } from "@/service/user-service";
import { UserModel } from "@/model/user-model";
import { IUser } from "@/types/user.types";
import { downloadImage } from "@/utils/download-image";

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
        let localPhotoPath = null;
        if (profile.photos && profile.photos.length > 0) {
          const photoUrl = profile.photos[0].value;
          const filename = `${profile.id}_${Date.now()}`;
          localPhotoPath = await downloadImage(photoUrl, filename);
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
