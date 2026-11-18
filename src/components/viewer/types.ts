export type ViewerViewCitation = {
  filename: string;
  chunk_index: number;
  preview: string;
  document_id?: string | null;
  chunk_text?: string;
  uploaded_at?: string | null;
  uploaded_by?: string | null;
  document_category?: string | null;
  relevance_score?: number;
  confidence?: "high" | "medium" | "low";
};

export type ViewerMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  citations?: ViewerViewCitation[];
  followUps?: string[];
  statusMessage?: string;
  confidence?: "high" | "medium" | "low";
  error?: boolean;
  chatMessageId?: string;
  feedbackSubmitted?: boolean;
  feedbackRating?: string | null;
};

export type ViewerSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ViewerCollection = {
  id: string;
  name: string;
};
