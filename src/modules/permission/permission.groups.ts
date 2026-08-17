import { PermissionEnum } from "./permission.enum";

export const PERMISSION_GROUP_KEYS = {
  STUDENT: "STUDENT",
  EXAM: "EXAM",
  QUESTION: "QUESTION",
  BOOK: "BOOK",
  GUIDELINE: "GUIDELINE",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  SMS: "SMS",
  STAFF: "STAFF",
  OTHER: "OTHER",
} as const;

export type PermissionGroupKey =
  (typeof PERMISSION_GROUP_KEYS)[keyof typeof PERMISSION_GROUP_KEYS];

export const PERMISSION_GROUPS: Record<PermissionGroupKey, PermissionEnum[]> = {
  [PERMISSION_GROUP_KEYS.STUDENT]: [
    PermissionEnum.CREATE_STUDENT,
    PermissionEnum.VIEW_STUDENT,
    PermissionEnum.UPDATE_STUDENT,
    PermissionEnum.DELETE_STUDENT,
  ],
  [PERMISSION_GROUP_KEYS.EXAM]: [
    PermissionEnum.CREATE_EXAM,
    PermissionEnum.VIEW_EXAM,
    PermissionEnum.UPDATE_EXAM,
    PermissionEnum.DELETE_EXAM,
  ],
  [PERMISSION_GROUP_KEYS.QUESTION]: [
    PermissionEnum.CREATE_QUESTION,
    PermissionEnum.VIEW_QUESTION,
    PermissionEnum.UPDATE_QUESTION,
    PermissionEnum.DELETE_QUESTION,
  ],
  [PERMISSION_GROUP_KEYS.BOOK]: [
    PermissionEnum.CREATE_BOOK,
    PermissionEnum.VIEW_BOOK,
    PermissionEnum.UPDATE_BOOK,
    PermissionEnum.DELETE_BOOK,
  ],
  [PERMISSION_GROUP_KEYS.GUIDELINE]: [
    PermissionEnum.CREATE_GUIDELINE,
    PermissionEnum.VIEW_GUIDELINE,
    PermissionEnum.UPDATE_GUIDELINE,
    PermissionEnum.DELETE_GUIDELINE,
  ],
  [PERMISSION_GROUP_KEYS.ANNOUNCEMENT]: [
    PermissionEnum.CREATE_ANNOUNCEMENT,
    PermissionEnum.VIEW_ANNOUNCEMENT,
    PermissionEnum.UPDATE_ANNOUNCEMENT,
    PermissionEnum.DELETE_ANNOUNCEMENT,
  ],
  [PERMISSION_GROUP_KEYS.SMS]: [
    PermissionEnum.VIEW_SMS,
    PermissionEnum.SEND_SMS,
  ],
  [PERMISSION_GROUP_KEYS.STAFF]: [
    PermissionEnum.CREATE_STAFF,
    PermissionEnum.VIEW_STAFF,
    PermissionEnum.UPDATE_STAFF,
    PermissionEnum.DELETE_STAFF,
  ],
  [PERMISSION_GROUP_KEYS.OTHER]: [
    PermissionEnum.CHECK_RESULT,
    PermissionEnum.MANAGE_PERMISSIONS,
  ],
};

export const PERMISSION_GROUP_LABELS: Record<PermissionGroupKey, string> = {
  [PERMISSION_GROUP_KEYS.STUDENT]: "Student",
  [PERMISSION_GROUP_KEYS.EXAM]: "Exam",
  [PERMISSION_GROUP_KEYS.QUESTION]: "Question",
  [PERMISSION_GROUP_KEYS.BOOK]: "Book",
  [PERMISSION_GROUP_KEYS.GUIDELINE]: "Guideline",
  [PERMISSION_GROUP_KEYS.ANNOUNCEMENT]: "Announcement",
  [PERMISSION_GROUP_KEYS.SMS]: "SMS",
  [PERMISSION_GROUP_KEYS.STAFF]: "Staff",
  [PERMISSION_GROUP_KEYS.OTHER]: "Other Permissions",
};

export const PERMISSION_GROUP_ICONS: Record<PermissionGroupKey, string> = {
  [PERMISSION_GROUP_KEYS.STUDENT]: "👨‍🎓",
  [PERMISSION_GROUP_KEYS.EXAM]: "📝",
  [PERMISSION_GROUP_KEYS.QUESTION]: "❓",
  [PERMISSION_GROUP_KEYS.BOOK]: "📚",
  [PERMISSION_GROUP_KEYS.GUIDELINE]: "📋",
  [PERMISSION_GROUP_KEYS.ANNOUNCEMENT]: "📢",
  [PERMISSION_GROUP_KEYS.SMS]: "💬",
  [PERMISSION_GROUP_KEYS.STAFF]: "👥",
  [PERMISSION_GROUP_KEYS.OTHER]: "⚙️",
};

export const PERMISSION_LABELS: Record<PermissionEnum, string> = {
  [PermissionEnum.CREATE_STUDENT]: "Create Student",
  [PermissionEnum.VIEW_STUDENT]: "View Student",
  [PermissionEnum.UPDATE_STUDENT]: "Update Student",
  [PermissionEnum.DELETE_STUDENT]: "Delete Student",
  [PermissionEnum.CREATE_EXAM]: "Create Exam",
  [PermissionEnum.VIEW_EXAM]: "View Exam",
  [PermissionEnum.UPDATE_EXAM]: "Update Exam",
  [PermissionEnum.DELETE_EXAM]: "Delete Exam",
  [PermissionEnum.CREATE_QUESTION]: "Create Question",
  [PermissionEnum.VIEW_QUESTION]: "View Question",
  [PermissionEnum.UPDATE_QUESTION]: "Update Question",
  [PermissionEnum.DELETE_QUESTION]: "Delete Question",
  [PermissionEnum.CREATE_BOOK]: "Create Book",
  [PermissionEnum.VIEW_BOOK]: "View Book",
  [PermissionEnum.UPDATE_BOOK]: "Update Book",
  [PermissionEnum.DELETE_BOOK]: "Delete Book",
  [PermissionEnum.CREATE_GUIDELINE]: "Create Guideline",
  [PermissionEnum.VIEW_GUIDELINE]: "View Guideline",
  [PermissionEnum.UPDATE_GUIDELINE]: "Update Guideline",
  [PermissionEnum.DELETE_GUIDELINE]: "Delete Guideline",
  [PermissionEnum.CREATE_ANNOUNCEMENT]: "Create Announcement",
  [PermissionEnum.VIEW_ANNOUNCEMENT]: "View Announcement",
  [PermissionEnum.UPDATE_ANNOUNCEMENT]: "Update Announcement",
  [PermissionEnum.DELETE_ANNOUNCEMENT]: "Delete Announcement",
  [PermissionEnum.VIEW_SMS]: "View SMS",
  [PermissionEnum.SEND_SMS]: "Send SMS",
  [PermissionEnum.CHECK_RESULT]: "Check Result",
  [PermissionEnum.CREATE_STAFF]: "Create Staff",
  [PermissionEnum.VIEW_STAFF]: "View Staff",
  [PermissionEnum.UPDATE_STAFF]: "Update Staff",
  [PermissionEnum.DELETE_STAFF]: "Delete Staff",
  [PermissionEnum.MANAGE_PERMISSIONS]: "Manage Permissions",
};
