import { serve } from "inngest/next";
import { inngest } from "@/src/lib/inngest/client";
import {
  dailyTrialExpiryCheck,
  deleteWorkspaceData,
  processDocument,
  scheduledWorkspaceDeletionCheck,
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
    deleteWorkspaceData,
    scheduledWorkspaceDeletionCheck,
    sendTrialLifecycleEmails,
    sendTrialReminderEmail,
    sendTrialExpiredEmail,
    dailyTrialExpiryCheck,
    sendPlatformNotification,
    scheduledPlatformNotificationCheck,
  ],
});
