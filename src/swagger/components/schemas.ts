import { ROLES } from "@/constants/roles";
import { PermissionEnum } from "@/modules/permission/permission.enum";
import { USER_ROLES } from "@/modules/user/user.enum";
import { QuestionType, answerType } from "@/modules/questions/question.enum";
import { NegativeMark } from "@/modules/exam/exam.interface";
import {
  GUIDELINE_CATEGORY_ENUMS,
  GUIDELINE_STATUS,
} from "@/modules/guideline/guideline.interface";
import { BOOK_PLATFORM_ENUMS } from "@/modules/books/books.interface";
import { NotificationModuleEnum } from "@/modules/notification/notification.interface";

export const schemas = {
  ErrorMessage: {
    type: "object",
    properties: {
      path: { oneOf: [{ type: "string" }, { type: "number" }] },
      message: { type: "string" },
    },
    required: ["path", "message"],
  },
  ErrorResponse: {
    type: "object",
    properties: {
      statusCode: { type: "integer" },
      success: { type: "boolean", example: false },
      message: { type: "string" },
      errorMessages: {
        type: "array",
        items: { $ref: "#/components/schemas/ErrorMessage" },
      },
      stack: { type: "string", description: "Only included in non-production" },
    },
    required: ["statusCode", "success", "message", "errorMessages"],
  },
  ApiResponse: {
    type: "object",
    properties: {
      statusCode: { type: "integer" },
      success: { oneOf: [{ type: "boolean" }, { type: "string" }] },
      message: { type: "string", nullable: true },
      data: { nullable: true },
    },
    required: ["statusCode", "success"],
  },
  PaginationMeta: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      total: { type: "integer", example: 100 },
      totalPage: { type: "integer", example: 10 },
    },
  },
  PaginatedResponse: {
    type: "object",
    properties: {
      meta: { $ref: "#/components/schemas/PaginationMeta" },
      data: { type: "array", items: {} },
    },
  },
  UserExamListItem: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        format: "objectId",
        description: "MongoDB document identifier",
        example: "665f1a2b3c4d5e6f7a8b9c0d",
      },
      exam_number: {
        type: "integer",
        description: "Public exam identifier (barcode number)",
        example: 1234567890123,
      },
      exam_name: {
        type: "string",
        description: "Exam display name",
        example: "BCS Preliminary Mock Test",
      },
      exam_date_time: {
        type: "string",
        format: "date-time",
        description: "Scheduled exam start date and time",
        example: "2026-07-15T10:00:00.000Z",
      },
      isSubmitted: {
        type: "boolean",
        description:
          "Whether the authenticated user has submitted this exam (computed from results collection)",
        example: false,
      },
      is_completed: {
        type: "boolean",
        description:
          "Whether the admin has marked this exam as completed. When true, new submissions are blocked.",
        example: false,
      },
    },
    required: [
      "_id",
      "exam_number",
      "exam_name",
      "exam_date_time",
      "isSubmitted",
      "is_completed",
    ],
  },
  UserExamPaginatedResponse: {
    type: "object",
    properties: {
      meta: { $ref: "#/components/schemas/PaginationMeta" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/UserExamListItem" },
      },
    },
    required: ["meta", "data"],
  },
  GlobalSearchExamModuleResult: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/UserExamListItem" },
      },
      meta: { $ref: "#/components/schemas/PaginationMeta" },
    },
    required: ["data", "meta"],
  },
  GlobalSearchModuleResult: {
    type: "object",
    properties: {
      data: { type: "array", items: {} },
      meta: { $ref: "#/components/schemas/PaginationMeta" },
    },
    required: ["data", "meta"],
  },
  GlobalSearchResults: {
    type: "object",
    properties: {
      exams: { $ref: "#/components/schemas/GlobalSearchExamModuleResult" },
      books: { $ref: "#/components/schemas/GlobalSearchModuleResult" },
      youtube: { $ref: "#/components/schemas/GlobalSearchModuleResult" },
      studyPlans: { $ref: "#/components/schemas/GlobalSearchModuleResult" },
      guidelines: { $ref: "#/components/schemas/GlobalSearchModuleResult" },
    },
    required: ["exams", "books", "youtube", "studyPlans", "guidelines"],
  },
  GlobalSearchResponse: {
    type: "object",
    properties: {
      query: { type: "string", example: "database" },
      results: { $ref: "#/components/schemas/GlobalSearchResults" },
    },
    required: ["query", "results"],
  },
  LoginRequest: {
    type: "object",
    properties: {
      phone_number: { type: "string", example: "01700000000" },
      password: { type: "string", minLength: 1, example: "password123" },
    },
    required: ["phone_number", "password"],
    additionalProperties: false,
  },
  ChangePasswordRequest: {
    type: "object",
    properties: {
      old_password: { type: "string", minLength: 1, example: "oldpass123" },
      new_password: {
        type: "string",
        minLength: 6,
        maxLength: 15,
        example: "newpass123",
      },
    },
    required: ["old_password", "new_password"],
    additionalProperties: false,
  },
  ResetPasswordRequest: {
    type: "object",
    properties: {
      phone_number: { type: "string", example: "01700000000" },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 15,
        example: "newpass123",
      },
    },
    required: ["phone_number", "password"],
    additionalProperties: false,
  },
  OtpVerifyRequest: {
    type: "object",
    properties: {
      phone_number: { type: "string", example: "01700000000" },
      otp: { type: "integer", example: 123456 },
    },
    required: ["phone_number", "otp"],
    additionalProperties: false,
  },
  OtpResendRequest: {
    type: "object",
    properties: {
      phone_number: { type: "string", example: "01700000000" },
    },
    required: ["phone_number"],
    additionalProperties: false,
  },
  ForgetPasswordRequest: {
    type: "object",
    properties: {
      phone_number: { type: "string", example: "01700000000" },
    },
    required: ["phone_number"],
  },
  AuthTokens: {
    type: "object",
    properties: {
      access_token: { type: "string" },
      refresh_token: { type: "string" },
    },
  },
  RoleEnum: {
    type: "string",
    enum: Object.values(ROLES),
    example: ROLES.ADMIN,
  },
  UserRoleEnum: {
    type: "string",
    enum: USER_ROLES,
    example: "customer",
  },
  PermissionEnum: {
    type: "string",
    enum: Object.values(PermissionEnum),
    example: PermissionEnum.VIEW_STUDENT,
  },
  AdminStatus: {
    type: "string",
    enum: ["inactive", "admin_approval", "active"],
    example: "active",
  },
  UserStatus: {
    type: "string",
    enum: ["active", "inactive"],
    example: "active",
  },
  Admin: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      name: { type: "string", example: "John Admin" },
      phone_number: { type: "string", example: "01700000000" },
      role: { $ref: "#/components/schemas/RoleEnum" },
      is_Deleted: { type: "boolean", default: false },
      image: { type: "string", example: "https://example.com/image.jpg" },
      status: { $ref: "#/components/schemas/AdminStatus" },
      permissions: { type: "string", format: "objectId", nullable: true },
      designation: { type: "string", example: "Manager" },
      bio: { type: "string", example: "Admin bio" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateAdminRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, example: "John Admin" },
      phone_number: { type: "string", example: "01700000000" },
      password: { type: "string", minLength: 6, example: "password123" },
      image: {
        type: "string",
        format: "uri",
        example: "https://example.com/image.jpg",
      },
      designation: { type: "string", example: "Manager" },
      role: { type: "string", example: "admin" },
      bio: { type: "string", example: "Admin bio" },
    },
    required: ["name", "phone_number", "password"],
    additionalProperties: false,
  },
  UpdateAdminRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      image: {},
      phone_number: { type: "string" },
      role: { type: "string" },
      password: { type: "string" },
      designation: { type: "string" },
      bio: { type: "string" },
    },
    additionalProperties: false,
  },
  ApproveAdminRequest: {
    type: "object",
    properties: {
      phone_number: { type: "string", example: "01700000000" },
    },
    required: ["phone_number"],
  },
  User: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      name: { type: "string", example: "Jane Student" },
      phone_number: { type: "string", example: "01800000000" },
      fcmToken: { type: "string", default: "" },
      image: { type: "string", example: "" },
      is_Deleted: { type: "boolean", default: false },
      email: { type: "string", format: "email", example: "jane@example.com" },
      role: { type: "string", example: "student" },
      status: { $ref: "#/components/schemas/UserStatus" },
      last_login_at: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateUserRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 3, example: "Jane Student" },
      phone_number: { type: "string", example: "01800000000" },
      email: {
        type: "string",
        format: "email",
        example: "jane@example.com",
      },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 15,
        example: "password123",
      },
      role: { $ref: "#/components/schemas/UserRoleEnum" },
    },
    required: ["name", "phone_number", "password", "role"],
    additionalProperties: false,
  },
  UpdateUserRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 3 },
      image: { type: "string" },
      phone_number: { type: "string" },
      email: { type: "string", format: "email" },
    },
    additionalProperties: false,
  },
  SaveFcmTokenRequest: {
    type: "object",
    properties: {
      userId: { type: "string", format: "objectId" },
      token: { type: "string", example: "fcm-device-token-here" },
    },
    required: ["userId", "token"],
  },
  QuestionTypeEnum: {
    type: "string",
    enum: Object.values(QuestionType),
    example: QuestionType.GENERAL,
  },
  AnswerTypeEnum: {
    type: "string",
    enum: Object.values(answerType),
    example: answerType.MCQ,
  },
  QuestionBlank: {
    type: "object",
    properties: {
      id: { type: "integer" },
      options: { type: "array", items: { type: "string" } },
      correctAnswer: { type: "string" },
    },
    required: ["options", "correctAnswer"],
  },
  Question: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      questionId: { type: "integer", example: 1234567890123 },
      title: { type: "string", example: "What is 2+2?" },
      description: { type: "string" },
      type: { $ref: "#/components/schemas/QuestionTypeEnum" },
      content: { type: "string" },
      options: { type: "array", items: { type: "string" } },
      blanks: {
        oneOf: [
          { type: "string" },
          {
            type: "array",
            items: { $ref: "#/components/schemas/QuestionBlank" },
          },
        ],
      },
      mathFormula: { type: "string" },
      answerType: { $ref: "#/components/schemas/AnswerTypeEnum" },
      marks: { type: "number", example: 1 },
      answer: {
        oneOf: [
          { type: "string" },
          {
            type: "array",
            items: { $ref: "#/components/schemas/QuestionBlank" },
          },
        ],
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateQuestionRequest: {
    type: "object",
    properties: {
      title: { type: "string", example: "What is 2+2?" },
      description: { type: "string" },
      type: { $ref: "#/components/schemas/QuestionTypeEnum" },
      content: { type: "string" },
      options: {
        type: "array",
        items: { type: "string" },
        example: ["3", "4", "5"],
      },
      blanks: {
        oneOf: [
          { type: "string" },
          {
            type: "array",
            items: { $ref: "#/components/schemas/QuestionBlank" },
          },
        ],
      },
      mathFormula: { type: "string" },
      answerType: { $ref: "#/components/schemas/AnswerTypeEnum" },
      marks: { type: "number", example: 1 },
      answer: {
        oneOf: [
          { type: "string", example: "4" },
          {
            type: "array",
            items: { $ref: "#/components/schemas/QuestionBlank" },
          },
        ],
      },
    },
    required: ["title", "type", "answerType", "marks", "answer"],
  },
  NegativeMarkEnum: {
    type: "number",
    enum: NegativeMark,
    example: 0.25,
  },
  Exam: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      exam_number: { type: "integer", example: 1234567890123 },
      exam_name: { type: "string", example: "BCS Preliminary Mock Test" },
      exam_date_time: { type: "string", format: "date-time" },
      duration_minutes: { type: "integer", example: 60 },
      total_marks: { type: "integer", example: 100 },
      is_started: { type: "boolean", default: false },
      is_completed: { type: "boolean", default: false },
      is_published: { type: "boolean", default: false },
      negative_mark: { $ref: "#/components/schemas/NegativeMarkEnum" },
      questions: {
        type: "array",
        items: { type: "string", format: "objectId" },
      },
    },
  },
  CreateExamRequest: {
    type: "object",
    properties: {
      exam_name: { type: "string", example: "BCS Preliminary Mock Test" },
      exam_date_time: { type: "string", format: "date-time" },
      duration_minutes: { type: "integer", example: 60 },
      total_marks: { type: "integer", example: 100 },
      negative_mark: { $ref: "#/components/schemas/NegativeMarkEnum" },
      questions: {
        type: "array",
        items: { type: "string", format: "objectId" },
        example: ["507f1f77bcf86cd799439011"],
      },
    },
    required: [
      "exam_name",
      "exam_date_time",
      "duration_minutes",
      "total_marks",
      "questions",
    ],
  },
  UpdateExamRequest: {
    type: "object",
    properties: {
      exam_name: { type: "string" },
      exam_date_time: { type: "string", format: "date-time" },
      duration_minutes: { type: "integer" },
      total_marks: { type: "integer" },
      negative_mark: { $ref: "#/components/schemas/NegativeMarkEnum" },
      questions: {
        type: "array",
        items: { type: "string", format: "objectId" },
      },
    },
  },
  UpdateExamStatusRequest: {
    type: "object",
    properties: {
      is_published: { type: "boolean" },
      is_started: { type: "boolean" },
      is_completed: { type: "boolean" },
    },
    description:
      "Only is_published, is_started, and is_completed fields are allowed",
  },
  WrittenExamAnswer: {
    type: "object",
    properties: {
      question: { type: "string" },
      answer: { type: "string" },
      _id: { type: "string" },
    },
    required: ["question", "answer"],
  },
  Result: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      student_name: { type: "string", example: "Jane Student" },
      student_phone: { type: "string", example: "01800000000" },
      exam_number: { type: "integer", example: 1234567890123 },
      total_score: { type: "number", example: 100 },
      score: { type: "number", example: 85 },
      totalQuestions: { type: "integer", example: 100 },
      correctAnswers: { type: "integer", example: 85 },
      wrongAnswers: { type: "integer", example: 10 },
      unanswered: { type: "integer", example: 5 },
      is_cheated: { type: "boolean", default: false },
      is_on_time: { type: "boolean", default: true },
      is_written_mark_updated: { type: "boolean", default: false },
      dateTaken: { type: "string", format: "date-time" },
      writtenExam: {
        type: "array",
        items: { $ref: "#/components/schemas/WrittenExamAnswer" },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateResultRequest: {
    type: "object",
    properties: {
      student_name: { type: "string", example: "Jane Student" },
      student_phone: { type: "string", example: "01800000000" },
      exam_number: { type: "integer", example: 1234567890123 },
      total_score: { type: "number", example: 100 },
      score: { type: "number", example: 85 },
      totalQuestions: { type: "integer", example: 100 },
      correctAnswers: { type: "integer", example: 85 },
      wrongAnswers: { type: "integer", example: 10 },
      unanswered: { type: "integer", example: 5 },
      is_cheated: { type: "boolean", default: false },
      is_on_time: { type: "boolean", default: true },
      writtenExam: {
        type: "array",
        items: { $ref: "#/components/schemas/WrittenExamAnswer" },
      },
    },
    required: [
      "student_name",
      "student_phone",
      "total_score",
      "score",
      "totalQuestions",
      "correctAnswers",
      "wrongAnswers",
      "unanswered",
    ],
  },
  UpdateMarksRequest: {
    type: "object",
    properties: {
      exam_number: { type: "integer", example: 1234567890123 },
      student_phone: { type: "string", example: "01800000000" },
      amount: { type: "number", example: 5 },
      action: {
        type: "string",
        enum: ["increase_marks", "decrease_marks"],
        example: "increase_marks",
      },
    },
    required: ["exam_number", "student_phone", "amount", "action"],
  },
  LeaderboardEntry: {
    type: "object",
    properties: {
      rank: {
        oneOf: [{ type: "integer" }, { type: "string" }, { type: "null" }],
        example: 1,
      },
      student_name: { type: "string" },
      student_phone: { type: "string" },
      exam_number: { type: "integer" },
      score: { type: "number" },
    },
  },
  BookPlatformEnum: {
    type: "string",
    enum: Object.values(BOOK_PLATFORM_ENUMS),
    example: BOOK_PLATFORM_ENUMS.ROKOMARI,
  },
  Book: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      book_number: { type: "integer", example: 1234567890123 },
      title: { type: "string", example: "BCS Guide Book" },
      thumbnail_url: {
        type: "string",
        example: "https://example.com/thumb.jpg",
      },
      description: { type: "string" },
      is_published: { type: "boolean", default: false },
      price: { type: "number", example: 500 },
      sold_platform: { $ref: "#/components/schemas/BookPlatformEnum" },
      buy_url: { type: "string", example: "https://rokomari.com/book/123" },
    },
  },
  CreateBookRequest: {
    type: "object",
    properties: {
      title: { type: "string", example: "BCS Guide Book" },
      thumbnail_url: {
        type: "string",
        example: "https://example.com/thumb.jpg",
      },
      description: { type: "string" },
      price: { type: "number", example: 500 },
      sold_platform: { $ref: "#/components/schemas/BookPlatformEnum" },
      buy_url: { type: "string", example: "https://rokomari.com/book/123" },
    },
    required: ["title", "thumbnail_url", "price", "sold_platform", "buy_url"],
  },
  GuidelineCategoryEnum: {
    type: "string",
    enum: Object.values(GUIDELINE_CATEGORY_ENUMS),
    example: GUIDELINE_CATEGORY_ENUMS.BCS_PREPARATION,
  },
  GuidelineStatusEnum: {
    type: "string",
    enum: Object.values(GUIDELINE_STATUS),
    example: GUIDELINE_STATUS.ACTIVE,
  },
  Guideline: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      guideline_number: { type: "integer", example: 1234567890123 },
      title: { type: "string", example: "BCS Preparation Guide" },
      category: { $ref: "#/components/schemas/GuidelineCategoryEnum" },
      description: { type: "string" },
      status: { $ref: "#/components/schemas/GuidelineStatusEnum" },
      thumbnail_url: { type: "string" },
    },
  },
  CreateGuidelineRequest: {
    type: "object",
    properties: {
      title: { type: "string", example: "BCS Preparation Guide" },
      category: { $ref: "#/components/schemas/GuidelineCategoryEnum" },
      description: {
        type: "string",
        example: "Complete BCS preparation guide",
      },
      status: { $ref: "#/components/schemas/GuidelineStatusEnum" },
      thumbnail_url: { type: "string" },
    },
    required: ["title", "category", "description"],
  },
  Youtube: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      video_number: { type: "integer", example: 1234567890123 },
      title: { type: "string", example: "BCS Math Tutorial" },
      thumbnail_url: { type: "string" },
      video_url: {
        type: "string",
        example: "https://youtube.com/watch?v=abc123",
      },
      description: { type: "string" },
      is_published: { type: "boolean", default: false },
    },
  },
  CreateYoutubeRequest: {
    type: "object",
    properties: {
      title: { type: "string", example: "BCS Math Tutorial" },
      thumbnail_url: { type: "string" },
      video_url: {
        type: "string",
        example: "https://youtube.com/watch?v=abc123",
      },
      description: { type: "string" },
    },
    required: ["video_url"],
  },
  StudyPlan: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      study_plan_number: { type: "integer", example: 1234567890123 },
      position: { type: "integer", example: 1 },
      title: { type: "string", example: "Week 1 Study Plan" },
      description: { type: "string" },
      status: { $ref: "#/components/schemas/GuidelineStatusEnum" },
      thumbnail_url: { type: "string" },
      study_plan_url: {
        type: "string",
        example: "https://example.com/plan.pdf",
      },
      category: { $ref: "#/components/schemas/GuidelineCategoryEnum" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateStudyPlanRequest: {
    type: "object",
    properties: {
      title: { type: "string", example: "Week 1 Study Plan" },
      description: { type: "string", example: "Study plan for week 1" },
      status: { $ref: "#/components/schemas/GuidelineStatusEnum" },
      thumbnail_url: { type: "string" },
      study_plan_url: {
        type: "string",
        example: "https://example.com/plan.pdf",
      },
      category: { $ref: "#/components/schemas/GuidelineCategoryEnum" },
      position: { type: "integer", example: 1 },
    },
    required: ["title", "description", "study_plan_url", "category"],
  },
  ReorderStudyPlanItem: {
    type: "object",
    properties: {
      id: { type: "string" },
      _id: { type: "string", format: "objectId" },
      study_plan_number: { oneOf: [{ type: "string" }, { type: "integer" }] },
      position: { type: "integer", minimum: 0 },
    },
    required: ["position"],
  },
  ReorderStudyPlansRequest: {
    oneOf: [
      {
        type: "array",
        items: { $ref: "#/components/schemas/ReorderStudyPlanItem" },
      },
      {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/ReorderStudyPlanItem" },
          },
        },
        required: ["items"],
      },
    ],
  },
  ExamRoutine: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      exam_routine_number: { type: "integer", example: 1234567890123 },
      position: { type: "integer", example: 1 },
      title: { type: "string", example: "Weekly Exam Routine" },
      description: { type: "string" },
      status: { $ref: "#/components/schemas/GuidelineStatusEnum" },
      thumbnail_url: { type: "string" },
      exam_routine_url: {
        type: "string",
        example: "https://example.com/routine.pdf",
      },
      category: { $ref: "#/components/schemas/GuidelineCategoryEnum" },
      post_date: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateExamRoutineRequest: {
    type: "object",
    properties: {
      title: { type: "string", example: "Weekly Exam Routine" },
      description: { type: "string", example: "Exam routine for this week" },
      status: { $ref: "#/components/schemas/GuidelineStatusEnum" },
      thumbnail_url: { type: "string" },
      exam_routine_url: {
        type: "string",
        example: "https://example.com/routine.pdf",
      },
      category: { $ref: "#/components/schemas/GuidelineCategoryEnum" },
      post_date: { type: "string", format: "date-time" },
      position: { type: "integer", example: 1 },
    },
    required: ["title", "exam_routine_url"],
  },
  ReorderExamRoutineItem: {
    type: "object",
    properties: {
      id: { type: "string" },
      _id: { type: "string", format: "objectId" },
      exam_routine_number: {
        oneOf: [{ type: "string" }, { type: "integer" }],
      },
      position: { type: "integer", minimum: 0 },
    },
    required: ["position"],
  },
  ReorderExamRoutinesRequest: {
    oneOf: [
      {
        type: "array",
        items: { $ref: "#/components/schemas/ReorderExamRoutineItem" },
      },
      {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/ReorderExamRoutineItem" },
          },
        },
        required: ["items"],
      },
    ],
  },
  UpdatePermissionsRequest: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "objectId",
        description: "Admin user ID",
        example: "507f1f77bcf86cd799439011",
      },
      permissions: {
        type: "array",
        items: { $ref: "#/components/schemas/PermissionEnum" },
        example: [PermissionEnum.VIEW_STUDENT, PermissionEnum.CREATE_EXAM],
      },
      note: { type: "string", example: "Permission updated by admin" },
    },
    required: ["id", "permissions"],
  },
  Permission: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      user: { type: "string", format: "objectId" },
      key: {
        type: "array",
        items: { $ref: "#/components/schemas/PermissionEnum" },
      },
      note: { type: "string" },
      group: { type: "string", nullable: true },
      isActive: { type: "boolean", default: true },
      createdBy: { type: "string", format: "objectId" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  NotificationModuleEnum: {
    type: "string",
    enum: Object.values(NotificationModuleEnum),
    example: NotificationModuleEnum.EXAM,
  },
  Notification: {
    type: "object",
    properties: {
      _id: { type: "string", format: "objectId" },
      title: { type: "string", example: "New Exam Available" },
      description: { type: "string", example: "A new exam has been published" },
      module: { $ref: "#/components/schemas/NotificationModuleEnum" },
      userId: { type: "string", example: "507f1f77bcf86cd799439011" },
      time: { type: "string", example: "2026-07-11T12:00:00.000Z" },
      isRead: { type: "boolean", default: false },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  UploadSingleResponse: {
    type: "object",
    properties: {
      url: {
        type: "string",
        example: "https://s3.amazonaws.com/bucket/file.jpg",
      },
    },
  },
  UploadMultipleResponse: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: { type: "string" },
        example: ["https://s3.amazonaws.com/bucket/file1.jpg"],
      },
    },
  },
};
