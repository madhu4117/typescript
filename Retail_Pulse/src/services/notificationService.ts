import api from "./api";

export interface NotificationDetails {
  productName?: string;
  sku?: string;
  currentStock?: number;
  reorderPoint?: number;
  risk?: string;
  recommendedQuantity?: number;
  daysRemaining?: number | null;
  importId?: number;
  importType?: string;
  filename?: string;
  totalRecords?: number;
  successfulRecords?: number;
  failedRecords?: number;
  duplicateRecords?: number;
  [key: string]: any;
}

export interface Notification {
  id: number;
  companyId: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  resourceType?: string | null;
  resourceId?: number | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  expiresAt?: string | null;
  details?: NotificationDetails | null;
}

export interface NotificationResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount?: number;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread?: boolean;
  status?: "all" | "unread" | "read";
  type?: string;
  priority?: string;
  search?: string;
  auto_evaluate?: boolean;
}


// =========================================================
// GET NOTIFICATIONS
// =========================================================

export const getNotifications = async (
  params: NotificationQuery = {}
): Promise<NotificationResponse> => {
  const queryParams: any = { ...params };
  if (params.status === "unread") {
    queryParams.unread = true;
  } else if (params.status === "read") {
    queryParams.unread = false;
  }

  const response = await api.get<NotificationResponse>(
    "/notifications",
    {
      params: queryParams,
    }
  );

  return response.data;
};


// =========================================================
// UNREAD COUNT
// =========================================================

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get<{
    unreadCount: number;
  }>("/notifications/unread-count");

  return response.data.unreadCount;
};


// =========================================================
// MARK ONE READ
// =========================================================

export const markNotificationRead = async (
  notificationId: number
): Promise<{ message: string; notification: Notification }> => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};


// =========================================================
// MARK ALL READ
// =========================================================

export const markAllNotificationsRead = async (): Promise<{
  message: string;
  updatedCount: number;
}> => {
  const response = await api.patch(
    "/notifications/read-all"
  );

  return response.data;
};


// =========================================================
// GET SINGLE NOTIFICATION
// =========================================================

export const getNotificationById = async (
  notificationId: number
): Promise<Notification> => {
  const response = await api.get<Notification>(
    `/notifications/${notificationId}`
  );

  return response.data;
};


// =========================================================
// TRIGGER ALERT EVALUATION
// =========================================================

export const triggerAlertEvaluation = async (): Promise<{
  message: string;
  newAlertsCount: number;
}> => {
  const response = await api.post("/notifications/evaluate");
  return response.data;
};


// =========================================================
// COMPATIBILITY TYPE & DEFAULT EXPORT
// =========================================================

export type NotificationItem = Notification;

const notificationService = {
  getNotifications,
  getUnreadNotificationCount,
  getUnreadCount: getUnreadNotificationCount,
  markNotificationRead,
  markAsRead: markNotificationRead,
  markAllNotificationsRead,
  markAllAsRead: markAllNotificationsRead,
  getNotificationById,
  triggerAlertEvaluation,
};

export default notificationService;