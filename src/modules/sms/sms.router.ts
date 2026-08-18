import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import validateRequest from "@/middlewares/validateRequest";
import { loggerMiddleware } from "@/middlewares/logger";
import { smsController } from "./sms.controller";
import { smsValidations } from "./sms.validate";

const router = Router();
const authenticate = JwtInstance.authenticate(Object.values(ROLES));

router.get(
  "/balance",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_SMS),
  smsController.getBalance
);

router.get(
  "/status",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_SMS),
  smsController.getStatus
);

router.get(
  "/logs",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_SMS),
  smsController.getSmsLogs
);

router.get(
  "/otp-block-logs",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_SMS),
  smsController.getOtpBlockLogs
);

router.get(
  "/otp-blocks",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_SMS),
  smsController.getOtpBlocks
);

router.get(
  "/otp-config",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_SMS),
  smsController.getOtpConfig
);

router.patch(
  "/otp-config",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.SEND_SMS),
  validateRequest(smsValidations.updateOtpConfig),
  loggerMiddleware,
  smsController.updateOtpConfig
);

router.delete(
  "/otp-blocks",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.SEND_SMS),
  validateRequest(smsValidations.clearOtpBlock),
  loggerMiddleware,
  smsController.clearOtpBlocks
);

router.post(
  "/test",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.SEND_SMS),
  validateRequest(smsValidations.sendTest),
  loggerMiddleware,
  smsController.sendTestSms
);

export const SmsRoutes = router;
