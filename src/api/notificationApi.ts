import client from "./client";
import { NotificationItem } from "../types/notification";

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await client.get("/Notifications", {
    params: { size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function getUnreadCount(): Promise<number> {
  const res = await client.get("/Notifications/unread-count");
  return res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
}

export async function markAsRead(id: number): Promise<void> {
  await client.patch(`/Notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await client.patch("/Notifications/read-all");
}

export async function getNotificationById(id: number): Promise<NotificationItem> {
  const res = await client.get(`/Notifications/${id}`);
  return res.data?.data || res.data;
}
