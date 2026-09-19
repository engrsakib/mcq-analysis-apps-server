/**
 * Optional one-time setup: set the exam_number counter to max(existing short IDs)
 * so the next allocated ID does not collide with exams numbered 1–9999.
 *
 * Does NOT renumber legacy EAN-style exam numbers.
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/init-exam-number-counter.ts
 */
import dotenv from "dotenv";
import path from "path";
import mongodbConnection from "../config/mongoDbConnection";
import { CounterModel } from "../common/models/counter.model";
import { ExamModel } from "../modules/exam/exam.model";
import { EXAM_NUMBER_COUNTER_NAME, EXAM_NUMBER_MAX } from "../lib/examNumber";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const connected = await mongodbConnection();
  if (!connected) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }

  const shortIds = await ExamModel.find({
    exam_number: { $gte: 1, $lte: EXAM_NUMBER_MAX },
  })
    .select("exam_number")
    .lean<{ exam_number?: number }[]>();

  const maxShort = shortIds.reduce(
    (max, doc) => Math.max(max, doc.exam_number ?? 0),
    0
  );

  await CounterModel.findOneAndUpdate(
    { name: EXAM_NUMBER_COUNTER_NAME },
    { $set: { sequence: maxShort } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.info(
    `Exam counter "${EXAM_NUMBER_COUNTER_NAME}" set to sequence=${maxShort}. Next new exam will be ${maxShort + 1}.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
