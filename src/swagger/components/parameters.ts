export const paginationQueryParams = [
  {
    name: "page",
    in: "query" as const,
    schema: { type: "integer" as const, minimum: 1, default: 1 },
    description: "Page number for pagination",
    example: 1,
  },
  {
    name: "limit",
    in: "query" as const,
    schema: { type: "integer" as const, minimum: 1, default: 10 },
    description: "Number of items per page",
    example: 10,
  },
];

export const adminUserPaginationParams = [
  ...paginationQueryParams,
  {
    name: "sortBy",
    in: "query" as const,
    schema: { type: "string" as const, default: "createdAt" },
    description: "Field to sort by",
    example: "createdAt",
  },
  {
    name: "sortOrder",
    in: "query" as const,
    schema: {
      type: "string" as const,
      enum: ["asc", "desc"],
      default: "desc",
    },
    description: "Sort direction",
    example: "desc",
  },
  {
    name: "role",
    in: "query" as const,
    schema: { type: "string" as const },
    description: "Filter by role",
    example: "admin",
  },
  {
    name: "search_query",
    in: "query" as const,
    schema: { type: "string" as const },
    description:
      "Search across name, email, designation, and phone_number fields",
    example: "john",
  },
];

export const searchTermPaginationParams = [
  ...paginationQueryParams,
  {
    name: "searchTerm",
    in: "query" as const,
    schema: { type: "string" as const },
    description: "Search term for title field (case-insensitive partial match)",
    example: "exam",
  },
];

export const questionPaginationParams = [
  ...paginationQueryParams,
  {
    name: "sortBy",
    in: "query" as const,
    schema: { type: "string" as const },
    description: "Field to sort by",
    example: "createdAt",
  },
  {
    name: "sortOrder",
    in: "query" as const,
    schema: { type: "string" as const, enum: ["asc", "desc"] },
    description: "Sort direction",
    example: "desc",
  },
  {
    name: "searchTerm",
    in: "query" as const,
    schema: { type: "string" as const },
    description: "Search term for question title",
    example: "math",
  },
];

export const objectIdPathParam = (name: string, description: string) => ({
  name,
  in: "path" as const,
  required: true,
  schema: { type: "string" as const, pattern: "^[a-f\\d]{24}$" },
  description,
  example: "507f1f77bcf86cd799439011",
});

export const numericIdPathParam = (
  name: string,
  description: string,
  example = 1234567890123
) => ({
  name,
  in: "path" as const,
  required: true,
  schema: { type: "integer" as const },
  description,
  example,
});
