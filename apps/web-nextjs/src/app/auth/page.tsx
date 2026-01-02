"use client";

import type React from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
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
  const initialMode = useMemo<Mode>(() => {
    return params.get("mode") === "register" ? "register" : "login";
  }, [params]);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => setMode(initialMode), [initialMode]);

  const handleChange =
    (key: "name" | "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") localStorage.removeItem("accessToken");

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
        localStorage.setItem("accessToken", String(token));
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
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      if (mode === "login") localStorage.removeItem("accessToken");
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Kada Mandiya</p>
              <p className="text-sm text-muted-foreground">Account portal</p>
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
          <section className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight">
              {mode === "register" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              Clean, fast sign-in for Kada Mandiya. Your token stays in the
              browser for testing.
            </p>
            <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                What you can do next
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Register with name, email, password</li>
                <li>Login and call protected routes via the API Gateway</li>
                <li>Fetch your profile from user-service (next step)</li>
              </ul>
            </div>
          </section>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">
                {mode === "register" ? "Register" : "Login"}
              </CardTitle>
              <CardDescription>
                {mode === "register"
                  ? "Create your account to start exploring."
                  : "Enter your email and password to continue."}
              </CardDescription>
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList className="w-full">
                  <TabsTrigger value="login" className="flex-1 gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex-1 gap-2">
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
                    placeholder="••••••••"
                    required
                    value={form.password}
                    onChange={handleChange("password")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "register" ? "Create account" : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
