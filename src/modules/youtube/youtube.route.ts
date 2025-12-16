import { Router } from "express";
import { YoutubeController } from "./youtube.controller";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_GUIDELINE),
  YoutubeController.createYouTube
);
router.get(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.VIEW_GUIDELINE),
  YoutubeController.getAllYouTubes
);
router.get("/user", YoutubeController.getAllYouTubesForUsers);
router.get("/:id", YoutubeController.getYouTubeById);
router.put(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  YoutubeController.updateYouTubeById
);
router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_GUIDELINE),
  YoutubeController.deleteYouTubeById
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  YoutubeController.publishYouTubeToggle
);

export const YoutubeRoutes = router;
