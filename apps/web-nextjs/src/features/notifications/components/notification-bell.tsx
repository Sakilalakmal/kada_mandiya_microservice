"use client";

import * as React from "react";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserUnreadCountQuery } from "@/features/notifications/queries";
import { NotificationsPopoverPanel } from "./notifications-popover-panel";

export function NotificationBell({ className }: { className?: string }) {
  const { token } = useAuth();
  const unreadQuery = useUserUnreadCountQuery();
  const [open, setOpen] = React.useState(false);

  const unreadCount = Math.max(0, Number(unreadQuery.data ?? 0));
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          aria-busy={unreadQuery.isFetching}
          disabled={!token}
          className={cn("relative transition-transform active:scale-95", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadQuery.isLoading ? (
            <Skeleton className="pointer-events-none absolute -right-1 -top-1 h-5 w-7 rounded-full" />
          ) : unreadCount > 0 ? (
            <Badge className="pointer-events-none absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[11px] leading-none">
              {badgeText}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="p-0">
        {open ? <NotificationsPopoverPanel scope="user" onClose={() => setOpen(false)} /> : null}
      </PopoverContent>
    </Popover>
  );
}
