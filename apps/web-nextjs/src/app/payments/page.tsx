"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, CreditCard } from "lucide-react";

import { useMyPaymentsQuery } from "@/features/payments/queries";
import { PaymentCard } from "@/features/payments/components/payment-card";
import { PaymentSkeleton } from "@/features/payments/components/payment-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartNavButton } from "@/components/cart-nav-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toastApiError } from "@/components/ui/feedback";

function PaymentsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <PaymentSkeleton key={idx} />
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const { token } = useAuth();
  const paymentsQuery = useMyPaymentsQuery();

  const didToastRef = React.useRef(false);
  React.useEffect(() => {
    if (paymentsQuery.isError && !didToastRef.current) {
      didToastRef.current = true;
      toastApiError(paymentsQuery.error, "Failed to load payments");
    }
    if (!paymentsQuery.isError) didToastRef.current = false;
  }, [paymentsQuery.error, paymentsQuery.isError]);

  const payments = paymentsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">My payments</p>
              <p className="text-sm text-muted-foreground">
                {paymentsQuery.isFetching ? "Refreshing..." : "Your payment history"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartNavButton />
            <Button asChild variant="ghost">
              <Link href="/orders" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Orders
              </Link>
            </Button>
          </div>
        </header>

        {!token ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in to view your payments.</p>
              <Button asChild className="active:scale-95">
                <Link href="/auth?mode=login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        ) : paymentsQuery.isLoading ? (
          <PaymentsSkeleton />
        ) : paymentsQuery.isError ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Could not load payments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <p>We couldn&apos;t reach the payment service. Please try again.</p>
              <Button variant="outline" onClick={() => paymentsQuery.refetch()} className="active:scale-95">
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : payments.length === 0 ? (
          <Empty className="border bg-background shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CreditCard className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No payments yet</EmptyTitle>
              <EmptyDescription>
                Your payments will appear here after you place an order.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="active:scale-95">
                <Link href="/products">Browse products</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <main className="space-y-4">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.orderId}
                payment={payment}
                href={`/orders/${payment.orderId}`}
              />
            ))}
          </main>
        )}
      </div>
    </div>
  );
}

