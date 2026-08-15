import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import mongoose from "mongoose";
import { PermissionModel } from "./permission.mode";
import { AdminModel } from "../admin/admin.model";
import { PermissionEnum } from "./permission.enum";
import { IAdminRole } from "@/constants/roles";
import {
  getPermissionsForRole,
  isSystemRole,
  SYSTEM_ROLES,
} from "./role-permissions";

class Service {
  async CreateAndUpdatePermissions(
    userId: string,
    permissions: PermissionEnum[],
    note?: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await AdminModel.findById(userId).session(session);
      if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
      }

      if (!permissions || permissions.length === 0) {
        throw new ApiError(
          HttpStatusCode.BAD_REQUEST,
          "Permissions are required"
        );
      }

      let ValidPermission = null;

      if (user.permissions) {
        ValidPermission = await PermissionModel.findById(
          user.permissions
        ).session(session);
      }

      if (!ValidPermission) {
        const newPermission = new PermissionModel({
          user: user._id,
          key: permissions,
          note: note || "Permission created by admin",
          createdBy: user._id,
        });

        await newPermission.save({ session });
        user.permissions = newPermission._id as any;
        await user.save({ session });
        ValidPermission = newPermission;
      } else {
        ValidPermission.key = permissions;
        if (note) {
          ValidPermission.note = note;
        }
        await ValidPermission.save({ session });
      }
      user.password = undefined as any;
      await session.commitTransaction();
      return { user, permission: ValidPermission };
    } catch (error) {
      console.error("Error in CreateAndUpdatePermissions:", error);
      await session.abortTransaction();
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Failed to create/update permissions"
      );
    } finally {
      session.endSession();
    }
  }

  async syncPermissionsForAdmin(adminId: string, role: IAdminRole) {
    const expectedPermissions = getPermissionsForRole(role);

    const admin = await AdminModel.findById(adminId)
      .select("permissions role")
      .populate({ path: "permissions", select: "key" })
      .lean();

    if (!admin) return;

    const currentKeys =
      admin.permissions &&
      typeof admin.permissions === "object" &&
      "key" in admin.permissions
        ? (admin.permissions as { key: string[] }).key
        : [];

    const expectedSet = new Set(expectedPermissions);
    const isInSync =
      currentKeys.length === expectedPermissions.length &&
      currentKeys.every((key) => expectedSet.has(key as PermissionEnum));

    if (isInSync) return;

    await this.CreateAndUpdatePermissions(
      adminId,
      expectedPermissions,
      `Auto-synced permissions for ${role} role`
    );
  }

  async syncSystemRolePermissions() {
    const admins = await AdminModel.find({
      is_Deleted: { $ne: true },
      role: { $in: SYSTEM_ROLES },
    }).select("_id role");

    for (const admin of admins) {
      if (!admin.role || !isSystemRole(admin.role)) continue;

      try {
        await this.syncPermissionsForAdmin(
          admin._id.toString(),
          admin.role as IAdminRole
        );
      } catch (error) {
        console.error(
          `Failed to sync permissions for admin ${admin._id}:`,
          error
        );
      }
    }
  }
}

export const PermissionService = new Service();
