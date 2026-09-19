/**
 * Optional one-time setup: set the question_number counter to max(existing short IDs)
 * so the next allocated ID does not collide with questions numbered 1–999999.
 *
 * Does NOT renumber legacy EAN-style question IDs.
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/init-question-number-counter.ts
 */
import dotenv from "dotenv";
import path from "path";
import mongodbConnection from "../config/mongoDbConnection";
import { CounterModel } from "../common/models/counter.model";
import { QuestionModel } from "../modules/questions/questuon.model";
import {
  QUESTION_NUMBER_COUNTER_NAME,
  QUESTION_NUMBER_MAX,
} from "../lib/questionNumber";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const connected = await mongodbConnection();
  if (!connected) {
    console.error("MongoDB connection failed");
    process.exit(1);
  }

  const shortIds = await QuestionModel.find({
    questionId: { $gte: 1, $lte: QUESTION_NUMBER_MAX },
  })
    .select("questionId")
    .lean<{ questionId?: number }[]>();

  const maxShort = shortIds.reduce(
    (max, doc) => Math.max(max, doc.questionId ?? 0),
    0
  );

  await CounterModel.findOneAndUpdate(
    { name: QUESTION_NUMBER_COUNTER_NAME },
    { $set: { sequence: maxShort } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  console.info(
    `Question counter "${QUESTION_NUMBER_COUNTER_NAME}" set to sequence=${maxShort}. Next new question will be ${maxShort + 1}.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
