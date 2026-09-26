import assert from "node:assert/strict";
import {
  buildCampaignListFilter,
  countWords,
  normalizeBdPhone,
  normalizePhoneList,
  parseCampaignDateFrom,
  parseCampaignDateTo,
  validateCampaignBody,
  MAX_CAMPAIGN_BODY_WORDS,
} from "../modules/notification/notification-campaign.utils";

assert.equal(countWords("  hello   world  "), 2);
assert.equal(countWords("বাংলা টেক্সট"), 2);

assert.equal(normalizeBdPhone("01712345678"), "01712345678");
assert.equal(normalizeBdPhone("+8801712345678"), "01712345678");
assert.equal(normalizeBdPhone("1712345678"), "01712345678");
assert.equal(normalizeBdPhone("invalid"), null);

const list = normalizePhoneList(["01712345678", "01712345678", "bad"]);
assert.deepEqual(list.normalized, ["01712345678"]);
assert.deepEqual(list.invalid, ["bad"]);

const okBody = validateCampaignBody("one two three");
assert.equal(okBody.ok, true);

const words201 = Array.from({ length: 201 }, (_, i) => `w${i}`).join(" ");
const badBody = validateCampaignBody(words201);
assert.equal(badBody.ok, false);
assert.equal(MAX_CAMPAIGN_BODY_WORDS, 200);

const from = parseCampaignDateFrom("2026-01-15");
assert.ok(from);
assert.equal(from!.toISOString(), "2026-01-15T00:00:00.000Z");

const to = parseCampaignDateTo("2026-01-15");
assert.ok(to);
assert.equal(to!.toISOString(), "2026-01-15T23:59:59.999Z");

const filter = buildCampaignListFilter({
  status: "completed",
  audienceMode: "selected",
  dateFrom: "2026-01-01",
  dateTo: "2026-01-31",
  search: "test",
});
assert.equal(filter.status, "completed");
assert.equal(filter.audienceMode, "selected");
assert.deepEqual(Object.keys(filter.createdAt as object).sort(), [
  "$gte",
  "$lte",
]);
assert.equal((filter.subject as { $regex: string }).$regex, "test");

console.log("notification-campaign.utils: all assertions passed");
