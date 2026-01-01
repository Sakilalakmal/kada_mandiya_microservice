import { randomUUID } from "crypto";
import { AppError } from "../utils/errors";
import { hashPassword, verifyPassword } from "../utils/password";
import { findUserByEmail, insertUser } from "../repositories/user.repo";
import { LoginInput, RegisterInput } from "../schema/auth.schema";

export async function register(input: RegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) {
    throw new AppError("VALIDATION_ERROR", 400, "Name is required.");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError(
      "EMAIL_EXISTS",
      409,
      "You already have an account. Please log in."
    );
  }

  const passwordHash = await hashPassword(input.password);

  return insertUser({
    id: randomUUID(),
    name,
    email,
    passwordHash,
  });
}

export async function login(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      401,
      "Invalid email or password."
    );
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      401,
      "Invalid email or password."
    );
  }

  return { id: user.id, name: user.name, email: user.email };
}
