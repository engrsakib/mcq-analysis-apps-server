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

export const ResultRoutes = router;
