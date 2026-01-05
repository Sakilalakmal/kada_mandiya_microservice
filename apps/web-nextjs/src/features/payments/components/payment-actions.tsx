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
import { useSimulateSuccessMutation } from "@/features/payments/queries";

function enablePaymentSim(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const flag =
    process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIM ?? process.env.NEXT_PUBLIC_VITE_ENABLE_PAYMENT_SIM;
  return String(flag ?? "").toLowerCase() === "true";
}

function canPayNow(status: PaymentStatus): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED";
}

export function PaymentActions({ payment }: { payment: Pick<PaymentDetail, "orderId" | "method" | "status"> }) {
  const enabled = enablePaymentSim();
  const successMutation = useSimulateSuccessMutation(payment.orderId);

  const isLoading = successMutation.isPending;

  const onSuccess = React.useCallback(() => successMutation.mutate(), [successMutation]);

  if (!enabled) return null;
  if (!canPayNow(payment.status)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={isLoading} className="active:scale-95">
            {isLoading ? "Processing..." : "Pay now"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay now?</AlertDialogTitle>
            <AlertDialogDescription>
              {payment.method === "COD"
                ? "This order is Cash on Delivery. This action is for dev/demo only and will mark the payment as paid."
                : "This will complete the Visa payment for this order (dev/demo)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onSuccess} disabled={isLoading}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

