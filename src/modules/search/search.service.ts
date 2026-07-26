import { paginationHelpers } from "@/helpers/paginationHelpers";
import { examService } from "@/modules/exam/exam.service";
import { BooksService } from "@/modules/books/books.service";
import { YoutubeService } from "@/modules/youtube/youtube.service";
import { StudyPlanService } from "@/modules/study-plan/study_plan.service";
import { GuidelineService } from "@/modules/guideline/guideline.servece";
import { searchHelpers } from "@/utils/searchHelpers";
import {
  GlobalSearchQuery,
  GlobalSearchResponse,
  GlobalSearchResults,
  SearchModuleResult,
} from "./search.interface";
import { SearchProvider, searchProviders } from "./search.registry";
import { IJWtPayload } from "@/interfaces/common.interface";

class Service {
  private buildModuleQuery(searchTerm: string, page: number, limit: number) {
    return {
      searchTerm,
      page,
      limit,
    };
  }

  async executeProviderSearch(
    provider: SearchProvider,
    searchTerm: string,
    page: number,
    limit: number
  ): Promise<SearchModuleResult> {
    const { skip } = paginationHelpers.calculatePagination({ page, limit });

    const filter: Record<string, unknown> = {
      ...provider.visibilityFilter,
      ...searchHelpers.buildSearchCondition({
        searchFields: provider.searchFields,
        searchTerm,
        numericIdField: provider.numericIdField,
      }),
    };

    const model = provider.model;
    const query = model
      .find(filter)
      .sort(provider.sort)
      .skip(skip)
      .limit(limit);

    if (provider.select) {
      query.select(provider.select);
    }

    const [data, total] = await Promise.all([
      query.lean(),
      model.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit) || 0,
      },
    };
  }

  async globalSearch(
    { q, page = 1, limit = 10 }: GlobalSearchQuery,
    user: IJWtPayload
  ): Promise<GlobalSearchResponse> {
    const searchTerm = q.trim().slice(0, searchHelpers.MAX_SEARCH_TERM_LENGTH);
    const moduleQuery = this.buildModuleQuery(searchTerm, page, limit);

    const [exams, books, youtube, studyPlans, guidelines] = await Promise.all([
      examService.getAllExamsForUsers(moduleQuery, user),
      BooksService.getAllBooksForUsers(moduleQuery),
      YoutubeService.getAllYoutubeVideosForUsers(moduleQuery),
      StudyPlanService.getAllStudyPlansForUsers(moduleQuery),
      GuidelineService.getAllGuidelinesForUsers(moduleQuery),
    ]);

    const results: GlobalSearchResults = {
      exams,
      books,
      youtube,
      studyPlans,
      guidelines,
    };

    return {
      query: q.trim(),
      results,
    };
  }

  async globalSearchViaRegistry({
    q,
    page = 1,
    limit = 10,
  }: GlobalSearchQuery): Promise<GlobalSearchResponse> {
    const searchTerm = searchHelpers.normalizeSearchTerm(q);

    const providerResults = await Promise.all(
      searchProviders.map((provider) =>
        this.executeProviderSearch(provider, searchTerm, page, limit)
      )
    );

    const results = searchProviders.reduce<GlobalSearchResults>(
      (accumulator, provider, index) => {
        accumulator[provider.key] = providerResults[index];
        return accumulator;
      },
      {} as GlobalSearchResults
    );

    return {
      query: q.trim(),
      results,
    };
  }
}

export const searchService = new Service();
