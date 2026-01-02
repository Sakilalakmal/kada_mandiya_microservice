import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">My fav</p>
              <p className="text-sm text-muted-foreground">Coming soon</p>
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

        <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle>Favorites</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This page is a placeholder for now.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

