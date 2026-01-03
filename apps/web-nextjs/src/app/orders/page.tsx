"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, Package } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useOrdersQuery } from "@/features/orders/queries";
import { OrderCard } from "@/features/orders/components/order-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartNavButton } from "@/components/cart-nav-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toastApiError } from "@/components/ui/feedback";

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-44" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-3 w-20" />
                <Skeleton className="ml-auto h-5 w-24" />
              </div>
            </div>
            <div className="mt-4">
              <Skeleton className="h-px w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { token } = useAuth();
  const ordersQuery = useOrdersQuery();

  const didToastRef = React.useRef(false);
  React.useEffect(() => {
    if (ordersQuery.isError && !didToastRef.current) {
      didToastRef.current = true;
      toastApiError(ordersQuery.error, "Failed to load orders");
    }
    if (!ordersQuery.isError) didToastRef.current = false;
  }, [ordersQuery.error, ordersQuery.isError]);

  const orders = ordersQuery.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">My orders</p>
              <p className="text-sm text-muted-foreground">
                {ordersQuery.isFetching ? "Refreshing…" : "Your order timeline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartNavButton />
            <Button asChild variant="ghost">
              <Link href="/products" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Products
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
              <p>Please log in to view your orders.</p>
              <Button asChild className="active:scale-95">
                <Link href="/auth?mode=login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        ) : ordersQuery.isLoading ? (
          <OrdersSkeleton />
        ) : ordersQuery.isError ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Could not load orders</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <p>We couldn&apos;t reach the order service. Please try again.</p>
              <Button variant="outline" onClick={() => ordersQuery.refetch()} className="active:scale-95">
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Empty className="border bg-background shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No orders yet</EmptyTitle>
              <EmptyDescription>
                Your future orders will appear here, crisp and calm. Start with a product you love.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="active:scale-95">
                <Link href="/products">Browse products</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <main className="relative space-y-4">
            <div aria-hidden className="pointer-events-none absolute left-5 top-3 bottom-3 w-px bg-border" />
            {orders.map((order) => (
              <div key={order.orderId} className="group relative pl-10">
                <div
                  aria-hidden
                  className="absolute left-[14px] top-8 h-3 w-3 rounded-full border bg-background shadow-sm transition-transform duration-200 group-hover:scale-110"
                />
                <OrderCard order={order} />
              </div>
            ))}
          </main>
        )}
      </div>
    </div>
  );
}
