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
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "springvox-knowledge-ai",
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});
