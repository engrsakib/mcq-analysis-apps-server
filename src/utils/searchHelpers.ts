const MAX_SEARCH_TERM_LENGTH = 100;

const escapeRegex = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeSearchTerm = (term: string): string => {
  return escapeRegex(term.trim().slice(0, MAX_SEARCH_TERM_LENGTH));
};

type SearchConditionOptions = {
  searchFields: string[];
  searchTerm?: string;
  numericIdField?: string;
};

const buildSearchCondition = ({
  searchFields,
  searchTerm,
  numericIdField,
}: SearchConditionOptions): Record<string, unknown> => {
  if (!searchTerm?.trim()) {
    return {};
  }

  const normalizedTerm = normalizeSearchTerm(searchTerm);
  const orConditions: Record<string, unknown>[] = searchFields.map((field) => ({
    [field]: { $regex: normalizedTerm, $options: "i" },
  }));

  if (numericIdField && !isNaN(Number(searchTerm.trim()))) {
    orConditions.push({ [numericIdField]: Number(searchTerm.trim()) });
  }

  if (orConditions.length === 1) {
    return orConditions[0];
  }

  return { $or: orConditions };
};

export const searchHelpers = {
  MAX_SEARCH_TERM_LENGTH,
  escapeRegex,
  normalizeSearchTerm,
  buildSearchCondition,
};
