import { Router } from "express";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get("/", NotificationController.getNotifications);
router.get("/unread", NotificationController.getUnreadNotifications);
router.patch("/:id/read", NotificationController.markAsRead);

export const NotificationRoutes = router;
