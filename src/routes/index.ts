import { AdminRoutes } from "@/modules/admin/admin.route";
import { OTPRoutes } from "@/modules/otp/otp.route";

import { ForgetPasswordRoutes } from "@/modules/forget-password/forgetPassword.routes";
import { Router } from "express";
import { UserRoutes } from "@/modules/user/user.routes";
import { UploadRoutes } from "@/modules/upload/upload.routes";
import { PermissionsRoutes } from "@/modules/permission/permission.route";
const router = Router();

const moduleRoutes = [
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/otp",
    route: OTPRoutes,
  },
  {
    path: "/forget-password",
    route: ForgetPasswordRoutes,
  },

  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/permissions",
    route: PermissionsRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
