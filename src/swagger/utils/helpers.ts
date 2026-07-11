export const successResponse = (
  statusCode: number,
  description: string,
  dataSchema?: object,
  example?: object
) => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/ApiResponse" },
          ...(dataSchema
            ? [{ type: "object", properties: { data: dataSchema } }]
            : []),
        ],
      },
      ...(example ? { example } : {}),
    },
  },
});

export const jsonRequestBody = (
  schemaRef: string,
  description: string,
  required = true
) => ({
  required,
  description,
  content: {
    "application/json": {
      schema: { $ref: schemaRef },
    },
  },
});
