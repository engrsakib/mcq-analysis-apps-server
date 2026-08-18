import { envConfig } from "@/config/index";
import axios from "axios";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { normalizePhoneNumber } from "@/utils/phone.util";
import { smsLogService } from "./sms-log.service";
import {
  IBulkSmsResponse,
  ISmsLogType,
  ISmsPayload,
  ISmsResult,
  ISmsStatus,
} from "./sms.interface";

export const SMS_ERROR_MESSAGES: Record<number, string> = {
  202: "SMS Submitted Successfully",
  1001: "Invalid Number",
  1002: "Sender ID not correct or sender ID is disabled",
  1003: "Please required all fields / contact your system administrator",
  1005: "Internal Error",
  1006: "Balance validity not available",
  1007: "Balance insufficient",
  1011: "User ID not found",
  1012: "Masking SMS must be sent in Bengali",
  1013: "Sender ID has not found gateway by API key",
  1014: "Sender type name not found using this sender by API key",
  1015: "Sender ID has not found any valid gateway by API key",
  1016: "Sender type name active price info not found by this sender ID",
  1017: "Sender type name price info not found by this sender ID",
  1018: "The owner of this account is disabled",
  1019: "The sender type name price of this account is disabled",
  1020: "The parent of this account is not found",
  1021: "The parent active sender type name price of this account is not found",
  1031: "Your account not verified, please contact administrator",
  1032: "IP not whitelisted",
};

class Service {
  private get balanceUrl(): string {
    return envConfig.sms.base_url.replace(/\/smsapi\/?$/, "/getBalanceApi");
  }

  private parseBulkSmsResponse(data: IBulkSmsResponse): ISmsResult {
    const responseCode = Number(data.response_code);

    return {
      response_code: responseCode,
      success: responseCode === 202,
      success_message: data.success_message || "",
      error_message:
        data.error_message ||
        SMS_ERROR_MESSAGES[responseCode] ||
        "Unknown SMS provider error",
      balance: data.balance,
    };
  }

  private buildSmsParams(payload: ISmsPayload): URLSearchParams {
    return new URLSearchParams({
      api_key: envConfig.sms.api_key,
      senderid: envConfig.sms.sender_id,
      type: "text",
      number: normalizePhoneNumber(payload.number),
      message: String(payload.message),
    });
  }

  private async sendSms(
    payload: ISmsPayload,
    messageType: ISmsLogType
  ): Promise<ISmsResult> {
    const number = normalizePhoneNumber(payload.number);

    try {
      console.log(`[SMS] Sending to ${number}...`);

      const { data } = await axios.post<IBulkSmsResponse>(
        envConfig.sms.base_url,
        this.buildSmsParams({ ...payload, number }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const parsed = this.parseBulkSmsResponse(data);

      await smsLogService.logSmsEvent({
        phone_number: number,
        message_type: messageType,
        success: parsed.success,
        response_code: parsed.response_code,
        error_message: parsed.error_message,
      });

      if (parsed.success) {
        console.log(`[SMS] Message sent successfully`, { number });
        return parsed;
      }

      console.error(`[SMS] Failed to send message`, {
        number,
        response: data,
      });

      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        parsed.error_message || `SMS failed with code ${parsed.response_code}`
      );
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Failed to send SMS";

      await smsLogService.logSmsEvent({
        phone_number: number,
        message_type: messageType,
        success: false,
        response_code: null,
        error_message: message,
      });

      console.error(`[SMS] Error sending message`, { error: message });

      throw new ApiError(HttpStatusCode.BAD_REQUEST, message);
    }
  }

  getBalance = async (): Promise<ISmsResult> => {
    const { data } = await axios.get<IBulkSmsResponse>(this.balanceUrl, {
      params: {
        api_key: envConfig.sms.api_key,
      },
    });

    return this.parseBulkSmsResponse(data);
  };

  getStatus = async (): Promise<ISmsStatus> => {
    try {
      const balance = await this.getBalance();

      return {
        connected: balance.success,
        balance: balance.balance ?? null,
        sender_id: envConfig.sms.sender_id,
        provider: "BulkSMS BD",
        base_url: envConfig.sms.base_url,
        last_checked_at: new Date().toISOString(),
        response_code: balance.response_code,
        message: balance.success
          ? "BulkSMS BD connection is healthy"
          : balance.error_message,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to connect to BulkSMS BD";

      return {
        connected: false,
        balance: null,
        sender_id: envConfig.sms.sender_id,
        provider: "BulkSMS BD",
        base_url: envConfig.sms.base_url,
        last_checked_at: new Date().toISOString(),
        response_code: null,
        message,
      };
    }
  };

  sendTestSms = async (
    number: string,
    message: string
  ): Promise<ISmsResult> => {
    return this.sendSms({ number, message }, "test");
  };

  sendOtp = async (number: string, otp: number): Promise<void> => {
    await this.sendSms(
      {
        number,
        message: `Your Cloudy BD OTP is ${otp}`,
      },
      "otp"
    );
  };

  sendForgetPasswordOtp = async (
    number: string,
    otp: number
  ): Promise<void> => {
    await this.sendSms(
      {
        number,
        message: `MCQ Analysis app user Password Recovery OTP is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`,
      },
      "forget_password_otp"
    );
  };

  sendGeneralMessage = async (number: string, message: string) => {
    await this.sendSms({ number, message }, "general");
  };
}

export const SMSService = new Service();
