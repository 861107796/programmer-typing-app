export interface AuthPayload {
  email: string;
  password: string;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  createdAt: string;
}
