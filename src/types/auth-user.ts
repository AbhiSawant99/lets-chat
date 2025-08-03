export interface AuthUser extends Express.User {
  id?: string;
  displayName?: string;
  emails?: { value: string }[];
  photos?: { value: string }[];
}
