import { Schema, model } from "mongoose";
import { IOTP } from "./otp.interface";

const OtpSchema = new Schema<IOTP>({
  phone_number: {
    type: String,
    required: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Document will be auto-deleted after 300 seconds (5 minutes)
  },
});

export const OTPModel = model<IOTP>("Otp", OtpSchema);
