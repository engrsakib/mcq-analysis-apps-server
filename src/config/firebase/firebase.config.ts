import admin from "firebase-admin";

export type PushNotificationResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

function fixPrivateKey(key?: string) {
  if (!key) return undefined;

  let fixed = key.trim();

  // ১. যদি কোটেশন থাকে (Render অনেক সময় "" যোগ করে), তা সরানো
  if (fixed.startsWith('"') && fixed.endsWith('"')) {
    fixed = fixed.slice(1, -1);
  }

  // ২. চেক করা কি-টি Base64 কি না। যদি PEM ট্যাগ না থাকে, তবে ডিকোড করা।
  if (!fixed.includes("-----BEGIN PRIVATE KEY-----")) {
    try {
      // Base64 থেকে আসল টেক্সটে রূপান্তর
      fixed = Buffer.from(fixed, "base64").toString("utf-8");
    } catch (e) {
      console.error("Firebase Key Decoding Error:", e);
    }
  }

  // ৩. নিউ-লাইন (\n) ক্যারেক্টারগুলো ঠিক করা
  fixed = fixed.replace(/\\n/g, "\n");

  // ৪. যদি কোনো কারণে সব এক লাইনে চলে আসে, তবে ম্যানুয়ালি লাইন ব্রেক দেওয়া
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
