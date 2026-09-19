import { CounterModel } from "@/common/models/counter.model";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

export const QUESTION_NUMBER_COUNTER_NAME = "question_number";
export const QUESTION_NUMBER_MAX = 9999;

export function formatQuestionIdForDisplay(questionId: number): string {
  if (
    Number.isFinite(questionId) &&
    questionId >= 1 &&
    questionId <= QUESTION_NUMBER_MAX
  ) {
    return String(Math.trunc(questionId)).padStart(4, "0");
  }
  return String(questionId);
}

export async function allocateNextQuestionNumber(): Promise<number> {
  const counterDoc = await CounterModel.findOneAndUpdate(
    { name: QUESTION_NUMBER_COUNTER_NAME },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  const sequence = counterDoc?.sequence ?? 1;

  if (sequence > QUESTION_NUMBER_MAX) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      `Question ID limit reached (${QUESTION_NUMBER_MAX}). Contact support.`
    );
  }

  return sequence;
}
