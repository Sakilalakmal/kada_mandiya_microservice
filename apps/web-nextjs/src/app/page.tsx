import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff4d8d_0%,#ffb34d_18%,#a78bfa_48%,#60a5fa_70%,#22d3ee_100%)] opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_40%),radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_55%_70%,rgba(0,0,0,0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.20)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_72%)]" />

      <div className="absolute -top-20 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.0),rgba(255,255,255,0.6),rgba(255,255,255,0.0))] blur-2xl opacity-60 animate-aurora" />

      <div className="absolute -bottom-28 left-0 right-0 h-64 bg-background [clip-path:polygon(0_55%,100%_25%,100%_100%,0_100%)]" />
    </div>
  )
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <HeroBackdrop />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/30 px-3 py-1 text-xs font-semibold tracking-wide text-slate-900 backdrop-blur">
              Kada Mandiya
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-white/85 md:flex">
            <a className="hover:text-white" href="#features">
              Products
            </a>
            <a className="hover:text-white" href="#features">
              Categories
            </a>
            <a className="hover:text-white" href="#features">
              Offers
            </a>
            <a className="hover:text-white" href="#features">
              Support
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/auth?mode=register">Sign up</Link>
            </Button>
            <UserNav />
          </div>
        </header>

        <main className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-10 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="space-y-6">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <a
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/25"
              >
                <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                  New
                </Badge>
                Sri Lankan online shopping—made simple
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-700 text-5xl font-semibold leading-[1.05] tracking-tight text-[#0b1b46] sm:text-6xl">
              Everything you need,
              <br />
              to shop with joy.
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 max-w-xl text-lg text-slate-900/70">
              Fresh market finds, everyday essentials, and trusted sellers—all in one place with a
              smooth checkout experience.
            </p>
            <p className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 text-base text-slate-900/70">
              <span className="font-semibold text-slate-900">කඩ මණ්ඩිය</span> — ශ්‍රී ලංකාවේ ඔබගේ නවීන ඔන්ලයින් වෙළඳපොළ.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                <Link href="/become-vendor" className="inline-flex items-center gap-2">
                  Start to sell <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/35 bg-white/20 text-slate-900 hover:bg-white/30">
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
    </div>
  )
}
