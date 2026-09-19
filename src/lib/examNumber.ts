import { CounterModel } from "@/common/models/counter.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

export const EXAM_NUMBER_COUNTER_NAME = "exam_number";
export const EXAM_NUMBER_MAX = 9999;

export function formatExamNumberForDisplay(examNumber: number): string {
  if (
    Number.isFinite(examNumber) &&
    examNumber >= 1 &&
    examNumber <= EXAM_NUMBER_MAX
  ) {
    return String(Math.trunc(examNumber)).padStart(4, "0");
  }
  return String(examNumber);
}

export async function allocateNextExamNumber(): Promise<number> {
  const counterDoc = await CounterModel.findOneAndUpdate(
    { name: EXAM_NUMBER_COUNTER_NAME },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  const sequence = counterDoc?.sequence ?? 1;

  if (sequence > EXAM_NUMBER_MAX) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      `Exam number limit reached (${EXAM_NUMBER_MAX}). Contact support.`
    );
  }

  return sequence;
}
