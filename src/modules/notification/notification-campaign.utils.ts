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

export type CampaignListFilters = {
  status?: "queued" | "processing" | "completed" | "failed";
  audienceMode?: "all" | "selected";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

const CAMPAIGN_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

/** Parse YYYY-MM-DD to UTC start of day. */
export function parseCampaignDateFrom(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parse YYYY-MM-DD to UTC end of day (inclusive). */
export function parseCampaignDateTo(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Build Mongo filter for campaign list queries (unit-testable). */
export function buildCampaignListFilter(
  filters: CampaignListFilters
): Record<string, unknown> {
  const mongo: Record<string, unknown> = {};

  if (
    filters.status &&
    CAMPAIGN_STATUSES.includes(
      filters.status as (typeof CAMPAIGN_STATUSES)[number]
    )
  ) {
    mongo.status = filters.status;
  }

  if (filters.audienceMode === "all" || filters.audienceMode === "selected") {
    mongo.audienceMode = filters.audienceMode;
  }

  const createdAt: Record<string, Date> = {};
  if (filters.dateFrom) {
    const from = parseCampaignDateFrom(filters.dateFrom);
    if (from) createdAt.$gte = from;
  }
  if (filters.dateTo) {
    const to = parseCampaignDateTo(filters.dateTo);
    if (to) createdAt.$lte = to;
  }
  if (Object.keys(createdAt).length > 0) {
    mongo.createdAt = createdAt;
  }

  const search = filters.search?.trim().slice(0, 100);
  if (search) {
    mongo.subject = { $regex: search, $options: "i" };
  }

  return mongo;
}
