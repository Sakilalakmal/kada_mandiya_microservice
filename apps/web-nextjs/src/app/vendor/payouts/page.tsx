"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";

import type { VendorOrderListItem } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVendorOrdersQuery } from "@/features/orders/vendorQueries";

type PayoutStatus = "Available" | "Pending" | "Completed";

function formatLkr(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(safe);
}

function getEarningsStatus(order: VendorOrderListItem): PayoutStatus | null {
  if (order.status === "DELIVERED") return "Available";
  if (order.status === "PENDING" || order.status === "PROCESSING" || order.status === "SHIPPED") return "Pending";
  return null;
}

function StatusPill({ status }: { status: PayoutStatus }) {
  if (status === "Available") return <Badge variant="secondary">Available</Badge>;
  if (status === "Pending") return <Badge variant="outline">Pending</Badge>;
  return <Badge>Completed</Badge>;
}

export default function VendorPayoutsPage() {
  const ordersQuery = useVendorOrdersQuery();

  const { availableBalance, pendingBalance, completedBalance, rows } = React.useMemo(() => {
    const list = ordersQuery.data ?? [];

    const summary = list.reduce(
      (acc, order) => {
        const status = getEarningsStatus(order);
        if (!status) return acc;

        const amount = Number(order.vendorSubtotal ?? 0);
        return {
          available: status === "Available" ? acc.available + amount : acc.available,
          pending: status === "Pending" ? acc.pending + amount : acc.pending,
          rows: [...acc.rows, { orderId: order.orderId, createdAt: order.createdAt, amount, status }],
        };
      },
      {
        available: 0,
        pending: 0,
        rows: [] as Array<{ orderId: string; createdAt: string; amount: number; status: PayoutStatus }>,
      }
    );

    const nextRows = summary.rows.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

    return {
      availableBalance: summary.available,
      pendingBalance: summary.pending,
      completedBalance: 0,
      rows: nextRows.slice(0, 12),
    };
  }, [ordersQuery.data]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="animate-in space-y-1 fade-in slide-in-from-bottom-3 duration-300">
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          Track balances in LKR. Completed payouts will appear here as they are processed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Available balance</CardTitle>
            <CardDescription>From delivered orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatLkr(availableBalance)}</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Pending payouts</CardTitle>
            <CardDescription>Not yet available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatLkr(pendingBalance)}</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Completed payouts</CardTitle>
            <CardDescription>Transfers to your bank</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatLkr(completedBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>Latest earnings activity based on your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      Loading payout activity…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-muted-foreground">
                      No payout activity yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const parsed = parseISO(row.createdAt);
                    const dateLabel = isValid(parsed) ? format(parsed, "MMM d, yyyy") : row.createdAt;
                    return (
                      <TableRow key={row.orderId}>
                        <TableCell className="whitespace-nowrap">{dateLabel}</TableCell>
                        <TableCell className="font-mono text-xs">{row.orderId}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{formatLkr(row.amount)}</TableCell>
                        <TableCell className="text-right">
                          <StatusPill status={row.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
