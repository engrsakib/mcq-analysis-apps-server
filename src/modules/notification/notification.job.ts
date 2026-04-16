import { handleSendNotificationEvent } from "./notification.handler";
import { NotificationEventPayload } from "@/events/EventTypes";

export async function handleSendNotificationJob(
  payload: NotificationEventPayload
) {
  await handleSendNotificationEvent(payload);
}
