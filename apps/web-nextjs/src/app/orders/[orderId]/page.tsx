"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, Ban, MapPin, Package, Phone, RefreshCcw } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useCancelOrderMutation, useOrderDetailQuery } from "@/features/orders/queries";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { OrderItemsList } from "@/features/orders/components/order-items-list";
import { usePaymentByOrderQuery } from "@/features/payments/queries";
import { PaymentActions } from "@/features/payments/components/payment-actions";
import { PaymentCard } from "@/features/payments/components/payment-card";
import { PaymentSkeleton } from "@/features/payments/components/payment-skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartNavButton } from "@/components/cart-nav-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toastApiError } from "@/components/ui/feedback";
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

function formatMoney(value: number) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `LKR ${value.toFixed(2)}`;
  }
}

function formatPaymentMethod(method: string) {
  if (method === "ONLINE") return "VISA";
  return method;
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { token } = useAuth();

  const params = useParams<{ orderId?: string }>();
  const orderId = React.useMemo(() => {
    if (!params?.orderId) return "";
    return Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  }, [params]);

  const detailQuery = useOrderDetailQuery(orderId);
  const paymentQuery = usePaymentByOrderQuery(orderId);
  const cancelMutation = useCancelOrderMutation();

  const payment = paymentQuery.data;
  const isPaymentRequired =
    payment?.method === "ONLINE" && (payment.status === "PENDING" || payment.status === "FAILED");

  const didToastRef = React.useRef(false);
  React.useEffect(() => {
    if (detailQuery.isError && !didToastRef.current) {
      didToastRef.current = true;
      toastApiError(detailQuery.error, "Failed to load order");
    }
    if (!detailQuery.isError) didToastRef.current = false;
  }, [detailQuery.error, detailQuery.isError]);

  const didPaymentToastRef = React.useRef(false);
  React.useEffect(() => {
    if (paymentQuery.isError && !didPaymentToastRef.current) {
      didPaymentToastRef.current = true;
      toastApiError(paymentQuery.error, "Failed to load payment");
    }
    if (!paymentQuery.isError) didPaymentToastRef.current = false;
  }, [paymentQuery.error, paymentQuery.isError]);

  if (!token) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold">Order</p>
                <p className="text-sm text-muted-foreground">Sign in required</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild variant="ghost">
                <Link href="/orders" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Orders
                </Link>
              </Button>
            </div>
          </header>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in to view order details.</p>
              <Button asChild className="active:scale-95">
                <Link href="/auth?mode=login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10 sm:px-10">
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-8">
            <p className="text-lg font-semibold text-foreground">Missing order</p>
            <Button asChild>
              <Link href="/orders">Back to orders</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const order = detailQuery.data;
  const isCancelling = cancelMutation.isPending && cancelMutation.variables === orderId;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Order details</p>
              <p className="text-sm text-muted-foreground">
                {detailQuery.isFetching ? "Refreshing..." : order ? `#${order.orderId.slice(0, 8)}` : "Loading"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartNavButton />
            <NotificationBell />
            <Button asChild variant="ghost">
              <Link href="/orders" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Orders
              </Link>
            </Button>
          </div>
        </header>

        {detailQuery.isLoading ? (
          <DetailSkeleton />
        ) : detailQuery.isError || !order ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Order not found</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <p>This order may have been removed or you don&apos;t have access.</p>
              <Button variant="outline" onClick={() => router.refresh()} className="active:scale-95">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">Order</CardTitle>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {order.orderId}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" />
                    Delivery address
                  </div>
                  <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                    {order.deliveryAddress}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Payment method</div>
                    <div className="text-sm font-semibold">{formatPaymentMethod(order.paymentMethod)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Mobile
                    </div>
                    <div className="text-sm font-semibold">{order.mobile ?? "N/A"}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="text-sm font-semibold">Items</div>
                  {order.items?.length ? (
                    <OrderItemsList items={order.items} />
                  ) : (
                    <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                      No items found for this order.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatMoney(order.subtotal)}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  {order.status === "PENDING" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full gap-2 active:scale-95"
                          disabled={isCancelling}
                        >
                          <Ban className="h-4 w-4" />
                          {isCancelling ? "Cancelling..." : "Cancel order"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This can&apos;t be undone. Only pending orders can be cancelled.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep order</AlertDialogCancel>
                          <AlertDialogAction onClick={() => cancelMutation.mutate(orderId)}>
                            Cancel order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                      Cancellation is available only while an order is pending.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {paymentQuery.isLoading ? (
              <PaymentSkeleton />
            ) : paymentQuery.isError || !paymentQuery.data ? (
              <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader>
                  <CardTitle className="text-lg">Payment</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <p>We couldn&apos;t load payment details right now.</p>
                  <Button
                    variant="outline"
                    onClick={() => paymentQuery.refetch()}
                    className="active:scale-95"
                  >
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {isPaymentRequired ? (
                  <Alert variant="destructive" className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AlertTitle>Payment required</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                      <span>
                        Complete your Visa payment to finish checkout. Vendors won&apos;t see this order until it&apos;s paid.
                      </span>
                      <PaymentActions payment={paymentQuery.data} />
                    </AlertDescription>
                  </Alert>
                ) : null}

                <PaymentCard
                  payment={paymentQuery.data}
                  footer={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {paymentQuery.data.status === "PENDING" ? (
                          <>
                            <Spinner className="size-3.5" />
                            <span>Updating...</span>
                          </>
                        ) : null}
                      </div>
                      {!isPaymentRequired ? <PaymentActions payment={paymentQuery.data} /> : null}
                    </div>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
