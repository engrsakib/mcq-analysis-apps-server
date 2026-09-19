import mongoose from "mongoose";
import { UserModel } from "@/modules/user/user.model";
import {
  getFirebasePushHealth,
  type FirebasePushHealthSnapshot,
} from "./firebasePushHealth";
import {
  getNotificationsHealth,
  type NotificationsHealthSnapshot,
} from "./notificationsHealth";

export type FcmRegistrationHealthSnapshot = {
  checked: boolean;
  dbConnected: boolean;
  usersWithToken: number | null;
};

export type HealthDataSnapshot = {
  firebasePush: FirebasePushHealthSnapshot;
  fcmRegistration: FcmRegistrationHealthSnapshot;
  notifications: NotificationsHealthSnapshot;
};

async function getFcmRegistrationHealth(): Promise<FcmRegistrationHealthSnapshot> {
  const dbConnected = mongoose.connection.readyState === 1;

  if (!dbConnected) {
    return {
      checked: false,
      dbConnected: false,
      usersWithToken: null,
    };
  }

  try {
    const usersWithToken = await UserModel.countDocuments({
      fcmToken: { $exists: true, $nin: [null, ""] },
    });

    return {
      checked: true,
      dbConnected: true,
      usersWithToken,
    };
  } catch {
    return {
      checked: false,
      dbConnected: true,
      usersWithToken: null,
    };
  }
}

export async function getHealthData(): Promise<HealthDataSnapshot> {
  const [firebasePush, fcmRegistration, notifications] = await Promise.all([
    getFirebasePushHealth(),
    getFcmRegistrationHealth(),
    getNotificationsHealth(),
  ]);

  return { firebasePush, fcmRegistration, notifications };
}
