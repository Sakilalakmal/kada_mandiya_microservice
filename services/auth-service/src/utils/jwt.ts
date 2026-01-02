import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "15m";

export function signAccessToken(user: { id: string; email: string  , roles:string[]}) {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };

  return jwt.sign({ sub: user.id, email: user.email, roles: user.roles }, JWT_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
