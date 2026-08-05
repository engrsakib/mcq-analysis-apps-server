import { NotificationEventPayload } from "@/events/EventTypes";
import { processNotification } from "./notification.helpers";

export async function handleSendNotificationJob(
  payload: NotificationEventPayload
) {
  await processNotification(payload);
}
