export interface NotificationItem {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  notificationType?: string;
  referenceType?: string;
  referenceId?: number;
}
