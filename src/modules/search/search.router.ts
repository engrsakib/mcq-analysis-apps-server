import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import validateRequest from "@/middlewares/validateRequest";
import { SearchValidations } from "./search.validate";
import { SearchController } from "./search.controller";

const router = Router();

router.get(
  "/",
  validateRequest(SearchValidations.globalSearch),
  JwtInstance.authenticate(Object.values(ROLES)),
  SearchController.globalSearch
);

export const SearchRoutes = router;
