import cron from "node-cron";
import mongoose from "mongoose";
import { ExamModel } from "./exam.model";
import { eventBus } from "@/events/EventBus";
import { getExamEndTime, getPracticeModeStartTime } from "./exam.utils";
import { buildAdminActivityPayload } from "@/modules/notification/notification.helpers";

let schedulerInitialized = false;

/** Safety: skip lifecycle queries when MongoDB is not connected (e.g. empty/missing env on boot). */
function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

async function backfillLegacyCompletedExams(): Promise<void> {
  const unpublished = await ExamModel.updateMany(
    {
      is_completed: true,
      results_published: { $ne: true },
    },
    { $set: { results_published: true } }
  );

  if (unpublished.modifiedCount > 0) {
    console.info(
      `[ExamScheduler] Backfilled results_published for ${unpublished.modifiedCount} legacy completed exam(s)`
    );
  }

  const practiceBackfill = await ExamModel.updateMany(
    {
      is_completed: true,
      results_published: true,
      is_practice_mode: { $ne: true },
    },
    { $set: { is_practice_mode: true } }
  );

  if (practiceBackfill.modifiedCount > 0) {
    console.info(
      `[ExamScheduler] Enabled practice mode for ${practiceBackfill.modifiedCount} legacy completed exam(s)`
    );
  }
}

async function autoPublishScheduledExams(): Promise<void> {
  const now = new Date();

  const result = await ExamModel.updateMany(
    {
      manual_status_override: { $ne: true },
      is_published: false,
      is_started: false,
      is_completed: false,
      exam_date_time: { $gt: now },
    },
    { $set: { is_published: true } }
  );

  if (result.modifiedCount > 0) {
    console.info(
      `[ExamScheduler] Auto-published ${result.modifiedCount} scheduled exam(s)`
    );
  }
}

async function autoStartExams(): Promise<void> {
  const now = new Date();

  const examsToStart = await ExamModel.find({
    manual_status_override: { $ne: true },
    is_started: false,
    is_completed: false,
    exam_date_time: { $lte: now },
  })
    .select("exam_number exam_name is_published")
    .lean();

  if (examsToStart.length === 0) {
    return;
  }

  await ExamModel.updateMany(
    {
      manual_status_override: { $ne: true },
      is_started: false,
      is_completed: false,
      exam_date_time: { $lte: now },
    },
    { $set: { is_started: true, is_published: true } }
  );

  for (const exam of examsToStart) {
    try {
      await eventBus.publish({
        type: "EXAM_UPDATED",
        payload: buildAdminActivityPayload({
          actor: { id: "system", name: "System" },
          action: "updated",
          entityType: "exam",
          entityLabel: `"${exam.exam_name || "Exam"}" started automatically`,
          entityId: String(exam.exam_number ?? ""),
          module: "exam",
          title: "Exam Started",
          description: `Exam "${exam.exam_name || "Exam"}" started automatically`,
        }),
      });
    } catch (error) {
      console.error(
        `[ExamScheduler] Failed to publish auto-start event for exam ${exam.exam_number}:`,
        error
      );
    }
  }

  console.info(`[ExamScheduler] Auto-started ${examsToStart.length} exam(s)`);
}

async function autoMarkExamsCompleted(): Promise<void> {
  const now = new Date();

  const candidateExams = await ExamModel.find({
    manual_status_override: { $ne: true },
    is_started: true,
    is_completed: false,
  })
    .select("exam_number exam_name exam_date_time duration_minutes")
    .lean();

  const examsToComplete = candidateExams.filter(
    (exam) => getExamEndTime(exam) <= now
  );

  if (examsToComplete.length === 0) {
    return;
  }

  const examNumbers = examsToComplete
    .map((exam) => exam.exam_number)
    .filter(
      (examNumber): examNumber is number =>
        examNumber !== undefined &&
        examNumber !== null &&
        !Number.isNaN(Number(examNumber))
    );

  if (examNumbers.length === 0) {
    return;
  }

  await ExamModel.updateMany(
    { exam_number: { $in: examNumbers } },
    { $set: { is_completed: true, completed_at: now } }
  );

  for (const exam of examsToComplete) {
    try {
      await eventBus.publish({
        type: "EXAM_UPDATED",
        payload: buildAdminActivityPayload({
          actor: { id: "system", name: "System" },
          action: "updated",
          entityType: "exam",
          entityLabel: `"${exam.exam_name || "Exam"}" marked completed`,
          entityId: String(exam.exam_number ?? ""),
          module: "exam",
          title: "Exam Completed",
          description: `Exam "${exam.exam_name || "Exam"}" duration ended and was marked completed`,
        }),
      });
    } catch (error) {
      console.error(
        `[ExamScheduler] Failed to publish auto-complete event for exam ${exam.exam_number}:`,
        error
      );
    }
  }

  console.info(
    `[ExamScheduler] Marked ${examsToComplete.length} exam(s) as completed`
  );
}

