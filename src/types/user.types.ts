export interface IUser {
  id?: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  photo?: string;
  oauthProvider?: String;
  oauthId?: String;
}

export interface ICachedUser {
  id?: string;
  name: string;
  username?: string;
  photo?: string;
  expiresAt?: number;
}
