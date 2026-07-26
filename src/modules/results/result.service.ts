import { ADMIN_ROLE_VALUES, IAdminRole } from "@/constants/roles";
import { ICreateResultInput, IUpdateMarkPayload } from "./result.interface";
import { ResultModel } from "./result.model";
import { ExamAttemptModel } from "../exam-attempt/exam-attempt.model";
import { IExamAttempt } from "../exam-attempt/exam-attempt.interface";
import { eventBus } from "@/events/EventBus";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { ExamModel } from "../exam/exam.model";
import { UserModel } from "../user/user.model";
import { IJWtPayload } from "@/interfaces/common.interface";
import { IRoles } from "@/constants/roles";
import { hasExamStarted, isExamWithinWindow } from "../exam/exam.utils";

function toResultResponse(
  attempt: IExamAttempt,
  studentName: string,
  studentPhone: string,
  examNumber: number
) {
  return {
    _id: attempt._id,
    student_name: studentName,
    student_phone: studentPhone,
    exam_number: examNumber,
    total_score: attempt.total_score,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    correctAnswers: attempt.correctAnswers,
    wrongAnswers: attempt.wrongAnswers,
    unanswered: attempt.unanswered,
    is_cheated: attempt.is_cheated,
    is_on_time: attempt.is_on_time,
    dateTaken: attempt.dateTaken,
    writtenExam: attempt.writtenExam,
    is_written_mark_updated: false,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
}

class service {
  createResult = async (resultData: ICreateResultInput, user: IJWtPayload) => {
    const {
      exam_number,
      total_score,
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unanswered,
      is_cheated,
      writtenExam,
    } = resultData;

    if (!exam_number) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Exam number is required");
    }

    const [exam, existingResult, userRecord, priorAttemptCount] =
      await Promise.all([
        ExamModel.findOne({ exam_number })
          .select(
            "exam_name exam_date_time duration_minutes is_published is_started is_completed questions"
          )
          .lean(),
        ResultModel.findOne({
          exam_number,
          student_phone: user.phone_number,
        }).lean(),
        UserModel.findById(user.id)
          .select("name phone_number status is_Deleted")
          .lean(),
        ExamAttemptModel.countDocuments({
          exam_number,
          student_phone: user.phone_number,
        }),
      ]);

    if (!userRecord || userRecord.is_Deleted) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
    }

    if (userRecord.status === "inactive") {
      throw new ApiError(HttpStatusCode.FORBIDDEN, "User account is inactive");
    }

    if (!exam) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Exam not found");
    }

    if (!exam.is_published) {
      throw new ApiError(HttpStatusCode.FORBIDDEN, "Exam is not published");
    }

    if (!hasExamStarted(exam)) {
      throw new ApiError(HttpStatusCode.FORBIDDEN, "Exam has not started yet");
    }

    if (exam.questions.length !== totalQuestions) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Question count does not match the exam"
      );
    }

    if (correctAnswers + wrongAnswers + unanswered !== totalQuestions) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Answer counts do not match total questions"
      );
    }

    if (score < 0 || score > total_score) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid score");
    }

    const studentName = userRecord.name || user.name || "";
    const withinWindow = isExamWithinWindow(exam);
    const attemptNumber = priorAttemptCount + 1;
    const attemptIsOnTime = withinWindow;

    const attempt = await ExamAttemptModel.create({
      student_name: studentName,
      student_phone: user.phone_number,
      exam_number,
      attempt_number: attemptNumber,
      is_official: false,
      total_score,
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unanswered,
      is_cheated: is_cheated ?? false,
      is_on_time: attemptIsOnTime,
      writtenExam: writtenExam ?? [],
    });

    const shouldCreateOfficialResult =
      !existingResult && withinWindow && !exam.is_completed;

    if (shouldCreateOfficialResult) {
      const result = await ResultModel.create({
        student_name: studentName,
        student_phone: user.phone_number,
        exam_number,
        total_score,
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unanswered,
        is_cheated: is_cheated ?? false,
        is_on_time: true,
        writtenExam: writtenExam ?? [],
      });

      await ExamAttemptModel.updateOne(
        { _id: attempt._id },
        { $set: { is_official: true } }
      );

      await eventBus.publish({
        type: "RESULT_PUBLISHED",
        payload: {
          userId: user.phone_number,
          title: exam.exam_name || "Result",
          description: "Created successfully",
          module: "result",
          time: new Date().toISOString(),
          resultId: result._id.toString(),
        },
      });

      return result;
    }

    return toResultResponse(
      attempt,
      studentName,
      user.phone_number,
      exam_number
    );
  };

  getResultsBySearch = async (
    phone?: string,
    examNum?: number,
    page: number = 1,
    limit: number = 10
  ) => {
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (phone) {
      matchQuery.student_phone = phone;
    }
    if (examNum) {
      matchQuery.exam_number = examNum;
    }

    const result = await ResultModel.aggregate([
      {
        $match: matchQuery,
      },

      {
        $facet: {
          // ক. ডাটা আনার পাইপলাইন
          data: [
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                student_name: 1,
                student_phone: 1,
                exam_number: 1,
                total_score: 1,
                score: 1,
              },
            },
          ],

          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const data = result[0].data;
    const totalResult = result[0].totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalResult / limit);

    return {
      meta: {
        page,
        limit,
        totalResult,
        totalPages,
      },
      data,
    };
  };

  getResultsBySearchForUsers = async (
    loggedInUserPhone: string, // ১. লগইন ইউজারের ফোন নম্বর এখানে নিতে হবে
    phone?: string,
    examNum?: number,
    page: number = 1,
    limit: number = 10
  ) => {
    const skip = (page - 1) * limit;

    // ১. মেইন লিস্টের জন্য কুয়েরি (যা সার্চ বা ফিল্টার অনুযায়ী আসবে)
    const listMatchQuery: any = {};
    if (phone) listMatchQuery.student_phone = phone;
    if (examNum) listMatchQuery.exam_number = examNum;

    // ২. কারেন্ট ইউজারের জন্য কুয়েরি (লগইন ফোন নম্বর এবং নির্দিষ্ট এক্সাম নম্বর)
    const currentUserMatchQuery: any = {
      student_phone: loggedInUserPhone,
    };
    if (examNum) currentUserMatchQuery.exam_number = examNum;

    // ৩. কমন প্রোজেকশন (কি কি ফিল্ড দেখাবেন)
    const projectFields = {
      _id: 0,
      student_name: 1,
      student_phone: 1,
      exam_number: 1,
      total_score: 1,
      score: 1,
    };

    const result = await ResultModel.aggregate([
      {
        $facet: {
          // ক. মেইন ডাটা লিস্ট (লিডারবোর্ড বা রেজাল্ট লিস্ট)
          data: [
            { $match: listMatchQuery },
            { $sort: { score: -1 } }, // স্কোরের ভিত্তিতে সর্ট
            { $skip: skip },
            { $limit: limit },
            { $project: projectFields },
          ],

          // খ. মোট ডাটা কাউন্ট (পেজিনেশনের জন্য)
          totalCount: [{ $match: listMatchQuery }, { $count: "total" }],

          // গ. লগইন করা ইউজারের নিজের রেজাল্ট
          currentUser: [
            { $match: currentUserMatchQuery },
            { $project: projectFields },
            { $limit: 1 }, // একজন ইউজারের একটি এক্সামের একটাই রেজাল্ট দরকার
          ],
        },
      },
    ]);

    const data = result[0].data;
    const totalResult = result[0].totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalResult / limit);

    // কারেন্ট ইউজার ডাটা অ্যারে থেকে অবজেক্টে নেওয়া হলো (না থাকলে null)
    const currentUserData = result[0].currentUser[0] || null;

    // ৪. রেসপন্স রিটার্ন করা
    return {
      meta: {
        page,
        limit,
        totalResult,
        totalPages,
      },
      current_user: currentUserData, // এখানে লগইন ইউজারের ডাটা থাকবে
      data, // বাকি সবার ডাটা
    };
  };

  getSingleResultByExamNumber = async (
    examNum: number,
    student_phone?: string
  ) => {
    const result = await ResultModel.findOne({
      exam_number: examNum,
      student_phone,
    }).select("-dateTaken -createdAt -updatedAt -__v");

    if (!result) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Result not found for this exam number!"
      );
    }

    return result;
  };

  updateStudentMarks = async (payload: IUpdateMarkPayload) => {
    const { exam_number, student_phone, amount, action } = payload;

    const incrementValue = action === "increase_marks" ? amount : -amount;

    const result = await ResultModel.findOneAndUpdate(
      {
        exam_number: exam_number,
        student_phone: student_phone,
      },
      {
        $inc: { score: incrementValue },
        $set: { is_written_mark_updated: true },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (result) {
      await eventBus.publish({
        type: "RESULT_UPDATED",
        payload: {
          userId: student_phone || "system",
          title: "Result",
          description: "Updated successfully",
          module: "result",
          time: new Date().toISOString(),
          resultId: result._id.toString(),
        },
      });
    }

    if (!result) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Result not found! Exam number or Phone did not match."
      );
    }

    return result;
  };

  getExamLeaderboard = async (
    loggedInUserPhone: string,
    examNum: number,
    query: any,
    userRole?: IRoles
  ) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const isAdmin = userRole
      ? ADMIN_ROLE_VALUES.includes(userRole as IAdminRole)
      : false;

    const exam = await ExamModel.findOne({ exam_number: examNum })
      .select("results_published")
      .lean();

    if (!exam) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Exam not found");
    }

    const canViewResults = isAdmin || exam.results_published === true;

    if (!canViewResults) {
      return {
        meta: {
          page,
          limit,
          totalResult: 0,
          totalPages: 0,
        },
        current_user: null,
        data: [],
      };
    }

    const allResults = await ResultModel.find({ exam_number: examNum })
      .sort({
        is_cheated: 1,
        is_on_time: -1,
        score: -1,
        dateTaken: 1,
      })
      .select(
        "student_name student_phone score exam_number dateTaken is_cheated is_on_time"
      )
      .lean();

    let currentRank = 1;

    const processedLeaderboard = allResults.map((student) => {
      let rankDisplay: string | number | null = null;

      if (student.is_cheated) {
        rankDisplay = "Cheater";
      } else if (!student.is_on_time) {
        rankDisplay = null;
      } else {
        rankDisplay = currentRank++;
      }

      return {
        rank: rankDisplay,
        student_name: student.student_name,
        student_phone: student.student_phone,
        exam_number: student.exam_number,
        score: student.score,
        // date: student.dateTaken,
      };
    });

    const currentUserData =
      processedLeaderboard.find(
        (item) => item.student_phone === loggedInUserPhone
      ) || null;

    const totalResult = processedLeaderboard.length;
    const totalPages = Math.ceil(totalResult / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = processedLeaderboard.slice(
      startIndex,
      startIndex + limit
    );

    return {
      meta: {
        page,
        limit,
        totalResult,
        totalPages,
      },
      current_user: currentUserData,
      data: paginatedData,
    };
  };

  getMixedLeaderboard = async (examNum: number, phone?: string) => {
    const results = await ResultModel.find({ exam_number: examNum })
      .sort({
        is_cheated: 1,
        is_on_time: -1,
        score: -1,
        dateTaken: 1,
      })
      .select(
        "student_name student_phone score is_cheated is_on_time exam_number"
      )
      .lean();

    let currentRank = 1;

    const fullLeaderboard = results.map((student) => {
      let rankDisplay: string | number;

      if (student.is_cheated) {
        rankDisplay = "Cheater";
      } else {
        rankDisplay = currentRank++;
      }

      return {
        rank: rankDisplay,
        name: student.student_name,
        phone: student.student_phone,
        score: student.score,
        status: getStatusText(student.is_cheated, student.is_on_time),
        exam_number: student.exam_number,
      };
    });

    if (phone) {
      const studentResult = fullLeaderboard.filter(
        (item) => item.phone === phone
      );
      return studentResult;
    }

    return fullLeaderboard;
  };
}

const getStatusText = (isCheated: boolean, isOnTime: boolean): string => {
  if (isCheated) {
    return "Cheater";
  }
  if (isOnTime) {
    return "On Time";
  }
  return "Late Submission";
};

export const resultService = new service();
