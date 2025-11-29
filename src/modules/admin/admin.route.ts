import { Router } from "express";
import { AdminController } from "./admin.controller";
import { adminValidations } from "./admin.validate";
import { otpValidations } from "../otp/otp.validate";
import validateRequest from "@/middlewares/validateRequest";
import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";
import { loggerMiddleware } from "@/middlewares/logger";
import { loginValidation } from "@/common/validators/login.validator";
import { changePasswordValidation } from "@/common/validators/change-password-validator";
import { resetPasswordValidation } from "@/common/validators/reset-password-validator";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

// router.post(
//   "/",
//   validateRequest(adminValidations.create),
//   loggerMiddleware,
//   AdminController.createAdmin
// );

router.post(
  "/create",
  validateRequest(adminValidations.create),
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_STAFF),

  loggerMiddleware,
  AdminController.createAdminByAdmin
);

router.post(
  "/login",
  validateRequest(loginValidation),
  loggerMiddleware,
  AdminController.adminLogin
);

router.post(
  "/verify",
  validateRequest(otpValidations.verifyOtp),
  loggerMiddleware,
  AdminController.verifyAccount
);

router.post(
  "/resend-otp",
  validateRequest(otpValidations.resendOtp),
  loggerMiddleware,
  AdminController.resendVerificationOtp
);

router.post(
  "/approve",
  validateRequest(adminValidations.approveAccount),
  loggerMiddleware,
  AdminController.approveAdminAccount
);

router.get(
  "/auth",
  JwtInstance.authenticate(Object.values(ROLES)),
  AdminController.getLoggedInAdmin
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_STAFF),
  AdminController.getAllAdmins
);

router.get(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_STAFF),
  AdminController.getAdminById
);

router.patch(
  "/change-password",
  JwtInstance.authenticate(Object.values(ROLES)),
  validateRequest(changePasswordValidation),
  loggerMiddleware,
  AdminController.changePassword
);

router.patch(
  "/reset-password",
  validateRequest(resetPasswordValidation),
  loggerMiddleware,
  AdminController.resetPassword
);

router.patch(
  "/update-staff/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_STAFF),
  validateRequest(adminValidations.update),
  loggerMiddleware,
  AdminController.updateAdmin
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_STAFF),
  AdminController.deleteAdmin
);

router.delete("/logout", AdminController.logout);

export const AdminRoutes = router;
