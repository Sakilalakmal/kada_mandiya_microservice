export type ErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    message: string
  ) {
    super(message);
  }
}
