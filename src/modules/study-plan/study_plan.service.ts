import { BarcodeService } from "@/lib/barcode";
import { StudyPlan } from "./study_plan.model";
import { GUIDELINE_STATUS } from "./study_plan.interface";

class Service {
  async createStudyPlan(guidelineData: any) {
    guidelineData.is_published = false;
    guidelineData.study_plan_number = await BarcodeService.generateEAN13();

    const guideline = await StudyPlan.create(guidelineData);

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
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

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
    return updatedGuideline;
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
