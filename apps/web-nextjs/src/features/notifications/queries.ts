"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { NotificationsListResponse } from "@/api/notifications";
import {
  getMyNotifications,
  getVendorNotifications,
  markAllNotificationsRead,
  markAllVendorNotificationsRead,
  markNotificationRead,
  markVendorNotificationRead,
} from "@/api/notifications";
import { toastApiError } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";

type ListParams = {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

type ResolvedListParams = Required<Pick<ListParams, "unreadOnly" | "page" | "pageSize">>;

function resolveListParams(params: ListParams | undefined): ResolvedListParams {
  return {
    unreadOnly: Boolean(params?.unreadOnly ?? false),
    page: params?.page ? Number(params.page) : 1,
    pageSize: params?.pageSize ? Number(params.pageSize) : 10,
  };
}

export const notificationsKeys = {
  user: {
    list: (params: ResolvedListParams) => ["notifications", "user", "list", params] as const,
    unreadCount: ["notifications", "user", "unreadCount"] as const,
  },
  vendor: {
    list: (params: ResolvedListParams) => ["notifications", "vendor", "list", params] as const,
    unreadCount: ["notifications", "vendor", "unreadCount"] as const,
  },
};

export function useUserNotificationsQuery(params: ListParams) {
  const { token } = useAuth();
  const resolved = resolveListParams(params);

  return useQuery<NotificationsListResponse>({
    queryKey: notificationsKeys.user.list(resolved),
    queryFn: () => getMyNotifications(resolved),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useUserUnreadCountQuery() {
  const { token } = useAuth();

  return useQuery<number>({
    queryKey: notificationsKeys.user.unreadCount,
    queryFn: async () => {
      const data = await getMyNotifications({ unreadOnly: true, page: 1, pageSize: 1 });
      return Number(data.unreadCount ?? 0);
    },
    enabled: Boolean(token),
    staleTime: 8_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
}

export function useVendorNotificationsQuery(params: ListParams) {
  const { token, isVendor } = useAuth();
  const resolved = resolveListParams(params);

  return useQuery<NotificationsListResponse>({
    queryKey: notificationsKeys.vendor.list(resolved),
    queryFn: () => getVendorNotifications(resolved),
    enabled: Boolean(token) && Boolean(isVendor),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useVendorUnreadCountQuery() {
  const { token, isVendor } = useAuth();

  return useQuery<number>({
    queryKey: notificationsKeys.vendor.unreadCount,
    queryFn: async () => {
      const data = await getVendorNotifications({ unreadOnly: true, page: 1, pageSize: 1 });
      return Number(data.unreadCount ?? 0);
    },
    enabled: Boolean(token) && Boolean(isVendor),
    staleTime: 8_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 12_000,
    refetchIntervalInBackground: true,
  });
}

function optimisticMarkReadInList(data: NotificationsListResponse, id: string, unreadOnly: boolean) {
  const notifications = data.notifications ?? [];
  const hit = notifications.find((n) => n.id === id);
  if (!hit || hit.isRead) return data;

  const nextUnreadCount = Math.max(0, Number(data.unreadCount ?? 0) - 1);

  if (unreadOnly) {
    const nextNotifications = notifications.filter((n) => n.id !== id);
    const nextTotal = Math.max(0, Number(data.total ?? 0) - 1);
    return {
      ...data,
      notifications: nextNotifications,
      total: nextTotal,
      unreadCount: nextUnreadCount,
    };
  }

  return {
    ...data,
    notifications: notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    unreadCount: nextUnreadCount,
  };
}

function optimisticMarkAllReadInList(data: NotificationsListResponse, unreadOnly: boolean) {
  if (unreadOnly) {
    return { ...data, notifications: [], total: 0, unreadCount: 0 };
  }

  const notifications = (data.notifications ?? []).map((n) => (n.isRead ? n : { ...n, isRead: true }));
  return { ...data, notifications, unreadCount: 0 };
}

export function useMarkUserNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "user"] });

      const previousUnread = queryClient.getQueryData<number>(notificationsKeys.user.unreadCount);
      const previousLists = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "user", "list"],
      });

      for (const [key, data] of previousLists) {
        if (!data) continue;
        const params = (key as unknown[])[3] as ResolvedListParams | undefined;
        queryClient.setQueryData<NotificationsListResponse>(
          key,
          optimisticMarkReadInList(data, id, Boolean(params?.unreadOnly))
        );
      }

      queryClient.setQueryData<number>(notificationsKeys.user.unreadCount, (old) => {
        if (old === undefined) return old as any;
        return Math.max(0, Number(old) - 1);
      });

      return { previousUnread, previousLists, id };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previousUnread !== undefined) {
        queryClient.setQueryData(notificationsKeys.user.unreadCount, ctx.previousUnread);
      }
      for (const [key, data] of ctx?.previousLists ?? []) queryClient.setQueryData(key, data);
      toastApiError(err, "Failed to mark notification as read");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.user.unreadCount });
    },
  });
}

