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
