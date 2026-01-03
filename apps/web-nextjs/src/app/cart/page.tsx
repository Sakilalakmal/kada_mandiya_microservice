"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { cartTotalQty, useCartQuery, useClearCartMutation, useRemoveCartItemMutation, useUpdateCartQtyMutation } from "@/features/cart/queries";
import { CartItemRow } from "@/features/cart/components/cart-item-row";
import { useCreateOrderMutation } from "@/features/orders/queries";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toastApiError } from "@/components/ui/feedback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              {idx < 2 ? <Separator /> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { token } = useAuth();
  const cartQuery = useCartQuery();
  const updateQty = useUpdateCartQtyMutation();
  const removeItem = useRemoveCartItemMutation();
  const clearCart = useClearCartMutation();
  const createOrder = useCreateOrderMutation();

  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [checkoutForm, setCheckoutForm] = React.useState({ deliveryAddress: "", mobile: "" });

  const cart = cartQuery.data;
  const totalQty = React.useMemo(() => cartTotalQty(cart), [cart]);

  const didToastRef = React.useRef(false);
  React.useEffect(() => {
    if (cartQuery.isError && !didToastRef.current) {
      didToastRef.current = true;
      toastApiError(cartQuery.error, "Failed to load cart");
    }
    if (!cartQuery.isError) didToastRef.current = false;
  }, [cartQuery.error, cartQuery.isError]);

  const canPlaceOrder = checkoutForm.deliveryAddress.trim().length >= 5 && !createOrder.isPending;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">My cart</p>
              <p className="text-sm text-muted-foreground">
                {totalQty > 0 ? `${totalQty} item${totalQty === 1 ? "" : "s"}` : "Your shopping cart"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/products" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Products
              </Link>
            </Button>
          </div>
        </header>

        {!token ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Please log in to view and manage your cart.</p>
              <Button asChild className="active:scale-95">
                <Link href="/auth">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        ) : cartQuery.isLoading ? (
          <CartSkeleton />
        ) : cartQuery.isError ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Could not load cart</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <p>We couldn&apos;t reach the cart service. Please try again.</p>
              <Button variant="outline" onClick={() => cartQuery.refetch()} className="active:scale-95">
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : !cart || cart.items.length === 0 ? (
          <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Browse products and add items to your cart.</p>
              <Button asChild className="active:scale-95">
                <Link href="/products">Explore products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {cart.items.map((item, idx) => {
                  const isUpdatingQty = updateQty.isPending && updateQty.variables?.itemId === item.itemId;
                  const isRemoving = removeItem.isPending && removeItem.variables === item.itemId;

                  return (
                    <div key={item.itemId} className="space-y-5">
                      <CartItemRow
                        item={item}
                        isUpdatingQty={isUpdatingQty}
                        isRemoving={isRemoving}
                        onDecrease={() => updateQty.mutate({ itemId: item.itemId, qty: Math.max(1, item.qty - 1) })}
                        onIncrease={() => updateQty.mutate({ itemId: item.itemId, qty: item.qty + 1 })}
                        onRemove={() => removeItem.mutate(item.itemId)}
                      />
                      {idx < cart.items.length - 1 ? <Separator /> : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatMoney(cart.subtotal)}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full active:scale-95"
                        disabled={clearCart.isPending}
                      >
                        Clear cart
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes all items from your cart. You can always add them back later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => clearCart.mutate()}>
                          Clear cart
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full active:scale-95">Place order</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Place your order</DialogTitle>
                        <DialogDescription>
                          Minimal details. We&apos;ll use COD and clear your cart after checkout.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress">Delivery address</Label>
                          <Textarea
                            id="deliveryAddress"
                            placeholder="House no, street, city…"
                            value={checkoutForm.deliveryAddress}
                            onChange={(e) =>
                              setCheckoutForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))
                            }
                            className="min-h-28 resize-none"
                          />
                          <p className="text-xs text-muted-foreground">Minimum 5 characters.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mobile">Mobile (optional)</Label>
                          <Input
                            id="mobile"
                            placeholder="07x xxx xxxx"
                            value={checkoutForm.mobile}
                            onChange={(e) =>
                              setCheckoutForm((prev) => ({ ...prev, mobile: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setCheckoutOpen(false)}
                          disabled={createOrder.isPending}
                        >
                          Not now
                        </Button>
                        <Button
                          disabled={!canPlaceOrder}
                          onClick={() => {
                            const deliveryAddress = checkoutForm.deliveryAddress.trim();
                            const mobile = checkoutForm.mobile.trim();

                            if (deliveryAddress.length < 5) {
                              toast.error("Delivery address is too short.");
                              return;
                            }

                            createOrder.mutate(
                              {
                                deliveryAddress,
                                mobile: mobile.length ? mobile : undefined,
                                paymentMethod: "COD",
                              },
                              {
                                onSuccess: (data) => {
                                  toast.success("Order created");
                                  setCheckoutOpen(false);
                                  setCheckoutForm({ deliveryAddress: "", mobile: "" });
                                  router.push(`/orders/${data.orderId}`);
                                  router.refresh();
                                },
                              }
                            );
                          }}
                        >
                          {createOrder.isPending ? "Placing…" : "Confirm order"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

