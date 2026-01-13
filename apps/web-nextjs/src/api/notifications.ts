import { apiFetch } from "@/lib/api";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsListResponse = {
  ok: true;
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
  notifications: NotificationListItem[];
};

export type NotificationsListParams = {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

function buildListQuery(params: NotificationsListParams | undefined) {
  const search = new URLSearchParams();
  if (params?.unreadOnly !== undefined) search.set("unreadOnly", params.unreadOnly ? "true" : "false");
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getMyNotifications(params?: NotificationsListParams): Promise<NotificationsListResponse> {
  return apiFetch<NotificationsListResponse>(`/api/notifications/me${buildListQuery(params)}`, {
    method: "GET",
    auth: "required",
  });
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    auth: "required",
  });
}

export async function markAllNotificationsRead(): Promise<{ ok: true; updatedCount?: number }> {
  return apiFetch<{ ok: true; updatedCount?: number }>(`/api/notifications/me/read-all`, {
    method: "PATCH",
    auth: "required",
  });
}

export async function getVendorNotifications(params?: NotificationsListParams): Promise<NotificationsListResponse> {
  return apiFetch<NotificationsListResponse>(`/api/vendor/notifications${buildListQuery(params)}`, {
    method: "GET",
    auth: "required",
  });
}

export async function markVendorNotificationRead(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/vendor/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    auth: "required",
  });
}

export async function markAllVendorNotificationsRead(): Promise<{ ok: true; updatedCount?: number }> {
  return apiFetch<{ ok: true; updatedCount?: number }>(`/api/vendor/notifications/read-all`, {
    method: "PATCH",
    auth: "required",
  });
}

