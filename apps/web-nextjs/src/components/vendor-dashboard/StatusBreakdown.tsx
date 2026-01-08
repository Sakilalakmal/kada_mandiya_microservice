"use client";

import * as React from "react";

import type { VendorOrderStatusBreakdownItem } from "@/components/vendor-dashboard/vendor-metrics";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

import { Cell, Pie, PieChart } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_ORDER = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "hsl(var(--chart-1))",
  SHIPPED: "hsl(var(--chart-2))",
  DELIVERED: "hsl(var(--chart-3))",
  CANCELLED: "hsl(var(--chart-4))",
};

function StatusBreakdownSkeleton() {
  return (
    <Card className="border bg-card">
      <CardHeader className="space-y-2 pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-52" />
      </CardHeader>
      <CardContent className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <Skeleton className="mx-auto aspect-square w-full max-w-[220px] rounded-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const OrderStatusDonut = React.memo(function OrderStatusDonut({
  items,
  isLoading,
  className,
}: {
  items: VendorOrderStatusBreakdownItem[];
  isLoading?: boolean;
  className?: string;
}) {
  const data = React.useMemo(() => {
    const raw = Array.isArray(items) ? items : [];

    const counts = new Map<string, number>();
    for (const item of raw) {
      const upper = String(item.status ?? "").toUpperCase();
      const status = upper === "PROCESSING" ? "PENDING" : upper;
      if (!STATUS_ORDER.includes(status as (typeof STATUS_ORDER)[number])) continue;
      const next = (counts.get(status) ?? 0) + Number(item.count ?? 0);
      counts.set(status, next);
    }

    return STATUS_ORDER.map((status) => ({ status, count: counts.get(status) ?? 0 })).filter(
      (item) => item.count > 0
    );
  }, [items]);

  const total = React.useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);
  const hasData = total > 0;

  if (isLoading) return <StatusBreakdownSkeleton />;

  return (
    <Card
      className={cn(
        "border bg-card",
        className
      )}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">Order status distribution</CardTitle>
        <p className="text-sm text-muted-foreground">Pending, shipped, delivered, and cancelled.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 xl:flex-row xl:items-center">
        {!hasData ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-xl border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
            No orders in this period yet.
          </div>
        ) : (
          <>
            <ChartContainer
              className="mx-auto aspect-square w-full max-w-[260px]"
              config={Object.fromEntries(
                data.map((item) => [
                  item.status,
                  {
                    label: STATUS_LABELS[item.status] ?? item.status,
                    color: STATUS_COLORS[item.status] ?? "hsl(var(--muted-foreground))",
                  },
                ])
              )}
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" nameKey="status" />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="hsl(var(--border))"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "hsl(var(--muted-foreground))"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-end justify-between">
                <p className="text-sm font-medium">Total</p>
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {total.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                {data.map((item) => {
                  const label = STATUS_LABELS[item.status] ?? item.status;
                  const pct = total ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[item.status] ?? "hsl(var(--muted-foreground))" }}
                        />
                        <span className="text-foreground">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{pct}%</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
