import { IPaginationOptions } from "@/interfaces/pagination.interfaces";

export type SearchModuleKey =
  | "exams"
  | "books"
  | "youtube"
  | "studyPlans"
  | "guidelines";

export type SearchPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type SearchModuleResult<T = unknown> = {
  data: T[];
  meta: SearchPaginationMeta;
};

export type GlobalSearchResults = Record<SearchModuleKey, SearchModuleResult>;

export type GlobalSearchResponse = {
  query: string;
  results: GlobalSearchResults;
};

export type GlobalSearchQuery = IPaginationOptions & {
  q: string;
};
