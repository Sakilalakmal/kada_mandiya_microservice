"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import { createProduct, productKeys } from "@/lib/products";
import { useAuth } from "@/hooks/use-auth";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";
import { vendorAccessToast, toastApiError } from "@/components/ui/feedback";

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuthToken } = useAuth();

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

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Add product</h1>
        <p className="text-sm text-muted-foreground">Create a new listing with price, inventory, and images.</p>
      </motion.div>

      <ProductForm
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        submitLabel={createMutation.isPending ? "Saving..." : "Create product"}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
