export enum PermissionEnum {
  CREATE_STUDENT = "create_student",
  VIEW_STUDENT = "view_student",
  UPDATE_STUDENT = "update_student",
  DELETE_STUDENT = "delete_student",

  CREATE_EXAM = "create_exam",
  VIEW_EXAM = "view_exam",
  UPDATE_EXAM = "update_exam",
  DELETE_EXAM = "delete_exam",

  CREATE_QUESTION = "create_question",
  VIEW_QUESTION = "view_question",
  UPDATE_QUESTION = "update_question",
  DELETE_QUESTION = "delete_question",

  CREATE_BOOK = "create_book",
  VIEW_BOOK = "view_book",
  UPDATE_BOOK = "update_book",
  DELETE_BOOK = "delete_book",

  CREATE_GUIDELINE = "create_guideline",
  VIEW_GUIDELINE = "view_guideline",
  UPDATE_GUIDELINE = "update_guideline",
  DELETE_GUIDELINE = "delete_guideline",

  CREATE_STAFF = "create_staff",
  VIEW_STAFF = "view_staff",
  UPDATE_STAFF = "update_staff",
  DELETE_STAFF = "delete_staff",

  CHECK_RESULT = "check_result",

  MANAGE_PERMISSIONS = "manage_permissions",
}

export enum PermissionGroup {
  ORDER = "Order",
  PRODUCT = "Product",
  USER = "User",
  REPORT = "Report",
  PAYMENT = "Payment",
  ADMIN = "Admin",
}
