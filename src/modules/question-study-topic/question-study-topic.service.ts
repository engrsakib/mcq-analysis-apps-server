import { AnyBulkWriteOperation, Types } from "mongoose";
import { BarcodeService } from "@/lib/barcode";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { searchHelpers } from "@/utils/searchHelpers";
import { QuestionModel } from "../questions/questuon.model";
import { QuestionStudyTopicModel } from "./question-study-topic.model";
import { StudyTopicType } from "./question-study-topic.enum";

type ReorderItem = {
  id?: string | number;
  _id?: string;
  category_number?: string | number;
  position: number;
};

const ALLOWED_UPDATE_FIELDS = ["name", "type"] as const;

class Service {
  createTopic = async (topicData: { name: string; type: StudyTopicType }) => {
    const payload: Record<string, unknown> = {
      name: topicData.name,
      type: topicData.type,
      category_number: await BarcodeService.generateEAN13(),
    };

    const lastTopic = await QuestionStudyTopicModel.findOne()
      .sort({ position: -1 })
      .select("position");

    payload.position = (lastTopic?.position ?? 0) + 1;

    return QuestionStudyTopicModel.create(payload);
  };

  getAllTopics = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = (query.searchTerm as string) || "";
    const type = query.type as string | undefined;
    const categoryNumber = query.category_number
      ? Number(query.category_number)
      : undefined;
    const sortBy = (query.sortBy as string) || "position";
    const sortOrder = query.sortOrder === "desc" ? -1 : 1;

    const andConditions: Record<string, unknown>[] = [];

    if (searchTerm) {
      andConditions.push(
        searchHelpers.buildSearchCondition({
          searchFields: ["name"],
          searchTerm,
        })
      );
    }

    if (
      type &&
      Object.values(StudyTopicType).includes(type as StudyTopicType)
    ) {
      andConditions.push({ type });
    }

    if (categoryNumber && Number.isFinite(categoryNumber)) {
      andConditions.push({ category_number: categoryNumber });
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

    const allowedSortFields = ["position", "category_number", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "position";

    const topics = await QuestionStudyTopicModel.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortField]: sortOrder });

    const total = await QuestionStudyTopicModel.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: topics,
    };
  };

  getDropdownTopics = async () => {
    return QuestionStudyTopicModel.find()
      .select("name category_number type position")
      .sort({ position: 1 });
  };

  getTopicByCategoryNumber = async (categoryNumber: number) => {
    const topic = await QuestionStudyTopicModel.findOne({
      category_number: categoryNumber,
    });

    if (!topic) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Study topic not found");
    }

    return topic;
  };

  updateTopicByCategoryNumber = async (
    categoryNumber: number,
    updateData: Record<string, unknown>
  ) => {
    const sanitized: Record<string, unknown> = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (updateData[field] !== undefined) {
        sanitized[field] = updateData[field];
      }
    }

    if (!Object.keys(sanitized).length) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Only name and type can be updated"
      );
    }

    const topic = await QuestionStudyTopicModel.findOneAndUpdate(
      { category_number: categoryNumber },
      sanitized,
      { new: true }
    );

    if (!topic) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Study topic not found");
    }

    return topic;
  };

  reorderTopics = async (items: ReorderItem[]) => {
    const operations = items.reduce<AnyBulkWriteOperation<unknown>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.category_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { category_number: Number(identifier) };

        if (
          "category_number" in filter &&
          !Number.isFinite(filter.category_number)
        ) {
          return acc;
        }

        acc.push({
          updateOne: {
            filter,
            update: { $set: { position } },
          },
        });

        return acc;
      },
      []
    );

    if (!operations.length) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    return QuestionStudyTopicModel.bulkWrite(operations);
  };

  deleteTopicByCategoryNumber = async (categoryNumber: number) => {
    const topic = await QuestionStudyTopicModel.findOne({
      category_number: categoryNumber,
    });

    if (!topic) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Study topic not found");
    }

    const linkedCount = await QuestionModel.countDocuments({
      category_id: topic._id,
    });

    if (linkedCount > 0) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `Cannot delete topic: ${linkedCount} question(s) are linked to it`
      );
    }

    await QuestionStudyTopicModel.findOneAndDelete({
      category_number: categoryNumber,
    });

    return topic;
  };
}

export const QuestionStudyTopicService = new Service();
