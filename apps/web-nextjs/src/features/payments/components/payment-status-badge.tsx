"use client";

import * as React from "react";

import type { PaymentStatus } from "@/api/payments";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "COD",
  PENDING: "Pending",
  COMPLETED: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const PaymentStatusBadge = React.memo(function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  const base = "rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide";

  const style =
    status === "PENDING"
      ? "bg-background text-foreground"
      : status === "COMPLETED" || status === "NOT_REQUIRED"
        ? "bg-foreground text-background shadow-sm"
        : status === "FAILED"
          ? "bg-destructive text-destructive-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground";

  return (
    <Badge
      variant="outline"
      className={cn(base, "transition-colors", style, status === "CANCELLED" && "line-through", className)}
    >
      {LABELS[status] ?? status}
    </Badge>
  );
});

