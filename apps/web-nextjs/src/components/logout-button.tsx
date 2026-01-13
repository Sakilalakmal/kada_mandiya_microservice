"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { logout, type LogoutRedirectTarget } from "@/lib/logout";
import { useAuth } from "@/hooks/use-auth";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type LogoutButtonProps = Omit<ButtonProps, "onClick" | "type"> & {
  redirectTo?: LogoutRedirectTarget;
};

export function LogoutButton({
  redirectTo = "/auth?mode=login",
  variant = "outline",
  size = "default",
  className,
  children,
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, setAuthToken } = useAuth();

  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  if (!token) return null;

  function handleConfirm() {
    if (isPending) return;
    setIsPending(true);

    toast.success("Logged out");
    setOpen(false);
    logout({ setAuthToken, queryClient, router, redirectTo });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "transition-transform active:scale-[0.98]",
            variant === "outline"
              ? "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "",
            className,
          )}
          {...props}
        >
          {children ?? (
            <>
              <LogOut className="h-4 w-4" />
              Log out
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be signed out and redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            {isPending ? "Logging out..." : "Log out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
