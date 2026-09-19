import { Types } from "mongoose";

export type AuthProvider = "local" | "google";

export type IUser = {
  _id: Types.ObjectId | string;
  name: string;
  phone_number: string;
  fcmToken?: string;
  is_Deleted: boolean;
  image: string;
  email: string;
  googleId?: string;
  googleEmail?: string;
  authProviders?: AuthProvider[];
  role: string;
  password: string;
  status: "inactive" | "active";
  last_login_at: Date;
};

export enum USER_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
