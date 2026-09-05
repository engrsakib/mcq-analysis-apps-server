import { AdminRoutes } from "@/modules/admin/admin.route";
import { OTPRoutes } from "@/modules/otp/otp.route";

import { ForgetPasswordRoutes } from "@/modules/forget-password/forgetPassword.routes";
import { Router } from "express";
import { UserRoutes } from "@/modules/user/user.routes";
import { UploadRoutes } from "@/modules/upload/upload.routes";
import { PermissionsRoutes } from "@/modules/permission/permission.route";
import { QuestionRoutes } from "./../modules/questions/question.route";
import { QuestionStudyTopicRoutes } from "@/modules/question-study-topic/question-study-topic.router";
import { StudyTopicTypeRoutes } from "@/modules/study-topic-type/study-topic-type.router";
import { YoutubeRoutes } from "@/modules/youtube/youtube.route";
import { GuidelineRoutes } from "@/modules/guideline/guideline.router";
import { BooksRoutes } from "@/modules/books/books.router";
import { ExamRoutes } from "@/modules/exam/exam.router";
import { ResultRoutes } from "@/modules/results/result.router";
import { StudyPlanRoutes } from "@/modules/study-plan/study_plan.router";
import { ExamSolutionRoutes } from "@/modules/exam-solution/exam_solution.router";
import { ExamRoutineRoutes } from "@/modules/exam-routine/exam_routine.router";
import { NotificationRoutes } from "@/modules/notification/notification.routes";
import { AnnouncementRoutes } from "@/modules/announcement/announcement.router";
import { SearchRoutes } from "@/modules/search/search.router";
import { DashboardRoutes } from "@/modules/dashboard/dashboard.router";
import { SmsRoutes } from "@/modules/sms/sms.router";
import { ActivityRoutes } from "@/modules/activity/activity.router";
const router = Router();

const moduleRoutes = [
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/otp/validate",
    route: OTPRoutes,
  },
  {
    path: "/forget-password",
    route: ForgetPasswordRoutes,
  },
  {
    path: "/youtube",
    route: YoutubeRoutes,
  },
  {
    path: "/results",
    route: ResultRoutes,
  },
  {
    path: "/study-plan",
    route: StudyPlanRoutes,
  },
  {
    path: "/exam-solution",
    route: ExamSolutionRoutes,
  },
  {
    path: "/exam-routine",
    route: ExamRoutineRoutes,
  },
  {
    path: "/exam",
    route: ExamRoutes,
  },
  {
    path: "/guideline",
    route: GuidelineRoutes,
  },
  {
    path: "/books",
    route: BooksRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/permissions",
    route: PermissionsRoutes,
  },
  {
    path: "/question",
    route: QuestionRoutes,
  },
  {
    path: "/question-study-topic",
    route: QuestionStudyTopicRoutes,
  },
  {
    path: "/study-topic-type",
    route: StudyTopicTypeRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/announcements",
    route: AnnouncementRoutes,
  },
  {
    path: "/search",
    route: SearchRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/sms",
    route: SmsRoutes,
  },
  {
    path: "/activity",
    route: ActivityRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
