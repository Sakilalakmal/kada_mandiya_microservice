"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { format, parseISO } from "date-fns";

import type { OrderListItem } from "@/api/orders";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

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

function formatDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy • h:mm a");
  } catch {
    return iso;
  }
}

export function OrderCard({ order, className }: { order: OrderListItem; className?: string }) {
  return (
    <Link href={`/orders/${order.orderId}`} className="block">
      <Card
        className={cn(
          "group relative overflow-hidden border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md",
          className
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <div className="absolute -left-20 top-8 h-32 w-32 rounded-full bg-foreground/5 blur-2xl" />
          <div className="absolute -right-24 bottom-0 h-40 w-40 rounded-full bg-foreground/5 blur-2xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <div className="text-xs text-muted-foreground tabular-nums">{formatDate(order.createdAt)}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Order</span>{" "}
              <span className="font-mono text-xs">{order.orderId.slice(0, 8)}…</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Subtotal</div>
              <div className="font-semibold tabular-nums">{formatMoney(order.subtotal)}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="text-[11px] font-medium text-muted-foreground">Tap for details</div>
        </div>
      </Card>
    </Link>
  );
}

