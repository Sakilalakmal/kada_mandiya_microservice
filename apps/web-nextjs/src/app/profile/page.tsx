import Link from "next/link";
import { ArrowLeft, UserCircle2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileForm } from "@/components/profile/profile-form";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Your profile</p>
              <p className="text-sm text-muted-foreground">Account details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton size="sm" />
            <Button asChild variant="ghost">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        <main className="grid flex-1 items-start">
          <ProfileForm />
        </main>
      </div>
    </div>
  );
}

