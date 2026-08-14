export const EXAM_SUBJECTS = [
  "Model Test",
  "Bangla Grammar",
  "Bangla Literature",
  "English Grammar",
  "English Literature",
  "Math : Arithmetics",
  "Math : Algebra",
  "Math : Geometry",
  "GK : Bangladesh",
  "GK : International",
  "Science",
  "ICT",
] as const;

export type ExamSubject = (typeof EXAM_SUBJECTS)[number];

export const DEFAULT_EXAM_SUBJECT: ExamSubject = "Model Test";
