import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Kada Mandiya</p>
              <p className="text-sm text-muted-foreground">Kada Mandiya kay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 items-center">
          <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
            <section className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Kada Mandiya
              </h1>
              <p className="max-w-xl text-muted-foreground">
                A clean test UI to verify register/login flows through the API Gateway.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/auth" className="inline-flex items-center gap-2">
                    Open auth portal <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/auth?mode=register">Create account</Link>
                </Button>
              </div>
            </section>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quick test</CardTitle>
                <CardDescription>
                  Use these endpoints after logging in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="font-medium text-foreground">POST</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5">/auth/register</code>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="font-medium text-foreground">POST</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5">/auth/login</code>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <span className="font-medium text-foreground">GET</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5">/users/me</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
