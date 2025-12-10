import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { ExamController } from "./exam.controller";

const router = Router();

router.get(
  "/exam-search",
  JwtInstance.authenticate(Object.values(ROLES)),
  ExamController.getExamForSearch
);

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_EXAM),
  ExamController.createExam
);
router.get("/", ExamController.getAllExams);
router.get("/:id", ExamController.getExamById);
router.put(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  ExamController.updateExamById
);
router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_EXAM),
  ExamController.deleteExamById
);
router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  ExamController.updateStatus
);

export const ExamRoutes = router;
