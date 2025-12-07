import { BarcodeService } from "@/lib/barcode";
import { GuidelineModel } from "./guideline.model";
import { GUIDELINE_STATUS } from "./guideline.interface";

class Service {
  async createGuideline(guidelineData: any) {
    guidelineData.is_published = false; // Default value
    guidelineData.guideline_number = await BarcodeService.generateEAN13(); // Auto-increment guideline_number

    const guideline = await GuidelineModel.create(guidelineData);

    return guideline;
  }

  async getAllGuidelines(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm || "";

    const searchCondition = {
      status: GUIDELINE_STATUS.ACTIVE,
      ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
    };

    const guidelines = await GuidelineModel.find(searchCondition)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

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

  async updateGuidelineById(id: string, updateData: any) {
    const updatedGuideline = await GuidelineModel.findOneAndUpdate(
      { guideline_number: id },
      updateData,
      { new: true }
    );
    return updatedGuideline;
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
