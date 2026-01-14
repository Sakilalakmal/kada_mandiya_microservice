"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { fetchProductDetail, productKeys } from "@/lib/products";
import { buildAuthRedirectUrl, getAccessToken, getCurrentPathWithQuery } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useAddToCartMutation } from "@/features/cart/queries";
import { useAuth } from "@/hooks/use-auth";
import type { AddToCartPayload } from "@/api/cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductReviewsSection } from "@/features/reviews/components/product-reviews-section";

const MotionButton = motion(Button);

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

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const productId = React.useMemo(() => {
    if (!params?.id) return "";
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProductDetail(productId),
    enabled: Boolean(productId),
  });

  const addToCart = useAddToCartMutation();
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const addToCartTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAddToCart = React.useCallback(
    (payload: AddToCartPayload) => {
      if (addToCartTimeoutRef.current) {
        clearTimeout(addToCartTimeoutRef.current);
        addToCartTimeoutRef.current = null;
      }

      setIsAddingToCart(true);
      addToCartTimeoutRef.current = window.setTimeout(() => {
        addToCartTimeoutRef.current = null;
        setIsAddingToCart(false);
      }, 12000);

      addToCart.mutate(payload, {
        onSettled: () => {
          if (addToCartTimeoutRef.current) {
            clearTimeout(addToCartTimeoutRef.current);
            addToCartTimeoutRef.current = null;
          }
          setIsAddingToCart(false);
        },
      });
    },
    [addToCart]
  );

  React.useEffect(() => {
    return () => {
      if (addToCartTimeoutRef.current) {
        clearTimeout(addToCartTimeoutRef.current);
      }
    };
  }, []);

  const images = data?.images ?? [];
  const activeImage = images[activeIndex];

  React.useEffect(() => {
    if (!token) return;
    if (!data) return;

    const raw = window.sessionStorage.getItem("post_login_action");
    if (!raw) return;

    try {
      const action = JSON.parse(raw) as { type?: string; payload?: unknown };
      if (action?.type !== "add_to_cart") return;
      const payload = action.payload as AddToCartPayload | undefined;
      if (!payload) return;
      if (payload.productId !== data.id) return;

      window.sessionStorage.removeItem("post_login_action");
      startAddToCart(payload);
    } catch {
      window.sessionStorage.removeItem("post_login_action");
    }
  }, [data, startAddToCart, token]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [productId]);

  React.useEffect(() => {
    if (activeIndex > images.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, images.length]);

  if (!productId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-8">
            <p className="text-lg font-semibold text-foreground">Missing product</p>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t find the product you were looking for.
            </p>
            <Button asChild>
              <Link href="/products">Back to products</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!data) return;
    if (!getAccessToken()) {
      window.sessionStorage.setItem(
        "post_login_action",
        JSON.stringify({
          type: "add_to_cart",
          payload: {
            productId: data.id,
            title: data.name,
            unitPrice: data.price,
            imageUrl: data.images?.[0]?.imageUrl ?? undefined,
            vendorId: data.vendorUserId,
            qty: 1,
          },
        })
      );
      router.replace(buildAuthRedirectUrl(getCurrentPathWithQuery()));
      return;
    }
    startAddToCart({
      productId: data.id,
      title: data.name,
      unitPrice: data.price,
      imageUrl: data.images?.[0]?.imageUrl ?? undefined,
      vendorId: data.vendorUserId,
      qty: 1,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 pl-0 text-sm font-medium"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href="/products" className="text-sm text-muted-foreground transition hover:text-foreground">
          Products
        </Link>
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !data ? (
        <Card className="border bg-card">
          <CardContent className="space-y-3 px-6 py-8">
            <p className="text-lg font-semibold text-foreground">Product not found</p>
            <p className="text-sm text-muted-foreground">
              The product may have been removed or is temporarily unavailable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <Link href="/products">Back to products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid gap-10 lg:grid-cols-2"
          >
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border bg-card">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeImage?.id ?? "placeholder"}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="relative aspect-[4/3] overflow-hidden bg-muted"
                  >
                    {activeImage ? (
                      <Image
                        src={activeImage.imageUrl}
                        alt={data.name}
                        fill
                        sizes="(min-width: 1024px) 45vw, 100vw"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No images available
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        "overflow-hidden rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        idx === activeIndex ? "border-foreground" : "border-border hover:border-foreground/60"
                      )}
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={img.imageUrl}
                          alt={`Image ${idx + 1}`}
                          fill
                          sizes="96px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {data.category ? (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {data.category}
                  </Badge>
                ) : null}
                <Badge variant={data.stockQty > 0 ? "secondary" : "outline"}>
                  {data.stockQty > 0 ? "In stock" : "Out of stock"}
                </Badge>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{data.name}</h1>
                <p className="text-lg font-medium text-foreground">{formatPrice(data.price, data.currency)}</p>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.description ?? "No description provided."}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <MotionButton
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || data.stockQty <= 0}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto"
                >
                  {isAddingToCart ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  Add to cart
                </MotionButton>
              </div>

              <div className="rounded-xl border bg-card/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Stock</p>
                <p className="text-base text-foreground">{data.stockQty > 0 ? data.stockQty : 0}</p>
                <p className="text-xs text-muted-foreground">
                  Updated at {new Date(data.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="pt-10">
            <ProductReviewsSection productId={data.id} />
          </div>
        </>
      )}
    </main>
  );
}