export function useMarkAllUserReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "user"] });

      const previousUnread = queryClient.getQueryData<number>(notificationsKeys.user.unreadCount);
      const previousLists = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "user", "list"],
      });

      for (const [key, data] of previousLists) {
        if (!data) continue;
        const params = (key as unknown[])[3] as ResolvedListParams | undefined;
        queryClient.setQueryData<NotificationsListResponse>(
          key,
          optimisticMarkAllReadInList(data, Boolean(params?.unreadOnly))
        );
      }

      queryClient.setQueryData<number>(notificationsKeys.user.unreadCount, 0);
      return { previousUnread, previousLists };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousUnread !== undefined) {
        queryClient.setQueryData(notificationsKeys.user.unreadCount, ctx.previousUnread);
      }
      for (const [key, data] of ctx?.previousLists ?? []) queryClient.setQueryData(key, data);
      toastApiError(err, "Failed to mark all notifications as read");
    },
    onSuccess: async () => {
      toast.success("All notifications marked as read");
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.user.unreadCount });
    },
  });
}

export function useMarkVendorNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markVendorNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "vendor"] });

      const previousUnread = queryClient.getQueryData<number>(notificationsKeys.vendor.unreadCount);
      const previousLists = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "vendor", "list"],
      });

      for (const [key, data] of previousLists) {
        if (!data) continue;
        const params = (key as unknown[])[3] as ResolvedListParams | undefined;
        queryClient.setQueryData<NotificationsListResponse>(
          key,
          optimisticMarkReadInList(data, id, Boolean(params?.unreadOnly))
        );
      }

      queryClient.setQueryData<number>(notificationsKeys.vendor.unreadCount, (old) => {
        if (old === undefined) return old as any;
        return Math.max(0, Number(old) - 1);
      });

      return { previousUnread, previousLists, id };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previousUnread !== undefined) {
        queryClient.setQueryData(notificationsKeys.vendor.unreadCount, ctx.previousUnread);
      }
      for (const [key, data] of ctx?.previousLists ?? []) queryClient.setQueryData(key, data);
      toastApiError(err, "Failed to mark notification as read");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.vendor.unreadCount });
    },
  });
}

export function useMarkAllVendorReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllVendorNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "vendor"] });

      const previousUnread = queryClient.getQueryData<number>(notificationsKeys.vendor.unreadCount);
      const previousLists = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "vendor", "list"],
      });

      for (const [key, data] of previousLists) {
        if (!data) continue;
        const params = (key as unknown[])[3] as ResolvedListParams | undefined;
        queryClient.setQueryData<NotificationsListResponse>(
          key,
          optimisticMarkAllReadInList(data, Boolean(params?.unreadOnly))
        );
      }

      queryClient.setQueryData<number>(notificationsKeys.vendor.unreadCount, 0);
      return { previousUnread, previousLists };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousUnread !== undefined) {
        queryClient.setQueryData(notificationsKeys.vendor.unreadCount, ctx.previousUnread);
      }
      for (const [key, data] of ctx?.previousLists ?? []) queryClient.setQueryData(key, data);
      toastApiError(err, "Failed to mark all notifications as read");
    },
    onSuccess: async () => {
      toast.success("All notifications marked as read");
      await queryClient.invalidateQueries({ queryKey: notificationsKeys.vendor.unreadCount });
    },
  });
}
