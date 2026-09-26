import { appUserMatchFilter } from "@/constants/roles";
import { UserModel } from "@/modules/user/user.model";
import { jobQueue } from "@/events/JobQueue";
import { NotificationCampaignModel } from "./notification-campaign.model";
import {
  CreateNotificationCampaignInput,
  INotificationCampaign,
} from "./notification-campaign.interface";
import {
  buildCampaignListFilter,
  CampaignListFilters,
  normalizePhoneList,
} from "./notification-campaign.utils";
import { Types } from "mongoose";

export type CreateCampaignResult =
  | { ok: true; campaign: INotificationCampaign }
  | {
      ok: false;
      code: "INVALID_PHONES" | "NO_RECIPIENTS" | "UNRESOLVED_PHONES";
      message: string;
      invalidPhones?: string[];
      unresolvedPhones?: string[];
    };

class NotificationCampaignService {
  async createCampaign(
    input: CreateNotificationCampaignInput,
    sender: { id: string; name?: string }
  ): Promise<CreateCampaignResult> {
    if (input.audienceMode === "selected") {
      const rawPhones = input.phoneNumbers ?? [];
      const { normalized, invalid } = normalizePhoneList(rawPhones);

      if (invalid.length > 0) {
        return {
          ok: false,
          code: "INVALID_PHONES",
          message: "One or more phone numbers are invalid",
          invalidPhones: invalid,
        };
      }

      if (normalized.length === 0) {
        return {
          ok: false,
          code: "NO_RECIPIENTS",
          message: "No valid phone numbers provided",
        };
      }

      const users = await UserModel.find({
        ...appUserMatchFilter(),
        phone_number: { $in: normalized },
      })
        .select("_id phone_number")
        .lean<{ _id: Types.ObjectId; phone_number: string }[]>();

      const foundPhones = new Set(users.map((u) => u.phone_number));
      const unresolvedPhones = normalized.filter((p) => !foundPhones.has(p));

      if (unresolvedPhones.length > 0) {
        return {
          ok: false,
          code: "UNRESOLVED_PHONES",
          message:
            "Some phone numbers are not registered as app users. Resolve them before sending.",
          unresolvedPhones,
        };
      }

      const campaign = await NotificationCampaignModel.create({
        senderAdminId: sender.id,
        senderAdminName: sender.name?.trim() || "Admin",
        subject: input.subject.trim(),
        body: input.body.trim(),
        audienceMode: "selected",
        selectedPhoneNumbers: normalized,
        resolvedUserIds: users.map((u) => u._id),
        unresolvedPhones: [],
        status: "queued",
      });

      jobQueue.enqueue({
        type: "NOTIFICATION_CAMPAIGN_DELIVER",
        payload: { campaignId: String(campaign._id) },
      });

      return { ok: true, campaign };
    }

    const userCount = await UserModel.countDocuments(appUserMatchFilter());
    if (userCount === 0) {
      return {
        ok: false,
        code: "NO_RECIPIENTS",
        message: "No eligible app users found",
      };
    }

    const campaign = await NotificationCampaignModel.create({
      senderAdminId: sender.id,
      senderAdminName: sender.name?.trim() || "Admin",
      subject: input.subject.trim(),
      body: input.body.trim(),
      audienceMode: "all",
      selectedPhoneNumbers: [],
      resolvedUserIds: [],
      unresolvedPhones: [],
      status: "queued",
    });

    jobQueue.enqueue({
      type: "NOTIFICATION_CAMPAIGN_DELIVER",
      payload: { campaignId: String(campaign._id) },
    });

    return { ok: true, campaign };
  }

  async listCampaigns(
    page: number,
    limit: number,
    filters: CampaignListFilters = {}
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const mongoFilter = buildCampaignListFilter(filters);

    const [data, total] = await Promise.all([
      NotificationCampaignModel.find(mongoFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      NotificationCampaignModel.countDocuments(mongoFilter),
    ]);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPage: Math.ceil(total / safeLimit) || 1,
        hasMore: skip + data.length < total,
      },
    };
  }

  async getCampaignById(id: string) {
    return NotificationCampaignModel.findById(id).lean();
  }
}

export const notificationCampaignService = new NotificationCampaignService();
