import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { StudyTopicType } from "../question-study-topic/question-study-topic.enum";
import { QuestionStudyTopicModel } from "../question-study-topic/question-study-topic.model";
import { StudyTopicTypeModel } from "./study-topic-type.model";

const DEFAULT_TYPES = Object.entries(StudyTopicType).map(
  ([key, value], index) => ({
    value,
    label: key.charAt(0) + key.slice(1).toLowerCase(),
    position: index,
    isDefault: true,
  })
);

export function slugifyStudyTopicTypeLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (slug) return slug;

  return `type_${Date.now()}`;
}

class Service {
  ensureDefaultTypes = async () => {
    const count = await StudyTopicTypeModel.countDocuments();

    if (count === 0) {
      await StudyTopicTypeModel.insertMany(DEFAULT_TYPES, { ordered: false });
    }
  };

  getAllTypes = async () => {
    await this.ensureDefaultTypes();

    return StudyTopicTypeModel.find().sort({ position: 1, label: 1 });
  };

  createType = async (payload: { label: string; value?: string }) => {
    await this.ensureDefaultTypes();

    const label = payload.label.trim();
    const value =
      payload.value?.trim().toLowerCase() || slugifyStudyTopicTypeLabel(label);

    const existing = await StudyTopicTypeModel.findOne({ value });

    if (existing) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        "A study topic type with this value already exists"
      );
    }

    const lastType = await StudyTopicTypeModel.findOne()
      .sort({ position: -1 })
      .select("position");

    return StudyTopicTypeModel.create({
      label,
      value,
      position: (lastType?.position ?? 0) + 1,
      isDefault: false,
    });
  };

  typeExists = async (value: string) => {
    await this.ensureDefaultTypes();
    const type = await StudyTopicTypeModel.findOne({
      value: value.toLowerCase(),
    });
    return Boolean(type);
  };

  deleteType = async (value: string) => {
    await this.ensureDefaultTypes();

    const normalizedValue = value.trim().toLowerCase();
    const type = await StudyTopicTypeModel.findOne({ value: normalizedValue });

    if (!type) {
      throw new ApiError(
        HttpStatusCode.NOT_FOUND,
        "Study topic type not found"
      );
    }

    if (type.isDefault) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "Default types cannot be deleted"
      );
    }

    const linkedCount = await QuestionStudyTopicModel.countDocuments({
      type: normalizedValue,
    });

    if (linkedCount > 0) {
      throw new ApiError(
        HttpStatusCode.CONFLICT,
        `Cannot delete type: ${linkedCount} topic(s) are using it`
      );
    }

    await StudyTopicTypeModel.deleteOne({ value: normalizedValue });

    return type;
  };
}

export const StudyTopicTypeService = new Service();
