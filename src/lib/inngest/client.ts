import { Inngest } from "inngest";

// Define the event types strictly to ensure type safety across publishers and handlers
export type Events = {
  "document/process.started": {
    data: {
      documentId: string;
      workspaceId: string;
      storagePath: string;
      originalFilename: string;
      mimeType?: string;
      userId: string;
    };
  };
  "workspace/trial.started": {
    data: {
      workspaceId: string;
      workspaceName: string;
      adminUserId: string;
      adminEmail: string;
      adminName?: string;
      trialEndsAt: string;
    };
  };
  "workspace/trial.reminder": {
    data: {
      workspaceId: string;
      daysRemaining: 1 | 3;
    };
  };
  "workspace/trial.expired": {
    data: {
      workspaceId: string;
    };
  };
  "platform/notification.send": {
    data: {
      notificationId: string;
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "springvox-knowledge-ai",
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});
