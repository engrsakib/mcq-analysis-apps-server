import {
  firebaseAdmin,
  getMissingFirebaseEnv,
  hasFirebaseCredentials,
} from "@/config/firebase/firebase.config";

export type FirebasePushHealthStatus =
  | "ok"
  | "misconfigured"
  | "init_failed"
  | "auth_failed";

export type FirebasePushHealthSnapshot = {
  status: FirebasePushHealthStatus;
  configured: boolean;
  initialized: boolean;
  projectId: string | null;
  missingEnv: string[];
  googleAuthOk: boolean;
  googleAuthError: string | null;
  messagingReady: boolean;
};

const AUTH_CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Google auth check timed out after ${ms}ms`)),
        ms
      );
    }),
  ]);
}

async function verifyGoogleAuth(): Promise<{
  ok: boolean;
  error: string | null;
}> {
  if (!firebaseAdmin) {
    return { ok: false, error: "Firebase Admin SDK not initialized" };
  }

  const credential = firebaseAdmin.options.credential;
  if (!credential || typeof credential.getAccessToken !== "function") {
    return {
      ok: false,
      error: "Firebase credential does not support getAccessToken",
    };
  }

  try {
    await withTimeout(credential.getAccessToken(), AUTH_CHECK_TIMEOUT_MS);
    return { ok: true, error: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google auth error";
    return { ok: false, error: message };
  }
}

export async function getFirebasePushHealth(): Promise<FirebasePushHealthSnapshot> {
  const missingEnv = getMissingFirebaseEnv();
  const configured = hasFirebaseCredentials();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || null;
  const initialized = Boolean(firebaseAdmin);

  if (!configured) {
    return {
      status: "misconfigured",
      configured: false,
      initialized,
      projectId,
      missingEnv,
      googleAuthOk: false,
      googleAuthError: null,
      messagingReady: false,
    };
  }

  if (!initialized) {
    return {
      status: "init_failed",
      configured: true,
      initialized: false,
      projectId,
      missingEnv: [],
      googleAuthOk: false,
      googleAuthError:
        "Firebase Admin SDK failed to initialize (see server logs)",
      messagingReady: false,
    };
  }

  const auth = await verifyGoogleAuth();

  if (!auth.ok) {
    return {
      status: "auth_failed",
      configured: true,
      initialized: true,
      projectId,
      missingEnv: [],
      googleAuthOk: false,
      googleAuthError: auth.error,
      messagingReady: false,
    };
  }

  return {
    status: "ok",
    configured: true,
    initialized: true,
    projectId,
    missingEnv: [],
    googleAuthOk: true,
    googleAuthError: null,
    messagingReady: true,
  };
}
