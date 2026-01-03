"use client";

import * as React from "react";

import type { OrderStatus } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const base = "rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide";

  const style =
    status === "PENDING"
      ? "bg-background text-foreground"
      : status === "PROCESSING"
        ? "bg-muted text-foreground"
        : status === "SHIPPED"
          ? "bg-foreground text-background"
          : status === "DELIVERED"
            ? "bg-foreground text-background shadow-sm"
            : "bg-muted/40 text-muted-foreground";

  return (
    <Badge
      variant="outline"
      className={cn(base, "transition-colors", style, status === "CANCELLED" && "line-through", className)}
    >
      {LABELS[status] ?? status}
    </Badge>
  );
}

