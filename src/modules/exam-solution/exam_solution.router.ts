import { Router } from "express";
import { ExamSolutionController } from "./exam_solution.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_GUIDELINE),
  ExamSolutionController.createExamSolution
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_EXAM),
  ExamSolutionController.getAllExamSolutions
);

router.get("/user", ExamSolutionController.getAllExamSolutionsForUsers);

router.get("/:id", ExamSolutionController.getExamSolutionById);

router.put(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  ExamSolutionController.updateExamSolution
);

router.patch(
  "/reorder",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  ExamSolutionController.reorderExamSolutions
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_EXAM),
  ExamSolutionController.deleteExamSolution
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  ExamSolutionController.toggleExamSolutionStatus
);

export const ExamSolutionRoutes = router;
