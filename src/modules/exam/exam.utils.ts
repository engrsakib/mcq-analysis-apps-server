import { DateTime } from "luxon";

type ExamTimingFields = {
  exam_date_time: Date;
  duration_minutes: number;
  is_started?: boolean;
};

const BANGLADESH_TIMEZONE = "Asia/Dhaka";
const PRACTICE_MODE_DELAY_MS = 360 * 1000;

/**
 * Converts a UTC instant to an Asia/Dhaka ISO string for user-facing API responses.
 * Does not mutate stored MongoDB values — call only when shaping the response payload.
 * Example: 2026-07-13T14:40:00.000Z → "2026-07-13T20:40:00.000+06:00"
 */
export function toBangladeshDateTime(
  value: Date | string | null | undefined
): string | null | undefined {
  if (value == null || value === "") {
    return value as null | undefined;
  }

  const dateTime =
    value instanceof Date
      ? DateTime.fromJSDate(value, { zone: "utc" }).setZone(BANGLADESH_TIMEZONE)
      : DateTime.fromISO(String(value), { setZone: true }).setZone(
          BANGLADESH_TIMEZONE
        );

  if (!dateTime.isValid) {
    return String(value);
  }

  return dateTime.toISO({ includeOffset: true });
}

function toPlainExamRecord(exam: unknown): Record<string, unknown> | null {
  if (exam == null) {
    return null;
  }

  if (
    typeof (exam as { toObject?: () => Record<string, unknown> }).toObject ===
    "function"
  ) {
    return (
      exam as { toObject: (opts?: object) => Record<string, unknown> }
    ).toObject({
      virtuals: true,
    });
  }

  return { ...(exam as Record<string, unknown>) };
}

/** Response-only: replace exam_date_time with Bangladesh local ISO (offset +06:00). */
export function withBangladeshExamDateTime<T>(exam: T): T {
  const plain = toPlainExamRecord(exam);
  if (!plain) {
    return exam;
  }

  if (plain.exam_date_time != null) {
    plain.exam_date_time = toBangladeshDateTime(
      plain.exam_date_time as Date | string
    );
  }

  return plain as T;
}

export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function withShuffledQuestions<T>(exam: T): T {
  if (!exam || typeof exam !== "object") {
    return exam;
  }

  const record = exam as Record<string, unknown>;

  if (!Array.isArray(record.questions) || record.questions.length <= 1) {
    return exam;
  }

  return {
    ...record,
    questions: shuffleArray(record.questions),
  } as T;
}

export function mapExamsWithBangladeshDateTime<T>(exams: T[]): T[] {
  return exams.map((exam) => withBangladeshExamDateTime(exam));
}

export function isLiveExam(exam: {
  is_started?: boolean;
  is_completed?: boolean;
}): boolean {
  return Boolean(exam.is_started && !exam.is_completed);
}

export function getExamEndTime(exam: ExamTimingFields): Date {
  const endTime = new Date(exam.exam_date_time);
  endTime.setMinutes(endTime.getMinutes() + exam.duration_minutes);
  return endTime;
}

export function getExamCompletedAt(exam: {
  completed_at?: Date | string | null;
  exam_date_time: Date | string;
  duration_minutes: number;
}): Date {
  if (exam.completed_at) {
    return new Date(exam.completed_at);
  }

  return getExamEndTime({
    exam_date_time: new Date(exam.exam_date_time),
    duration_minutes: exam.duration_minutes,
  });
}

export function getPracticeModeStartTime(exam: {
  completed_at?: Date | string | null;
  exam_date_time: Date | string;
  duration_minutes: number;
}): Date {
  const completedAt = getExamCompletedAt(exam);
  return new Date(completedAt.getTime() + PRACTICE_MODE_DELAY_MS);
}

export function isPracticeMode(exam: { is_practice_mode?: boolean }): boolean {
  return Boolean(exam.is_practice_mode);
}

export function isExamInFinalizingWindow(
  exam: {
    is_completed?: boolean;
    is_practice_mode?: boolean;
    results_published?: boolean;
    completed_at?: Date | string | null;
    exam_date_time: Date | string;
    duration_minutes: number;
  },
  now: Date = new Date()
): boolean {
  if (!exam.is_completed || exam.is_practice_mode || exam.results_published) {
    return false;
  }

  return now < getPracticeModeStartTime(exam);
}

export function isExamWithinWindow(
  exam: ExamTimingFields,
  now: Date = new Date()
): boolean {
  const startTime = new Date(exam.exam_date_time);
  const endTime = getExamEndTime(exam);
  return now >= startTime && now <= endTime;
}

export function hasExamStarted(
  exam: ExamTimingFields,
  now: Date = new Date()
): boolean {
  if (exam.is_started) {
    return true;
  }

  return now >= new Date(exam.exam_date_time);
}

export function hasExamEnded(
  exam: ExamTimingFields,
  now: Date = new Date()
): boolean {
  return now > getExamEndTime(exam);
}
