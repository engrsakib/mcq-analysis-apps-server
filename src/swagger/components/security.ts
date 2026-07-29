export const securitySchemes = {
  bearerAuth: {
    type: "http" as const,
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "JWT access token obtained from login or verify endpoints. Click **Authorize**, paste the token value, and Swagger will attach it to all protected requests.",
  },
  refreshToken: {
    type: "apiKey" as const,
    in: "header" as const,
    name: "x-refresh-token",
    description:
      "Optional JWT refresh token. Used when the access token expires.",
  },
};

export const securityRequirements = {
  /** Opt out of global bearer auth (public routes). */
  public: [] as const,
  authenticated: [{ bearerAuth: [] }],
  authenticatedWithRefresh: [{ bearerAuth: [], refreshToken: [] }],
};
