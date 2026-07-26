import cron from "node-cron";
import { ExamModel } from "./exam.model";
import { eventBus } from "@/events/EventBus";
import { getExamEndTime } from "./exam.utils";

let schedulerInitialized = false;

async function backfillLegacyCompletedExams(): Promise<void> {
  const result = await ExamModel.updateMany(
    {
      is_completed: true,
      results_published: { $ne: true },
    },
    { $set: { results_published: true } }
  );

  if (result.modifiedCount > 0) {
    console.info(
      `[ExamScheduler] Backfilled results_published for ${result.modifiedCount} legacy completed exam(s)`
    );
  }
}

async function autoStartExams(): Promise<void> {
  const now = new Date();

  const examsToStart = await ExamModel.find({
    is_published: true,
    is_started: false,
    exam_date_time: { $lte: now },
  })
    .select("exam_number exam_name")
    .lean();

  if (examsToStart.length === 0) {
    return;
  }

  await ExamModel.updateMany(
    {
      is_published: true,
      is_started: false,
      exam_date_time: { $lte: now },
    },
    { $set: { is_started: true } }
  );

  for (const exam of examsToStart) {
    await eventBus.publish({
      type: "EXAM_UPDATED",
      payload: {
        userId: "system",
        title: exam.exam_name || "Exam",
        description: "Exam started automatically",
        module: "exam",
        time: now.toISOString(),
        examId: exam.exam_number?.toString() || "",
      },
    });
  }

  console.info(`[ExamScheduler] Auto-started ${examsToStart.length} exam(s)`);
}

async function autoEndAndPublishExams(): Promise<void> {
  const now = new Date();

  const candidateExams = await ExamModel.find({
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

  const examNumbers = examsToComplete.map((exam) => exam.exam_number);

  await ExamModel.updateMany(
    { exam_number: { $in: examNumbers } },
    { $set: { is_completed: true, results_published: true } }
  );

  for (const exam of examsToComplete) {
    await eventBus.publish({
      type: "EXAM_UPDATED",
      payload: {
        userId: "system",
        title: exam.exam_name || "Exam",
        description: "Exam completed and results published automatically",
        module: "exam",
        time: now.toISOString(),
        examId: exam.exam_number?.toString() || "",
      },
    });
  }

  console.info(
    `[ExamScheduler] Auto-completed and published results for ${examsToComplete.length} exam(s)`
  );
}

async function runExamLifecycleTick(): Promise<void> {
  try {
    await autoStartExams();
    await autoEndAndPublishExams();
  } catch (error) {
    console.error("[ExamScheduler] Lifecycle tick failed:", error);
  }
}

export async function initExamScheduler(): Promise<void> {
  if (schedulerInitialized) {
    return;
  }

  await backfillLegacyCompletedExams();
  await runExamLifecycleTick();

  cron.schedule("* * * * *", () => {
    void runExamLifecycleTick();
  });

  schedulerInitialized = true;
  console.info("[ExamScheduler] Initialized — running every 1 minute");
}
