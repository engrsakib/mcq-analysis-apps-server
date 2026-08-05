import { BarcodeService } from "@/lib/barcode";
import { GuidelineModel } from "./guideline.model";
import { GUIDELINE_STATUS } from "./guideline.interface";
import { eventBus } from "@/events/EventBus";
import { searchHelpers } from "@/utils/searchHelpers";
import { AnyBulkWriteOperation, Types } from "mongoose";
import {
  ActorInfo,
  buildAdminActivityPayload,
} from "@/modules/notification/notification.helpers";

type ReorderGuidelineItem = {
  id?: string | number;
  _id?: string;
  guideline_number?: string | number;
  position: number;
};

class Service {
  async createGuideline(guidelineData: any, actor?: ActorInfo) {
    guidelineData.is_published = false;
    guidelineData.guideline_number = await BarcodeService.generateEAN13();

    if (
      guidelineData.position === undefined ||
      guidelineData.position === null
    ) {
      const lastGuideline = await GuidelineModel.findOne()
        .sort({ position: -1 })
        .select("position");

      guidelineData.position = (lastGuideline?.position || 0) + 1;
    }

    const guideline = await GuidelineModel.create(guidelineData);

    await eventBus.publish({
      type: "GUIDELINE_CREATED",
      payload: buildAdminActivityPayload({
        actor,
        action: "created",
        entityType: "guideline",
        entityLabel: `"${guideline.title || "Guideline"}"`,
        entityId: String(guideline.guideline_number),
        module: "guideline",
      }),
    });

    return guideline;
  }

  async getAllGuidelines(query: any) {
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

    const guidelines = await GuidelineModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await GuidelineModel.countDocuments(searchCondition);

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

  async getAllGuidelinesForUsers(query: any) {
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

    const guidelines = await GuidelineModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ position: 1, createdAt: -1 });

    const total = await GuidelineModel.countDocuments(searchCondition);

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

  async getGuidelineById(id: string) {
    const guideline = await GuidelineModel.findOne({ guideline_number: id });
    return guideline;
  }

  async updateGuidelineById(id: string, updateData: any, actor?: ActorInfo) {
    const updatedGuideline = await GuidelineModel.findOneAndUpdate(
      { guideline_number: id },
      updateData,
      { new: true }
    );

    if (updatedGuideline) {
      await eventBus.publish({
        type: "GUIDELINE_UPDATED",
        payload: buildAdminActivityPayload({
          actor,
          action: "updated",
          entityType: "guideline",
          entityLabel: `"${updatedGuideline.title || "Guideline"}"`,
          entityId: String(updatedGuideline.guideline_number),
          module: "guideline",
        }),
      });
    }

    return updatedGuideline;
  }

  async reorderGuidelines(items: ReorderGuidelineItem[]) {
    const operations = items.reduce<AnyBulkWriteOperation<any>[]>(
      (acc, item) => {
        const identifier = item.id || item._id || item.guideline_number;
        const position = Number(item.position);

        if (!identifier || !Number.isInteger(position) || position < 0) {
          return acc;
        }

        const filter =
          typeof identifier === "string" && Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { guideline_number: Number(identifier) };

        if (
          "guideline_number" in filter &&
          !Number.isFinite(filter.guideline_number)
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

    return GuidelineModel.bulkWrite(operations);
  }

  async deleteGuidelineById(id: string) {
    const deletedGuideline = await GuidelineModel.findOneAndDelete({
      guideline_number: id,
    });
    return deletedGuideline;
  }

  async toggleGuidelineStatus(id: string) {
    const result = await GuidelineModel.findOneAndUpdate(
      { guideline_number: id },
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

export const GuidelineService = new Service();
