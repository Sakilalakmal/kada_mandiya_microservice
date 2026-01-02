import { randomUUID } from "crypto";
import { AppError } from "../utils/errors";
import { hashPassword, verifyPassword } from "../utils/password";
import { findUserByEmail, insertUser } from "../repositories/user.repo";
import { LoginInput, RegisterInput } from "../schema/auth.schema";
import { getRolesByUserId, grantRoleToUser } from "../repositories/roles.repo";

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

  const newUser = await insertUser({
    id: randomUUID(),
    name,
    email,
    passwordHash,
  });

  await grantRoleToUser(newUser.id, "customer");

  const roles = await getRolesByUserId(newUser.id);

  return { id: newUser.id, name: newUser.name, email: newUser.email, roles };
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

  const roles = await getRolesByUserId(user.id);

  return { id: user.id, name: user.name, email: user.email, roles };
}
