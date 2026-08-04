import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import validateRequest from "@/middlewares/validateRequest";
import { QuestionStudyTopicController } from "./question-study-topic.controller";
import { questionStudyTopicValidations } from "./question-study-topic.validate";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_QUESTION),
  validateRequest(questionStudyTopicValidations.create),
  QuestionStudyTopicController.createTopic
);

router.get(
  "/dropdown",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_QUESTION),
  QuestionStudyTopicController.getDropdownTopics
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_QUESTION),
  QuestionStudyTopicController.getAllTopics
);

router.patch(
  "/reorder",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_QUESTION),
  QuestionStudyTopicController.reorderTopics
);

router.get(
  "/:category_number",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_QUESTION),
  QuestionStudyTopicController.getTopicByCategoryNumber
);

router.patch(
  "/:category_number",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_QUESTION),
  validateRequest(questionStudyTopicValidations.update),
  QuestionStudyTopicController.updateTopicByCategoryNumber
);

router.delete(
  "/:category_number",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_QUESTION),
  QuestionStudyTopicController.deleteTopicByCategoryNumber
);

export const QuestionStudyTopicRoutes = router;
