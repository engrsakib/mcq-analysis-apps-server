export type IExamSolution = {
  exam_solution_number?: number;
  position?: number;
  title: string;
  description: string;
  status: EXAM_SOLUTION_STATUS;
  thumbnail_url?: string;
  exam_solution_url: string;
};

export enum EXAM_SOLUTION_STATUS {
  INACTIVE = "inactive",
  ACTIVE = "active",
  ADMIN_APPROVAL = "admin_approval",
}
