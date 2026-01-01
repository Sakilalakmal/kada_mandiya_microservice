import jwt from "jsonwebtoken";
import { JwtClaims } from "./types/types";

export type VerifyOptions = {
  secret: string;
};

export function verifyAccessToken(token: string, opts: VerifyOptions): JwtClaims {
  return jwt.verify(token, opts.secret) as JwtClaims;
}
