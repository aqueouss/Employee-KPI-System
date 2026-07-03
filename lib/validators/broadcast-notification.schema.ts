import { z } from "zod";

export const sendBroadcastNotificationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Enter a notification message.")
    .max(2000, "Message is too long."),
});

export const acknowledgeBroadcastNotificationSchema = z.object({
  notification_id: z.string().uuid(),
});
