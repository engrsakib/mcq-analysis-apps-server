import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json";

export type PushNotificationResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

const firebaseAdmin =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
      });

export { firebaseAdmin };

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string
): Promise<PushNotificationResult> => {
  try {
    const messageId = await firebaseAdmin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
    });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to send push notification";

    return {
      success: false,
      error: errorMessage,
    };
  }
};
