import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get(
  "/stats",
  JwtInstance.authenticate(Object.values(ROLES)),
  dashboardController.getStats
);

export const DashboardRoutes = router;
