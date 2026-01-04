import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { CartNavButton } from "@/components/cart-nav-button"
import { LandingBackground } from "@/components/landing/landing-background"
import { MarketplaceIntroStackSection } from "@/components/landing/marketplace-intro-stack-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <section className="relative overflow-hidden">
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-900 backdrop-blur dark:bg-white/10 dark:text-white">
              Kada Mandiya
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
            <a className="hover:text-foreground" href="#features">
              Products
            </a>
            <Link className="hover:text-foreground" href="/orders">
              Orders
            </Link>
            <a className="hover:text-foreground" href="#features">
              Categories
            </a>
            <a className="hover:text-foreground" href="#features">
              Offers
            </a>
            <a className="hover:text-foreground" href="#features">
              Support
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartNavButton className="border-border/50 bg-background/40 text-foreground hover:bg-background/55 hover:text-foreground" />
            <Button
              asChild
              size="sm"
              className="border-border/50 bg-background/40 text-foreground hover:bg-background/55"
            >
              <Link href="/auth?mode=register">Sign up</Link>
            </Button>
            <UserNav />
          </div>
        </header>

        <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="space-y-6">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <a
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-full bg-background/40 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-background/55"
              >
                <Badge className="border-border/40 bg-background/45 text-foreground hover:bg-background/45">
                  New
                </Badge>
                Sri Lankan online shopping—made simple
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-700 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Everything you need,
              <br />
              to shop with joy.
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 max-w-xl text-lg text-muted-foreground">
              Fresh market finds, everyday essentials, and trusted sellers—all in one place with a
              smooth checkout experience.
            </p>
            <p className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 text-base text-muted-foreground">
              <span className="font-semibold text-foreground">කඩ මණ්ඩිය</span> — ශ්‍රී ලංකාවේ ඔබගේ නවීන ඔන්ලයින් වෙළඳපොළ.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                <Link href="/become-vendor" className="inline-flex items-center gap-2">
                  Start to sell <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border/50 bg-background/35 text-foreground hover:bg-background/55"
              >
                <Link href="/auth">Login</Link>
              </Button>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] animate-in fade-in slide-in-from-right-8 duration-700 lg:max-w-[460px]">
              <div className="absolute -left-10 -top-10 h-24 w-24 rounded-3xl bg-white/35 blur-2xl animate-float" />
              <div className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-black/10 blur-2xl animate-float" />

              <div className="rounded-[2rem] border border-white/40 bg-white/20 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur">
                <div className="overflow-hidden rounded-[1.6rem] bg-white">
                  <Image
                    src="/hero.png"
                    alt="Kada Mandiya online shopping"
                    width={900}
                    height={1300}
                    priority
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </section>

      <MarketplaceIntroStackSection />
      <FeaturesSection />

      {false && (
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Curated for Sri Lanka",
              desc: "Local favorites, seasonal picks, and everyday essentials—easy to discover.",
            },
            {
              title: "Fast, friendly checkout",
              desc: "Clean flows that feel effortless on mobile and desktop.",
            },
            {
              title: "Built for trust",
              desc: "Clear order status updates and a smoother support journey.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <p className="text-base font-semibold">{f.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      )}
    </div>
  )
}
