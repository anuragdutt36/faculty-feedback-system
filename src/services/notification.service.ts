import { apiFetch } from "./api.js";

export interface INotification {
  _id: string;
  studentId: string;
  title: string;
  message: string;
  category: "feedback" | "academic" | "system";
  isRead: boolean;
  relatedSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  /** Fetches all notifications and marks them all as read server-side */
  async getMyNotifications(): Promise<INotification[]> {
    const res = await apiFetch("/notifications");
    return res.data || [];
  },

  /** Returns the unread count without marking as read */
  async getUnreadCount(): Promise<number> {
    const res = await apiFetch("/notifications/unread-count");
    return res.data?.count ?? 0;
  },

  /** Mark all notifications read */
  async markAllRead(): Promise<void> {
    await apiFetch("/notifications/read-all", { method: "PUT" });
  },

  /** Mark a single notification read */
  async markOneRead(id: string): Promise<void> {
    await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
  },

  /** Delete a single notification */
  async deleteNotification(id: string): Promise<void> {
    await apiFetch(`/notifications/${id}`, { method: "DELETE" });
  },
};
