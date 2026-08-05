import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";

const router = Router();

router.get(
  "/stream",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.streamNotifications
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.getNotifications
);

router.get(
  "/unread",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.getUnreadNotifications
);

router.patch(
  "/read-all",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.markAllAsRead
);

router.patch(
  "/:id/read",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.markAsRead
);

export const NotificationRoutes = router;
