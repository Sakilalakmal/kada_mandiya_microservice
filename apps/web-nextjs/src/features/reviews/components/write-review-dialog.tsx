"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import * as React from "react";
import { Loader2, PenLine } from "lucide-react";
import { useForm } from "react-hook-form";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useQueryClient } from "@tanstack/react-query";

import { getOrderDetail } from "@/api/orders";
import { ordersKeys, useOrdersQuery } from "@/features/orders/queries";
import { useCreateReviewMutation } from "../queries";
import { createReviewSchema, type CreateReviewValues } from "../schemas";
import { StarRating } from "./star-rating";

type WriteReviewDialogProps = {
  productId: string;
  onCreated?: () => void;
  className?: string;
};

export function WriteReviewDialog({ productId, onCreated, className }: WriteReviewDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [showOrderPicker, setShowOrderPicker] = React.useState(false);
  const mutation = useCreateReviewMutation();
  const ordersQuery = useOrdersQuery();
  const queryClient = useQueryClient();

  const form = useForm<CreateReviewValues>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { orderId: "", rating: 5, comment: "" },
  });

  const submitting = mutation.isPending || form.formState.isSubmitting;
  const orders = ordersQuery.data ?? [];
  const selectedOrderId = form.watch("orderId");
  const selectedOrder = orders.find((o) => o.orderId === selectedOrderId) ?? null;

  React.useEffect(() => {
    if (!open) return;
    const current = form.getValues("orderId");
    if (current) return;
    const first = orders[0]?.orderId;
    if (first) form.setValue("orderId", first, { shouldValidate: true });
  }, [open, orders, form]);

  React.useEffect(() => {
    if (!open) return;
    if (!productId) return;
    if (orders.length === 0) return;

    let cancelled = false;

    async function pickEligibleOrder() {
      for (const order of orders.slice(0, 8)) {
        try {
          const detail = await queryClient.fetchQuery({
            queryKey: ordersKeys.detail(order.orderId),
            queryFn: () => getOrderDetail(order.orderId),
            staleTime: 60_000,
          });

          const hasProduct = (detail.items ?? []).some((it) => it.productId === productId);
          if (hasProduct) {
            if (!cancelled) {
              form.setValue("orderId", order.orderId, { shouldValidate: true });
            }
            return;
          }
        } catch {
          // ignore and keep scanning
        }
      }
    }

    pickEligibleOrder();
    return () => {
      cancelled = true;
    };
  }, [open, orders, productId, queryClient, form]);

  React.useEffect(() => {
    if (!open) return;
    setShowOrderPicker(false);
  }, [open]);

  const submit = async (values: CreateReviewValues) => {
    await mutation.mutateAsync({
      productId,
      orderId: values.orderId.trim(),
      rating: values.rating,
      comment: values.comment.trim(),
    });
    form.reset({ orderId: "", rating: 5, comment: "" });
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="default" className={cn("gap-2 active:scale-95", className)}>
          <PenLine className="h-4 w-4" />
          Write a review
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>
            Reviews are tied to a purchase. We&apos;ll attach your review to one of your orders.{" "}
            You can check your orders in{" "}
            <Link href="/orders" className="underline underline-offset-4 hover:text-foreground">
              your orders
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  {ordersQuery.isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : orders.length === 0 ? (
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                      No orders found. You can only review products you purchased.
                    </div>
                  ) : (
                    <FormControl>
                      <div className="space-y-2">
                        {!showOrderPicker && selectedOrder ? (
                          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">Most recent order</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(selectedOrder.createdAt).toLocaleDateString()} • {selectedOrder.status}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0 active:scale-95"
                              onClick={() => setShowOrderPicker(true)}
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              setShowOrderPicker(false);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an order" />
                            </SelectTrigger>
                            <SelectContent>
                              {orders.map((o) => (
                                <SelectItem key={o.orderId} value={o.orderId}>
                                  {new Date(o.createdAt).toLocaleDateString()} • {o.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarRating value={field.value} onChange={field.onChange} ariaLabel="Select rating" />
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
                    <Textarea
                      placeholder="What did you like? What could be better?"
                      className="min-h-[110px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={submitting || ordersQuery.isLoading || orders.length === 0}
                className="gap-2 active:scale-95"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
