import {
  ICreateNotificationPayload,
  INotification,
} from "./notification.interface";
import { NotificationModel } from "./notification.model";
import { NotificationAudience } from "@/events/EventTypes";

const NOTIFICATION_SORT = { createdAt: -1 } as const;
const READ_FILTER = { isRead: false } as const;

class Service {
  async createNotification(
    payload: ICreateNotificationPayload
  ): Promise<INotification> {
    return NotificationModel.create(payload);
  }

  async getNotificationsByUserId(
    userId: string,
    audience: NotificationAudience = "admin"
  ): Promise<INotification[]> {
    return NotificationModel.find({ userId, audience }).sort(NOTIFICATION_SORT);
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
