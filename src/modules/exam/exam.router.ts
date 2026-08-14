import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { ExamController } from "./exam.controller";
import validateRequest from "@/middlewares/validateRequest";
import { examValidations } from "./exam.validate";

const router = Router();
const authenticate = JwtInstance.authenticate(Object.values(ROLES));

router.get("/exam-search", authenticate, ExamController.getExamForSearch);

router.post(
  "/",
  // authenticate,
  // JwtInstance.hasPermissions(PermissionEnum.CREATE_EXAM),
  validateRequest(examValidations.create),
  ExamController.createExam
);

router.get(
  "/",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.VIEW_EXAM),
  ExamController.getAllExams
);

router.get("/user", authenticate, ExamController.getAllExamsForUsers);

router.get("/upcoming", authenticate, ExamController.getUpcomingExamsForUsers);

router.get("/user/:id", authenticate, ExamController.getExamByIdForUsers);

router.get("/:id", ExamController.getExamById);

router.put(
  "/:id",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  validateRequest(examValidations.update),
  ExamController.updateExamById
);

router.delete(
  "/:id",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.DELETE_EXAM),
  ExamController.deleteExamById
);

router.patch(
  "/:id",
  authenticate,
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_EXAM),
  ExamController.updateStatus
);

export const ExamRoutes = router;
