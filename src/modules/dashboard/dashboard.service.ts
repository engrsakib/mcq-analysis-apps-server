import { BooksModel } from "@/modules/books/books.model";
import { BOOK_PLATFORM_ENUMS } from "@/modules/books/books.interface";
import { ExamModel } from "@/modules/exam/exam.model";
import { GuidelineModel } from "@/modules/guideline/guideline.model";
import { QuestionModel } from "@/modules/questions/questuon.model";
import { ResultModel } from "@/modules/results/result.model";
import { UserModel } from "@/modules/user/user.model";
import { YoutubeModel } from "@/modules/youtube/youtube.model";
import { IDashboardStats } from "./dashboard.interface";

class DashboardService {
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

    return {
      totalExams,
      completedExams,
      totalStudents,
      totalQuestions,
      totalGuidelines,
      totalYoutubeVideos,
      rokomariBooks,
      totalResults,
    };
  }
}

export const dashboardService = new DashboardService();
