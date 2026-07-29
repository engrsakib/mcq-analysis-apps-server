import { DateTime } from "luxon";

type ExamTimingFields = {
  exam_date_time: Date;
  duration_minutes: number;
  is_started?: boolean;
};

const BANGLADESH_TIMEZONE = "Asia/Dhaka";

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

export function mapExamsWithBangladeshDateTime<T>(exams: T[]): T[] {
  return exams.map((exam) => withBangladeshExamDateTime(exam));
}

export function getExamEndTime(exam: ExamTimingFields): Date {
  const endTime = new Date(exam.exam_date_time);
  endTime.setMinutes(endTime.getMinutes() + exam.duration_minutes);
  return endTime;
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
