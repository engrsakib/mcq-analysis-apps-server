import { BarcodeService } from "@/lib/barcode";
import { ExamRoutine } from "./exam_routine.model";
import { GUIDELINE_STATUS } from "./exam_routine.interface";
import { eventBus } from "@/events/EventBus";
import { AnyBulkWriteOperation, Types } from "mongoose";
import { searchHelpers } from "@/utils/searchHelpers";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

type ReorderExamRoutineItem = {
  id?: string | number;
  _id?: string;
  exam_routine_number?: string | number;
  position: number;
};

class Service {
  async createExamRoutine(routineData: any, actor?: ActorInfo) {
    routineData.is_published = false;
    routineData.exam_routine_number = await BarcodeService.generateEAN13();

    if (routineData.position === undefined || routineData.position === null) {
      const lastRoutine = await ExamRoutine.findOne()
        .sort({ position: -1 })
        .select("position");

      routineData.position = (lastRoutine?.position || 0) + 1;
    }

    if (!routineData.post_date) {
      routineData.post_date = new Date();
    }

    const routine = await ExamRoutine.create(routineData);

    await eventBus.publish({
      type: "EXAM_ROUTINE_CREATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "exam-routine",
        entityLabel: `"${routine.title || "Exam Routine"}"`,
        entityId: String(routine.exam_routine_number),
        module: "exam-routine",
      }),
    });

    return routine;
  }

  async getAllExamRoutines(query: any) {
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

    const routines = await ExamRoutine.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ post_date: -1, createdAt: -1 });

    const total = await ExamRoutine.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: routines,
    };
  }

  async getAllExamRoutinesForUsers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      status: GUIDELINE_STATUS.ACTIVE,
      ...searchHelpers.buildSearchCondition({
        searchFields: ["title"],
        searchTerm,
      }),
    };

    const routines = await ExamRoutine.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ post_date: -1, createdAt: -1 });

    const total = await ExamRoutine.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: routines,
    };
  }

  async getExamRoutineById(id: string) {
    const routine = await ExamRoutine.findOne({ exam_routine_number: id });
    return routine;
  }

  async updateExamRoutineById(id: string, updateData: any, actor?: ActorInfo) {
    const updatedRoutine = await ExamRoutine.findOneAndUpdate(
      { exam_routine_number: id },
      updateData,
      { new: true }
    );

    if (updatedRoutine) {
      await eventBus.publish({
        type: "EXAM_ROUTINE_UPDATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "updated",
          entityType: "exam-routine",
          entityLabel: `"${updatedRoutine.title || "Exam Routine"}"`,
          entityId: String(updatedRoutine.exam_routine_number),
          module: "exam-routine",
        }),
      });
    }

    return updatedRoutine;
  }

  async reorderExamRoutines(items: ReorderExamRoutineItem[]) {
    const operations = items.reduce<AnyBulkWriteOperation<any>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.exam_routine_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { exam_routine_number: Number(identifier) };

        if (
          "exam_routine_number" in filter &&
          !Number.isFinite(filter.exam_routine_number)
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

    return ExamRoutine.bulkWrite(operations);
  }

  async deleteExamRoutineById(id: string) {
    const deletedRoutine = await ExamRoutine.findOneAndDelete({
      exam_routine_number: id,
    });
    return deletedRoutine;
  }

  async toggleExamRoutineStatus(id: string) {
    const result = await ExamRoutine.findOneAndUpdate(
      { exam_routine_number: id },
      [
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ["$status", GUIDELINE_STATUS.ACTIVE] },
                then: GUIDELINE_STATUS.INACTIVE,
                else: GUIDELINE_STATUS.ACTIVE,
              },
            },
          },
        },
      ],
      { new: true }
    );

    return result;
  }
}

export const ExamRoutineService = new Service();
