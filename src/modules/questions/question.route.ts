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
  JwtInstance.hasPermissions(PermissionEnum.CREATE_QUESTION),
  QuestionController.createQuestion
);

router.get(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_QUESTION),
  QuestionController.getQuestionById
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_QUESTION),
  QuestionController.getAllQuestions
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_QUESTION),
  QuestionController.updateQuestionById
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_QUESTION),
  QuestionController.deleteQuestionById
);

export const QuestionRoutes = router;
