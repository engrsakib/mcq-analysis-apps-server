import { commonResponses } from "../components/responses";
import { securityRequirements } from "../components/security";
import { jsonRequestBody, successResponse } from "../utils/helpers";

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
  { name: "searchTerm", in: "query", schema: { type: "string" } },
];

const objectIdParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "objectId" },
};

const crudResponses = {
  "401": commonResponses.Unauthorized,
  "403": commonResponses.Forbidden,
};

export const booksPaths = {
  "/books": {
    post: {
      tags: ["Books"],
      summary: "Create book",
      description:
        "Creates a new book entry. Requires CREATE_GUIDELINE permission.",
      operationId: "createBook",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateBookRequest",
        "Book creation payload"
      ),
      responses: {
        "201": successResponse(201, "Book created", {
          $ref: "#/components/schemas/Book",
        }),
        ...crudResponses,
      },
    },
    get: {
      tags: ["Books"],
      summary: "Get all books (admin)",
      description: "Retrieves paginated books. Requires VIEW_BOOK permission.",
      operationId: "getAllBooks",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Books retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        ...crudResponses,
      },
    },
  },
  "/books/user": {
    get: {
      tags: ["Books"],
      summary: "Get all books for users",
      description: "Retrieves published books for end users",
      operationId: "getAllBooksForUsers",
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Books retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
      },
    },
  },
  "/books/{id}": {
    get: {
      tags: ["Books"],
      summary: "Get book by ID",
      operationId: "getBookById",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Book retrieved", {
          $ref: "#/components/schemas/Book",
        }),
      },
    },
    put: {
      tags: ["Books"],
      summary: "Update book",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "updateBookById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateBookRequest",
        "Book update payload"
      ),
      responses: {
        "200": successResponse(200, "Book updated", {
          $ref: "#/components/schemas/Book",
        }),
        ...crudResponses,
      },
    },
    delete: {
      tags: ["Books"],
      summary: "Delete book",
      description: "Requires DELETE_GUIDELINE permission.",
      operationId: "deleteBookById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Book deleted"),
        ...crudResponses,
      },
    },
    patch: {
      tags: ["Books"],
      summary: "Toggle book publish status",
      description:
        "Toggles is_published flag. Requires UPDATE_GUIDELINE permission.",
      operationId: "publishBookToggle",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Publish status toggled", {
          $ref: "#/components/schemas/Book",
        }),
        ...crudResponses,
      },
    },
  },
};

export const guidelinePaths = {
  "/guideline": {
    post: {
      tags: ["Guideline"],
      summary: "Create guideline",
      description:
        "Creates a new guideline. Requires CREATE_GUIDELINE permission.",
      operationId: "createGuideline",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateGuidelineRequest",
        "Guideline creation payload"
      ),
      responses: {
        "201": successResponse(201, "Guideline created", {
          $ref: "#/components/schemas/Guideline",
        }),
        ...crudResponses,
      },
    },
    get: {
      tags: ["Guideline"],
      summary: "Get all guidelines (admin)",
      description: "Requires VIEW_GUIDELINE permission.",
      operationId: "getAllGuidelines",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Guidelines retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        ...crudResponses,
      },
    },
  },
  "/guideline/user": {
    get: {
      tags: ["Guideline"],
      summary: "Get all guidelines for users",
      operationId: "getAllGuidelinesForUsers",
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Guidelines retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
      },
    },
  },
  "/guideline/{id}": {
    get: {
      tags: ["Guideline"],
      summary: "Get guideline by ID",
      operationId: "getGuidelineById",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Guideline retrieved", {
          $ref: "#/components/schemas/Guideline",
        }),
      },
    },
    put: {
      tags: ["Guideline"],
      summary: "Update guideline",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "updateGuidelineById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateGuidelineRequest",
        "Guideline update payload"
      ),
      responses: {
        "200": successResponse(200, "Guideline updated", {
          $ref: "#/components/schemas/Guideline",
        }),
        ...crudResponses,
      },
    },
    delete: {
      tags: ["Guideline"],
      summary: "Delete guideline",
      description: "Requires DELETE_GUIDELINE permission.",
      operationId: "deleteGuidelineById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Guideline deleted"),
        ...crudResponses,
      },
    },
    patch: {
      tags: ["Guideline"],
      summary: "Toggle guideline status",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "toggleGuidelineStatus",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Status toggled", {
          $ref: "#/components/schemas/Guideline",
        }),
        ...crudResponses,
      },
    },
  },
};

