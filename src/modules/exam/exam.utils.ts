type ExamTimingFields = {
  exam_date_time: Date;
  duration_minutes: number;
  is_started?: boolean;
};

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
