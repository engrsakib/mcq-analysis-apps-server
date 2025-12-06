export type IGuideline = {
  guideline_number?: number;
  title: string;
  category: GUIDELINE_CATEGORY_ENUMS;
  description?: string;
  status: GUIDELINE_ADMIN_ENUMS;
};

export enum GUIDELINE_ADMIN_ENUMS {
  INACTIVE = "inactive",
  ACTIVE = "active",
  ADMIN_APPROVAL = "admin_approval",
}

enum GUIDELINE_CATEGORY_ENUMS {
  GENERAL = "general",
  TECHNICAL = "technical",
  EXAM = "exam",
  BCS_PREPARATION = "bcs_preparation",
  PRIMARY_TEACHRER = "primary_teacher",
}
