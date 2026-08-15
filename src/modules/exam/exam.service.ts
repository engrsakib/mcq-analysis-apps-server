import mongoose from "mongoose";
import { BarcodeService } from "@/lib/barcode";
import { ExamModel } from "./exam.model";
import { IExam } from "./exam.interface";
import { eventBus } from "@/events/EventBus";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { UserModel } from "@/modules/user/user.model";
import { searchHelpers } from "@/utils/searchHelpers";
import { syncExamLifecycle } from "./examScheduler.service";
import {
  mapExamsWithBangladeshDateTime,
  withBangladeshExamDateTime,
  withShuffledQuestions,
} from "./exam.utils";
import { IJWtPayload } from "@/interfaces/common.interface";
import { ADMIN_ROLE_VALUES, IAdminRole } from "@/constants/roles";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";
import {
  DEFAULT_EXAM_SUBJECT,
  EXAM_SUBJECTS,
  ExamSubject,
  SUBJECTIVE_EXAM_SUBJECTS,
} from "./exam.constants";
import { pickExamCreatePayload, pickExamUpdatePayload } from "./exam.payload";

// Exams are addressable by either their Mongo _id or their numeric exam_number,
// so callers may pass whichever identifier they have at hand.
const buildExamFilter = (id: string): Record<string, unknown> => {
  const trimmedId = String(id ?? "").trim();

  if (/^[0-9a-fA-F]{24}$/.test(trimmedId)) {
    return { _id: new mongoose.Types.ObjectId(trimmedId) };
  }

  const examNumber = Number(trimmedId);
  if (!trimmedId || !Number.isFinite(examNumber)) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      "Invalid exam identifier. Provide an exam _id or an exam_number."
    );
  }

  return { exam_number: examNumber };
};

const buildSubjectFilter = (query: Record<string, unknown>) => {
  const excludeSubject =
    typeof query.excludeSubject === "string" ? query.excludeSubject.trim() : "";

  if (excludeSubject.length > 0) {
    if (!EXAM_SUBJECTS.includes(excludeSubject as ExamSubject)) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        `Invalid excludeSubject. Allowed values: ${EXAM_SUBJECTS.join(", ")}`
      );
    }

    if (excludeSubject === DEFAULT_EXAM_SUBJECT) {
      return { subject: { $in: [...SUBJECTIVE_EXAM_SUBJECTS] } };
    }

    return { subject: { $ne: excludeSubject } };
  }

  const requestedSubject =
    typeof query.subject === "string" ? query.subject.trim() : "";

  const subject =
    requestedSubject.length > 0 ? requestedSubject : DEFAULT_EXAM_SUBJECT;

  if (!EXAM_SUBJECTS.includes(subject as ExamSubject)) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      `Invalid subject. Allowed values: ${EXAM_SUBJECTS.join(", ")}`
    );
  }

  if (subject === DEFAULT_EXAM_SUBJECT) {
    return {
      $or: [{ subject: DEFAULT_EXAM_SUBJECT }, { subject: { $exists: false } }],
    };
  }

  return { subject };
};

