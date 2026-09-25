import assert from "node:assert/strict";
import {
  countWords,
  normalizeBdPhone,
  normalizePhoneList,
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

console.log("notification-campaign.utils: all assertions passed");
