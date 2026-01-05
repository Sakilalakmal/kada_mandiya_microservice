"use client";

import * as React from "react";

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
import { useSimulateFailMutation, useSimulateSuccessMutation } from "@/features/payments/queries";

function enablePaymentSim(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const flag =
    process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIM ?? process.env.NEXT_PUBLIC_VITE_ENABLE_PAYMENT_SIM;
  return String(flag ?? "").toLowerCase() === "true";
}

export function PaymentActions({ orderId }: { orderId: string }) {
  const enabled = enablePaymentSim();
  const successMutation = useSimulateSuccessMutation(orderId);
  const failMutation = useSimulateFailMutation(orderId);

  const isLoading = successMutation.isPending || failMutation.isPending;

  const onSuccess = React.useCallback(() => successMutation.mutate(), [successMutation]);
  const onFail = React.useCallback(() => failMutation.mutate(), [failMutation]);

  if (!enabled) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isLoading} className="active:scale-95">
            Simulate success
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark payment as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              Dev-only action. This updates the payment status and publishes the payment event.
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

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={isLoading} className="active:scale-95">
            Simulate fail
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark payment as failed?</AlertDialogTitle>
            <AlertDialogDescription>
              Dev-only action. This updates the payment status and publishes the payment event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onFail} disabled={isLoading}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

