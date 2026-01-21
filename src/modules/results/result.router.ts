import { ROLES } from "@/constants/roles";
import { JwtInstance } from "@/lib/jwt";
import { Router } from "express";
import { ResultController } from "./result.controller";

const router = Router();
router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  ResultController.createResult
);

router.get(
  "/:exam_number/leaderboard",
  JwtInstance.authenticate(Object.values(ROLES)),
  ResultController.getExamLeaderboard
);

router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  ResultController.getResultsBySearch
);

router.patch(
  "/update-marks",
  // JwtInstance.authenticate(Object.values(ROLES)),
  ResultController.updateMarks
);

router.get(
  "/:exam_number",
  // JwtInstance.authenticate(Object.values(ROLES)),
  ResultController.getResultByExamNumber
);

export const ResultRoutes = router;
