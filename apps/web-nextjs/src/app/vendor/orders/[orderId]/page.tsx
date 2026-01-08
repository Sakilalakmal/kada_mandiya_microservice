"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { ArrowLeft } from "lucide-react";

import type { ApiError } from "@/lib/api";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { useUpdateVendorOrderStatusMutation, useVendorOrderDetailQuery } from "@/features/orders/vendorQueries";
import { VendorOrderDetailSkeleton } from "@/features/orders/vendor/components/vendor-order-detail-skeleton";
import { VendorOrderItemsTable } from "@/features/orders/vendor/components/vendor-order-items-table";
import { VendorOrderSummaryCard } from "@/features/orders/vendor/components/vendor-order-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

const STATUS_OPTIONS = ["PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default function VendorOrderDetailPage() {
  const params = useParams<{ orderId?: string }>();
  const orderId = React.useMemo(() => {
    const raw = params?.orderId;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const detailQuery = useVendorOrderDetailQuery(orderId);
  const updateStatusMutation = useUpdateVendorOrderStatusMutation();

  const order = detailQuery.data;
  const shortId = order?.orderId ? order.orderId.slice(0, 8) : "";

  const canUpdateStatus = order ? order.status !== "CANCELLED" && order.status !== "DELIVERED" : false;
  const statusChoices = React.useMemo(() => {
    if (!order) return [];
    return STATUS_OPTIONS.filter((s) => s !== order.status);
  }, [order]);

  const [nextStatus, setNextStatus] = React.useState<(typeof STATUS_OPTIONS)[number] | "">("");
  React.useEffect(() => {
    if (!order) return;
    if (!statusChoices.length) {
      setNextStatus("");
      return;
    }
    setNextStatus((prev) => (prev && statusChoices.includes(prev) ? prev : statusChoices[0]!));
  }, [order, statusChoices]);

  const err = detailQuery.error as ApiError | null;
  const errStatus = err?.status ?? null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="active:scale-95">
            <Link href="/vendor/orders" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Orders
            </Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Order Details</p>
            <p className="font-mono text-xs text-muted-foreground">#{shortId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order ? <StatusBadge status={order.status} /> : null}
        </div>
      </header>

      {detailQuery.isLoading ? (
        <VendorOrderDetailSkeleton />
      ) : detailQuery.isError ? (
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {errStatus === 403 ? "Not allowed to view this order" : errStatus === 404 ? "Order not found" : "Could not load order"}
            </CardTitle>
            <CardDescription>
              {errStatus === 403
                ? "This order does not include your items."
                : errStatus === 404
                  ? "The order ID may be invalid or the order was removed."
                  : "Please try again."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="active:scale-95">
              <Link href="/vendor/orders">Back to orders</Link>
            </Button>
            <Button variant="outline" onClick={() => detailQuery.refetch()} className="active:scale-95">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !order ? (
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Order missing</CardTitle>
            <CardDescription>We didn&apos;t receive an order payload from the API.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="active:scale-95">
              <Link href="/vendor/orders">Back to orders</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Only items sold by you are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.length ? (
                <VendorOrderItemsTable items={order.items} />
              ) : (
                <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                  No items found for this vendor in this order.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <VendorOrderSummaryCard order={order} />

            <Card className="border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Update status</CardTitle>
                <CardDescription>Update your fulfillment progress for this order.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">New status</div>
                  <Select
                    value={nextStatus}
                    onValueChange={(v) => setNextStatus(v as (typeof STATUS_OPTIONS)[number])}
                    disabled={!canUpdateStatus || updateStatusMutation.isPending || statusChoices.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusChoices.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full active:scale-95"
                      disabled={!canUpdateStatus || !nextStatus || updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? "Updating..." : "Update status"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm status update?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will update order <span className="font-mono">#{shortId}</span> to{" "}
                        <span className="font-semibold">{nextStatus}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (!nextStatus) return;
                          updateStatusMutation.mutate({ orderId, status: nextStatus });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {!canUpdateStatus ? (
                  <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                    This order can&apos;t be updated further.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
