"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import { fetchProductDetail, productKeys, updateProduct, deactivateProduct } from "@/lib/products";
import { useAuth } from "@/hooks/use-auth";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";
import { vendorAccessToast, toastApiError } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const productId = React.useMemo(() => {
    if (!params?.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

  const queryClient = useQueryClient();
  const { isVendor, setAuthToken } = useAuth();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProductDetail(productId),
    enabled: Boolean(productId) && isVendor,
    retry: false,
    staleTime: 15_000,
    onError: (err: ApiError) => {
      if (err?.status === 401) {
        setAuthToken(null);
        router.push("/login");
        return;
      }
      if (err?.status === 403) {
        vendorAccessToast(() => router.push("/become-vendor"));
        return;
      }
      toastApiError(err, "Could not load product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        currency: values.currency || "LKR",
        stockQty: values.stockQty,
        images: values.images ?? [],
        isActive: values.isActive,
      };

      return updateProduct(productId, payload);
    },
    onSuccess: async () => {
      toast.success("Product updated");
      await queryClient.invalidateQueries({ queryKey: productKeys.mine });
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      router.push("/vendor/products");
    },
    onError: (err: ApiError) => {
      if (err?.status === 401) {
        setAuthToken(null);
        router.push("/login");
        return;
      }
      if (err?.status === 403) {
        vendorAccessToast(() => router.push("/become-vendor"));
        return;
      }
      toastApiError(err, "Could not update product");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => deactivateProduct(productId),
    onSuccess: async () => {
      toast.success("Product deactivated");
      await queryClient.invalidateQueries({ queryKey: productKeys.mine });
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      router.push("/vendor/products");
    },
    onError: (err: ApiError) => {
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
  });

  if (!isVendor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Vendor access required</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              You need a vendor account to edit products.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild className="active:scale-95">
              <Link href="/become-vendor">Become a vendor</Link>
            </Button>
            <Button asChild variant="outline" className="active:scale-95">
              <Link href="/auth?mode=login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!productId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10 sm:px-10">
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-8">
            <p className="text-lg font-semibold text-foreground">Missing product</p>
            <Button asChild>
              <Link href="/vendor/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const defaultValues: ProductFormValues | undefined = data
    ? {
        name: data.name,
        description: data.description ?? "",
        category: data.category ?? "",
        price: data.price,
        currency: data.currency,
        stockQty: data.stockQty,
        images: data.images?.map((img) => img.imageUrl) ?? [],
        isActive: data.isActive,
      }
    : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <p className="text-sm text-muted-foreground">Vendor</p>
        <h1 className="text-3xl font-semibold text-foreground">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          Update details, pricing, and availability.
        </p>
      </motion.div>

      {isLoading ? (
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ) : isError || !data ? (
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-8">
            <p className="text-lg font-semibold text-foreground">Product not found</p>
            <p className="text-sm text-muted-foreground">
              This product may have been removed.
            </p>
            <Button asChild variant="outline">
              <Link href="/vendor/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProductForm
          defaultValues={defaultValues}
          onSubmit={(values) => updateMutation.mutateAsync(values)}
          submitLabel={updateMutation.isPending ? "Saving..." : "Save changes"}
          isSubmitting={updateMutation.isPending || deactivateMutation.isPending}
          onDeactivate={() => deactivateMutation.mutateAsync()}
          showStatusToggle
        />
      )}
    </main>
  );
}
