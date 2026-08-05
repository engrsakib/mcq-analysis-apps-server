import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import validateRequest from "@/middlewares/validateRequest";
import { StudyTopicTypeController } from "./study-topic-type.controller";
import { studyTopicTypeValidations } from "./study-topic-type.validate";

const router = Router();

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_QUESTION),
  StudyTopicTypeController.getAllTypes
);

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_QUESTION),
  validateRequest(studyTopicTypeValidations.create),
  StudyTopicTypeController.createType
);

export const StudyTopicTypeRoutes = router;
