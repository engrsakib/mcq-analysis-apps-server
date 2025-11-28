export const ROLES = {
  // Platform roles
  FOUNDER: "founder",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",

  // User roles
  STUDENT: "student",
};

export type IRoles = (typeof ROLES)[keyof typeof ROLES];
