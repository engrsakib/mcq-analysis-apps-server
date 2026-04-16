import {
  ICreateNotificationPayload,
  INotification,
} from "./notification.interface";
import { NotificationModel } from "./notification.model";

const NOTIFICATION_SORT = { createdAt: -1 } as const;
const READ_FILTER = { isRead: false } as const;

class Service {
  async createNotification(
    payload: ICreateNotificationPayload
  ): Promise<INotification> {
    return NotificationModel.create(payload);
  }

  async getNotificationsByUserId(userId: string): Promise<INotification[]> {
    return NotificationModel.find({ userId }).sort(NOTIFICATION_SORT);
  }

  async getUnreadNotificationsByUserId(
    userId: string
  ): Promise<INotification[]> {
    return NotificationModel.find({ userId, ...READ_FILTER }).sort(
      NOTIFICATION_SORT
    );
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
  }
}

export const NotificationService = new Service();
