import { Router } from "express";
import { JwtInstance } from "@/lib/jwt";
import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "../permission/permission.enum";
import { BooksController } from "./books.controller";

const router = Router();

router.post(
  "/",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.CREATE_GUIDELINE),
  BooksController.createBooks
);
router.get("/", BooksController.getAllBooks);
router.get("/:id", BooksController.getBookById);
router.put(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  BooksController.updateBookById
);
router.delete(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.DELETE_GUIDELINE),
  BooksController.deleteBookById
);

router.patch(
  "/:id",
  JwtInstance.authenticate(Object.values(ROLES)),
  JwtInstance.hasPermissions(PermissionEnum.UPDATE_GUIDELINE),
  BooksController.publishBookToggole
);

export const BooksRoutes = router;