export const youtubePaths = {
  "/youtube": {
    post: {
      tags: ["YouTube"],
      summary: "Create YouTube video",
      description: "Requires CREATE_GUIDELINE permission.",
      operationId: "createYoutube",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateYoutubeRequest",
        "YouTube video payload"
      ),
      responses: {
        "201": successResponse(201, "YouTube entry created", {
          $ref: "#/components/schemas/Youtube",
        }),
        ...crudResponses,
      },
    },
    get: {
      tags: ["YouTube"],
      summary: "Get all YouTube videos (admin)",
      description: "Requires VIEW_GUIDELINE permission.",
      operationId: "getAllYoutubes",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "YouTube entries retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        ...crudResponses,
      },
    },
  },
  "/youtube/user": {
    get: {
      tags: ["YouTube"],
      summary: "Get all YouTube videos for users",
      operationId: "getAllYoutubesForUsers",
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "YouTube entries retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
      },
    },
  },
  "/youtube/{id}": {
    get: {
      tags: ["YouTube"],
      summary: "Get YouTube video by ID",
      operationId: "getYoutubeById",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "YouTube entry retrieved", {
          $ref: "#/components/schemas/Youtube",
        }),
      },
    },
    put: {
      tags: ["YouTube"],
      summary: "Update YouTube video",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "updateYoutubeById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateYoutubeRequest",
        "YouTube update payload"
      ),
      responses: {
        "200": successResponse(200, "YouTube entry updated", {
          $ref: "#/components/schemas/Youtube",
        }),
        ...crudResponses,
      },
    },
    delete: {
      tags: ["YouTube"],
      summary: "Delete YouTube video",
      description: "Requires DELETE_GUIDELINE permission.",
      operationId: "deleteYoutubeById",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "YouTube entry deleted"),
        ...crudResponses,
      },
    },
    patch: {
      tags: ["YouTube"],
      summary: "Toggle YouTube publish status",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "publishYoutubeToggle",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Publish status toggled", {
          $ref: "#/components/schemas/Youtube",
        }),
        ...crudResponses,
      },
    },
  },
};

export const studyPlanPaths = {
  "/study-plan": {
    post: {
      tags: ["Study Plan"],
      summary: "Create study plan",
      description: "Requires CREATE_GUIDELINE permission.",
      operationId: "createStudyPlan",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateStudyPlanRequest",
        "Study plan creation payload"
      ),
      responses: {
        "201": successResponse(201, "Study plan created", {
          $ref: "#/components/schemas/StudyPlan",
        }),
        ...crudResponses,
      },
    },
    get: {
      tags: ["Study Plan"],
      summary: "Get all study plans (admin)",
      description: "Requires VIEW_GUIDELINE permission.",
      operationId: "getAllStudyPlans",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Study plans retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        ...crudResponses,
      },
    },
  },
  "/study-plan/user": {
    get: {
      tags: ["Study Plan"],
      summary: "Get all study plans for users",
      operationId: "getAllStudyPlansForUsers",
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Study plans retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
      },
    },
  },
  "/study-plan/reorder": {
    patch: {
      tags: ["Study Plan"],
      summary: "Reorder study plans",
      description:
        "Updates position/order of study plans. Requires UPDATE_GUIDELINE permission.",
      operationId: "reorderStudyPlans",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/ReorderStudyPlansRequest",
        "Array of items with id and position, or { items: [...] }"
      ),
      responses: {
        "200": successResponse(200, "Study plan order updated"),
        "400": commonResponses.ValidationError,
        ...crudResponses,
      },
    },
  },
  "/study-plan/{id}": {
    get: {
      tags: ["Study Plan"],
      summary: "Get study plan by ID",
      operationId: "getStudyPlanById",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Study plan retrieved", {
          $ref: "#/components/schemas/StudyPlan",
        }),
        "404": commonResponses.NotFound,
      },
    },
    put: {
      tags: ["Study Plan"],
      summary: "Update study plan",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "updateStudyPlan",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateStudyPlanRequest",
        "Study plan update payload"
      ),
      responses: {
        "200": successResponse(200, "Study plan updated", {
          $ref: "#/components/schemas/StudyPlan",
        }),
        "404": commonResponses.NotFound,
        ...crudResponses,
      },
    },
    delete: {
      tags: ["Study Plan"],
      summary: "Delete study plan",
      description: "Requires DELETE_GUIDELINE permission.",
      operationId: "deleteStudyPlan",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Study plan deleted"),
        "404": commonResponses.NotFound,
        ...crudResponses,
      },
    },
    patch: {
      tags: ["Study Plan"],
      summary: "Toggle study plan status",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "toggleStudyPlanStatus",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Status toggled", {
          $ref: "#/components/schemas/StudyPlan",
        }),
        "404": commonResponses.NotFound,
        ...crudResponses,
      },
    },
  },
};

