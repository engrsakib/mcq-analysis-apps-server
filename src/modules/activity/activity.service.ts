import { NotificationEventPayload } from "@/events/EventTypes";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { RequestContext } from "@/middlewares/requestContext";
import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { IJWtPayload } from "@/interfaces/common.interface";
import { ExamModel } from "@/modules/exam/exam.model";
import {
  ActivityListResult,
  IActivityListFilters,
  IActivityListOptions,
  IRecordActivityInput,
  IRecordExamStartedInput,
} from "./activity.interface";
import { formatActivityClock12h } from "./activity-datetime";
import { AdminModel } from "@/modules/admin/admin.model";
import { UserModel } from "@/modules/user/user.model";
import { AdminActivityLogModel } from "./activity.model";
import { hasExamStarted } from "@/modules/exam/exam.utils";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "actorName"]);

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

async function resolveActorIdsByPhoneQuery(search: string): Promise<string[]> {
  const digits = normalizePhoneDigits(search.trim());
  if (digits.length < 5) {
    return [];
  }

  const phoneRegex = { $regex: digits, $options: "i" };

  const [users, admins] = await Promise.all([
    UserModel.find({ phone_number: phoneRegex }).select("_id").lean(),
    AdminModel.find({ phone_number: phoneRegex }).select("_id").lean(),
  ]);

  const ids = new Set<string>();
  for (const row of [...users, ...admins]) {
    if (row._id) {
      ids.add(String(row._id));
    }
  }

  return Array.from(ids);
}

class ActivityService {
  private serialize(doc: unknown): Record<string, unknown> {
    const record = doc as {
      _id?: unknown;
      toObject?: () => Record<string, unknown>;
    };

    const raw =
      typeof record.toObject === "function"
        ? record.toObject()
        : { ...(record as object) };

    return {
      ...raw,
      _id: String(raw._id ?? ""),
      createdAt:
        raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : raw.createdAt,
    };
  }

  record = async (input: IRecordActivityInput): Promise<void> => {
    try {
      await AdminActivityLogModel.create(input);
    } catch (error) {
      console.error("[Activity] Failed to record activity:", error);
    }
  };

