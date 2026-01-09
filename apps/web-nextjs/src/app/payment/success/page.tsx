"use client";

import Link from "next/link";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { getPaymentByOrderId } from "@/api/payments";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentStatusBadge } from "@/features/payments/components/payment-status-badge";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

export default function PaymentSuccessPage() {
  const { token } = useAuth();
  const search = useSearchParams();
  const orderId = search.get("orderId") ?? "";

  const startedAtRef = React.useRef<number>(Date.now());

  const paymentQuery = useQuery({
    queryKey: ["paymentResult", orderId],
    queryFn: () => getPaymentByOrderId(orderId),
    enabled: !!token && !!orderId,
    staleTime: 5_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const elapsed = Date.now() - startedAtRef.current;
      if (status === "PENDING" && elapsed < 20_000) return 2000;
      return false;
    },
  });

  const payment = paymentQuery.data;
  const isProcessing = paymentQuery.isLoading || payment?.status === "PENDING";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-10 sm:px-10">
        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg">Payment successful</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Thanks for supporting local Sri Lankan vendors.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {!token ? (
              <Alert variant="destructive">
                <AlertTitle>Sign in required</AlertTitle>
                <AlertDescription>Please log in to view your payment details.</AlertDescription>
              </Alert>
            ) : !orderId ? (
              <Alert variant="destructive">
                <AlertTitle>Missing payment reference</AlertTitle>
                <AlertDescription>Return to your orders and open the payment again.</AlertDescription>
              </Alert>
            ) : paymentQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load payment</AlertTitle>
                <AlertDescription>Please try again from your orders page.</AlertDescription>
              </Alert>
            ) : isProcessing ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : payment ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <PaymentStatusBadge status={payment.status} />
                  <div className="text-xs text-muted-foreground tabular-nums">{formatDate(payment.updatedAt)}</div>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMoney(Number(payment.amount), String(payment.currency))}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Currency</div>
                    <div className="text-sm font-semibold">{payment.currency}</div>
                  </div>
                  <div className="rounded-xl border bg-background p-4">
                    <div className="text-xs text-muted-foreground">Method</div>
                    <div className="text-sm font-semibold">{payment.method === "ONLINE" ? "VISA" : payment.method}</div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Payment not found</AlertTitle>
                <AlertDescription>Please check your orders page.</AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="w-full sm:w-auto active:scale-95">
                <Link href="/products">Continue shopping</Link>
              </Button>
              <Button asChild className="w-full sm:w-auto active:scale-95">
                <Link href="/orders">View my orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

