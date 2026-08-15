import { BarcodeService } from "@/lib/barcode";
import { ExamSolution } from "./exam_solution.model";
import { EXAM_SOLUTION_STATUS } from "./exam_solution.interface";
import { eventBus } from "@/events/EventBus";
import { AnyBulkWriteOperation, Types } from "mongoose";
import { searchHelpers } from "@/utils/searchHelpers";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

type ReorderExamSolutionItem = {
  id?: string | number;
  _id?: string;
  exam_solution_number?: string | number;
  position: number;
};

class Service {
  async createExamSolution(data: any, actor?: ActorInfo) {
    data.is_published = false;
    data.exam_solution_number = await BarcodeService.generateEAN13();
    if (data.position === undefined || data.position === null) {
      const lastItem = await ExamSolution.findOne()
        .sort({ position: -1 })
        .select("position");

      data.position = (lastItem?.position || 0) + 1;
    }

    const item = await ExamSolution.create(data);

    await eventBus.publish({
      type: "EXAM_SOLUTION_CREATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "exam-solution",
        entityLabel: `"${item.title || "Exam Solution"}"`,
        entityId: String(item.exam_solution_number),
        module: "exam-solution",
      }),
    });

    return item;
  }

  async getAllExamSolutions(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    const items = await ExamSolution.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await ExamSolution.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: items,
    };
  }

  async getAllExamSolutionsForUsers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      status: EXAM_SOLUTION_STATUS.ACTIVE,
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    const items = await ExamSolution.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await ExamSolution.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: items,
    };
  }

  async getExamSolutionById(id: string) {
    return ExamSolution.findOne({ exam_solution_number: id });
  }

  async updateExamSolutionById(id: string, updateData: any, actor?: ActorInfo) {
    const updated = await ExamSolution.findOneAndUpdate(
      { exam_solution_number: id },
      updateData,
      { new: true }
    );

    if (updated) {
      await eventBus.publish({
        type: "EXAM_SOLUTION_UPDATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "updated",
          entityType: "exam-solution",
          entityLabel: `"${updated.title || "Exam Solution"}"`,
          entityId: String(updated.exam_solution_number),
          module: "exam-solution",
        }),
      });
    }

    return updated;
  }

  async reorderExamSolutions(items: ReorderExamSolutionItem[]) {
    const operations = items.reduce<AnyBulkWriteOperation<any>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.exam_solution_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { exam_solution_number: Number(identifier) };

        if (
          "exam_solution_number" in filter &&
          !Number.isFinite(filter.exam_solution_number)
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

    return ExamSolution.bulkWrite(operations);
  }

  async deleteExamSolutionById(id: string) {
    return ExamSolution.findOneAndDelete({ exam_solution_number: id });
  }

  async toggleExamSolutionStatus(id: string) {
    return ExamSolution.findOneAndUpdate(
      { exam_solution_number: id },
      [
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ["$status", EXAM_SOLUTION_STATUS.ACTIVE] },
                then: EXAM_SOLUTION_STATUS.INACTIVE,
                else: EXAM_SOLUTION_STATUS.ACTIVE,
              },
            },
          },
        },
      ],
      { new: true }
    );
  }
}

export const ExamSolutionService = new Service();