  recordFromNotification = async (
    payload: NotificationEventPayload,
    context?: RequestContext
  ): Promise<void> => {
    if (!payload.actorName || !payload.action || !payload.module) {
      return;
    }

    await this.record({
      actorId: payload.actorId || "system",
      actorName: payload.actorName,
      action: payload.action,
      module: payload.module,
      title: payload.title,
      description: payload.description,
      entityType: payload.entityType,
      entityId: payload.entityId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  };

  private buildDateFilter = (
    dateFrom?: string,
    dateTo?: string
  ): Record<string, unknown> | null => {
    if (!dateFrom && !dateTo) {
      return null;
    }

    const createdAt: Record<string, Date> = {};

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        createdAt.$gte = from;
      }
    }

    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAt.$lte = to;
      }
    }

    return Object.keys(createdAt).length > 0 ? { createdAt } : null;
  };

  private buildWhereConditions = async (
    filters: IActivityListFilters,
    actorId?: string
  ): Promise<Record<string, unknown>> => {
    const { search, module, action, dateFrom, dateTo } = filters;
    const andConditions: Record<string, unknown>[] = [];

    if (actorId) {
      andConditions.push({ actorId });
    }

    if (search?.trim()) {
      const term = search.trim();
      const regex = { $regex: term, $options: "i" };
      const orConditions: Record<string, unknown>[] = [
        { actorName: regex },
        { title: regex },
        { description: regex },
      ];

      const phoneDigits = normalizePhoneDigits(term);
      if (phoneDigits.length >= 5) {
        orConditions.push({
          description: { $regex: phoneDigits, $options: "i" },
        });
        const actorIds = await resolveActorIdsByPhoneQuery(term);
        if (actorIds.length > 0) {
          orConditions.push({ actorId: { $in: actorIds } });
        }
      }

      andConditions.push({ $or: orConditions });
    }

    if (module?.trim()) {
      andConditions.push({ module: module.trim() });
    }

    if (action?.trim()) {
      andConditions.push({ action: action.trim() });
    }

    const dateFilter = this.buildDateFilter(dateFrom, dateTo);
    if (dateFilter) {
      andConditions.push(dateFilter);
    }

    return andConditions.length > 0 ? { $and: andConditions } : {};
  };

  private queryLogs = async (
    whereConditions: Record<string, unknown>,
    options: IActivityListOptions
  ): Promise<ActivityListResult> => {
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination({
        page: options.page,
        limit: options.limit,
        sortBy: ALLOWED_SORT_FIELDS.has(options.sortBy || "")
          ? options.sortBy
          : "createdAt",
        sortOrder: options.sortOrder === "asc" ? "asc" : "desc",
      });

    const sortField = ALLOWED_SORT_FIELDS.has(String(sortBy))
      ? String(sortBy)
      : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      AdminActivityLogModel.find(whereConditions)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminActivityLogModel.countDocuments(whereConditions),
    ]);

    return {
      data: items.map((item) => this.serialize(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  };

  list = async (
    filters: IActivityListFilters,
    options: IActivityListOptions
  ): Promise<ActivityListResult> => {
    const whereConditions = await this.buildWhereConditions(filters);
    return this.queryLogs(whereConditions, options);
  };

  listForActor = async (
    actorId: string,
    filters: IActivityListFilters,
    options: IActivityListOptions
  ): Promise<ActivityListResult> => {
    const whereConditions = await this.buildWhereConditions(filters, actorId);
    return this.queryLogs(whereConditions, {
      ...options,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
    });
  };

  recordExamStarted = async (
    payload: IRecordExamStartedInput,
    user: IJWtPayload
  ) => {
    const examNumber = Number(payload.exam_number);
    const sessionStartedAt = payload.sessionStartedAt?.trim();

    if (!Number.isFinite(examNumber)) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, "Exam number is required");
    }

    if (!sessionStartedAt) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "sessionStartedAt is required"
      );
    }

    const sessionDate = new Date(sessionStartedAt);
    if (Number.isNaN(sessionDate.getTime())) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        "sessionStartedAt must be a valid ISO date"
      );
    }

    const [exam, userRecord, existingLog] = await Promise.all([
      ExamModel.findOne({ exam_number: examNumber })
        .select("exam_name is_published is_started")
        .lean(),
      UserModel.findById(user.id)
        .select("name phone_number is_Deleted status")
        .lean(),
      AdminActivityLogModel.findOne({
        actorId: String(user.id),
        action: "exam_started",
        examNumber,
        entityId: sessionStartedAt,
      }).lean(),
    ]);

    if (!userRecord || userRecord.is_Deleted) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
    }

    if (!exam || !exam.is_published) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, "Exam not found");
    }

    if (!hasExamStarted(exam)) {
      throw new ApiError(HttpStatusCode.FORBIDDEN, "Exam has not started yet");
    }

    if (existingLog) {
      return this.serialize(existingLog);
    }

    const actorName = userRecord.name || user.name || "Student";

    await this.record({
      actorId: String(user.id),
      actorName,
      action: "exam_started",
      module: "exam",
      title: "Exam started",
      description: `${actorName} started exam "${exam.exam_name || examNumber}" at ${formatActivityClock12h(sessionStartedAt)}`,
      entityType: "exam",
      entityId: sessionStartedAt,
      examNumber,
      severity: "normal",
    });

    return {
      exam_number: examNumber,
      sessionStartedAt,
      recorded: true,
    };
  };

  updateProctoringDescription = async (input: {
    actorId: string;
    examNumber: number;
    startedAt: string;
    description: string;
  }): Promise<boolean> => {
    const updated = await AdminActivityLogModel.findOneAndUpdate(
      {
        actorId: input.actorId,
        action: "proctoring_violation",
        examNumber: input.examNumber,
        entityId: input.startedAt,
      },
      { $set: { description: input.description } },
      { new: true }
    );

    return Boolean(updated);
  };
}

export const activityService = new ActivityService();
