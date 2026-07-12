import z from "zod";
import { searchHelpers } from "@/utils/searchHelpers";

const globalSearch = z.object({
  query: z
    .object({
      q: z
        .string({
          required_error: "Search query is required",
          invalid_type_error: "Search query must be a string",
        })
        .trim()
        .min(1, "Search query cannot be empty")
        .max(
          searchHelpers.MAX_SEARCH_TERM_LENGTH,
          `Search query must be at most ${searchHelpers.MAX_SEARCH_TERM_LENGTH} characters`
        ),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict(),
});

export const SearchValidations = {
  globalSearch,
};
