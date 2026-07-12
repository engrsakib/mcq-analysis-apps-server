import { Model } from "mongoose";
import { ExamModel } from "@/modules/exam/exam.model";
import { BooksModel } from "@/modules/books/books.model";
import { YoutubeModel } from "@/modules/youtube/youtube.model";
import { StudyPlan } from "@/modules/study-plan/study_plan.model";
import { GuidelineModel } from "@/modules/guideline/guideline.model";
import { GUIDELINE_STATUS } from "@/modules/guideline/guideline.interface";
import { SearchModuleKey } from "./search.interface";

export type SearchProvider = {
  key: SearchModuleKey;
  model: Model<any>;
  searchFields: string[];
  visibilityFilter: Record<string, unknown>;
  sort: Record<string, 1 | -1>;
  select?: string;
  numericIdField?: string;
};

export const searchProviders: SearchProvider[] = [
  {
    key: "exams",
    model: ExamModel,
    searchFields: ["exam_name"],
    visibilityFilter: { is_published: true },
    sort: { createdAt: -1 },
    select: "-questions",
    numericIdField: "exam_number",
  },
  {
    key: "books",
    model: BooksModel,
    searchFields: ["title"],
    visibilityFilter: { is_published: true },
    sort: { createdAt: -1 },
  },
  {
    key: "youtube",
    model: YoutubeModel,
    searchFields: ["title"],
    visibilityFilter: { is_published: true },
    sort: { createdAt: -1 },
  },
  {
    key: "studyPlans",
    model: StudyPlan,
    searchFields: ["title"],
    visibilityFilter: { status: GUIDELINE_STATUS.ACTIVE },
    sort: { position: 1, createdAt: -1 },
  },
  {
    key: "guidelines",
    model: GuidelineModel,
    searchFields: ["title"],
    visibilityFilter: { status: GUIDELINE_STATUS.ACTIVE },
    sort: { createdAt: -1 },
  },
];

export const searchProviderMap = Object.fromEntries(
  searchProviders.map((provider) => [provider.key, provider])
) as Record<SearchModuleKey, SearchProvider>;
