import Link from "next/link"
import {
  BadgePercent,
  Blocks,
  ChartNoAxesCombined,
  CreditCard,
  PackageSearch,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react"

import { TiltedCard } from "@/components/react-bits/tilted-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const quickFeatures = [
  { icon: ShieldCheck, label: "Trusted sellers" },
  { icon: CreditCard, label: "Secure payments" },
  { icon: Store, label: "Storefronts" },
  { icon: Blocks, label: "Categories" },
  { icon: PackageSearch, label: "Order tracking" },
  { icon: Truck, label: "Fast delivery" },
  { icon: BadgePercent, label: "Offers & deals" },
  { icon: ChartNoAxesCombined, label: "Insights" },
] as const

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-slate-950 px-6 py-14 text-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-80 w-[56rem] -translate-x-1/2 rounded-full bg-purple-600/55 blur-3xl opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.16),transparent_42%),radial-gradient(circle_at_72%_28%,rgba(99,102,241,0.18),transparent_50%),radial-gradient(circle_at_55%_80%,rgba(0,0,0,0.55),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_55%,transparent_78%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/70" />
        </div>

        <div className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-pretty text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Accelerate your shopping
              <span className="text-white/70"> with a first-class marketplace stack</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
              Kada Mandiya helps customers discover local favorites while giving vendors the tools
              to fulfill orders with speed, clarity, and trust.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-4 gap-4 sm:grid-cols-8">
            {quickFeatures.map(({ icon: Icon, label }) => (
              <div key={label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
                  <Icon className="h-5 w-5 text-white/85" />
                </div>
                <p className="mt-2 text-[11px] font-medium leading-snug text-white/70">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <TiltedCard containerClassName="h-full overflow-hidden rounded-[2rem]" className="h-full">
              <Card className="relative h-full rounded-[2rem] border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(168,85,247,0.25),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(34,211,238,0.18),transparent_55%)]" />
                <CardContent className="relative flex h-full flex-col p-8">
                  <Badge className="w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
                    Vendor onboarding
                  </Badge>
                  <h3 className="mt-4 text-balance text-2xl font-semibold tracking-tight">
                    Launch your storefront in minutes
                  </h3>
                  <p className="mt-3 max-w-md text-sm text-white/70">
                    Create a profile, upload products, manage stock, and start accepting orders
                    without the busywork.
                  </p>

                  <Button
                    asChild
                    variant="link"
                    className="mt-4 w-fit px-0 text-white/80 hover:text-white"
                  >
                    <Link href="/become-vendor">
                      Learn more <span aria-hidden className="ml-1">{">"}</span>
                    </Link>
                  </Button>

                  <div className="mt-10 flex flex-1 items-end justify-center">
                    <div className="relative h-44 w-full max-w-sm">
                      <div className="absolute bottom-0 left-6 h-32 w-44 -rotate-[14deg] rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/30 to-cyan-400/10 shadow-[0_30px_70px_rgba(0,0,0,0.45)]" />
                      <div className="absolute bottom-2 right-4 h-28 w-48 rotate-[10deg] rounded-3xl border border-white/10 bg-gradient-to-br from-white/12 to-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.45)]" />
                      <div className="absolute bottom-4 left-16 h-36 w-56 rounded-3xl border border-white/15 bg-slate-950/40 shadow-[0_30px_70px_rgba(0,0,0,0.45)] backdrop-blur">
                        <div className="p-5">
                          <p className="text-xs font-medium text-white/70">Today</p>
                          <p className="mt-1 text-sm font-semibold">15 new orders</p>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((n) => (
                              <div
                                key={n}
                                className="h-10 rounded-2xl border border-white/10 bg-white/5"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltedCard>

            <TiltedCard containerClassName="h-full overflow-hidden rounded-[2rem]" className="h-full">
              <Card className="relative h-full rounded-[2rem] border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,211,238,0.20),transparent_55%),radial-gradient(circle_at_40%_65%,rgba(168,85,247,0.20),transparent_55%)]" />
                <CardContent className="relative flex h-full flex-col p-8">
                  <Badge className="w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
                    Checkout & delivery
                  </Badge>
                  <h3 className="mt-4 text-balance text-2xl font-semibold tracking-tight">
                    Reduce drop-offs with a smoother checkout
                  </h3>
                  <p className="mt-3 max-w-md text-sm text-white/70">
                    Card payments, clear fees, and delivery updates—built to feel effortless on
                    mobile and desktop.
                  </p>

                  <Button
                    asChild
                    variant="link"
                    className="mt-4 w-fit px-0 text-white/80 hover:text-white"
                  >
                    <Link href="/orders">
                      Learn more <span aria-hidden className="ml-1">{">"}</span>
                    </Link>
                  </Button>

                  <div className="mt-10 flex flex-1 items-end justify-center">
                    <div className="relative h-44 w-full max-w-sm">
                      <div className="absolute left-1/2 top-2 h-28 w-44 -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/45 backdrop-blur" />
                      <div className="absolute left-1/2 top-7 h-28 w-44 -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/35 backdrop-blur" />
                      <div className="absolute left-1/2 top-12 h-28 w-44 -translate-x-1/2 rounded-3xl border border-white/15 bg-slate-950/30 shadow-[0_30px_70px_rgba(0,0,0,0.45)] backdrop-blur">
                        <div className="flex items-center justify-between p-5">
                          <div className="grid gap-1">
                            <p className="text-xs text-white/65">Delivery ETA</p>
                            <p className="text-base font-semibold">25 min</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <Truck className="h-5 w-5 text-white/80" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute -right-1 bottom-1 grid gap-3">
                        {[CreditCard, ShieldCheck, BadgePercent].map((Icon, idx) => (
                          <div
                            key={idx}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                          >
                            <Icon className="h-5 w-5 text-white/75" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltedCard>

            <TiltedCard containerClassName="h-full overflow-hidden rounded-[2rem]" className="h-full">
              <Card className="relative h-full rounded-[2rem] border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_70%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.18),transparent_55%)]" />
                <CardContent className="relative flex h-full flex-col p-8">
                  <Badge className="w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
                    Order tracking
                  </Badge>
                  <h3 className="mt-4 text-balance text-2xl font-semibold tracking-tight">
                    Keep customers in the loop, automatically
                  </h3>
                  <p className="mt-3 max-w-md text-sm text-white/70">
                    Real-time updates, clean timelines, and fewer support tickets—so shoppers always
                    know what’s next.
                  </p>

                  <Button
                    asChild
                    variant="link"
                    className="mt-4 w-fit px-0 text-white/80 hover:text-white"
                  >
                    <Link href="/orders">
                      Learn more <span aria-hidden className="ml-1">{">"}</span>
                    </Link>
                  </Button>

                  <div className="mt-10 flex flex-1 items-end justify-center">
                    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/35 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.45)] backdrop-blur">
                      {[
                        { label: "Order placed", time: "10:12 AM", done: true },
                        { label: "Packed by vendor", time: "10:38 AM", done: true },
                        { label: "Out for delivery", time: "11:05 AM", done: false },
                      ].map((step, idx) => (
                        <div key={step.label} className="flex items-start gap-3">
                          <div className="relative mt-1">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full border",
                                step.done
                                  ? "border-emerald-300/40 bg-emerald-300/60"
                                  : "border-white/25 bg-white/10"
                              )}
                            />
                            {idx < 2 ? (
                              <div className="absolute left-1/2 top-3 h-10 w-px -translate-x-1/2 bg-white/10" />
                            ) : null}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="text-sm font-medium">{step.label}</p>
                            <p className="mt-1 text-xs text-white/60">{step.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltedCard>

            <TiltedCard containerClassName="h-full overflow-hidden rounded-[2rem]" className="h-full">
              <Card className="relative h-full rounded-[2rem] border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(34,211,238,0.14),transparent_55%)]" />
                <CardContent className="relative flex h-full flex-col p-8">
                  <Badge className="w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
                    Analytics
                  </Badge>
                  <h3 className="mt-4 text-balance text-2xl font-semibold tracking-tight">
                    See what’s working—then scale it
                  </h3>
                  <p className="mt-3 max-w-md text-sm text-white/70">
                    Track sales, repeat customers, and top categories to run smarter promos and keep
                    inventory moving.
                  </p>

                  <Button
                    asChild
                    variant="link"
                    className="mt-4 w-fit px-0 text-white/80 hover:text-white"
                  >
                    <Link href="/profile">
                      Learn more <span aria-hidden className="ml-1">{">"}</span>
                    </Link>
                  </Button>

                  <div className="mt-10 flex flex-1 items-end justify-center">
                    <div className="relative grid place-items-center">
                      <div className="h-44 w-44 rounded-full border border-white/10 bg-[conic-gradient(from_90deg,rgba(168,85,247,0.85)_0%,rgba(34,211,238,0.75)_32%,rgba(255,255,255,0.10)_32%,rgba(255,255,255,0.10)_100%)] shadow-[0_30px_70px_rgba(0,0,0,0.45)]" />
                      <div className="absolute inset-6 rounded-full border border-white/10 bg-slate-950/45 backdrop-blur" />
                      <div className="absolute grid place-items-center text-center">
                        <p className="text-xs text-white/60">Conversion</p>
                        <p className="mt-1 text-2xl font-semibold">3.8%</p>
                        <p className="mt-1 text-xs text-white/55">+0.6 this week</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TiltedCard>
          </div>
        </div>
      </div>
    </section>
  )
}
