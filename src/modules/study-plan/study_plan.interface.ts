export type IstudyPlan = {
  study_plan_number?: number;
  title: string;
  description: string;
  status: GUIDELINE_STATUS;
  thumbnail_url?: string;
  study_plan_url: string;
  category: GUIDELINE_CATEGORY_ENUMS;
};

export enum GUIDELINE_STATUS {
  INACTIVE = "inactive",
  ACTIVE = "active",
  ADMIN_APPROVAL = "admin_approval",
}

export enum GUIDELINE_CATEGORY_ENUMS {
  GENERAL = "general",
  TECHNICAL = "technical",
  EXAM = "exam",
  BCS_PREPARATION = "bcs_preparation",
  PRIMARY_TEACHER_PREPARATION = "primary_teacher_preparation",
  TEACHER_NIBONDHON_PREPARATION = "teacher_nibondhon_preparation",
}
