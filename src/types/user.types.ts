export interface IUser {
  name: string;
  email: string;
  username?: string;
  password?: string;
  photo?: string;
  oauthProvider?: String;
  oauthId?: String;
}
