export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
  roles?: string[];
};

export type JwtClaims = {
  sub: string;
  email?: string;
  role?: string;
  roles?: string[];
};
