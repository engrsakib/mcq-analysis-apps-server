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
