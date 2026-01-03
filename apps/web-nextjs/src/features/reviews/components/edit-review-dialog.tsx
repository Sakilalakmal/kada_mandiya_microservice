"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Loader2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { useUpdateReviewMutation } from "../queries";
import { editReviewSchema, type EditReviewValues } from "../schemas";
import { StarRating } from "./star-rating";

type EditReviewDialogProps = {
  reviewId: string;
  productId: string;
  rating: number;
  comment: string;
  disabled?: boolean;
};

export function EditReviewDialog({
  reviewId,
  productId,
  rating,
  comment,
  disabled,
}: EditReviewDialogProps) {
  const [open, setOpen] = React.useState(false);
  const mutation = useUpdateReviewMutation();

  const form = useForm<EditReviewValues>({
    resolver: zodResolver(editReviewSchema),
    defaultValues: { rating, comment },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({ rating, comment });
  }, [open, rating, comment, form]);

  const submitting = mutation.isPending || form.formState.isSubmitting;

  const submit = async (values: EditReviewValues) => {
    const nextComment = values.comment?.trim();
    const patch: { rating?: number; comment?: string } = {};

    if (values.rating !== undefined && values.rating !== rating) patch.rating = values.rating;
    if (nextComment !== undefined && nextComment !== comment) patch.comment = nextComment;

    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save");
      setOpen(false);
      return;
    }

    await mutation.mutateAsync({ reviewId, productId, patch });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 active:scale-95" disabled={disabled}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit your review</DialogTitle>
          <DialogDescription>Update your rating or comment.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarRating value={field.value ?? rating} onChange={field.onChange} ariaLabel="Edit rating" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[110px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={submitting} className="gap-2 active:scale-95">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

