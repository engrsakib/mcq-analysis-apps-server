export const securitySchemes = {
  accessToken: {
    type: "apiKey" as const,
    in: "header" as const,
    name: "authorization",
    description:
      "JWT access token. Pass the raw token value directly in the Authorization header (no Bearer prefix). Obtained from login or verify endpoints.",
  },
  refreshToken: {
    type: "apiKey" as const,
    in: "header" as const,
    name: "x-refresh-token",
    description:
      "JWT refresh token. Used automatically when the access token expires.",
  },
};

export const securityRequirements = {
  authenticated: [{ accessToken: [] }],
  authenticatedWithRefresh: [{ accessToken: [], refreshToken: [] }],
};
