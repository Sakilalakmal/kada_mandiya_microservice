"use client";

import { format, parseISO } from "date-fns";

import type { VendorOrderDetail } from "@/api/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/features/orders/components/status-badge";

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

export function VendorOrderSummaryCard({ order, className }: { order: VendorOrderDetail; className?: string }) {
  const shortId = order.orderId ? order.orderId.slice(0, 8) : "";

  return (
    <Card className={cn("border bg-card shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Order</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-xs text-foreground">#{shortId}</div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">{formatDateTime(order.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Vendor subtotal</span>
          <span className="font-semibold tabular-nums">{formatMoney(order.vendorSubtotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

