import { appUserMatchFilter } from "@/constants/roles";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { ExamModel } from "@/modules/exam/exam.model";
import { resultService } from "@/modules/results/result.service";
import { ResultModel } from "@/modules/results/result.model";
import { UserModel } from "@/modules/user/user.model";
import { z } from "zod";
import { listCampaignRecipientsQuerySchema } from "./notification-campaign.validate";

export type CampaignRecipientRow = {
  userId?: string;
  name: string;
  phone_number: string;
  rank?: number;
  score?: number;
};

type ListRecipientsInput = z.infer<typeof listCampaignRecipientsQuerySchema>;

function buildUserSearchOr(search: string) {
  return {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { phone_number: { $regex: search, $options: "i" } },
    ],
  };
}

async function attachUserIdsByPhone(
  rows: CampaignRecipientRow[]
): Promise<CampaignRecipientRow[]> {
  const phones = rows.map((r) => r.phone_number).filter(Boolean);
  if (phones.length === 0) return rows;

  const users = await UserModel.find({
    ...appUserMatchFilter(),
    phone_number: { $in: phones },
  })
    .select("_id phone_number")
    .lean<{ _id: { toString(): string }; phone_number: string }[]>();

  const byPhone = new Map(users.map((u) => [u.phone_number, String(u._id)]));

  return rows.map((row) => ({
    ...row,
    userId: byPhone.get(row.phone_number) ?? row.userId,
  }));
}

class NotificationCampaignAudienceService {
  async listRecipients(input: ListRecipientsInput) {
    const page = input.page ?? 1;
    const limit = Math.min(50, Math.max(1, input.limit ?? 20));
    const search = input.search?.trim().slice(0, 100);

    if (input.segment === "browse") {
      return this.listBrowse(page, limit, search);
    }

    const examNum = input.examNumber!;
    const exam = await ExamModel.findOne({ exam_number: examNum })
      .select("exam_number")
      .lean();
    if (!exam) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Exam not found");
    }

    if (input.segment === "not_attended") {
      return this.listNotAttended(examNum, page, limit, search);
    }

    return this.listTopByExam(examNum, page, limit, input.topN ?? 50);
  }

  private async listBrowse(page: number, limit: number, search?: string) {
    const filter: Record<string, unknown> = { ...appUserMatchFilter() };
    if (search) {
      Object.assign(filter, buildUserSearchOr(search));
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select("name phone_number")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<
          { _id: { toString(): string }; name: string; phone_number: string }[]
        >(),
      UserModel.countDocuments(filter),
    ]);

    const data: CampaignRecipientRow[] = users.map((u) => ({
      userId: String(u._id),
      name: u.name ?? u.phone_number,
      phone_number: u.phone_number,
    }));

    const totalPage = Math.ceil(total / limit) || 1;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage,
        hasMore: skip + data.length < total,
      },
    };
  }

  private async listNotAttended(
    examNum: number,
    page: number,
    limit: number,
    search?: string
  ) {
    const attendedPhones = await ResultModel.distinct("student_phone", {
      exam_number: examNum,
    });

    const filter: Record<string, unknown> = {
      ...appUserMatchFilter(),
      phone_number: { $nin: attendedPhones },
    };
    if (search) {
      Object.assign(filter, buildUserSearchOr(search));
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select("name phone_number")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<
          { _id: { toString(): string }; name: string; phone_number: string }[]
        >(),
      UserModel.countDocuments(filter),
    ]);

    const data: CampaignRecipientRow[] = users.map((u) => ({
      userId: String(u._id),
      name: u.name ?? u.phone_number,
      phone_number: u.phone_number,
    }));

    const totalPage = Math.ceil(total / limit) || 1;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage,
        hasMore: skip + data.length < total,
      },
    };
  }

  private async listTopByExam(
    examNum: number,
    page: number,
    limit: number,
    topN: number
  ) {
    const safeTopN = Math.min(200, Math.max(1, topN));
    const ranked = await resultService.getTopRankedStudents(examNum, safeTopN);

    let rows: CampaignRecipientRow[] = ranked.map((row) => ({
      name: row.student_name,
      phone_number: row.student_phone,
      rank: row.rank,
      score: row.score,
    }));

    rows = await attachUserIdsByPhone(rows);

    const total = rows.length;
    const skip = (page - 1) * limit;
    const data = rows.slice(skip, skip + limit);
    const totalPage = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage,
        hasMore: skip + data.length < total,
      },
    };
  }
}

export const notificationCampaignAudienceService =
  new NotificationCampaignAudienceService();
