"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";

import type { VendorMetricsRange, VendorOrderSeriesPoint } from "@/components/vendor-dashboard/vendor-metrics";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

function formatAxisDate(isoDate: string) {
  try {
    return format(parseISO(isoDate), "MMM d");
  } catch {
    return isoDate;
  }
}

function OrdersChartSkeleton() {
  return (
    <Card className="border bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-[16/7] w-full" />
      </CardContent>
    </Card>
  );
}

export const OrdersLineChart = React.memo(function OrdersLineChart({
  series,
  range,
  onRangeChange,
  isLoading,
  className,
}: {
  series: VendorOrderSeriesPoint[];
  range: VendorMetricsRange;
  onRangeChange: (next: VendorMetricsRange) => void;
  isLoading?: boolean;
  className?: string;
}) {
  const normalized = React.useMemo(() => {
    return (series ?? []).map((point) => ({
      date: point.date,
      orders: Number(point.orders ?? 0),
    }));
  }, [series]);

  const hasData = normalized.some((p) => p.orders > 0);

  if (isLoading) return <OrdersChartSkeleton />;

  return (
    <Card
      className={cn(
        "border bg-card",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">Orders over time</CardTitle>
          <p className="text-sm text-muted-foreground">Daily orders for the selected range.</p>
        </div>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(value) => {
            if (value === "7d" || value === "30d") onRangeChange(value);
          }}
          className="justify-start rounded-lg border bg-muted/40 p-1"
        >
          <ToggleGroupItem
            value="30d"
            className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground"
          >
            Last 30 days
          </ToggleGroupItem>
          <ToggleGroupItem
            value="7d"
            className="h-8 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground"
          >
            Last 7 days
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
            No order activity in this period yet.
          </div>
        ) : (
          <ChartContainer
            className="aspect-[16/7] w-full"
            config={{
              orders: { label: "Orders", color: "hsl(var(--chart-1))" },
            }}
          >
            <AreaChart data={normalized} margin={{ left: 4, right: 10, top: 14, bottom: 0 }}>
              <defs>
                <linearGradient id="orders-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={8}
                tickFormatter={formatAxisDate}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Orders</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="orders"
                type="monotone"
                stroke="var(--color-orders)"
                fill="url(#orders-fill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
});
