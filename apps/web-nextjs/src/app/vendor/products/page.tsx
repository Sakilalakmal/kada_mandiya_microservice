"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Package, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import type { ProductListItem } from "@/lib/products";
import { fetchMyProducts, deactivateProduct, reactivateProduct, productKeys } from "@/lib/products";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { vendorAccessToast, toastApiError } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const MotionTableRow = motion(TableRow);
const vendorProductsKey = ["vendor-products"] as const;

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "LKR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default function VendorProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isVendor, setAuthToken } = useAuth();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: vendorProductsKey,
    queryFn: fetchMyProducts,
    enabled: isVendor,
    retry: false,
    staleTime: 15_000,
  });

  const handledErrorRef = React.useRef(false);
  React.useEffect(() => {
    if (!isError || handledErrorRef.current) return;
    const err = error as ApiError | null | undefined;
    handledErrorRef.current = true;

    if (err?.status === 401) {
      setAuthToken(null);
      router.push("/login");
      return;
    }
    if (err?.status === 403) {
      vendorAccessToast(() => router.push("/become-vendor"));
      return;
    }
    toastApiError(err, "Could not load your products");
  }, [error, isError, router, setAuthToken]);

  const [pendingActionById, setPendingActionById] = React.useState<Record<string, "deactivate" | "reactivate">>({});

  const setCachedIsActive = React.useCallback(
    (productId: string, isActive: boolean) => {
      queryClient.setQueryData<ProductListItem[]>(vendorProductsKey, (old) => {
        if (!old) return old;
        return old.map((product) =>
          product.id === productId ? { ...product, isActive } : product
        );
      });
    },
    [queryClient]
  );

  const deactivateMutation = useMutation({
    mutationFn: deactivateProduct,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: vendorProductsKey });
      const previous = queryClient.getQueryData<ProductListItem[]>(vendorProductsKey);

      setPendingActionById((current) => ({ ...current, [productId]: "deactivate" }));
      setCachedIsActive(productId, false);

      return { previous, productId };
    },
    onSuccess: () => {
      toast.success("Product deactivated");
    },
    onError: (err: ApiError, _productId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData<ProductListItem[]>(vendorProductsKey, ctx.previous);
      }
      if (err?.status === 401) {
        setAuthToken(null);
        router.push("/login");
        return;
      }
      if (err?.status === 403) {
        vendorAccessToast(() => router.push("/become-vendor"));
        return;
      }
      toastApiError(err, "Could not deactivate product");
    },
    onSettled: async (_data, _err, productId) => {
      setPendingActionById((current) => {
        if (!(productId in current)) return current;
        const next = { ...current };
        delete next[productId];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: vendorProductsKey });
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateProduct,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: vendorProductsKey });
      const previous = queryClient.getQueryData<ProductListItem[]>(vendorProductsKey);

      setPendingActionById((current) => ({ ...current, [productId]: "reactivate" }));
      setCachedIsActive(productId, true);

      return { previous, productId };
    },
    onSuccess: () => {
      toast.success("Product reactivated");
    },
    onError: (err: ApiError, _productId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData<ProductListItem[]>(vendorProductsKey, ctx.previous);
      }
      if (err?.status === 401) {
        setAuthToken(null);
        router.push("/login");
        return;
      }
      if (err?.status === 403) {
        vendorAccessToast(() => router.push("/become-vendor"));
        return;
      }
      toastApiError(err, "Could not reactivate product");
    },
    onSettled: async (_data, _err, productId) => {
      setPendingActionById((current) => {
        if (!(productId in current)) return current;
        const next = { ...current };
        delete next[productId];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: vendorProductsKey });
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });

  const products = data ?? [];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage listings, pricing, and stock.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="gap-2 active:scale-95"
            variant="default"
          >
            <Link href="/vendor/products/new">
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card className="border bg-card">
          <CardContent className="flex flex-col gap-3 px-6 py-8">
            <div className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5" />
              <p className="font-semibold">No products yet</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Start by adding your first product listing.
            </p>
            <Button asChild className="w-fit active:scale-95">
              <Link href="/vendor/products/new">Add product</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="min-w-0 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground">
            <span>{products.length} products</span>
            {isFetching ? <span>Refreshing...</span> : null}
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const pendingAction = pendingActionById[product.id] ?? null;
                  const isUpdating = Boolean(pendingAction);
                  return (
                    <MotionTableRow
                      key={product.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="transition hover:bg-muted/50"
                    >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border bg-muted">
                          {product.thumbnailImageUrl ? (
                            <Image
                              src={product.thumbnailImageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category ?? "Uncategorized"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatPrice(product.price, product.currency)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.stockQty}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "secondary" : "outline"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="gap-1 active:scale-95"
                        >
                          <Link href={`/vendor/products/${product.id}/edit`}>Edit</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "gap-1 active:scale-95",
                            isUpdating && "opacity-70"
                          )}
                          disabled={isUpdating}
                          onClick={() => {
                            if (product.isActive) {
                              deactivateMutation.mutate(product.id);
                            } else {
                              reactivateMutation.mutate(product.id);
                            }
                          }}
                        >
                          {pendingAction ? (
                            <div className="flex items-center gap-1 text-xs">
                              {pendingAction === "deactivate" ? (
                                <Ban className="h-3 w-3" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              {pendingAction === "deactivate" ? "Deactivating..." : "Reactivating..."}
                            </div>
                          ) : (
                            <>
                              {product.isActive ? (
                                <Ban className="h-3 w-3" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              {product.isActive ? "Deactivate" : "Reactivate"}
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    </MotionTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {isError ? (
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-6">
            <p className="text-sm font-semibold text-foreground">Could not load products.</p>
            <p className="text-xs text-muted-foreground">Please try again in a moment.</p>
            <Button variant="outline" onClick={() => router.refresh()} className="active:scale-95">
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
