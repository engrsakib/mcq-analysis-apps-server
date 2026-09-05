import { BooksModel } from "@/modules/books/books.model";
import { BOOK_PLATFORM_ENUMS } from "@/modules/books/books.interface";
import { ExamModel } from "@/modules/exam/exam.model";
import { GuidelineModel } from "@/modules/guideline/guideline.model";
import { QuestionModel } from "@/modules/questions/questuon.model";
import { ResultModel } from "@/modules/results/result.model";
import { UserModel } from "@/modules/user/user.model";
import { YoutubeModel } from "@/modules/youtube/youtube.model";
import { ExamAttemptModel } from "@/modules/exam-attempt/exam-attempt.model";
import { IExamParticipation, IDashboardStats } from "./dashboard.interface";

const RECENT_EXAM_LIMIT = 10;

class DashboardService {
  private async getExamParticipation(
    totalStudents: number
  ): Promise<IExamParticipation[]> {
    const recentExams = await ExamModel.find()
      .sort({ exam_date_time: -1, exam_number: -1 })
      .limit(RECENT_EXAM_LIMIT)
      .select("exam_number exam_name")
      .lean();

    if (recentExams.length === 0) {
      return [];
    }

    const examNumbers = recentExams
      .map((exam) => Number(exam.exam_number))
      .filter((num) => Number.isFinite(num));

    const [participantCounts, attemptCounts, submissionTiming] =
      await Promise.all([
        ResultModel.aggregate<{
          _id: number;
          participants: number;
        }>([
          { $match: { exam_number: { $in: examNumbers } } },
          { $group: { _id: "$exam_number", participants: { $sum: 1 } } },
        ]),
        ExamAttemptModel.aggregate<{
          _id: number;
          participants: number;
        }>([
          { $match: { exam_number: { $in: examNumbers } } },
          {
            $group: {
              _id: {
                exam_number: "$exam_number",
                student_phone: "$student_phone",
              },
            },
          },
          { $group: { _id: "$_id.exam_number", participants: { $sum: 1 } } },
        ]),
        ResultModel.aggregate<{
          _id: number;
          onTimeSubmissions: number;
          lateSubmissions: number;
        }>([
          { $match: { exam_number: { $in: examNumbers } } },
          {
            $group: {
              _id: "$exam_number",
              onTimeSubmissions: {
                $sum: { $cond: [{ $eq: ["$is_on_time", true] }, 1, 0] },
              },
              lateSubmissions: {
                $sum: { $cond: [{ $eq: ["$is_on_time", false] }, 1, 0] },
              },
            },
          },
        ]),
      ]);

    const countByExam = new Map<number, number>();
    for (const row of participantCounts) {
      countByExam.set(Number(row._id), row.participants);
    }
    for (const row of attemptCounts) {
      const examNumber = Number(row._id);
      const attemptCount = row.participants;
      const resultCount = countByExam.get(examNumber) ?? 0;
      countByExam.set(examNumber, Math.max(resultCount, attemptCount));
    }

    const timingByExam = new Map(
      submissionTiming.map((row) => [
        Number(row._id),
        {
          onTimeSubmissions: row.onTimeSubmissions,
          lateSubmissions: row.lateSubmissions,
        },
      ])
    );

    return recentExams
      .map((exam) => {
        const examNumber = Number(exam.exam_number);
        if (!Number.isFinite(examNumber) || !exam.exam_name) {
          return null;
        }

        const participants = countByExam.get(examNumber) ?? 0;
        const timing = timingByExam.get(examNumber) ?? {
          onTimeSubmissions: 0,
          lateSubmissions: 0,
        };
        const participationRate =
          totalStudents > 0 ? (participants / totalStudents) * 100 : 0;

        return {
          exam_number: examNumber,
          exam_name: exam.exam_name,
          participants,
          participationRate: Math.round(participationRate * 100) / 100,
          onTimeSubmissions: timing.onTimeSubmissions,
          lateSubmissions: timing.lateSubmissions,
        };
      })
      .filter((row): row is IExamParticipation => row !== null);
  }

  async getStats(): Promise<IDashboardStats> {
    const [
      totalExams,
      completedExams,
      totalStudents,
      totalQuestions,
      totalGuidelines,
      totalYoutubeVideos,
      rokomariBooks,
      totalResults,
    ] = await Promise.all([
      ExamModel.countDocuments(),
      ExamModel.countDocuments({ is_completed: true }),
      UserModel.countDocuments({ is_Deleted: false }),
      QuestionModel.countDocuments(),
      GuidelineModel.countDocuments(),
      YoutubeModel.countDocuments(),
      BooksModel.countDocuments({
        sold_platform: BOOK_PLATFORM_ENUMS.ROKOMARI,
      }),
      ResultModel.countDocuments(),
    ]);

    const examParticipation = await this.getExamParticipation(totalStudents);

    return {
      totalExams,
      completedExams,
      totalStudents,
      totalQuestions,
      totalGuidelines,
      totalYoutubeVideos,
      rokomariBooks,
      totalResults,
      examParticipation,
    };
  }
}

export const dashboardService = new DashboardService();
