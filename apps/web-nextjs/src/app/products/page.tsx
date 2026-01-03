"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { fetchProducts, productKeys, type ProductListItem } from "@/lib/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_OPTIONS = [
  { label: "All categories", value: "all" },
  { label: "Groceries", value: "groceries" },
  { label: "Home & Living", value: "home" },
  { label: "Fashion", value: "fashion" },
  { label: "Electronics", value: "electronics" },
  { label: "Beauty", value: "beauty" },
];

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

function ProductCard({ product, index }: { product: ProductListItem; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, delay: index * 0.02 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      className="h-full"
    >
      <Link href={`/products/${product.id}`} className="block h-full">
        <Card className="group h-full border bg-card shadow-sm transition hover:shadow-md">
          <div className="relative overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {product.thumbnailImageUrl ? (
                <Image
                  src={product.thumbnailImageUrl}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  unoptimized
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-background text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="absolute right-3 top-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {product.category ?? "General"}
              </Badge>
            </div>
          </div>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-tight text-foreground line-clamp-2">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description ?? "No description provided."}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{formatPrice(product.price, product.currency)}</span>
              <span className="text-xs text-muted-foreground">
                {product.stockQty > 0 ? `${product.stockQty} in stock` : "Out of stock"}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="border bg-card">
          <Skeleton className="aspect-[4/3] w-full" />
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const debouncedSearch = useDebouncedValue(search, 400);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: productKeys.list({
      page,
      search: debouncedSearch || undefined,
      category: category === "all" ? undefined : category,
    }),
    queryFn: () =>
      fetchProducts({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        category: category === "all" ? undefined : category,
      }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const products = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Browse</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Products</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            {isFetching ? "Refreshing..." : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products"
              className="pl-9"
            />
          </div>

          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value || "all"} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {isError ? (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Could not load products</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Something went wrong while contacting the catalog service.
            </p>
            <Button variant="outline" onClick={() => refetch()} className="active:scale-95">
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <ProductGridSkeleton />
      ) : (
        <motion.div
          key={`${page}-${debouncedSearch}-${category}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {products.length === 0 ? (
            <Card className="border bg-card">
              <CardContent className="flex flex-col gap-2 px-6 py-8 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No products found</p>
                <p>Try adjusting your search or switching the category filter.</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            </AnimatePresence>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <MotionButton
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                whileTap={{ scale: 0.96 }}
                className={cn("active:scale-95", page <= 1 && "cursor-not-allowed")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </MotionButton>
              <MotionButton
                variant="default"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                whileTap={{ scale: 0.96 }}
                className={cn("active:scale-95", page >= totalPages && "cursor-not-allowed")}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </MotionButton>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
