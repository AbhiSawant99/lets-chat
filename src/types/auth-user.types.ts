export interface AuthUser extends Express.User {
  id?: string;
  displayName?: string;
  username?: string;
  email?: string;
  photo?: string;
}

export interface AuthRequestUser {
  email: string;
  password: string;
}
