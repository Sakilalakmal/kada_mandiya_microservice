"use client";

import type { OrderItem } from "@/api/orders";
import { cn } from "@/lib/utils";

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

export function OrderItemsList({ items, className }: { items: OrderItem[]; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div
          key={item.itemId}
          className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/30"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{item.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-mono">#{item.productId.slice(0, 8)}…</span>
              {item.vendorId ? <span className="font-mono">v:{item.vendorId.slice(0, 8)}…</span> : null}
              <span className="tabular-nums">
                {item.qty} × {formatMoney(item.unitPrice)}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs text-muted-foreground">Line total</div>
            <div className="text-sm font-semibold tabular-nums">{formatMoney(item.lineTotal)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

