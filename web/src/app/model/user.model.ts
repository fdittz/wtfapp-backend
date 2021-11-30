export interface User {
  uid: string;
  name?: string;
  photoURL?: string;
  login?: string;
  secret?: string;
  salt?: string;
  role?: string;
}