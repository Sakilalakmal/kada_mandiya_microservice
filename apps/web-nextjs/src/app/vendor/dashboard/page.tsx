"use client";

import Link from "next/link";
import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  Boxes,
  Clock,
  Package,
  ShieldAlert,
  Store,
  TriangleAlert,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useVendorDashboardOrdersQuery, useVendorDashboardProductsQuery, useVendorDashboardProfileQuery } from "@/lib/queries/vendorDashboard";
import { StatusBadge } from "@/features/orders/components/status-badge";
import { VendorNotificationBell } from "@/features/notifications/components/vendor-notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

function formatDateTime(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="border-white/10 bg-white/5">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: rows }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export default function VendorDashboardPage() {
  const { isVendor } = useAuth();
  const profileQuery = useVendorDashboardProfileQuery();
  const ordersQuery = useVendorDashboardOrdersQuery();
  const productsQuery = useVendorDashboardProductsQuery();

  const profile = profileQuery.data;
  const ordersSummary = ordersQuery.data;
  const productsSummary = productsQuery.data;

  const overviewCards = React.useMemo(
    () => [
      {
        label: "Total orders",
        value: ordersSummary?.totalOrders,
        icon: <Package className="h-4 w-4 text-[#c4b5fd]" />,
      },
      {
        label: "Pending orders",
        value: ordersSummary?.pendingOrders,
        icon: <Clock className="h-4 w-4 text-[#c4b5fd]" />,
      },
      {
        label: "Total products",
        value: productsSummary?.totalProducts,
        icon: <Boxes className="h-4 w-4 text-[#c4b5fd]" />,
      },
      {
        label: "Low stock",
        value: productsSummary?.lowStockProducts.length,
        icon: <TriangleAlert className="h-4 w-4 text-[#c4b5fd]" />,
      },
    ],
    [ordersSummary, productsSummary]
  );

  if (!isVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050507] via-[#0b0b12] to-[#120f24] text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
          <Card className="border-[#c4b5fd]/30 bg-[#0f0c1a]/80 text-slate-100 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <ShieldAlert className="h-5 w-5 text-[#c4b5fd]" />
                You are not a vendor yet
              </CardTitle>
              <CardDescription className="text-slate-300">
                Create a vendor profile to unlock the dashboard and start selling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-200">
                Upgrade your account to manage listings, track orders, and grow on Kada Mandiya.
              </p>
              <Separator className="border-white/10" />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#c4b5fd] text-slate-900 hover:bg-[#b7a4ff]">
                  <Link href="/become-vendor">Become a vendor</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Link href="/auth?mode=login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050507] via-[#0b0b12] to-[#120f24] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4b5fd]/10 text-[#c4b5fd]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#c4b5fd]">Vendor</p>
              <p className="text-2xl font-semibold text-white">Vendor Dashboard</p>
              <p className="text-sm text-slate-300">
                {profile?.storeName
                  ? `${profile.storeName} overview and recent activity.`
                  : "Overview of your store performance and inventory."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VendorNotificationBell className="border border-[#c4b5fd]/40 text-[#c4b5fd] hover:bg-[#c4b5fd]/10" />
            <Button
              asChild
              variant="outline"
              className="border-[#c4b5fd]/40 text-[#c4b5fd] hover:bg-[#c4b5fd]/10"
            >
              <Link href="/vendor/orders">View orders</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#c4b5fd]/40 text-[#c4b5fd] hover:bg-[#c4b5fd]/10"
            >
              <Link href="/">Home</Link>
            </Button>
          </div>
        </header>

        {ordersQuery.isLoading || productsQuery.isLoading ? (
          <OverviewSkeleton />
        ) : ordersQuery.isError || productsQuery.isError ? (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-lg text-white">Dashboard stats unavailable</CardTitle>
              <CardDescription className="text-slate-300">
                We could not load all vendor metrics. Try again in a moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  ordersQuery.refetch();
                  productsQuery.refetch();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <Card key={card.label} className="border-white/10 bg-white/5">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{card.label}</span>
                    {card.icon}
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {card.value ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400">Last updated a moment ago</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent orders</h2>
                <p className="text-sm text-slate-400">Latest activity across your store.</p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Link href="/vendor/orders">View all</Link>
              </Button>
            </div>

            {ordersQuery.isLoading ? (
              <SectionSkeleton rows={5} />
            ) : ordersQuery.isError ? (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Could not load orders</CardTitle>
                  <CardDescription className="text-slate-300">
                    Check your connection and retry.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => ordersQuery.refetch()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : ordersSummary?.recentOrders.length === 0 ? (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-white">No orders yet</CardTitle>
                  <CardDescription className="text-slate-300">
                    Incoming orders will show here once customers buy your items.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="px-0 py-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Placed</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersSummary?.recentOrders.map((order) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-mono text-xs text-slate-200">
                            #{order.orderId.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-sm text-slate-200">
                            {formatMoney(
                              Number.isFinite(Number(order.vendorSubtotal))
                                ? Number(order.vendorSubtotal)
                                : order.subtotal
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-400">
                            {formatDateTime(order.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" className="active:scale-95">
                              <Link href={`/vendor/orders/${order.orderId}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Low stock</h2>
              <p className="text-sm text-slate-400">Products that need restocking soon.</p>
            </div>

            {productsQuery.isLoading ? (
              <SectionSkeleton rows={4} />
            ) : productsQuery.isError ? (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Could not load inventory</CardTitle>
                  <CardDescription className="text-slate-300">
                    Check your connection and retry.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => productsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : productsSummary?.lowStockProducts.length === 0 ? (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-white">All stocked up</CardTitle>
                  <CardDescription className="text-slate-300">
                    You have no products under the low stock threshold.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Link href="/vendor/products">Manage products</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="space-y-3 p-6">
                  {productsSummary?.lowStockProducts.map((product) => {
                    const isOut = product.stockQty <= 0;
                    return (
                      <div key={product.id} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.category ?? "General"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isOut ? "destructive" : "secondary"}>
                            {isOut ? "Out of stock" : "Low stock"}
                          </Badge>
                          <span className="text-sm font-semibold text-white">
                            {product.stockQty}
                          </span>
                          <Button asChild size="sm" variant="outline" className="border-white/20 text-white">
                            <Link href={`/vendor/products/${product.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
