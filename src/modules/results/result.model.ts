import { model, Schema } from "mongoose";
import { IResult, IwrittenExam } from "./result.interface";

const WrittenExamSchema = new Schema<IwrittenExam>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: true }
);

const ResultSchema = new Schema<IResult>(
  {
    student_name: {
      type: String,
      required: true,
    },
    student_phone: {
      type: String,
      required: true,
      default: "",
    },
    exam_number: {
      type: Number,
      required: false,
    },
    total_score: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    unanswered: {
      type: Number,
      required: true,
      default: 0,
    },
    is_cheated: {
      type: Boolean,
      required: true,
      default: false,
    },
    is_on_time: {
      type: Boolean,
      required: true,
      default: true,
    },
    dateTaken: {
      type: Date,
      required: true,
      default: Date.now,
    },
    writtenExam: {
      type: [WrittenExamSchema],
      default: [],
    },
    is_written_mark_updated: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ exam_number: 1, student_phone: 1 }, { unique: true });

export const ResultModel = model<IResult>("Result", ResultSchema);

export async function syncResultIndexes(): Promise<void> {
  try {
    const collection = ResultModel.collection;
    const indexes = await collection.indexes();

    const legacyUniqueExamIndex = indexes.find(
      (index) =>
        index.key?.exam_number === 1 &&
        index.unique === true &&
        index.key?.student_phone === undefined
    );

    if (legacyUniqueExamIndex?.name) {
      await collection.dropIndex(legacyUniqueExamIndex.name);
      console.info(
        `Dropped legacy Result index "${legacyUniqueExamIndex.name}" (exam_number unique)`
      );
    }

    await ResultModel.syncIndexes();
  } catch (error) {
    // Safety: rethrow so mongoDbConnection can log; caller treats this as non-fatal.
    console.error("[ResultModel] syncResultIndexes failed:", error);
    throw error;
  }
}