export const examRoutinePaths = {
  "/exam-routine": {
    post: {
      tags: ["Exam Routine"],
      summary: "Create exam routine",
      description: "Requires CREATE_GUIDELINE permission.",
      operationId: "createExamRoutine",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateExamRoutineRequest",
        "Exam routine creation payload"
      ),
      responses: {
        "201": successResponse(201, "Exam routine created", {
          $ref: "#/components/schemas/ExamRoutine",
        }),
        ...crudResponses,
      },
    },
    get: {
      tags: ["Exam Routine"],
      summary: "Get all exam routines (admin)",
      description: "Requires VIEW_GUIDELINE permission.",
      operationId: "getAllExamRoutines",
      security: securityRequirements.authenticated,
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Exam routines retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
        ...crudResponses,
      },
    },
  },
  "/exam-routine/user": {
    get: {
      tags: ["Exam Routine"],
      summary: "Get all exam routines for users",
      description: "Returns active routines sorted by post_date descending.",
      operationId: "getAllExamRoutinesForUsers",
      parameters: paginationParams,
      responses: {
        "200": successResponse(200, "Exam routines retrieved", {
          $ref: "#/components/schemas/PaginatedResponse",
        }),
      },
    },
  },
  "/exam-routine/reorder": {
    patch: {
      tags: ["Exam Routine"],
      summary: "Reorder exam routines",
      description:
        "Updates position/order of exam routines. Requires UPDATE_GUIDELINE permission.",
      operationId: "reorderExamRoutines",
      security: securityRequirements.authenticated,
      requestBody: jsonRequestBody(
        "#/components/schemas/ReorderExamRoutinesRequest",
        "Array of items with id and position, or { items: [...] }"
      ),
      responses: {
        "200": successResponse(200, "Exam routine order updated"),
        "400": commonResponses.ValidationError,
        ...crudResponses,
      },
    },
  },
  "/exam-routine/{id}": {
    get: {
      tags: ["Exam Routine"],
      summary: "Get exam routine by ID",
      operationId: "getExamRoutineById",
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Exam routine retrieved", {
          $ref: "#/components/schemas/ExamRoutine",
        }),
        "404": commonResponses.NotFound,
      },
    },
    put: {
      tags: ["Exam Routine"],
      summary: "Update exam routine",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "updateExamRoutine",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      requestBody: jsonRequestBody(
        "#/components/schemas/CreateExamRoutineRequest",
        "Exam routine update payload"
      ),
      responses: {
        "200": successResponse(200, "Exam routine updated", {
          $ref: "#/components/schemas/ExamRoutine",
        }),
        "404": commonResponses.NotFound,
        ...crudResponses,
      },
    },
    delete: {
      tags: ["Exam Routine"],
      summary: "Delete exam routine",
      description: "Requires DELETE_GUIDELINE permission.",
      operationId: "deleteExamRoutine",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Exam routine deleted"),
        "404": commonResponses.NotFound,
        ...crudResponses,
      },
    },
    patch: {
      tags: ["Exam Routine"],
      summary: "Toggle exam routine status",
      description: "Requires UPDATE_GUIDELINE permission.",
      operationId: "toggleExamRoutineStatus",
      security: securityRequirements.authenticated,
      parameters: [objectIdParam],
      responses: {
        "200": successResponse(200, "Status toggled", {
          $ref: "#/components/schemas/ExamRoutine",
        }),
        "404": commonResponses.NotFound,
        ...crudResponses,
      },
    },
  },
};

export const notificationPaths = {
  "/notifications": {
    get: {
      tags: ["Notification"],
      summary: "Get all notifications",
      description: "Retrieves notifications. Requires userId query parameter.",
      operationId: "getNotifications",
      parameters: [
        {
          name: "userId",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "User ID to fetch notifications for",
        },
      ],
      responses: {
        "200": successResponse(200, "Notifications retrieved", {
          type: "array",
          items: { $ref: "#/components/schemas/Notification" },
        }),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/notifications/unread": {
    get: {
      tags: ["Notification"],
      summary: "Get unread notifications",
      operationId: "getUnreadNotifications",
      parameters: [
        {
          name: "userId",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": successResponse(200, "Unread notifications retrieved", {
          type: "array",
          items: { $ref: "#/components/schemas/Notification" },
        }),
        "400": commonResponses.ValidationError,
      },
    },
  },
  "/notifications/{id}/read": {
    patch: {
      tags: ["Notification"],
      summary: "Mark notification as read",
      operationId: "markNotificationAsRead",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "objectId" },
        },
      ],
      responses: {
        "200": successResponse(200, "Notification marked as read", {
          $ref: "#/components/schemas/Notification",
        }),
        "404": commonResponses.NotFound,
      },
    },
  },
};
