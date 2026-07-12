import { BarcodeService } from "@/lib/barcode";
import { ExamModel } from "./exam.model";
import { IExam } from "./exam.interface";
import { eventBus } from "@/events/EventBus";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { UserModel } from "@/modules/user/user.model";
import { searchHelpers } from "@/utils/searchHelpers";

class Service {
  async createExam(payload: Partial<IExam>): Promise<IExam> {
    try {
      const examNumber = BarcodeService.generateEAN13();

      const examData = {
        ...payload,
        exam_number: examNumber,
        is_published: false,
        is_started: false,
        is_completed: false,
      };

      const result = await ExamModel.create(examData);

      await eventBus.publish({
        type: "EXAM_CREATED",
        payload: {
          userId: (payload as any).created_by || "system",
          title: (result as any).title || "Exam",
          description: "Created successfully",
          module: "exam",
          time: new Date().toISOString(),
          examId:
            (result.exam_number as any)?.toString() || result._id.toString(),
        },
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to create exam: ${error}`);
    }
  }

  async getAllExams(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
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
      data: exams,
    };
  }

  // get upcoming exams for users
  async getUpcomingExamsForUsers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      is_published: true,
      is_started: false,
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
      data: exams,
    };
  }

  async getAllExamsForUsers(query: any, userId: string) {
    if (!userId) {
      throw new ApiError(
        HttpStatusCode.UNAUTHORIZED,
        "Authenticated user ID is required"
      );
    }

    const userRecord = await UserModel.findById(userId)
      .select("phone_number is_Deleted")
      .lean();

    if (!userRecord || userRecord.is_Deleted) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
    }

    const userPhone = userRecord.phone_number;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition: Record<string, unknown> = {
      is_published: true,
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
                duration_minutes: 0,
                total_marks: 0,
                is_started: 0,
                is_completed: 0,
                is_published: 0,
                negative_mark: 0,
                createdAt: 0,
                updatedAt: 0,
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
      data: aggregationResult?.data || [],
    };
  }

  async getExamById(id: string) {
    const exam = await ExamModel.findOne({ exam_number: id }).populate(
      "questions"
    );
    return exam;
  }

  async getExamByIdForUsers(id: string) {
    const exam = await ExamModel.findOne({
      exam_number: id,
      is_started: true,
    }).populate("questions");
    return exam;
  }

  async updateExamById(id: string, payload: Partial<IExam>) {
    const updatedExam = await ExamModel.findOneAndUpdate(
      { exam_number: id },
      payload,
      {
        new: true,
        runValidators: true,
      }
    ).populate("questions");

    // যদি এক্সাম খুঁজে না পাওয়া যায়
    if (!updatedExam) {
      throw new Error("Exam not found");
    }
    await eventBus.publish({
      type: "EXAM_UPDATED",
      payload: {
        userId: (payload as any).updated_by || "system",
        title: (updatedExam as any).title || "Exam",
        description: "Updated successfully",
        module: "exam",
        time: new Date().toISOString(),
        examId:
          (updatedExam.exam_number as any)?.toString() ||
          updatedExam._id.toString(),
      },
    });
    return updatedExam;
  }

  async deleteExamById(id: string) {
    const deletedExam = await ExamModel.findOneAndDelete({
      exam_number: id,
    });
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

  async updateExamStatus(id: string, payload: Partial<IExam>) {
    const updatedExam = await ExamModel.findOneAndUpdate(
      { exam_number: id },
      payload,
      { new: true, runValidators: true }
    );

    if (!updatedExam) {
      throw new Error("Exam not found");
    }

    await eventBus.publish({
      type: "EXAM_UPDATED",
      payload: {
        userId: (payload as any).updated_by || "system",
        title: (updatedExam as any).title || "Exam",
        description: "Updated successfully",
        module: "exam",
        time: new Date().toISOString(),
        examId:
          (updatedExam.exam_number as any)?.toString() ||
          updatedExam._id.toString(),
      },
    });

    return updatedExam;
  }
}

export const examService = new Service();
