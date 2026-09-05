import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { activityController } from "./activity.controller";

const router = Router();
const authenticate = JwtInstance.authenticate(Object.values(ROLES));

router.get(
  "/",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_ACTIVITY),
  activityController.getActivityLogs
);

export const ActivityRoutes = router;
