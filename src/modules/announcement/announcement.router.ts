import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { AnnouncementController } from "./announcement.controller";
import validateRequest from "@/middlewares/validateRequest";
import { announcementValidations } from "./announcement.validate";

const router = Router();
const authenticate = JwtInstance.authenticate(Object.values(ROLES));

router.get(
  "/user/unread",
  authenticate,
  AnnouncementController.getUnreadAnnouncementForUser
);

router.get(
  "/user",
  authenticate,
  AnnouncementController.getAnnouncementsForUser
);

router.post(
  "/:id/dismiss",
  authenticate,
  AnnouncementController.dismissAnnouncementForUser
);

router.post(
  "/",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.CREATE_ANNOUNCEMENT),
  validateRequest(announcementValidations.create),
  AnnouncementController.createAnnouncement
);

router.get(
  "/",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_ANNOUNCEMENT),
  AnnouncementController.getAllAnnouncements
);

router.get(
  "/:id",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_ANNOUNCEMENT),
  AnnouncementController.getAnnouncementById
);

router.put(
  "/:id",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_ANNOUNCEMENT),
  validateRequest(announcementValidations.update),
  AnnouncementController.updateAnnouncementById
);

router.delete(
  "/:id",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.DELETE_ANNOUNCEMENT),
  AnnouncementController.deleteAnnouncementById
);

export const AnnouncementRoutes = router;
