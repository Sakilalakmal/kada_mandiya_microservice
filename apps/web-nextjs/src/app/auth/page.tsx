"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, LogIn, ShieldCheck, Store, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { buildNextParam } from "@/lib/auth-client";

type Mode = "login" | "register";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background text-foreground">
          Loading...
        </div>
      }
    >
      <AuthShell />
    </Suspense>
  );
}

function AuthShell() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, setAuthToken } = useAuth();
  const modeParam = params.get("mode");
  const rawNextParam = params.get("next");

  const initialMode: Mode = modeParam === "register" ? "register" : "login";
  const nextPath = buildNextParam(rawNextParam);
  const redirectTarget = nextPath.startsWith("/auth") ? "/" : nextPath;
  const showContinueHint = typeof rawNextParam === "string" && rawNextParam.trim().length > 0;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => setMode(initialMode), [initialMode]);

  useEffect(() => {
    if (!token) return;
    if (!showContinueHint) return;
    router.replace(redirectTarget || "/");
  }, [redirectTarget, router, showContinueHint, token]);

  const handleChange =
    (key: "name" | "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") setAuthToken(null);

    const toastId = toast.loading(
      mode === "register" ? "Creating account..." : "Signing in..."
    );
    try {
      const payload =
        mode === "register"
          ? {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            }
          : { email: form.email.trim(), password: form.password };

      const res = await fetch(`/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Request failed");

      if (mode === "login") {
        const token = data?.accessToken;
        if (!token) throw new Error("Login failed: missing access token.");
        setAuthToken(String(token));
      }

      toast.success(
        mode === "register"
          ? "Account created. Please log in."
          : "Welcome back.",
        {
          id: toastId,
        }
      );

      if (mode === "register") setMode("login");
      if (mode === "login") {
        const liveNext =
          (typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("next")
            : null) ?? rawNextParam;
        const liveTarget = buildNextParam(liveNext);
        router.replace(liveTarget.startsWith("/auth") ? "/" : liveTarget);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      if (mode === "login") setAuthToken(null);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Kada Mandiya (කඩ මණ්ඩිය)</p>
              <p className="text-sm text-muted-foreground">
                Secure local marketplace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 lg:grid-cols-2">
          <section className="animate-in space-y-6 fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Account
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">
                {mode === "register" ? "Create your account" : "Sign in"}
              </h1>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Kada Mandiya (කඩ මණ්ඩිය) is a secure local marketplace built
                for trust and simplicity—helping customers discover vendors, and
                helping vendors manage orders with confidence.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">Vendors first</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a store, publish products, and manage orders in one
                  place.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">Secure by default</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sessions and actions are protected so your account stays safe.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">Designed for clarity</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimal UI and consistent structure keep work focused.
                </p>
              </div>
            </div>
          </section>

          <Card className="animate-in border bg-card shadow-sm fade-in slide-in-from-bottom-3 duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">
                {mode === "register" ? "Register" : "Login"}
              </CardTitle>
              <CardDescription>
                {mode === "register"
                  ? "Create your account to start exploring."
                  : "Enter your email and password to continue."}
              </CardDescription>
              {mode === "login" && showContinueHint ? (
                <p className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Please login to continue.
                </p>
              ) : null}
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                  <TabsTrigger
                    value="login"
                    className="w-full justify-start gap-2 sm:justify-center"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="w-full justify-start gap-2 sm:justify-center"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login" />
                <TabsContent value="register" />
              </Tabs>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Alex Doe"
                      required
                      value={form.name}
                      onChange={handleChange("name")}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    required
                    value={form.password}
                    onChange={handleChange("password")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "register" ? "Create account" : "Login"}
                </Button>
                <div className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                  <p className="inline-flex items-center gap-2">
                    <Store className="h-3.5 w-3.5" />
                    Vendor access unlocks the dashboard.
                  </p>
                  <Link
                    href="/"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Browse marketplace
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
