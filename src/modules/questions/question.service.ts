import { Types } from "mongoose";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IPaginationOptions } from "@/interfaces/pagination.interfaces";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { QuestionModel } from "./questuon.model";
import { BarcodeService } from "@/lib/barcode";
import { QuestionStudyTopicModel } from "../question-study-topic/question-study-topic.model";

const CATEGORY_POPULATE_FIELDS = "name category_number type position";

class Service {
  private validateCategoryId = async (categoryId: unknown) => {
    if (!categoryId) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "category_id is required");
    }

    if (!Types.ObjectId.isValid(String(categoryId))) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid category_id");
    }

    const topic = await QuestionStudyTopicModel.findById(categoryId);

    if (!topic) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Study topic not found for category_id"
      );
    }

    return topic;
  };

  private sanitizeQuestionPayload = (data: Record<string, unknown>) => {
    const payload = { ...data };
    delete payload.questionId;
    delete payload.category_number;
    return payload;
  };

  createQuestion = async (questionData: Record<string, unknown>) => {
    await this.validateCategoryId(questionData.category_id);

    const payload = this.sanitizeQuestionPayload(questionData);
    payload.questionId = BarcodeService.generateEAN13();

    const question = await QuestionModel.create(payload);
    return question.populate("category_id", CATEGORY_POPULATE_FIELDS);
  };

  getAllQuestions = async (
    filters: {
      searchTerm?: string;
      category_number?: number;
      category_id?: string;
    },
    paginationOptions: IPaginationOptions
  ) => {
    const { searchTerm, category_number, category_id } = filters;
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination(paginationOptions);

    const andConditions: Record<string, unknown>[] = [];

    if (searchTerm) {
      andConditions.push({
        title: {
          $regex: searchTerm,
          $options: "i",
        },
      });
    }

    if (category_number && Number.isFinite(category_number)) {
      const topic = await QuestionStudyTopicModel.findOne({ category_number });

      if (topic) {
        andConditions.push({ category_id: topic._id });
      } else {
        andConditions.push({ category_id: null });
      }
    } else if (category_id && Types.ObjectId.isValid(category_id)) {
      const topic = await QuestionStudyTopicModel.findById(category_id);

      if (topic) {
        andConditions.push({ category_id: topic._id });
      } else {
        andConditions.push({ category_id: null });
      }
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const sortConditions: { [key: string]: 1 | -1 } = {};
    if (sortBy && sortOrder) {
      sortConditions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    const questions = await QuestionModel.find(whereConditions)
      .populate("category_id", CATEGORY_POPULATE_FIELDS)
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    const total = await QuestionModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: questions,
    };
  };

  getQuestionById = async (id: number) => {
    const question = await QuestionModel.findOne({ questionId: id }).populate(
      "category_id",
      CATEGORY_POPULATE_FIELDS
    );

    if (!question) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Question not found");
    }

    return question;
  };

  updateQuestionById = async (
    id: number,
    updateData: Record<string, unknown>
  ) => {
    if (updateData.category_id !== undefined) {
      await this.validateCategoryId(updateData.category_id);
    }

    const payload = this.sanitizeQuestionPayload(updateData);

    const question = await QuestionModel.findOneAndUpdate(
      { questionId: id },
      payload,
      { new: true }
    ).populate("category_id", CATEGORY_POPULATE_FIELDS);

    if (!question) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Question not found");
    }

    return question;
  };

  deleteQuestionById = async (id: number) => {
    const question = await QuestionModel.findOneAndDelete({ questionId: id });

    if (!question) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Question not found");
    }

    return question;
  };
}

export const QuestionService = new Service();
