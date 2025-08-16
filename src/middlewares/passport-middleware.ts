import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export const googlePassportMiddleware = () => {
  return new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      //todo: Here you can save the user profile to your database if needed
      //? For now, we will just return the profile
      return done(null, profile);
    }
  );
};
