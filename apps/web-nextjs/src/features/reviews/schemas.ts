import { z } from "zod";

export const createReviewSchema = z
  .object({
    orderId: z.string().trim().min(1, "Order ID is required"),
    rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
    comment: z.string().trim().min(1, "Comment is required").max(1000, "Max 1000 characters"),
  })
  .strict();

export const editReviewSchema = z
  .object({
    rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5").optional(),
    comment: z.string().trim().min(1, "Comment is required").max(1000, "Max 1000 characters").optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field must be provided." });

export type CreateReviewValues = z.output<typeof createReviewSchema>;
export type EditReviewValues = z.output<typeof editReviewSchema>;

