import { OAuth2Client } from "google-auth-library";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";

export type VerifiedGoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
};

function getAllowedAudiences(): string[] {
  const ids = [
    process.env.GOOGLE_CLIENT_ID_WEB?.trim(),
    process.env.GOOGLE_CLIENT_ID_ANDROID?.trim(),
  ].filter((id): id is string => Boolean(id));

  return ids;
}

let oauthClient: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!oauthClient) {
    const audiences = getAllowedAudiences();
    if (!audiences.length) {
      throw new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "Google Sign-In is not configured on the server"
      );
    }
    oauthClient = new OAuth2Client(audiences[0]);
  }
  return oauthClient;
}

export async function verifyGoogleIdToken(
  idToken: string
): Promise<VerifiedGoogleProfile> {
  const trimmed = idToken?.trim();
  if (!trimmed) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      "Google ID token is required"
    );
  }

  const audiences = getAllowedAudiences();
  if (!audiences.length) {
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      "Google Sign-In is not configured on the server"
    );
  }

  const ticket = await getClient().verifyIdToken({
    idToken: trimmed,
    audience: audiences,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new ApiError(
      HttpStatusCode.UNAUTHORIZED,
      "Invalid Google token payload"
    );
  }

  if (payload.email_verified === false) {
    throw new ApiError(
      HttpStatusCode.UNAUTHORIZED,
      "Google account email is not verified"
    );
  }

  return {
    sub: payload.sub,
    email: payload.email?.trim() ?? "",
    emailVerified: payload.email_verified ?? false,
    name: payload.name?.trim() ?? "",
    picture: payload.picture?.trim() ?? "",
  };
}

export function getGoogleOAuthPublicConfig() {
  return {
    webClientId: process.env.GOOGLE_CLIENT_ID_WEB?.trim() ?? "",
    androidClientId: process.env.GOOGLE_CLIENT_ID_ANDROID?.trim() ?? "",
  };
}
