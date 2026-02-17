import { Router } from "express";
import { StudyPlanController } from "./study_plan.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_GUIDELINE),
  StudyPlanController.createStudyPlan
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_GUIDELINE),
  StudyPlanController.getAllStudyPlans
);

router.get("/user", StudyPlanController.getAllStudyPlansForUsers);

router.get("/:id", StudyPlanController.getStudyPlanById);

router.put(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  StudyPlanController.updateStudyPlan
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_GUIDELINE),
  StudyPlanController.deleteStudyPlan
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  StudyPlanController.toggleStudyPlanStatus
);

export const StudyPlanRoutes = router;
