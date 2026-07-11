import mongoose from "mongoose";
import { envConfig } from "../config";
import { ResultModel, syncResultIndexes } from "@/modules/results/result.model";
import { ExamModel } from "@/modules/exam/exam.model";
import { resultService } from "@/modules/results/result.service";
import { examService } from "@/modules/exam/exam.service";
import { IJWtPayload } from "@/interfaces/common.interface";
import { ROLES } from "@/constants/roles";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

import { UserModel } from "@/modules/user/user.model";

const TEST_EXAM_NUMBER = 999999991;
const USER_A_PHONE = "01900000001";
const USER_B_PHONE = "01900000002";
const USER_C_PHONE = "01900000003";

let userA: IJWtPayload;

const basePayload = {
  exam_number: TEST_EXAM_NUMBER,
  total_score: 100,
  score: 80,
  totalQuestions: 2,
  correctAnswers: 2,
  wrongAnswers: 0,
  unanswered: 0,
  is_cheated: false,
  is_on_time: true,
  writtenExam: [],
};

type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const results: TestResult[] = [];

function record(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} - ${name}: ${detail}`);
}

async function expectConflict(fn: () => Promise<unknown>) {
  try {
    await fn();
    return false;
  } catch (error) {
    return (
      error instanceof ApiError && error.statusCode === HttpStatusCode.CONFLICT
    );
  }
}

async function main() {
  await mongoose.connect(envConfig.database.mongodb_url, {
    ssl: true,
    retryWrites: true,
    serverSelectionTimeoutMS: 10000,
  });

  await syncResultIndexes();

  const indexes = await ResultModel.collection.indexes();
  const compoundIndex = indexes.find(
    (index) =>
      index.key?.exam_number === 1 &&
      index.key?.student_phone === 1 &&
      index.unique === true
  );
  const legacyIndex = indexes.find(
    (index) =>
      index.key?.exam_number === 1 &&
      index.unique === true &&
      index.key?.student_phone === undefined
  );

  record(
    "Compound unique index exists",
    Boolean(compoundIndex),
    compoundIndex?.name || "missing"
  );
  record(
    "Legacy exam_number-only unique index removed",
    !legacyIndex,
    legacyIndex?.name || "not present"
  );

  await ResultModel.deleteMany({
    exam_number: TEST_EXAM_NUMBER,
    student_phone: { $in: [USER_A_PHONE, USER_B_PHONE, USER_C_PHONE] },
  });
  await ExamModel.deleteOne({ exam_number: TEST_EXAM_NUMBER });
  await UserModel.deleteMany({
    phone_number: { $in: [USER_A_PHONE, USER_B_PHONE, USER_C_PHONE] },
  });

  const [createdUserA] = await UserModel.insertMany([
    {
      name: "Verify User A",
      phone_number: USER_A_PHONE,
      password: "verify-test-password",
      role: ROLES.STUDENT,
      status: "active",
    },
    {
      name: "Verify User B",
      phone_number: USER_B_PHONE,
      password: "verify-test-password",
      role: ROLES.STUDENT,
      status: "active",
    },
    {
      name: "Verify User C",
      phone_number: USER_C_PHONE,
      password: "verify-test-password",
      role: ROLES.STUDENT,
      status: "active",
    },
  ]);

  userA = {
    id: createdUserA._id.toString(),
    phone_number: USER_A_PHONE,
    name: "Verify User A",
    role: ROLES.STUDENT,
  };

  await ExamModel.create({
    exam_number: TEST_EXAM_NUMBER,
    exam_name: "Verification Exam",
    exam_date_time: new Date(),
    duration_minutes: 120,
    total_marks: 100,
    is_started: true,
    is_completed: false,
    is_published: true,
    negative_mark: 0,
    questions: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
  });

  await ResultModel.create({
    student_name: userA.name!,
    student_phone: USER_A_PHONE,
    exam_number: TEST_EXAM_NUMBER,
    total_score: 100,
    score: 70,
    totalQuestions: 2,
    correctAnswers: 2,
    wrongAnswers: 0,
    unanswered: 0,
    is_cheated: false,
    is_on_time: true,
  });

  await ResultModel.create({
    student_name: "Verify User B",
    student_phone: USER_B_PHONE,
    exam_number: TEST_EXAM_NUMBER,
    total_score: 100,
    score: 85,
    totalQuestions: 2,
    correctAnswers: 2,
    wrongAnswers: 0,
    unanswered: 0,
    is_cheated: false,
    is_on_time: true,
  });

  const sameExamCount = await ResultModel.countDocuments({
    exam_number: TEST_EXAM_NUMBER,
  });
  record(
    "Multiple users can submit the same exam",
    sameExamCount >= 2,
    `found ${sameExamCount} submissions for exam ${TEST_EXAM_NUMBER}`
  );

  const duplicateBlocked = await expectConflict(() =>
    resultService.createResult(basePayload, userA)
  );
  record(
    "Duplicate submission blocked for same user",
    duplicateBlocked,
    "expected 409 conflict"
  );

  const listForUserA = await examService.getAllExamsForUsers(
    { page: 1, limit: 50 },
    USER_A_PHONE
  );
  const userAExam = listForUserA.data.find(
    (exam: { exam_number?: number }) => exam.exam_number === TEST_EXAM_NUMBER
  );
  record(
    "Exam list marks submitted exam for User A",
    Boolean(userAExam?.is_attends_exam),
    `is_attends_exam=${String(userAExam?.is_attends_exam)}`
  );

  const listForUserC = await examService.getAllExamsForUsers(
    { page: 1, limit: 50 },
    USER_C_PHONE
  );
  const userCExam = listForUserC.data.find(
    (exam: { exam_number?: number }) => exam.exam_number === TEST_EXAM_NUMBER
  );
  record(
    "Exam list shows unsubmitted exam for User C",
    userCExam?.is_attends_exam === false,
    `is_attends_exam=${String(userCExam?.is_attends_exam)}`
  );

  await ResultModel.deleteMany({
    exam_number: TEST_EXAM_NUMBER,
    student_phone: { $in: [USER_A_PHONE, USER_B_PHONE, USER_C_PHONE] },
  });
  await ExamModel.deleteOne({ exam_number: TEST_EXAM_NUMBER });
  await UserModel.deleteMany({
    phone_number: { $in: [USER_A_PHONE, USER_B_PHONE, USER_C_PHONE] },
  });

  const passed = results.filter((item) => item.passed).length;
  const failed = results.length - passed;

  console.log("\nVerification summary");
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error("Verification script failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
