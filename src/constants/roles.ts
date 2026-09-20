export const ADMIN_ROLES = {
  FOUNDER: "founder",
  ADMIN: "admin",
  EDITOR: "editor",
} as const;

export const ROLES = {
  ...ADMIN_ROLES,
  STUDENT: "student",
  CUSTOMER: "customer",
} as const;

export type IAdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];
export type IRoles = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLE_VALUES = Object.values(ADMIN_ROLES);

/** App users who receive student notifications and FCM (not staff). */
export const APP_USER_ROLES = [ROLES.STUDENT, ROLES.CUSTOMER] as const;

/** Mongo filter: students/app users (excludes staff roles; includes legacy users without role). */
export function appUserMatchFilter(): Record<string, unknown> {
  return {
    is_Deleted: false,
    role: { $nin: [...ADMIN_ROLE_VALUES] },
  };
}
