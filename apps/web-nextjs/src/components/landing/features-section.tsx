import Link from "next/link"
import { ArrowRight, Bot, ChartLine, Handshake, ShieldCheck, Truck, UserPlus } from "lucide-react"

import { MagicBento, MagicBentoCard } from "@/components/react-bits/magic-bento"
import { TiltedCard } from "@/components/react-bits/tilted-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const bentoItems = [
  {
    icon: UserPlus,
    badge: "Vendor onboarding",
    title: "Launch your storefront quickly",
    description:
      "Create your vendor profile, list products, and start fulfilling orders without busywork.",
    href: "/become-vendor",
  },
  {
    icon: Truck,
    badge: "Checkout & delivery",
    title: "Smooth checkout, clear delivery",
    description: "Simple ordering and clean status updates so shoppers always know what’s next.",
    href: "/orders",
  },
  {
    icon: ChartLine,
    badge: "Insights",
    title: "See what’s working—then scale it",
    description: "Track performance and spot trends to plan promos and keep inventory moving.",
    href: "/profile",
  },
  {
    icon: Bot,
    badge: "Automation",
    title: "Keep operations lightweight",
    description: "Reduce manual steps with event-driven flows that stay reliable as you grow.",
    href: "/vendor/dashboard",
  },
  {
    icon: Handshake,
    badge: "Collaboration",
    title: "Coordinate with confidence",
    description: "Shared visibility for vendors and operations so everyone stays aligned.",
    href: "/vendor/dashboard",
  },
  {
    icon: ShieldCheck,
    badge: "Security",
    title: "Trust as a default",
    description: "Clear identities and predictable workflows across services.",
    href: "/auth",
  },
] as const

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <div className="relative overflow-hidden rounded-[2.75rem] border border-border bg-card px-6 py-14 shadow-sm sm:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-8 h-[26rem] w-[54rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl opacity-60 dark:bg-blue-400/10 dark:opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(96,165,250,0.08),transparent_55%)]" />
        </div>

        <div className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-pretty text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Marketplace features{" "}
              <span className="text-muted-foreground">that feel fast, calm, and premium</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Tools for vendors, shoppers, and ops—built around clean flows and consistent
              event-driven services.
            </p>
          </div>

          <div className="mt-12">
            <MagicBento className="mx-auto max-w-5xl">
              {bentoItems.map(({ icon: Icon, badge, title, description, href }) => (
                <MagicBentoCard key={badge}>
                  <TiltedCard
                    containerClassName="h-full overflow-hidden rounded-3xl motion-reduce:[transform:none]"
                    className="h-full"
                    maxTilt={6}
                    scale={1.01}
                    glare
                  >
                    <div
                      className={cn(
                        "group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 text-card-foreground shadow-sm",
                        "transition-transform transition-shadow duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(15,23,42,0.14)] dark:hover:shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(59,130,246,0.10)]",
                        "motion-reduce:transition-none"
                      )}
                    >
                      <div aria-hidden className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 motion-reduce:transition-none">
                          <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_15%,rgba(37,99,235,0.14),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_15%,rgba(96,165,250,0.14),transparent_55%)]" />
                        </div>
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 motion-reduce:transition-none">
                          <div className="absolute -left-1/2 top-0 h-full w-[200%] -translate-x-1/4 bg-[linear-gradient(110deg,transparent_0%,rgba(37,99,235,0.08)_35%,transparent_70%)] dark:bg-[linear-gradient(110deg,transparent_0%,rgba(96,165,250,0.10)_35%,transparent_70%)] blur-sm [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] group-hover:translate-x-1/4 group-hover:duration-700 motion-reduce:transform-none" />
                        </div>
                      </div>

                      <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant="secondary"
                            className="border border-border bg-muted text-foreground/80 hover:bg-muted"
                          >
                            {badge}
                          </Badge>
                          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="mt-5 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                          {title}
                        </h3>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      </div>

                      <div className="relative mt-8">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 motion-reduce:transition-none"
                        >
                          Learn more <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </TiltedCard>
                </MagicBentoCard>
              ))}
            </MagicBento>
          </div>
        </div>
      </div>
    </section>
  )
}

