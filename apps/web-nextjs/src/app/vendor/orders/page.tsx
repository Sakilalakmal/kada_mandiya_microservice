"use client";

import Link from "next/link";
import * as React from "react";
import { format, parseISO } from "date-fns";
import { Package } from "lucide-react";

import { useVendorOrdersQuery } from "@/features/orders/vendorQueries";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

function formatDateTime(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

function OrdersSkeleton() {
  return (
    <Card className="border bg-card">
      <CardContent className="space-y-3 px-6 py-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

export default function VendorOrdersPage() {
  const ordersQuery = useVendorOrdersQuery();

  const orders = ordersQuery.data;
  const rows = React.useMemo(() => {
    const list = orders ?? [];
    return list.map((o) => {
      const rawVendorSubtotal = Number(o.vendorSubtotal);
      const vendorSubtotal = Number.isFinite(rawVendorSubtotal)
        ? rawVendorSubtotal
        : o.itemsForThisVendor.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
      return { ...o, vendorSubtotal };
    });
  }, [orders]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Track and update incoming orders.</p>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <OrdersSkeleton />
      ) : ordersQuery.isError ? (
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Could not load vendor orders</CardTitle>
            <CardDescription>Try again in a moment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => ordersQuery.refetch()} className="active:scale-95">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (orders ?? []).length === 0 ? (
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              No orders yet
            </CardTitle>
            <CardDescription>New orders that include your items will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border bg-card shadow-sm">
          <CardContent className="px-0 py-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Vendor subtotal</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((o) => (
                    <TableRow key={o.orderId}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">#{o.orderId.slice(0, 8)}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.itemsForThisVendor.length}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(o.vendorSubtotal)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button asChild size="sm" className="active:scale-95">
                          <Link href={`/vendor/orders/${o.orderId}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
