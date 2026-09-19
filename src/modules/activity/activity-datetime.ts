import { DateTime } from "luxon";

const BANGLADESH_TIMEZONE = "Asia/Dhaka";
const CLOCK_12H = "MMM d, yyyy · h:mm a";
const CLOCK_12H_TIME = "h:mm a";

function toDhaka(value: Date | string): DateTime | null {
  const dt =
    value instanceof Date
      ? DateTime.fromJSDate(value, { zone: "utc" }).setZone(BANGLADESH_TIMEZONE)
      : DateTime.fromISO(String(value), { setZone: true }).setZone(
          BANGLADESH_TIMEZONE
        );

  return dt.isValid ? dt : null;
}

export function formatActivityClock12h(value: Date | string): string {
  const dt = toDhaka(value);
  if (!dt) {
    return String(value);
  }

  return dt.toFormat(CLOCK_12H);
}

export function formatDurationBetween(
  start: Date | string,
  end: Date | string
): string {
  const from = toDhaka(start);
  const to = toDhaka(end);
  if (!from || !to) {
    return "";
  }

  const totalSec = Math.max(
    0,
    Math.round((to.toMillis() - from.toMillis()) / 1000)
  );
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} sec`);
  }

  return parts.join(" ");
}

export function formatAwayRange(
  startedAt: Date | string,
  endedAt?: Date | string | null
): string {
  const startLabel = formatActivityClock12h(startedAt);
  if (!endedAt) {
    return `from ${startLabel} (still away from the exam)`;
  }

  const startDt = toDhaka(startedAt);
  const endDt = toDhaka(endedAt);
  const sameDay = Boolean(startDt && endDt && startDt.hasSame(endDt, "day"));
  const endLabel =
    sameDay && endDt
      ? endDt.toFormat(CLOCK_12H_TIME)
      : formatActivityClock12h(endedAt);
  const duration = formatDurationBetween(startedAt, endedAt);

  return `from ${startLabel} to ${endLabel} (${duration})`;
}

export function humanizeEventType(eventType: string): string {
  return eventType.replace(/_/g, " ").trim() || eventType;
}

export function buildProctoringDescription(input: {
  actorName: string;
  eventType: string;
  examName: string;
  startedAt: string;
  endedAt?: string;
}): string {
  const kind = humanizeEventType(input.eventType);
  const range = formatAwayRange(input.startedAt, input.endedAt);

  return `${input.actorName} left the exam (${kind}) during "${input.examName}" ${range}`;
}
