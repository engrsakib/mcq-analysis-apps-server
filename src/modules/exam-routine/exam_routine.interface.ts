export type IExamRoutine = {
  exam_routine_number?: number;
  position?: number;
  title: string;
  description: string;
  status: GUIDELINE_STATUS;
  thumbnail_url?: string;
  exam_routine_url: string;
  category: GUIDELINE_CATEGORY_ENUMS;
  post_date: Date;
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
