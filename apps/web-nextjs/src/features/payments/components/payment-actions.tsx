"use client";

import * as React from "react";

import type { PaymentDetail, PaymentStatus } from "@/api/payments";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCheckoutSessionMutation } from "@/features/payments/queries";

function canPayNow(status: PaymentStatus): boolean {
  return status === "PENDING" || status === "FAILED";
}

export function PaymentActions({ payment }: { payment: Pick<PaymentDetail, "orderId" | "method" | "status"> }) {
  const checkoutMutation = useCheckoutSessionMutation(payment.orderId);
  const isLoading = checkoutMutation.isPending;

  const onCheckout = React.useCallback(() => {
    checkoutMutation.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
    });
  }, [checkoutMutation]);

  if (payment.method !== "ONLINE") return null;
  if (!canPayNow(payment.status)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={isLoading} className="active:scale-95">
            {isLoading ? "Redirecting..." : payment.status === "FAILED" ? "Try again" : "Pay now"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay now?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll be redirected to Stripe Checkout to complete your payment securely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onCheckout} disabled={isLoading}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

