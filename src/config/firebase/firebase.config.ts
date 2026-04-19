import admin from "firebase-admin";

export type PushNotificationResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function fixPrivateKey(key?: string) {
  if (!key) return undefined;

  let fixed = key.trim();

  if (fixed.startsWith('"') && fixed.endsWith('"')) {
    fixed = fixed.slice(1, -1);
  }

  fixed = fixed.replace(/\\n/g, "\n");

  if (!fixed.includes("\n")) {
    fixed = fixed
      .replace(/-----BEGIN PRIVATE KEY-----/g, "-----BEGIN PRIVATE KEY-----\n")
      .replace(/-----END PRIVATE KEY-----/g, "\n-----END PRIVATE KEY-----\n");
  }

  return fixed;
}

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: fixPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

export const firebaseAdmin =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
      });

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string
): Promise<PushNotificationResult> => {
  try {
    const messageId = await firebaseAdmin.messaging().send({
      token,
      notification: { title, body },
    });

    return { success: true, messageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
