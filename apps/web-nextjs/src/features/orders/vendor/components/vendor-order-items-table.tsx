"use client";

import Image from "next/image";

import type { VendorOrderDetailItem } from "@/api/orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function VendorOrderItemsTable({ items, className }: { items: VendorOrderDetailItem[]; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-background", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[72px]">Item</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit</TableHead>
            <TableHead className="text-right">Line total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={`${item.productId}-${idx}`}>
              <TableCell>
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="48px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell className="text-right tabular-nums">{item.qty}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(item.unitPrice)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatMoney(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

