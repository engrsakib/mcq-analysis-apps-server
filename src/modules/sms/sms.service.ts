import { envConfig } from "@/config/index";
import axios from "axios";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { ISmsPayload } from "./sms.interface";

class Service {
  private async sendSms(payload: ISmsPayload) {
    try {
      const requestBody = {
        ...payload,
        api_key: envConfig.sms.api_key,
        senderid: envConfig.sms.sender_id,
      };

      console.log(`[SMS] Sending to ${payload.number}...`);

      const { data } = await axios.post(envConfig.sms.base_url, requestBody);

      if (data?.response_code === 202) {
        console.log(`[SMS] ✅ Message sent successfully`, {
          number: payload.number,
          otp: payload.message,
        });
      } else {
        console.error(`[SMS] ❌ Failed to send message`, {
          number: payload.number,
          response: data,
        });
      }
    } catch (error: any) {
      console.error(`[SMS] 🚨 Error sending message`, {
        number: payload.number,
        error: error.message,
      });

      throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
    }
  }

  sendOtp = async (number: string, otp: number): Promise<void> => {
    await this.sendSms({
      number,
      message: `Your Cloudy BD verification code is ${otp}`,
    });
  };

  sendForgetPasswordOtp = async (
    number: string,
    otp: number
  ): Promise<void> => {
    await this.sendSms({
      number,
      message: `MCQ Analysis app user Password Recovery OTP is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`,
    });
  };

  sendGeneralMessage = async (number: string, message: string) => {
    await this.sendSms({ number, message });
  };
}

export const SMSService = new Service();
