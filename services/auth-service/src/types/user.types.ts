export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