async function autoPublishResultsAndEnablePractice(): Promise<void> {
  const now = new Date();

  const candidateExams = await ExamModel.find({
    manual_status_override: { $ne: true },
    is_completed: true,
    is_practice_mode: { $ne: true },
    results_published: false,
  })
    .select(
      "exam_number exam_name exam_date_time duration_minutes completed_at"
    )
    .lean();

  const examsToPublish = candidateExams.filter(
    (exam) => getPracticeModeStartTime(exam) <= now
  );

  if (examsToPublish.length === 0) {
    return;
  }

  const examNumbers = examsToPublish
    .map((exam) => exam.exam_number)
    .filter(
      (examNumber): examNumber is number =>
        examNumber !== undefined &&
        examNumber !== null &&
        !Number.isNaN(Number(examNumber))
    );

  if (examNumbers.length === 0) {
    return;
  }

  await ExamModel.updateMany(
    { exam_number: { $in: examNumbers } },
    {
      $set: {
        results_published: true,
        is_practice_mode: true,
      },
    }
  );

  for (const exam of examsToPublish) {
    try {
      await eventBus.publish({
        type: "EXAM_UPDATED",
        payload: buildAdminActivityPayload({
          actor: { id: "system", name: "System" },
          action: "updated",
          entityType: "exam",
          entityLabel: `"${exam.exam_name || "Exam"}" results published`,
          entityId: String(exam.exam_number ?? ""),
          module: "exam",
          title: "Results Published",
          description: `Exam "${exam.exam_name || "Exam"}" results published and practice mode enabled`,
        }),
      });
    } catch (error) {
      console.error(
        `[ExamScheduler] Failed to publish practice-mode event for exam ${exam.exam_number}:`,
        error
      );
    }
  }

  console.info(
    `[ExamScheduler] Published results and enabled practice mode for ${examsToPublish.length} exam(s)`
  );
}

async function autoEndAndPublishExams(): Promise<void> {
  await autoMarkExamsCompleted();
  await autoPublishResultsAndEnablePractice();
}

async function runExamLifecycleTick(): Promise<void> {
  if (!isDatabaseReady()) {
    console.warn(
      "[ExamScheduler] Skipping lifecycle tick — database is not connected."
    );
    return;
  }

  try {
    await autoPublishScheduledExams();
    await autoStartExams();
    await autoEndAndPublishExams();
  } catch (error) {
    console.error("[ExamScheduler] Lifecycle tick failed:", error);
  }
}

/** Runs auto-start/end immediately — used by cron and exam read APIs. */
export async function syncExamLifecycle(): Promise<void> {
  await runExamLifecycleTick();
}

export async function initExamScheduler(): Promise<void> {
  if (schedulerInitialized) {
    return;
  }

  try {
    if (!isDatabaseReady()) {
      console.warn(
        "[ExamScheduler] Database not connected — skipping boot lifecycle sync."
      );
    } else {
      await backfillLegacyCompletedExams();
      await runExamLifecycleTick();
    }
  } catch (error) {
    // Safety: scheduler failure must not prevent the HTTP server from starting.
    console.error("[ExamScheduler] Boot initialization failed:", error);
  }

  cron.schedule("* * * * *", () => {
    void runExamLifecycleTick();
  });

  schedulerInitialized = true;
  console.info("[ExamScheduler] Initialized — running every 1 minute");
}
