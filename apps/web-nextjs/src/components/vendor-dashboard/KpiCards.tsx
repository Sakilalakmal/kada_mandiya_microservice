"use client";

import * as React from "react";
import { Boxes, Clock, CreditCard, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type VendorDashboardKpis = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
};

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

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="border bg-card transition-transform">
          <CardHeader className="space-y-2 pb-0">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="pt-4">
            <Skeleton className="h-3 w-44" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const DashboardCards = React.memo(function DashboardCards({
  kpis,
  isLoading,
}: {
  kpis: VendorDashboardKpis | null;
  isLoading?: boolean;
}) {
  if (isLoading) return <KpiSkeleton />;

  const safe = {
    totalRevenue: kpis?.totalRevenue ?? 0,
    totalOrders: kpis?.totalOrders ?? 0,
    pendingOrders: kpis?.pendingOrders ?? 0,
    totalProducts: kpis?.totalProducts ?? 0,
    lowStockCount: kpis?.lowStockCount ?? 0,
  };

  const cards = [
    {
      label: "Revenue (est.)",
      value: formatMoney(safe.totalRevenue),
      hint: "Based on completed orders (Stripe soon).",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Total orders",
      value: safe.totalOrders.toLocaleString(),
      hint: "All-time vendor orders.",
      icon: <Boxes className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Pending orders",
      value: safe.pendingOrders.toLocaleString(),
      hint: "Orders to process next.",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Inventory (low stock)",
      value: safe.lowStockCount.toLocaleString(),
      hint: `${safe.totalProducts.toLocaleString()} total product${safe.totalProducts === 1 ? "" : "s"}.`,
      icon: <TriangleAlert className="h-4 w-4 text-muted-foreground" />,
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="group border bg-card transition-transform hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            {card.icon}
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
