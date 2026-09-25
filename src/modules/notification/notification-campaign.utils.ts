const BD_PHONE_REGEX = /^01[0-9]{9}$/;

/** Count words using Unicode whitespace boundaries. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const MAX_CAMPAIGN_BODY_WORDS = 200;

export function validateCampaignBody(body: string): {
  ok: boolean;
  wordCount: number;
  message?: string;
} {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, wordCount: 0, message: "Message body is required" };
  }
  const wordCount = countWords(trimmed);
  if (wordCount > MAX_CAMPAIGN_BODY_WORDS) {
    return {
      ok: false,
      wordCount,
      message: `Message body must be at most ${MAX_CAMPAIGN_BODY_WORDS} words (got ${wordCount})`,
    };
  }
  return { ok: true, wordCount };
}

/** Normalize Bangladesh mobile to 11-digit 01XXXXXXXXX. */
export function normalizeBdPhone(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) {
    digits = digits.slice(3);
  }
  if (digits.length === 10 && digits.startsWith("1")) {
    digits = `0${digits}`;
  }
  if (!BD_PHONE_REGEX.test(digits)) return null;
  return digits;
}

export function normalizePhoneList(phones: string[]): {
  normalized: string[];
  invalid: string[];
} {
  const normalized: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const raw of phones) {
    const phone = normalizeBdPhone(raw);
    if (!phone) {
      invalid.push(raw);
      continue;
    }
    if (seen.has(phone)) continue;
    seen.add(phone);
    normalized.push(phone);
  }

  return { normalized, invalid };
}
