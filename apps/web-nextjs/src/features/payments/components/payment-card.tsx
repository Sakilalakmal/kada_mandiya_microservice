"use client";

import Link from "next/link";
import * as React from "react";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";

import type { PaymentDetail, PaymentListItem } from "@/api/payments";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PaymentStatusBadge } from "./payment-status-badge";

type PaymentLike = PaymentDetail | PaymentListItem;

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy ƒ?› h:mm a");
  } catch {
    return iso;
  }
}

export function PaymentCard({
  payment,
  href,
  className,
  footer,
}: {
  payment: PaymentLike;
  href?: string;
  className?: string;
  footer?: React.ReactNode;
}) {
  const money = React.useMemo(
    () => formatMoney(Number(payment.amount), String(payment.currency)),
    [payment.amount, payment.currency]
  );
  const updated = React.useMemo(() => formatDate(String(payment.updatedAt)), [payment.updatedAt]);

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden border bg-card shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md",
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

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <PaymentStatusBadge status={payment.status} />
              <div className="text-xs text-muted-foreground tabular-nums">{updated}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Order</span>{" "}
              <span className="font-mono text-xs break-all">{payment.orderId}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="font-semibold tabular-nums">{money}</div>
            </div>
            {href ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Method</div>
            <div className="text-sm font-semibold">{payment.method}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Currency</div>
            <div className="text-sm font-semibold">{payment.currency}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-sm font-semibold">{payment.status}</div>
          </div>
        </div>

        {footer ? <div className="mt-5 -mx-5 border-t px-5 pt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
