import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import {
  DEFAULT_EXAM_SUBJECT,
  EXAM_SUBJECTS,
  ExamSubject,
} from "./exam.constants";
import { IExam } from "./exam.interface";

export function resolveExamSubject(value: unknown): ExamSubject {
  if (value == null || value === "") {
    return DEFAULT_EXAM_SUBJECT;
  }

  const subject = String(value).trim();

  if (!EXAM_SUBJECTS.includes(subject as ExamSubject)) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      `Invalid subject "${subject}". Allowed values: ${EXAM_SUBJECTS.join(", ")}`
    );
  }

  return subject as ExamSubject;
}

const CREATE_EXAM_FIELDS = [
  "exam_name",
  "subject",
  "exam_date_time",
  "duration_minutes",
  "total_marks",
  "negative_mark",
  "questions",
] as const;

const UPDATE_EXAM_FIELDS = [
  "exam_name",
  "subject",
  "exam_date_time",
  "duration_minutes",
  "total_marks",
  "negative_mark",
  "questions",
] as const;

export function pickExamCreatePayload(
  payload: Partial<IExam> & Record<string, unknown>
) {
  const data: Record<string, unknown> = {};

  for (const field of CREATE_EXAM_FIELDS) {
    if (payload[field] !== undefined) {
      data[field] = payload[field];
    }
  }

  data.subject = resolveExamSubject(data.subject);

  return data as Partial<IExam>;
}

export function pickExamUpdatePayload(
  payload: Partial<IExam> & Record<string, unknown>
) {
  const data: Record<string, unknown> = {};

  for (const field of UPDATE_EXAM_FIELDS) {
    if (payload[field] !== undefined) {
      data[field] = payload[field];
    }
  }

  if (data.subject !== undefined) {
    data.subject = resolveExamSubject(data.subject);
  }

  return data as Partial<IExam>;
}
