"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Package, ShieldAlert, Store } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { VendorNotificationBell } from "@/features/notifications/components/vendor-notification-bell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function VendorDashboardPage() {
  const { isVendor } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050507] via-[#0b0b12] to-[#120f24] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4b5fd]/10 text-[#c4b5fd]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#c4b5fd]">
                Vendor
              </p>
              <p className="text-lg font-semibold text-white">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VendorNotificationBell className="border border-[#c4b5fd]/40 text-[#c4b5fd] hover:bg-[#c4b5fd]/10" />
            <Button
              asChild
              variant="outline"
              className="border-[#c4b5fd]/40 text-[#c4b5fd] hover:bg-[#c4b5fd]/10"
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        {isVendor ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-[#c4b5fd]/30 bg-[#0f0c1a]/80 text-slate-100 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <Store className="h-5 w-5 text-[#c4b5fd]" />
                  Welcome, vendor
                </CardTitle>
                <CardDescription className="text-slate-300">
                  You now have access to vendor-only routes through the API gateway.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-200">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="font-medium text-[#c4b5fd]">Next: Add Products</p>
                  <p className="mt-1 text-slate-300">
                    Product management will live here. Build listings, pricing, and inventory next.
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="font-medium text-[#c4b5fd]">Keep your profile updated</p>
                  <p className="mt-1 text-slate-300">
                    Update your vendor details and branding anytime to keep buyers informed.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#c4b5fd]/30 bg-gradient-to-b from-[#18122d] to-[#0f0c1a] text-slate-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="h-5 w-5 text-[#c4b5fd]" />
                  Operations board
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Quick actions to help you get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Create your first product</p>
                    <p className="text-xs text-slate-300">Add images, price, and inventory.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#c4b5fd]" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Configure payout details</p>
                    <p className="text-xs text-slate-300">Connect your preferred payout channel.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#c4b5fd]" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Manage orders</p>
                    <p className="text-xs text-slate-300">Track fulfillment and customer updates.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#c4b5fd]" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-[#c4b5fd]/30 bg-[#0f0c1a]/80 text-slate-100 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <ShieldAlert className="h-5 w-5 text-[#c4b5fd]" />
                You are not a vendor yet
              </CardTitle>
              <CardDescription className="text-slate-300">
                Create a vendor profile to unlock the dashboard and start selling.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-200">
                Upgrade your account to manage listings, track orders, and grow on Kada Mandiya.
              </p>
              <Separator className="border-white/10" />
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[#c4b5fd] text-slate-900 hover:bg-[#b7a4ff]"
                >
                  <Link href="/become-vendor">Become a vendor</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Link href="/auth?mode=login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
