import type { NextRequest } from 'next/server';
import { serve } from 'inngest/next';

import { inngest } from '@/src/lib/inngest/client';
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
} from '@/src/lib/inngest/functions';

const handlers = serve({
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

function configurationError() {
  if (process.env.NODE_ENV !== 'production') return null;

  if (process.env.INNGEST_DEV === '1') {
    return Response.json(
      { error: 'Inngest dev mode is disabled in production.' },
      { status: 503 },
    );
  }

  if (!process.env.INNGEST_SIGNING_KEY) {
    return Response.json(
      { error: 'Inngest is not configured.' },
      { status: 503 },
    );
  }

  return null;
}

export async function GET(req: NextRequest) {
  return configurationError() ?? handlers.GET(req, undefined);
}

export async function POST(req: NextRequest) {
  return configurationError() ?? handlers.POST(req, undefined);
}

export async function PUT(req: NextRequest) {
  return configurationError() ?? handlers.PUT(req, undefined);
}