class Service {
  async createExam(payload: Partial<IExam>, actor?: ActorInfo): Promise<IExam> {
    try {
      const examNumber = BarcodeService.generateEAN13();
      const normalizedPayload = pickExamCreatePayload(payload);

      const examData = {
        ...normalizedPayload,
        exam_number: examNumber,
        is_published: Boolean(normalizedPayload.exam_date_time),
        is_started: false,
        is_completed: false,
        results_published: false,
        is_practice_mode: false,
      };

      const result = await ExamModel.create(examData);

      await eventBus.publish({
        type: "EXAM_CREATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "created",
          entityType: "exam",
          entityLabel: `"${result.exam_name || "Exam"}"`,
          entityId: String(result.exam_number),
          module: "exam",
        }),
      });

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(`Failed to create exam: ${error}`);
    }
  }

  async getAllExams(query: any) {
    await syncExamLifecycle();

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition: Record<string, unknown> = {
      ...searchHelpers.buildSearchCondition({
        searchFields: ["exam_name"],
        searchTerm,
      }),
    };

    if (query.is_completed === "true") {
      searchCondition.is_completed = true;
    } else if (query.is_completed === "false") {
      searchCondition.is_completed = false;
    }

    const exams = await ExamModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .select("-questions")
      .sort({ exam_date_time: -1, exam_number: -1 });

    const total = await ExamModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: exams,
    };
  }

  // get upcoming exams for users — published, not started, not completed
  async getUpcomingExamsForUsers(query: any) {
    await syncExamLifecycle();

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";
    const now = new Date();

    const searchCondition = {
      is_published: true,
      is_started: false,
      is_completed: false,
      exam_date_time: { $gt: now },
      ...buildSubjectFilter(query),
      ...searchHelpers.buildSearchCondition({
        searchFields: ["exam_name"],
        searchTerm,
      }),
    };

    const exams = await ExamModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .select("-questions")
      .sort({ exam_date_time: -1, exam_number: -1 });

    const total = await ExamModel.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: mapExamsWithBangladeshDateTime(exams),
    };
  }

  async getAllExamsForUsers(query: any, user: IJWtPayload) {
    await syncExamLifecycle();

    if (!user?.phone_number) {
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Authenticated user phone number is required"
      );
    }

    const isAdmin = ADMIN_ROLE_VALUES.includes(user.role as IAdminRole);

    if (!isAdmin) {
      const userRecord = await UserModel.findById(user.id)
        .select("phone_number is_Deleted status")
        .lean();

      if (!userRecord || userRecord.is_Deleted) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
      }

      if (userRecord.status === "inactive") {
        throw new ApiError(
          HttpStatusCode.FORBIDDEN,
          "User account is inactive"
        );
      }
    }

    const userPhone = user.phone_number;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition: Record<string, unknown> = {
      $or: [{ is_published: true }, { is_started: true }],
      ...buildSubjectFilter(query),
      ...searchHelpers.buildSearchCondition({
        searchFields: ["exam_name"],
        searchTerm,
        numericIdField: "exam_number",
      }),
    };

    const filterLive =
      query.isLive === true || query.isLive === "true" || query.isLive === "1";

    const pipeline: mongoose.PipelineStage[] = [
      { $match: searchCondition },
      {
        $addFields: {
          isLive: {
            $and: [
              { $eq: ["$is_started", true] },
              { $eq: ["$is_completed", false] },
            ],
          },
          isPractice: { $eq: ["$is_practice_mode", true] },
        },
      },
    ];

    if (filterLive) {
      pipeline.push({ $match: { isLive: true } });
    }

    pipeline.push(
      { $sort: { exam_date_time: -1, exam_number: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "results",
                let: { examNum: "$exam_number" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$exam_number", "$$examNum"] },
                          { $eq: ["$student_phone", userPhone] },
                        ],
                      },
                    },
                  },
                  { $project: { _id: 1 } },
                  { $limit: 1 },
                ],
                as: "userSubmission",
              },
            },
            {
              $addFields: {
                isSubmitted: {
                  $gt: [{ $size: "$userSubmission" }, 0],
                },
              },
            },
            {
              $project: {
                questions: 0,
                negative_mark: 0,
                __v: 0,
                userSubmission: 0,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      }
    );

    const [aggregationResult] = await ExamModel.aggregate(pipeline);

    const total = aggregationResult?.total?.[0]?.count || 0;

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: mapExamsWithBangladeshDateTime(aggregationResult?.data || []),
    };
  }

  async getExamById(id: string) {
    await syncExamLifecycle();

    const exam = await ExamModel.findOne(buildExamFilter(id)).populate(
      "questions"
    );
    return exam;
  }

  async getExamByIdForUsers(id: string) {
    await syncExamLifecycle();

    const exam = await ExamModel.findOne({
      ...buildExamFilter(id),
      is_published: true,
      $or: [
        { is_started: true, is_completed: false },
        { is_practice_mode: true },
      ],
    }).populate("questions");

    if (!exam) {
      return null;
    }

    return withShuffledQuestions(withBangladeshExamDateTime(exam));
  }

  async updateExamById(id: string, payload: Partial<IExam>, actor?: ActorInfo) {
    const normalizedPayload = pickExamUpdatePayload(payload);

    const updatedExam = await ExamModel.findOneAndUpdate(
      buildExamFilter(id),
      normalizedPayload,
      {
        new: true,
        runValidators: true,
      }
    ).populate("questions");

    if (!updatedExam) {
      throw new Error("Exam not found");
    }

    await eventBus.publish({
      type: "EXAM_UPDATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "updated",
        entityType: "exam",
        entityLabel: `"${updatedExam.exam_name || "Exam"}"`,
        entityId: String(updatedExam.exam_number),
        module: "exam",
      }),
    });

    return updatedExam;
  }

  async deleteExamById(id: string, actor?: ActorInfo) {
    const deletedExam = await ExamModel.findOneAndDelete(buildExamFilter(id));

    if (deletedExam) {
      await eventBus.publish({
        type: "EXAM_DELETED",
        payload: buildAdminActivityPayload({
          actor,
          action: "deleted",
          entityType: "exam",
          entityLabel: `"${deletedExam.exam_name || "Exam"}"`,
          entityId: String(deletedExam.exam_number),
          module: "exam",
        }),
      });
    }

    return deletedExam;
  }

  async getExamForSearch(search?: string) {
    const query: Record<string, unknown> = {
      ...searchHelpers.buildSearchCondition({
        searchFields: ["exam_name"],
        searchTerm: search,
        numericIdField: "exam_number",
      }),
    };

    const exams = await ExamModel.find(query)
      .select("exam_number exam_name exam_date_time is_published, is_completed")
      .sort({ exam_date_time: -1 })
      .limit(15)
      .lean();

    return exams;
  }

  async updateExamStatus(
    id: string,
    payload: Partial<IExam>,
    actor?: ActorInfo
  ) {
    const existingExam = await ExamModel.findOne(buildExamFilter(id)).lean();

    if (!existingExam) {
      throw new Error("Exam not found");
    }

    const statusUpdate: Partial<IExam> & {
      manual_status_override: boolean;
    } = {
      is_published: payload.is_published,
      is_started: payload.is_started,
      is_completed: payload.is_completed,
      manual_status_override: true,
    };

    if (payload.is_completed === true) {
      if (!existingExam.is_completed) {
        statusUpdate.completed_at = new Date();
      }

      if (payload.is_practice_mode === true) {
        statusUpdate.is_practice_mode = true;
        statusUpdate.results_published = true;
      } else {
        statusUpdate.is_practice_mode = false;
        if (!existingExam.is_completed) {
          statusUpdate.results_published = false;
        }
      }
    } else if (payload.is_completed === false) {
      statusUpdate.results_published = false;
      statusUpdate.is_practice_mode = false;
      statusUpdate.completed_at = null;
    } else if (typeof payload.is_practice_mode === "boolean") {
      statusUpdate.is_practice_mode = payload.is_practice_mode;
      if (payload.is_practice_mode) {
        statusUpdate.results_published = true;
      }
    }

    const updatedExam = await ExamModel.findOneAndUpdate(
      buildExamFilter(id),
      statusUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedExam) {
      throw new Error("Exam not found");
    }

    await eventBus.publish({
      type: "EXAM_UPDATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "updated",
        entityType: "exam",
        entityLabel: `"${updatedExam.exam_name || "Exam"}" status`,
        entityId: String(updatedExam.exam_number),
        module: "exam",
      }),
    });

    return updatedExam;
  }
}

export const examService = new Service();
