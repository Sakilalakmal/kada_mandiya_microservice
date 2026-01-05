"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Inbox, RefreshCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { NotificationItemRow } from "./notification-item-row";
import {
  useMarkAllUserReadMutation,
  useMarkAllVendorReadMutation,
  useMarkUserNotificationReadMutation,
  useMarkVendorNotificationReadMutation,
  useUserNotificationsQuery,
  useUserUnreadCountQuery,
  useVendorNotificationsQuery,
  useVendorUnreadCountQuery,
} from "../queries";

type Scope = "user" | "vendor";

export type NotificationsPopoverPanelProps = {
  scope: Scope;
  onClose?: () => void;
  className?: string;
};

function SkeletonRows() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border px-3 py-2">
          <div className="flex items-start gap-3">
            <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="m-3 border bg-background">
      <CardContent className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted/30">
          <Inbox className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold">No notifications yet</p>
        <p className="text-xs text-muted-foreground">
          You&apos;ll see updates here as orders and payments change.
        </p>
      </CardContent>
    </Card>
  );
}

export function NotificationsPopoverPanel({ scope, onClose, className }: NotificationsPopoverPanelProps) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const unreadOnly = tab === "unread";

  const selectTab = React.useCallback((next: "all" | "unread") => {
    setTab(next);
    setPage(1);
  }, []);

  const listQuery =
    scope === "user"
      ? useUserNotificationsQuery({ unreadOnly, page, pageSize })
      : useVendorNotificationsQuery({ unreadOnly, page, pageSize });

  const unreadCountQuery = scope === "user" ? useUserUnreadCountQuery() : useVendorUnreadCountQuery();

  const markReadMutation =
    scope === "user" ? useMarkUserNotificationReadMutation() : useMarkVendorNotificationReadMutation();

  const markAllMutation = scope === "user" ? useMarkAllUserReadMutation() : useMarkAllVendorReadMutation();

  const unreadCount = Math.max(0, Number(unreadCountQuery.data ?? 0));
  const data = listQuery.data;
  const notifications = data?.notifications ?? [];

  const canPrev = page > 1;
  const total = Math.max(0, Number(data?.total ?? 0));
  const canNext = page * pageSize < total;

  return (
    <div className={cn("w-[520px] max-w-[96vw] sm:w-[560px]", className)}>
      <div className="flex items-start justify-between gap-3 px-3 pb-3 pt-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unreadCountQuery.isFetching ? "Refreshing..." : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0 || markAllMutation.isPending}
              className="h-8 px-2 text-xs active:scale-95"
            >
              Mark all as read
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark all as read?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark all your notifications as read.
              </AlertDialogDescription>
            </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex justify-center px-3 pb-2">
        <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-6 text-sm font-medium",
              tab === "all" ? "bg-background text-foreground shadow" : "hover:bg-background/60"
            )}
            onClick={() => selectTab("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || listQuery.isLoading}
            className={cn(
              "h-8 px-6 text-sm font-medium",
              tab === "unread" ? "bg-background text-foreground shadow" : "hover:bg-background/60"
            )}
            onClick={() => selectTab("unread")}
            aria-label="Show all unread notifications"
          >
            All unread
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[360px]">
        {listQuery.isLoading ? (
          <SkeletonRows />
        ) : listQuery.isError ? (
          <Card className="m-3 border bg-background">
            <CardContent className="flex items-center justify-between gap-3 px-4 py-4">
              <p className="text-xs text-muted-foreground">Could not load notifications.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => listQuery.refetch()}
                className="h-8 gap-2 active:scale-95"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1 p-2">
            {notifications.map((n) => (
              <NotificationItemRow
                key={n.id}
                notification={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onOpenLink={(href) => {
                  onClose?.();
                  router.push(href);
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canPrev || listQuery.isLoading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="h-8 px-2 text-xs active:scale-95"
        >
          Prev
        </Button>
        <p className="text-xs text-muted-foreground">
          Page {page}
          {total > 0 ? ` · ${Math.min(total, page * pageSize)}/${total}` : ""}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canNext || listQuery.isLoading}
          onClick={() => setPage((p) => p + 1)}
          className="h-8 px-2 text-xs active:scale-95"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
