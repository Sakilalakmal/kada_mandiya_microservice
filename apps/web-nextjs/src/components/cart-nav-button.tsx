"use client";

import Link from "next/link";
import * as React from "react";
import { ShoppingCart } from "lucide-react";

import { cartTotalQty, useCartQuery } from "@/features/cart/queries";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CartNavButton({ className }: { className?: string }) {
  const { data: cart, isFetching } = useCartQuery();
  const totalQty = React.useMemo(() => cartTotalQty(cart), [cart]);

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-busy={isFetching}
      className={cn("relative transition-transform active:scale-95", className)}
    >
      <Link href="/cart" aria-label="Cart">
        <ShoppingCart className="h-5 w-5" />
        {totalQty > 0 ? (
          <Badge className="pointer-events-none absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[11px] leading-none">
            {totalQty > 99 ? "99+" : totalQty}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}

