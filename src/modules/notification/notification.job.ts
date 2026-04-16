import { handleSendNotificationEvent } from "./notification.handler";

export async function handleSendNotificationJob(payload: {
  userId: string;
  title: string;
  message: string;
}) {
  await handleSendNotificationEvent(payload);
}
