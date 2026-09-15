import { DateTime } from "luxon";
import { ROLES } from "@/constants/roles";
import {
  NotificationEventPayload,
  NotificationModuleName,
} from "@/events/EventTypes";
import { ExamModel } from "@/modules/exam/exam.model";
import { IExam } from "@/modules/exam/exam.interface";
import { UserModel } from "@/modules/user/user.model";
import { resultService } from "@/modules/results/result.service";
import {
  formatRelativeTime,
  notifyAllUsers,
  notifyUser,
} from "./notification.helpers";

const BANGLADESH_TIMEZONE = "Asia/Dhaka";
const ANNOUNCEMENT_BODY_MAX = 120;

const RANK_ORDINALS = ["1st", "2nd", "3rd"] as const;

type ExamNotifyFields = Pick<
  IExam,
  | "exam_name"
  | "exam_number"
  | "exam_date_time"
  | "is_published"
  | "is_started"
  | "is_completed"
  | "results_published"
>;

function formatExamStartLabel(examDateTime: Date | string | undefined): string {
  if (!examDateTime) return "the scheduled time";

  const dt =
    examDateTime instanceof Date
      ? DateTime.fromJSDate(examDateTime, { zone: "utc" }).setZone(
          BANGLADESH_TIMEZONE
        )
      : DateTime.fromISO(String(examDateTime), { setZone: true }).setZone(
          BANGLADESH_TIMEZONE
        );

  if (!dt.isValid) return "the scheduled time";
  return dt.toFormat("dd LLL yyyy, hh:mm a");
}

function truncateText(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 3).trimEnd()}...`;
}

export function buildStudentPayload(options: {
  title: string;
  description: string;
  module: NotificationModuleName;
  examId?: string | number;
  announcementId?: string | number;
  kind?: string;
}): NotificationEventPayload {
  return {
    title: options.title,
    description: options.description,
    module: options.module,
    time: formatRelativeTime(new Date()),
    actorName: "System",
    actorId: "system",
    action: "updated",
    examId: options.examId,
    announcementId: options.announcementId,
    entityId:
      options.examId != null
        ? String(options.examId)
        : options.announcementId != null
          ? String(options.announcementId)
          : undefined,
    entityType:
      options.module === "announcement"
        ? "announcement"
        : options.module === "result"
          ? "result"
          : "exam",
    kind: options.kind,
  };
}

export async function broadcastToStudents(
  payload: NotificationEventPayload
): Promise<void> {
  await notifyAllUsers(payload);
}

export async function notifyExamGoLive(exam: ExamNotifyFields): Promise<void> {
  const name = exam.exam_name?.trim() || "Exam";
  const startLabel = formatExamStartLabel(exam.exam_date_time);
  await broadcastToStudents(
    buildStudentPayload({
      title: "Exam is live",
      description: `${name} is now available. Starts at ${startLabel}.`,
      module: "exam",
      examId: exam.exam_number,
      kind: "exam_go_live",
    })
  );
}

export async function notifyExamStarted(exam: ExamNotifyFields): Promise<void> {
  const name = exam.exam_name?.trim() || "Exam";
  await broadcastToStudents(
    buildStudentPayload({
      title: "Exam started",
      description: `${name} has started. Join now.`,
      module: "exam",
      examId: exam.exam_number,
      kind: "exam_started",
    })
  );
}

export async function notifyExamEnded(exam: ExamNotifyFields): Promise<void> {
  const name = exam.exam_name?.trim() || "Exam";
  await broadcastToStudents(
    buildStudentPayload({
      title: "Exam ended",
      description: `${name} has ended.`,
      module: "exam",
      examId: exam.exam_number,
      kind: "exam_ended",
    })
  );
}

export async function notifyResultsPublished(
  exam: ExamNotifyFields
): Promise<void> {
  const name = exam.exam_name?.trim() || "Exam";
  await broadcastToStudents(
    buildStudentPayload({
      title: "Results published",
      description: `Results for ${name} are now available.`,
      module: "result",
      examId: exam.exam_number,
      kind: "results_published",
    })
  );
}

export async function notifyAnnouncementPublished(options: {
  title: string;
  body: string;
  announcementNumber?: number;
}): Promise<void> {
  const title = options.title?.trim() || "New announcement";
  const body = truncateText(options.body ?? "", ANNOUNCEMENT_BODY_MAX);
  await broadcastToStudents(
    buildStudentPayload({
      title,
      description: body || title,
      module: "announcement",
      announcementId: options.announcementNumber,
      kind: "announcement_published",
    })
  );
}

export async function sendTopRankCongratulations(options: {
  examNumber: number;
  examName: string;
}): Promise<void> {
  const claimed = await ExamModel.findOneAndUpdate(
    {
      exam_number: options.examNumber,
      rank_notifications_sent: { $ne: true },
    },
    { $set: { rank_notifications_sent: true } }
  ).select("_id");

  if (!claimed) {
    return;
  }

  const topStudents = await resultService.getTopRankedStudents(
    options.examNumber,
    3
  );

  const examName = options.examName?.trim() || "Exam";

  for (let i = 0; i < topStudents.length; i++) {
    const row = topStudents[i];
    const ordinal = RANK_ORDINALS[i] ?? `${i + 1}th`;

    const studentUser = await UserModel.findOne({
      phone_number: row.student_phone,
      is_Deleted: false,
      role: ROLES.STUDENT,
    })
      .select("_id")
      .lean<{ _id: { toString(): string } } | null>();

    if (!studentUser) {
      console.warn(
        `[Notification] Top rank skipped — no student user for phone on exam ${options.examNumber}`
      );
      continue;
    }

    await notifyUser({
      userId: studentUser._id.toString(),
      title: "Congratulations!",
      description: `Congratulations! You ranked ${ordinal} in ${examName}.`,
      module: "result",
      time: formatRelativeTime(new Date()),
      audience: "user",
      examId: options.examNumber,
      entityType: "result",
      entityId: String(options.examNumber),
      kind: "leaderboard_top_rank",
    });
  }
}

export async function handleExamStatusTransition(
  before: ExamNotifyFields,
  after: ExamNotifyFields
): Promise<void> {
  const wasPublished = Boolean(before.is_published);
  const isPublished = Boolean(after.is_published);
  const wasStarted = Boolean(before.is_started);
  const isStarted = Boolean(after.is_started);
  const wasCompleted = Boolean(before.is_completed);
  const isCompleted = Boolean(after.is_completed);
  const wasResultsPublished = Boolean(before.results_published);
  const isResultsPublished = Boolean(after.results_published);

  if (!wasPublished && isPublished) {
    await notifyExamGoLive(after);
  }
  if (!wasStarted && isStarted) {
    await notifyExamStarted(after);
  }
  if (!wasCompleted && isCompleted) {
    await notifyExamEnded(after);
  }
  if (!wasResultsPublished && isResultsPublished) {
    await notifyResultsPublished(after);
    if (after.exam_number != null && !Number.isNaN(Number(after.exam_number))) {
      await sendTopRankCongratulations({
        examNumber: Number(after.exam_number),
        examName: after.exam_name || "Exam",
      });
    }
  }
}
