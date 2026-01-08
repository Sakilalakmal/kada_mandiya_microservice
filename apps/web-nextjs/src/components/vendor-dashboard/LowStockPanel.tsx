"use client";

import * as React from "react";

import type { ProductListItem } from "@/lib/products";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

function truncateLabel(value: string, max = 18) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function LowStockSkeleton() {
  return (
    <Card className="border bg-card">
      <CardHeader className="space-y-2 pb-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-52" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full" />
      </CardContent>
    </Card>
  );
}

export const LowStockBar = React.memo(function LowStockBar({
  products,
  isLoading,
  threshold = 3,
  className,
}: {
  products: ProductListItem[];
  isLoading?: boolean;
  threshold?: number;
  className?: string;
}) {
  const data = React.useMemo(() => {
    const raw = Array.isArray(products) ? products : [];
    return raw
      .filter((p) => Number(p.stockQty ?? 0) <= threshold)
      .sort((a, b) => Number(a.stockQty ?? 0) - Number(b.stockQty ?? 0))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: truncateLabel(String(p.name ?? "Unnamed")),
        stock: Number(p.stockQty ?? 0),
      }));
  }, [products, threshold]);

  const hasData = data.length > 0;

  if (isLoading) return <LowStockSkeleton />;

  return (
    <Card className={cn("border bg-card", className)}>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">Low stock</CardTitle>
        <p className="text-sm text-muted-foreground">
          Top {Math.min(5, data.length || 5)} items at or below {threshold} in stock.
        </p>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border bg-muted/30 px-6 text-center text-sm text-muted-foreground">
            Inventory looks healthy—no products under the threshold.
          </div>
        ) : (
          <ChartContainer
            className="h-[260px] w-full"
            config={{
              stock: { label: "Stock", color: "hsl(var(--chart-1))" },
            }}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 10, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" opacity={0.35} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={110}
                tickMargin={8}
              />
              <XAxis type="number" dataKey="stock" tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--chart-1))", opacity: 0.08 }}
                content={<ChartTooltipContent nameKey="name" indicator="line" />}
              />
              <Bar dataKey="stock" radius={[0, 6, 6, 0]} fill="var(--color-stock)" isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
});

