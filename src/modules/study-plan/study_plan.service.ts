import { BarcodeService } from "@/lib/barcode";
import { StudyPlan } from "./study_plan.model";
import { GUIDELINE_STATUS } from "./study_plan.interface";
import { eventBus } from "@/events/EventBus";
import { AnyBulkWriteOperation, Types } from "mongoose";

type ReorderStudyPlanItem = {
  id?: string | number;
  _id?: string;
  study_plan_number?: string | number;
  position: number;
};

class Service {
  async createStudyPlan(guidelineData: any) {
    guidelineData.is_published = false;
    guidelineData.study_plan_number = await BarcodeService.generateEAN13();
    if (
      guidelineData.position === undefined ||
      guidelineData.position === null
    ) {
      const lastStudyPlan = await StudyPlan.findOne()
        .sort({ position: -1 })
        .select("position");

      guidelineData.position = (lastStudyPlan?.position || 0) + 1;
    }

    const guideline = await StudyPlan.create(guidelineData);

    await eventBus.publish({
      type: "STUDY_PLAN_CREATED",
      payload: {
        userId: guidelineData.created_by || "system",
        title: guideline.title || "Study Plan",
        description: "Created successfully",
        module: "study-plan",
        time: new Date().toISOString(),
        planId: guideline.study_plan_number as number,
      },
    });

    return guideline;
  }

  async getAllStudyPlans(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    const guidelines = await StudyPlan.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await StudyPlan.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: guidelines,
    };
  }

  async getAllStudyPlansForUsers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      status: GUIDELINE_STATUS.ACTIVE,
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    const guidelines = await StudyPlan.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await StudyPlan.countDocuments(searchCondition);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: guidelines,
    };
  }

  async getStudyPlanById(id: string) {
    const studyPlan = await StudyPlan.findOne({ study_plan_number: id });
    return studyPlan;
  }

  async updateStudyPlanById(id: string, updateData: any) {
    const updatedGuideline = await StudyPlan.findOneAndUpdate(
      { study_plan_number: id },
      updateData,
      { new: true }
    );

    if (updatedGuideline) {
      await eventBus.publish({
        type: "STUDY_PLAN_UPDATED",
        payload: {
          userId: updateData.updated_by || "system",
          title: updatedGuideline.title || "Study Plan",
          description: "Updated successfully",
          module: "study-plan",
          time: new Date().toISOString(),
          planId: updatedGuideline.study_plan_number as number,
        },
      });
    }

    return updatedGuideline;
  }

  async reorderStudyPlans(items: ReorderStudyPlanItem[]) {
    const operations = items.reduce<AnyBulkWriteOperation<any>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.study_plan_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { study_plan_number: Number(identifier) };

        if (
          "study_plan_number" in filter &&
          !Number.isFinite(filter.study_plan_number)
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

    return StudyPlan.bulkWrite(operations);
  }

  async deleteStudyPlanById(id: string) {
    const deletedStudyPlan = await StudyPlan.findOneAndDelete({
      study_plan_number: id,
    });
    return deletedStudyPlan;
  }

  async toggleStudyPlanStatus(id: string) {
    const result = await StudyPlan.findOneAndUpdate(
      { study_plan_number: id },
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

export const StudyPlanService = new Service();
