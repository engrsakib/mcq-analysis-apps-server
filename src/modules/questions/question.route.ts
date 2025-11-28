/* eslint-disable @typescript-eslint/no-unused-vars */
import { Router } from "express";

import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { QuestionController } from "./question.controller";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.MANAGE_PERMISSIONS),
  QuestionController.createQuestion
);

export const QuestionRoutes = router;
