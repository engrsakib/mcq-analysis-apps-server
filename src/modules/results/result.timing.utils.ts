import { getExamEndTime, isExamWithinWindow } from "@/modules/exam/exam.utils";

type ExamTimingSource = {
  exam_date_time: Date | string;
  duration_minutes: number;
};

export function parseClientInstant(
  value: string | undefined,
  fallback: Date = new Date()
): Date {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

export function resolveSubmissionInstant(options: {
  clientSubmittedAt?: string;
  serverNow?: Date;
}): Date {
  return parseClientInstant(
    options.clientSubmittedAt,
    options.serverNow ?? new Date()
  );
}

export function resolveSessionStartedAt(
  sessionStartedAt: string | undefined
): Date | null {
  if (!sessionStartedAt?.trim()) {
    return null;
  }

  const parsed = new Date(sessionStartedAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function computeAttemptIsOnTime(options: {
  exam: ExamTimingSource;
  submitInstant: Date;
  sessionStartedAt: Date | null;
  clientIsOnTime?: boolean;
}): boolean {
  const { exam, submitInstant, sessionStartedAt, clientIsOnTime } = options;

  if (
    !isExamWithinWindow(
      {
        exam_date_time: new Date(exam.exam_date_time),
        duration_minutes: exam.duration_minutes,
      },
      submitInstant
    )
  ) {
    return false;
  }

  const examEnd = getExamEndTime({
    exam_date_time: new Date(exam.exam_date_time),
    duration_minutes: exam.duration_minutes,
  });

  if (sessionStartedAt) {
    const personalDeadline = new Date(sessionStartedAt);
    personalDeadline.setMinutes(
      personalDeadline.getMinutes() + exam.duration_minutes
    );
    const effectiveDeadline =
      personalDeadline.getTime() <= examEnd.getTime()
        ? personalDeadline
        : examEnd;

    if (submitInstant.getTime() > effectiveDeadline.getTime()) {
      return false;
    }
  }

  if (typeof clientIsOnTime === "boolean") {
    return clientIsOnTime;
  }

  return true;
}

export function sanitizeClientSubmittedAt(options: {
  clientSubmittedAt?: string;
  examStart: Date;
  serverNow?: Date;
}): Date {
  const serverNow = options.serverNow ?? new Date();
  const parsed = parseClientInstant(options.clientSubmittedAt, serverNow);

  if (parsed.getTime() > serverNow.getTime() + 60_000) {
    return serverNow;
  }

  if (parsed.getTime() < options.examStart.getTime() - 86_400_000) {
    return serverNow;
  }

  return parsed;
}
