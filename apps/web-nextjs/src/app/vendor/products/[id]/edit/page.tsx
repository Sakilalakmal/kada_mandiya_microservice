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
import { Card, CardContent } from "@/components/ui/card";
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
    error,
  } = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProductDetail(productId),
    enabled: Boolean(productId) && isVendor,
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
    toastApiError(err, "Could not load product");
  }, [error, isError, router, setAuthToken]);

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

  if (!productId) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-8">
            <p className="text-lg font-semibold text-foreground">Missing product</p>
            <Button asChild>
              <Link href="/vendor/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
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
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <p className="text-sm text-muted-foreground">Update details, pricing, and availability.</p>
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
          onSubmit={async (values) => {
            await updateMutation.mutateAsync(values);
          }}
          submitLabel={updateMutation.isPending ? "Saving..." : "Save changes"}
          isSubmitting={updateMutation.isPending || deactivateMutation.isPending}
          onDeactivate={async () => {
            await deactivateMutation.mutateAsync();
          }}
          showStatusToggle
        />
      )}
    </div>
  );
}
