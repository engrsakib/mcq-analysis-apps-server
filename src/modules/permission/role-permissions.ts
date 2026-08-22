import { ADMIN_ROLES, IAdminRole } from "@/constants/roles";
import { PermissionEnum } from "./permission.enum";
import {
  PERMISSION_GROUP_KEYS,
  PERMISSION_GROUPS,
  PermissionGroupKey,
} from "./permission.groups";

const ROLE_PERMISSION_GROUPS: Record<IAdminRole, PermissionGroupKey[] | "ALL"> =
  {
    [ADMIN_ROLES.FOUNDER]: "ALL",
    [ADMIN_ROLES.ADMIN]: [
      PERMISSION_GROUP_KEYS.STUDENT,
      PERMISSION_GROUP_KEYS.EXAM,
      PERMISSION_GROUP_KEYS.QUESTION,
      PERMISSION_GROUP_KEYS.BOOK,
      PERMISSION_GROUP_KEYS.GUIDELINE,
      PERMISSION_GROUP_KEYS.ANNOUNCEMENT,
      PERMISSION_GROUP_KEYS.SMS,
    ],
    [ADMIN_ROLES.EDITOR]: [
      PERMISSION_GROUP_KEYS.STUDENT,
      PERMISSION_GROUP_KEYS.EXAM,
      PERMISSION_GROUP_KEYS.QUESTION,
      PERMISSION_GROUP_KEYS.BOOK,
      PERMISSION_GROUP_KEYS.GUIDELINE,
      PERMISSION_GROUP_KEYS.ANNOUNCEMENT,
    ],
  };

const ROLE_EXTRA_PERMISSIONS: Partial<Record<IAdminRole, PermissionEnum[]>> = {
  [ADMIN_ROLES.ADMIN]: [PermissionEnum.CHECK_RESULT],
  [ADMIN_ROLES.EDITOR]: [PermissionEnum.CHECK_RESULT],
};

export const SYSTEM_ROLES = Object.values(ADMIN_ROLES);

export function isSystemRole(role: string): role is IAdminRole {
  return SYSTEM_ROLES.includes(role as IAdminRole);
}

export function getPermissionsForRole(role: IAdminRole): PermissionEnum[] {
  const groupConfig = ROLE_PERMISSION_GROUPS[role];

  if (groupConfig === "ALL") {
    return Object.values(PermissionEnum);
  }

  const fromGroups = groupConfig.flatMap(
    (groupKey) => PERMISSION_GROUPS[groupKey]
  );
  const extras = ROLE_EXTRA_PERMISSIONS[role] ?? [];

  return Array.from(new Set([...fromGroups, ...extras]));
}
