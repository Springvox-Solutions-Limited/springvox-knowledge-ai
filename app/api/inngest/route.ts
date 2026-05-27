import { serve } from "inngest/next";
import { inngest } from "@/src/lib/inngest/client";
import {
  dailyTrialExpiryCheck,
  processDocument,
  sendTrialExpiredEmail,
  sendTrialLifecycleEmails,
  sendTrialReminderEmail,
  sendPlatformNotification,
  scheduledPlatformNotificationCheck,
} from "@/src/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processDocument,
    sendTrialLifecycleEmails,
    sendTrialReminderEmail,
    sendTrialExpiredEmail,
    dailyTrialExpiryCheck,
    sendPlatformNotification,
    scheduledPlatformNotificationCheck,
  ],
});
