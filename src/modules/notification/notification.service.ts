import {
  ICreateNotificationPayload,
  INotification,
} from "./notification.interface";
import { NotificationModel } from "./notification.model";
import { NotificationAudience } from "@/events/EventTypes";

const NOTIFICATION_SORT = { createdAt: -1 } as const;
const READ_FILTER = { isRead: false } as const;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

class Service {
  async createNotification(
    payload: ICreateNotificationPayload
  ): Promise<INotification> {
    return NotificationModel.create(payload);
  }

  async getNotificationsByUserId(
    userId: string,
    audience: NotificationAudience = "admin",
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;

    const filter = { userId, audience };

    const [data, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort(NOTIFICATION_SORT)
        .skip(skip)
        .limit(safeLimit),
      NotificationModel.countDocuments(filter),
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

  async getUnreadNotificationsByUserId(
    userId: string,
    audience: NotificationAudience = "admin"
  ): Promise<INotification[]> {
    return NotificationModel.find({
      userId,
      audience,
      ...READ_FILTER,
    }).sort(NOTIFICATION_SORT);
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(
    userId: string,
    audience: NotificationAudience = "admin"
  ): Promise<{ modifiedCount: number }> {
    const result = await NotificationModel.updateMany(
      { userId, audience, ...READ_FILTER },
      { isRead: true }
    );

    return { modifiedCount: result.modifiedCount };
  }
}

export const NotificationService = new Service();
