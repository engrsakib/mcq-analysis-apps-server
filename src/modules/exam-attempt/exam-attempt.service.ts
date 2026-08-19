import { ExamAttemptModel } from "./exam-attempt.model";

class ExamAttemptService {
  /**
   * Returns timeSeries grouped by day and a summary for the given phone and date range.
   */
  async getPersonalGrowth(phone: string, startDate: Date, endDate: Date) {
    const match: any = {
      student_phone: phone,
      dateTaken: { $gte: startDate, $lte: endDate },
    };

    const timeSeriesPipeline = [
      { $match: match },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$dateTaken" } },
          score: "$score",
          total_score: "$total_score",
          correctAnswers: "$correctAnswers",
          totalQuestions: "$totalQuestions",
        },
      },
      {
        $group: {
          _id: "$day",
          avgScore: { $avg: "$score" },
          attempts: { $sum: 1 },
          avgCorrectRate: {
            $avg: {
              $cond: [
                { $gt: ["$totalQuestions", 0] },
                { $divide: ["$correctAnswers", "$totalQuestions"] },
                0,
              ],
            },
          },
          avgTotalScore: { $avg: "$total_score" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const summaryPipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          avgTotalScore: { $avg: "$total_score" },
          attempts: { $sum: 1 },
          avgCorrectRate: {
            $avg: {
              $cond: [
                { $gt: ["$totalQuestions", 0] },
                { $divide: ["$correctAnswers", "$totalQuestions"] },
                0,
              ],
            },
          },
        },
      },
    ];

    const [timeSeriesRaw, summaryRaw] = await Promise.all([
      // aggregate typings can be strict; cast to any to keep pipeline flexible
      ExamAttemptModel.aggregate(timeSeriesPipeline as any),
      ExamAttemptModel.aggregate(summaryPipeline as any),
    ]);

    const timeSeries = (timeSeriesRaw || []).map((r: any) => ({
      date: r._id,
      avgScore: Math.round((r.avgScore ?? 0) * 100) / 100,
      attempts: r.attempts ?? 0,
      avgCorrectRate: Math.round((r.avgCorrectRate ?? 0) * 10000) / 10000,
      avgTotalScore: Math.round((r.avgTotalScore ?? 0) * 100) / 100,
    }));

    const summaryData = (summaryRaw && summaryRaw[0]) || {
      avgScore: 0,
      avgTotalScore: 0,
      attempts: 0,
      avgCorrectRate: 0,
    };

    const professionalGrade =
      summaryData.avgTotalScore > 0
        ? Math.round((summaryData.avgScore / summaryData.avgTotalScore) * 100)
        : Math.round(summaryData.avgScore ?? 0);

    const summary = {
      averageScore: Math.round((summaryData.avgScore ?? 0) * 100) / 100,
      totalAttempts: summaryData.attempts ?? 0,
      averageCorrectRate:
        Math.round((summaryData.avgCorrectRate ?? 0) * 10000) / 10000,
      professionalGrade,
    };

    return { timeSeries, summary };
  }
}

export const examAttemptService = new ExamAttemptService();
