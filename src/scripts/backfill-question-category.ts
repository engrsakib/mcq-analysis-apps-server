/**
 * One-time migration: create a default study topic (if none exists)
 * and backfill category_id on questions missing it.
 *
 * Run: npm run migrate:question-topics
 */
import mongoose from "mongoose";
import { envConfig } from "../config";
import { BarcodeService } from "@/lib/barcode";
import { QuestionModel } from "@/modules/questions/questuon.model";
import { QuestionStudyTopicModel } from "@/modules/question-study-topic/question-study-topic.model";
import { StudyTopicType } from "@/modules/question-study-topic/question-study-topic.enum";

const DEFAULT_TOPIC_NAME = "General (Uncategorized)";

async function run() {
  const mongoUrl = envConfig.database.mongodb_url?.trim();

  if (!mongoUrl) {
    console.error("MONGODB_URL is missing. Aborting migration.");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");

  let defaultTopic = await QuestionStudyTopicModel.findOne({
    name: DEFAULT_TOPIC_NAME,
  });

  if (!defaultTopic) {
    const lastTopic = await QuestionStudyTopicModel.findOne()
      .sort({ position: -1 })
      .select("position");

    defaultTopic = await QuestionStudyTopicModel.create({
      name: DEFAULT_TOPIC_NAME,
      type: StudyTopicType.GENERAL,
      category_number: await BarcodeService.generateEAN13(),
      position: (lastTopic?.position ?? 0) + 1,
    });

    console.log(
      `Created default topic "${DEFAULT_TOPIC_NAME}" (${defaultTopic.category_number})`
    );
  } else {
    console.log(
      `Using existing default topic "${DEFAULT_TOPIC_NAME}" (${defaultTopic.category_number})`
    );
  }

  const result = await QuestionModel.updateMany(
    {
      $or: [{ category_id: { $exists: false } }, { category_id: null }],
    },
    { $set: { category_id: defaultTopic._id } }
  );

  console.log(`Backfilled category_id on ${result.modifiedCount} question(s)`);

  await mongoose.disconnect();
  console.log("Migration complete");
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
