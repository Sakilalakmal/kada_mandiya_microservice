"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, CreditCard, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { cartTotalQty, useCartQuery, useClearCartMutation, useRemoveCartItemMutation, useUpdateCartQtyMutation } from "@/features/cart/queries";
import { CartItemRow } from "@/features/cart/components/cart-item-row";
import { useCreateOrderMutation } from "@/features/orders/queries";
import { createCheckoutSession } from "@/api/payments";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toastApiError } from "@/components/ui/feedback";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

function errorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if (!("status" in err)) return undefined;
  const status = (err as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}

async function createCheckoutSessionWithRetry(orderId: string) {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createCheckoutSession(orderId);
    } catch (err) {
      const status = errorStatus(err);
      const retryable = status === 404;
      if (!retryable || attempt >= maxAttempts) throw err;
      const delayMs = 250 * attempt;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return await createCheckoutSession(orderId);
}

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
  const [checkoutForm, setCheckoutForm] = React.useState({
    deliveryAddress: "",
    mobile: "",
    paymentMethod: "COD" as "COD" | "ONLINE",
  });

  const cart = cartQuery.data;
  const totalQty = React.useMemo(() => cartTotalQty(cart), [cart]);
  const hasOutOfStockItems = React.useMemo(() => {
    if (!cart?.items?.length) return false;
    return cart.items.some((item) => typeof item.stockQty === "number" && item.stockQty <= 0);
  }, [cart]);

  const didToastRef = React.useRef(false);
  React.useEffect(() => {
    if (cartQuery.isError && !didToastRef.current) {
      didToastRef.current = true;
      toastApiError(cartQuery.error, "Failed to load cart");
    }
    if (!cartQuery.isError) didToastRef.current = false;
  }, [cartQuery.error, cartQuery.isError]);

  const canPlaceOrder =
    checkoutForm.deliveryAddress.trim().length >= 5 && !createOrder.isPending && !hasOutOfStockItems;

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
            <NotificationBell />
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

                  <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                    <SheetTrigger asChild>
                      <Button className="w-full active:scale-95" disabled={hasOutOfStockItems}>
                        Place order
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle>Place your order</SheetTitle>
                        <SheetDescription>Choose a payment method and enter delivery details.</SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {hasOutOfStockItems ? (
                          <Alert variant="destructive">
                            <AlertDescription>
                              Your cart has out-of-stock items. Remove them to continue checkout.
                            </AlertDescription>
                          </Alert>
                        ) : null}
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Payment method</div>
                          <RadioGroup
                            value={checkoutForm.paymentMethod}
                            onValueChange={(v) =>
                              setCheckoutForm((prev) => ({
                                ...prev,
                                paymentMethod: v === "ONLINE" ? "ONLINE" : "COD",
                              }))
                            }
                            className="grid gap-3"
                          >
                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 hover:bg-muted/20">
                              <RadioGroupItem value="COD" className="mt-1" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                  <Truck className="h-4 w-4" />
                                  Cash on Delivery (COD)
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Pay when the order arrives. Vendors can start processing immediately.
                                </p>
                              </div>
                            </label>

                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 hover:bg-muted/20">
                              <RadioGroupItem value="ONLINE" className="mt-1" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                  <CreditCard className="h-4 w-4" />
                                  Visa card (Online)
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Vendors won&apos;t see this order until payment is completed.
                                </p>
                              </div>
                            </label>
                          </RadioGroup>

                          {checkoutForm.paymentMethod === "ONLINE" ? (
                            <Alert variant="destructive">
                              <AlertDescription>
                                Payment is required to complete checkout. You&apos;ll be redirected to pay after the
                                order is created.
                              </AlertDescription>
                            </Alert>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress">Delivery address</Label>
                          <Textarea
                            id="deliveryAddress"
                            placeholder="House no, street, city..."
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

                      <SheetFooter className="mt-6 gap-2 sm:gap-0">
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

                            const paymentMethod = checkoutForm.paymentMethod;

                            createOrder.mutate(
                              {
                                deliveryAddress,
                                mobile: mobile.length ? mobile : undefined,
                                paymentMethod,
                              },
                              {
                                onSuccess: async (data) => {
                                  toast.success("Order created");
                                  setCheckoutOpen(false);
                                  setCheckoutForm({ deliveryAddress: "", mobile: "", paymentMethod: "COD" });

                                  if (paymentMethod === "ONLINE") {
                                    try {
                                      const { url } = await createCheckoutSessionWithRetry(data.orderId);
                                      window.location.href = url;
                                      return;
                                    } catch (err) {
                                      toastApiError(err, "Failed to start checkout");
                                      router.push(`/orders/${data.orderId}?pay=1`);
                                      router.refresh();
                                      return;
                                    }
                                  }

                                  router.push(`/orders/${data.orderId}`);
                                  router.refresh();
                                },
                              }
                            );
                          }}
                        >
                          {createOrder.isPending ? "Placing..." : "Confirm order"}
                        </Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
