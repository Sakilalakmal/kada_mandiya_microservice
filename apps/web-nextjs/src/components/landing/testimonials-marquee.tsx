import type { CSSProperties } from "react"
import { Quote } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Testimonial = {
  name: string
  role: string
  company: string
  quote: string
  avatarSrc?: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Nethmi Perera",
    role: "Home cook",
    company: "Colombo",
    quote:
      "Checkout is fast, and I always find the same pantry basics without hopping between stores. Feels genuinely polished.",
  },
  {
    name: "Akila Jayasinghe",
    role: "Small business owner",
    company: "Kandy",
    quote:
      "The seller flow is clean and the order updates are clear. Customers trust the process, and that makes a big difference.",
  },
  {
    name: "Ishara Fernando",
    role: "Busy parent",
    company: "Galle",
    quote:
      "I can do my weekly shopping on my phone in minutes. Everything feels organized, with the right amount of detail.",
  },
  {
    name: "Sahan Abeykoon",
    role: "Frequent shopper",
    company: "Negombo",
    quote:
      "Search and discovery are surprisingly good. I keep finding new vendors with consistent quality and fair pricing.",
  },
  {
    name: "Dinithi Silva",
    role: "Office admin",
    company: "Battaramulla",
    quote:
      "The UI is calm and premium. No clutter—just the info I need, and a checkout that doesn't fight me.",
  },
  {
    name: "Kavindu Rajapaksa",
    role: "Vendor",
    company: "Matara",
    quote:
      "Listing products is straightforward, and the dashboard makes it easy to stay on top of orders. Smooth experience overall.",
  },
  {
    name: "Tharushi Wickramasinghe",
    role: "Student",
    company: "Moratuwa",
    quote:
      "Great on mobile. I love that it doesn't feel heavy or slow, even when browsing a lot of categories.",
  },
  {
    name: "Rajitha Gunasekara",
    role: "Community organizer",
    company: "Kurunegala",
    quote:
      "The communication and order status flow is clear. It builds trust for group purchases and shared deliveries.",
  },
  {
    name: "Chamika Dissanayake",
    role: "Product lead",
    company: "Sri Lanka",
    quote:
      "Design details are thoughtful—spacing, typography, and the subtle interactions. It feels like a product that cares.",
  },
]

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function TestimonialsRow({
  testimonials,
  direction,
  duration = "30s",
  className,
}: {
  testimonials: Testimonial[]
  direction: "ltr" | "rtl"
  duration?: string
  className?: string
}) {
  const animationClass = direction === "ltr" ? "animate-marquee-reverse" : "animate-marquee"
  const style = { ["--duration" as string]: duration } as CSSProperties

  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        "[-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max items-stretch gap-4 py-3 will-change-transform",
          animationClass,
          "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
          "motion-reduce:animate-none motion-reduce:!w-full motion-reduce:flex-wrap motion-reduce:justify-center",
          "motion-reduce:[&_[data-duplicate='true']]:hidden"
        )}
        style={style}
      >
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={`${testimonial.name}-${index}`}
            testimonial={testimonial}
            dataDuplicate="false"
          />
        ))}
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={`${testimonial.name}-dup-${index}`}
            testimonial={testimonial}
            dataDuplicate="true"
          />
        ))}
      </div>
    </div>
  )
}

function TestimonialCard({
  testimonial,
  dataDuplicate,
}: {
  testimonial: Testimonial
  dataDuplicate: "true" | "false"
}) {
  return (
    <Card
      data-duplicate={dataDuplicate}
      tabIndex={0}
      className={cn(
        "w-[min(92vw,360px)] shrink-0 rounded-xl border-border/50 bg-card/80",
        "transition-transform transition-shadow duration-200",
        "hover:-translate-y-0.5 hover:!shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "!shadow-sm"
      )}
      aria-label={`Testimonial from ${testimonial.name}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background/40">
            <Quote className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <blockquote
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden"
            )}
          >
            “{testimonial.quote}”
          </blockquote>
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/60">
            {testimonial.avatarSrc ? (
              <AvatarImage src={testimonial.avatarSrc} alt={testimonial.name} />
            ) : null}
            <AvatarFallback className="text-xs font-semibold text-foreground">
              {initialsFromName(testimonial.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{testimonial.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {testimonial.role} · {testimonial.company}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export function TestimonialsMarquee() {
  const firstRow = TESTIMONIALS.slice(0, Math.ceil(TESTIMONIALS.length / 2))
  const secondRow = TESTIMONIALS.slice(Math.ceil(TESTIMONIALS.length / 2))

  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">
            Words from our customers
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Loved by shoppers and sellers.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            A premium marketplace experience—fast to browse, effortless to buy, and built for trust.
          </p>
        </div>

        <div className="mt-10 grid gap-6">
          <TestimonialsRow testimonials={firstRow} direction="ltr" duration="32s" />
          <TestimonialsRow testimonials={secondRow} direction="rtl" duration="28s" />
        </div>
      </div>
    </section>
  )
}
