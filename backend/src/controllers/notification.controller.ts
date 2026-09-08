import { Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service.js";
import { AuthenticatedRequest } from "../types/index.js";

export class NotificationController {
  // GET /api/notifications — fetch all and mark as read
  static async getMyNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const institutionId = req.user?.institutionId || req.institutionId;
      const notifs = await NotificationService.getForStudent(userId, true, institutionId ? institutionId.toString() : undefined);
      res.json({ success: true, data: notifs });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/notifications/unread-count
  static async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const institutionId = req.user?.institutionId || req.institutionId;
      const count = await NotificationService.getUnreadCount(userId, institutionId ? institutionId.toString() : undefined);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/notifications/read-all
  static async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const institutionId = req.user?.institutionId || req.institutionId;
      await NotificationService.markAllRead(userId, institutionId ? institutionId.toString() : undefined);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/notifications/:id/read
  static async markOneRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const institutionId = req.user?.institutionId || req.institutionId;
      await NotificationService.markOneRead(req.params.id, userId, institutionId ? institutionId.toString() : undefined);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/notifications/:id
  static async deleteOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const institutionId = req.user?.institutionId || req.institutionId;
      await NotificationService.deleteOne(req.params.id, userId, institutionId ? institutionId.toString() : undefined);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}
export default NotificationController;
