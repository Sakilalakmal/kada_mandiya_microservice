"use client";

import * as React from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Check } from "lucide-react";

import type { NotificationListItem } from "@/api/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function ensureIsoUtc(value: string): string {
  const s = String(value ?? "").trim();
  if (!s) return s;
  // If the timestamp lacks a timezone (e.g. SQL `CONVERT(..., 127)`), treat it as UTC.
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return s;
  return `${s}Z`;
}

function formatRelativeTime(value: string) {
  try {
    const date = parseISO(ensureIsoUtc(value));
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch {
    return value;
  }
}

export type NotificationItemRowProps = {
  notification: NotificationListItem;
  onOpenLink?: (href: string) => void;
  onMarkRead?: (id: string) => void;
  className?: string;
};

export const NotificationItemRow = React.memo(function NotificationItemRow({
  notification,
  onOpenLink,
  onMarkRead,
  className,
}: NotificationItemRowProps) {
  const isUnread = !notification.isRead;
  const timeLabel = React.useMemo(() => formatRelativeTime(notification.createdAt), [notification.createdAt]);

  const handleMarkRead = React.useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (isUnread) onMarkRead?.(notification.id);
    },
    [isUnread, notification.id, onMarkRead]
  );

  const handleOpen = React.useCallback(() => {
    if (notification.link) {
      if (isUnread) onMarkRead?.(notification.id);
      onOpenLink?.(notification.link);
    }
  }, [isUnread, notification.id, notification.link, onMarkRead, onOpenLink]);

  return (
    <div
      role={notification.link ? "button" : undefined}
      tabIndex={notification.link ? 0 : undefined}
      onClick={notification.link ? handleOpen : undefined}
      onKeyDown={
        notification.link
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleOpen();
            }
          : undefined
      }
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-colors",
        notification.link ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : "",
        isUnread ? "bg-muted/20" : "",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          isUnread ? "bg-foreground" : "bg-muted-foreground/30"
        )}
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <p className={cn("truncate text-sm font-semibold", isUnread ? "text-foreground" : "text-foreground/90")}>
            {notification.title}
          </p>
          <p className="shrink-0 text-[11px] text-muted-foreground">{timeLabel}</p>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
      </div>

      {isUnread ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleMarkRead}
          className="h-8 w-8 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Mark as read"
        >
          <Check className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
});
