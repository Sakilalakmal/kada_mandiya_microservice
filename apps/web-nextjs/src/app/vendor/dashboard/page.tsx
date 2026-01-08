"use client";

import * as React from "react";
import { format, isValid, parseISO, startOfDay, subDays } from "date-fns";
import { motion } from "framer-motion";

import { DashboardCards, type VendorDashboardKpis } from "@/components/vendor-dashboard/KpiCards";
import { LowStockBar } from "@/components/vendor-dashboard/LowStockPanel";
import { OrdersLineChart } from "@/components/vendor-dashboard/OrdersChart";
import { OrderStatusDonut } from "@/components/vendor-dashboard/StatusBreakdown";
import type { VendorMetricsRange, VendorOrderSeriesPoint, VendorOrderStatusBreakdownItem } from "@/components/vendor-dashboard/vendor-metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorOrdersQuery } from "@/features/orders/vendorQueries";
import { useVendorDashboardProductsQuery, useVendorDashboardProfileQuery } from "@/lib/queries/vendorDashboard";

export default function VendorDashboardPage() {
  const [range, setRange] = React.useState<VendorMetricsRange>("30d");

  const profileQuery = useVendorDashboardProfileQuery();
  const productsQuery = useVendorDashboardProductsQuery();
  const ordersQuery = useVendorOrdersQuery();

  const profile = profileQuery.data;
  const products = productsQuery.data;
  const orders = ordersQuery.data;

  const { series, statusBreakdown, totalOrders, pendingOrders, totalRevenue } = React.useMemo(() => {
    const list = orders ?? [];
    const totalOrdersValue = list.length;
    const pendingOrdersValue = list.filter((o) => o.status === "PENDING" || o.status === "PROCESSING").length;
    const totalRevenueValue = list
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.vendorSubtotal ?? 0), 0);

    const days = range === "7d" ? 7 : 30;
    const end = startOfDay(new Date());
    const start = subDays(end, days - 1);

    const byDate = new Map<string, VendorOrderSeriesPoint>();
    for (let i = days - 1; i >= 0; i -= 1) {
      const day = subDays(end, i);
      const key = format(day, "yyyy-MM-dd");
      byDate.set(key, { date: key, orders: 0 });
    }

    const statusCounts = new Map<string, number>();
    for (const order of list) {
      const created = parseISO(order.createdAt);
      if (!isValid(created)) continue;
      const day = startOfDay(created);
      if (day < start || day > end) continue;

      const key = format(day, "yyyy-MM-dd");
      const point = byDate.get(key);
      if (point) point.orders += 1;

      const status = String(order.status ?? "UNKNOWN").toUpperCase();
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }

    const statusItems: VendorOrderStatusBreakdownItem[] = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count })
    );

    return {
      series: Array.from(byDate.values()),
      statusBreakdown: statusItems,
      totalOrders: totalOrdersValue,
      pendingOrders: pendingOrdersValue,
      totalRevenue: totalRevenueValue,
    };
  }, [orders, range]);

  const kpis = React.useMemo<VendorDashboardKpis | null>(() => {
    if (!products) return null;
    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalProducts: products.totalProducts,
      lowStockCount: products.lowStockCount,
    };
  }, [pendingOrders, products, totalOrders, totalRevenue]);

  const hasError = ordersQuery.isError || productsQuery.isError || profileQuery.isError;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.storeName ? `${profile.storeName} performance snapshot.` : "Performance snapshot and trends."}
        </p>
      </motion.div>

      <DashboardCards kpis={kpis} isLoading={ordersQuery.isLoading || productsQuery.isLoading} />

      {hasError ? (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Dashboard data unavailable</CardTitle>
            <CardDescription>We could not load all analytics. Try again in a moment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                profileQuery.refetch();
                ordersQuery.refetch();
                productsQuery.refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <OrdersLineChart
            series={series}
            range={range}
            onRangeChange={setRange}
            isLoading={ordersQuery.isLoading}
          />

          <div className="grid min-w-0 gap-4 xl:grid-cols-3">
            <OrderStatusDonut items={statusBreakdown} isLoading={ordersQuery.isLoading} className="min-w-0 xl:col-span-2" />
            <LowStockBar products={products?.lowStockProducts ?? []} isLoading={productsQuery.isLoading} className="min-w-0" />
          </div>
        </>
      )}
    </div>
  );
}
