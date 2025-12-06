import { AdminRoutes } from "@/modules/admin/admin.route";
import { OTPRoutes } from "@/modules/otp/otp.route";

import { ForgetPasswordRoutes } from "@/modules/forget-password/forgetPassword.routes";
import { Router } from "express";
import { UserRoutes } from "@/modules/user/user.routes";
import { UploadRoutes } from "@/modules/upload/upload.routes";
import { PermissionsRoutes } from "@/modules/permission/permission.route";
import { QuestionRoutes } from "./../modules/questions/question.route";
import { YoutubeRoutes } from "@/modules/youtube/youtube.route";
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
    path: "/otp/validate",
    route: OTPRoutes,
  },
  {
    path: "/forget-password",
    route: ForgetPasswordRoutes,
  },
  {
    path: "/youtube",
    route: YoutubeRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/permissions",
    route: PermissionsRoutes,
  },
  {
    path: "/question",
    route: QuestionRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
