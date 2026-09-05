import { NotificationEventPayload } from "@/events/EventTypes";
import { paginationHelpers } from "@/helpers/paginationHelpers";
import { RequestContext } from "@/middlewares/requestContext";
import {
  ActivityListResult,
  IActivityListFilters,
  IActivityListOptions,
  IRecordActivityInput,
} from "./activity.interface";
import { AdminActivityLogModel } from "./activity.model";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "actorName"]);

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

  list = async (
    filters: IActivityListFilters,
    options: IActivityListOptions
  ): Promise<ActivityListResult> => {
    const { search, module, action, dateFrom, dateTo } = filters;
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelpers.calculatePagination({
        page: options.page,
        limit: options.limit,
        sortBy: ALLOWED_SORT_FIELDS.has(options.sortBy || "")
          ? options.sortBy
          : "createdAt",
        sortOrder: options.sortOrder === "asc" ? "asc" : "desc",
      });

    const andConditions: Record<string, unknown>[] = [];

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      andConditions.push({
        $or: [{ actorName: regex }, { title: regex }, { description: regex }],
      });
    }

    if (module?.trim()) {
      andConditions.push({ module: module.trim() });
    }

    if (action?.trim()) {
      andConditions.push({ action: action.trim() });
    }

    if (dateFrom || dateTo) {
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

      if (Object.keys(createdAt).length > 0) {
        andConditions.push({ createdAt });
      }
    }

    const whereConditions =
      andConditions.length > 0 ? { $and: andConditions } : {};

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
}

export const activityService = new ActivityService();
