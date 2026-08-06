import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { NotificationController } from "../controllers/notification.controller.js";

const router = Router();

// All routes require student auth
router.use(authenticate, authorize("student"));

// GET /api/notifications — returns all notifications and marks them all as read
router.get("/", NotificationController.getMyNotifications);

// GET /api/notifications/unread-count — returns { count } without marking as read
router.get("/unread-count", NotificationController.getUnreadCount);

// PUT /api/notifications/read-all — mark all as read
router.put("/read-all", NotificationController.markAllRead);

// PUT /api/notifications/:id/read — mark one as read
router.put("/:id/read", NotificationController.markOneRead);

// DELETE /api/notifications/:id — delete one notification
router.delete("/:id", NotificationController.deleteOne);

export default router;
