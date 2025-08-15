export interface IUser {
  name: string;
  email: string;
  password?: string;
  oauthProvider: String;
  oauthId: String;
}
