import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service.js";

export class NotificationController {
  // GET /api/notifications — fetch all and mark as read
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notifs = await NotificationService.getForStudent(userId, true);
      res.json({ success: true, data: notifs });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/notifications/unread-count
  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const count = await NotificationService.getUnreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/notifications/read-all
  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await NotificationService.markAllRead(userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/notifications/:id/read
  static async markOneRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await NotificationService.markOneRead(req.params.id, userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/notifications/:id
  static async deleteOne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await NotificationService.deleteOne(req.params.id, userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}
