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
} from "./exam.utils";
import { IJWtPayload } from "@/interfaces/common.interface";
import { ADMIN_ROLE_VALUES, IAdminRole } from "@/constants/roles";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

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

class Service {
  async createExam(payload: Partial<IExam>, actor?: ActorInfo): Promise<IExam> {
    try {
      const examNumber = BarcodeService.generateEAN13();

      const examData = {
        ...payload,
        exam_number: examNumber,
        is_published: Boolean(payload.exam_date_time),
        is_started: false,
        is_completed: false,
        results_published: false,
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
      .sort({ createdAt: -1 });

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
      ...searchHelpers.buildSearchCondition({
        searchFields: ["exam_name"],
        searchTerm,
      }),
    };

    const exams = await ExamModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .select("-questions")
      .sort({ createdAt: -1 });

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
      ...searchHelpers.buildSearchCondition({
        searchFields: ["exam_name"],
        searchTerm,
        numericIdField: "exam_number",
      }),
    };

    const [aggregationResult] = await ExamModel.aggregate([
      { $match: searchCondition },
      { $sort: { createdAt: -1 } },
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
      },
    ]);

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
      is_started: true,
      is_completed: false,
      $or: [{ is_published: true }, { is_started: true }],
    }).populate("questions");
    return withBangladeshExamDateTime(exam);
  }

  async updateExamById(id: string, payload: Partial<IExam>, actor?: ActorInfo) {
    const updatedExam = await ExamModel.findOneAndUpdate(
      buildExamFilter(id),
      payload,
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
    const statusUpdate: Partial<IExam> & {
      manual_status_override: boolean;
    } = {
      ...payload,
      manual_status_override: true,
    };

    if (payload.is_completed === true) {
      statusUpdate.results_published = true;
    } else if (payload.is_completed === false) {
      statusUpdate.results_published = false;
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
