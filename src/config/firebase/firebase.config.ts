import admin from "firebase-admin";

export type PushNotificationResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);

const firebaseAdmin =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        } as admin.ServiceAccount),
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
