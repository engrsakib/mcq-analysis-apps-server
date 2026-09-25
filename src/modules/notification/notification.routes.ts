import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { NotificationCampaignController } from "./notification-campaign.controller";
import { JwtInstance } from "@/lib/jwt";
import { ADMIN_ROLE_VALUES, ROLES } from "@/constants/roles";

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

router.get(
  "/popup/unseen",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.getUnseenPopup
);

router.post(
  "/campaigns",
  JwtInstance.authenticate(ADMIN_ROLE_VALUES),
  NotificationCampaignController.createCampaign
);

router.get(
  "/campaigns",
  JwtInstance.authenticate(ADMIN_ROLE_VALUES),
  NotificationCampaignController.listCampaigns
);

router.get(
  "/campaigns/:id",
  JwtInstance.authenticate(ADMIN_ROLE_VALUES),
  NotificationCampaignController.getCampaign
);

router.patch(
  "/:id/popup-seen",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.markPopupSeen
);

router.patch(
  "/:id/read",
  JwtInstance.authenticate(Object.values(ROLES)),
  NotificationController.markAsRead
);

export const NotificationRoutes = router;
