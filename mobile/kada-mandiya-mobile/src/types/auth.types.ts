export type UserRole = 'customer' | 'vendor';

export type User = {
  id: string;
  email: string;
  roles: UserRole[];
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
};

export type MeResponse = {
  payload: {
    sub: string;
    email: string;
    roles: UserRole[];
    iat: number;
    exp: number;
  };
};

export type RefreshResponse = {
  ok: true;
  accessToken: string;
  tokenType: 'Bearer';
};

