"use client";

import Image from "next/image";
import * as React from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem } from "@/api/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export const CartItemRow = React.memo(function CartItemRow({
  item,
  isUpdatingQty,
  isRemoving,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: CartItem;
  isUpdatingQty: boolean;
  isRemoving: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  const busy = isUpdatingQty || isRemoving;
  const disableDecrease = busy || item.qty <= 1;

  return (
    <div className={cn("flex gap-4", busy && "opacity-80")}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unit: <span className="font-medium text-foreground/80">{formatMoney(item.unitPrice)}</span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={busy}
            className="text-muted-foreground hover:text-foreground active:scale-95"
            aria-label="Remove item"
          >
            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onDecrease}
              disabled={disableDecrease}
              className="h-9 w-9 active:scale-95"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="min-w-10 text-center text-sm font-medium tabular-nums">
              {isUpdatingQty ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : item.qty}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onIncrease}
              disabled={busy}
              className="h-9 w-9 active:scale-95"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm font-semibold tabular-nums">{formatMoney(item.lineTotal)}</div>
        </div>
      </div>
    </div>
  );
});

