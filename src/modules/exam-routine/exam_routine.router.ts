import { Router } from "express";
import { ExamRoutineController } from "./exam_routine.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import validateRequest from "@/middlewares/validateRequest";
import { examRoutineValidations } from "./exam_routine.validate";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_GUIDELINE),
  validateRequest(examRoutineValidations.create),
  ExamRoutineController.createExamRoutine
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_GUIDELINE),
  ExamRoutineController.getAllExamRoutines
);

router.get("/user", ExamRoutineController.getAllExamRoutinesForUsers);

router.get("/:id", ExamRoutineController.getExamRoutineById);

router.put(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  validateRequest(examRoutineValidations.update),
  ExamRoutineController.updateExamRoutine
);

router.patch(
  "/reorder",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  ExamRoutineController.reorderExamRoutines
);

router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_GUIDELINE),
  ExamRoutineController.deleteExamRoutine
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  ExamRoutineController.toggleExamRoutineStatus
);

export const ExamRoutineRoutes = router;
