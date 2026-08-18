export type ISmsPayload = {
  number: string;
  message: number | string;
};

export type IBulkSmsResponse = {
  response_code: number;
  success_message?: string;
  error_message?: string;
  balance?: number;
};

export type ISmsResult = {
  response_code: number;
  success: boolean;
  success_message: string;
  error_message: string;
  balance?: number;
};

export type ISmsStatus = {
  connected: boolean;
  balance: number | null;
  sender_id: string;
  provider: string;
  base_url: string;
  last_checked_at: string;
  response_code: number | null;
  message: string;
};

export type ISmsLogType = "otp" | "forget_password_otp" | "general" | "test";

export type ISmsLogEntry = {
  id: string;
  phone_number: string;
  message_type: ISmsLogType;
  success: boolean;
  response_code: number | null;
  error_message: string;
  created_at: string;
};

export type IOtpBlockLog = {
  id: string;
  phone_number: string;
  attempts_used: number;
  max_attempts: number;
  reset_at: string;
  created_at: string;
};

export type IOtpRateLimitConfig = {
  maxAttempts: number;
  windowHours: number;
};

export type IOtpRateLimitBlock = {
  phone_number: string;
  attempts_used: number;
  max_attempts: number;
  remaining_attempts: number;
  is_blocked: boolean;
  ttl_seconds: number;
  reset_at: string;
};

export type OtpRateLimitMeta = {
  remainingAttempts: number;
  resetIn: string;
};
