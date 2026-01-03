"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import { createProduct, productKeys } from "@/lib/products";
import { useAuth } from "@/hooks/use-auth";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";
import { vendorAccessToast, toastApiError } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isVendor, setAuthToken } = useAuth();

  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        currency: values.currency || "LKR",
        stockQty: values.stockQty,
        images: values.images ?? [],
      };
      return createProduct(payload);
    },
    onSuccess: async () => {
      toast.success("Product created");
      await queryClient.invalidateQueries({ queryKey: productKeys.mine });
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
      toastApiError(err, "Could not create product");
    },
  });

  if (!isVendor) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              Vendor access required
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              You need a vendor account to add new products.
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

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <p className="text-sm text-muted-foreground">Vendor</p>
        <h1 className="text-3xl font-semibold text-foreground">Add product</h1>
        <p className="text-sm text-muted-foreground">
          Create a new listing with price, inventory, and images.
        </p>
      </motion.div>

      <ProductForm
        onSubmit={(values) => createMutation.mutateAsync(values)}
        submitLabel={createMutation.isPending ? "Saving..." : "Create product"}
        isSubmitting={createMutation.isPending}
      />
    </main>
  );
}
