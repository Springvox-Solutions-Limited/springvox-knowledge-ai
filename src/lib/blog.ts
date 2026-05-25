export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
};

const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-enterprise-rag',
    title: 'What Is Enterprise RAG and Why It Matters for Your Organisation',
    description:
      'Learn how Retrieval-Augmented Generation (RAG) keeps AI answers grounded in your company\u2019s approved documents, not the open internet.',
    content: `
      <p>Retrieval-Augmented Generation, or RAG, is the architecture that makes SpringVox Knowledge AI possible. It combines two powerful capabilities: retrieving the right information from your documents and generating a natural-language answer from that information.</p>
      <p>Unlike general-purpose chatbots that answer from everything on the internet, a RAG system looks only at the content you provide. This matters for organisations that need accurate, controlled, and auditable answers from their own policies, handbooks, and procedures.</p>
      <h2>How RAG Works in Practice</h2>
      <p>When a team member asks a question, the system follows three steps:</p>
      <ol>
        <li><strong>Retrieve</strong> \u2014 The question is converted into a mathematical vector and searched against your document chunks in a vector database.</li>
        <li><strong>Augment</strong> \u2014 The most relevant chunks are bundled together as context for the AI model.</li>
        <li><strong>Generate</strong> \u2014 The AI produces an answer from that context alone, with source citations.</li>
      </ol>
      <p>This means every answer is traceable back to a specific document and section. If the retrieved documents do not contain a good answer, the system says so rather than guessing.</p>
      <h2>Why Enterprise Teams Are Moving to RAG</h2>
      <p>Traditional search tools return a list of links. Staff still need to read, interpret, and synthesise across multiple documents. RAG removes that overhead by giving a direct answer with supporting evidence.</p>
      <p>For compliance, legal, and HR teams, this is transformative. Instead of asking \u201cIs this answer from an approved source?\u201d the architecture guarantees it.</p>
    `,
    author: 'SpringVox Team',
    authorRole: 'Product',
    date: '15 May 2026',
    readTime: '4 min read',
    category: 'Technology',
    image: '/blog/rag-architecture.svg',
  },
  {
    slug: 'ai-document-search-vs-traditional-search',
    title: 'AI Document Search vs. Traditional Search: What\u2019s the Difference?',
    description:
      'Keyword search gives you links. AI search gives you answers. Here is why the shift matters for internal company knowledge.',
    content: `
      <p>Most organisations still rely on traditional keyword search to find internal information. Type a phrase, get a list of documents, and then read through each one to find what you need. It works, but it is slow.</p>
      <p>AI document search works differently. It understands the meaning behind your question, finds the most relevant content across all your documents, and returns a direct answer with supporting sources.</p>
      <h2>Keyword Search: The Old Way</h2>
      <p>Keyword search matches exact terms. If you search for \u201cremote work policy\u201d but the document says \u201cworking from home guidelines,\u201d traditional search may not find it. Staff often need to try multiple queries, guess the right terms, or ask a colleague.</p>
      <h2>AI-Powered Semantic Search</h2>
      <p>AI search uses embeddings to understand meaning, not just words. \u201cCan I work from home?\u201d and \u201cWhat is the remote work policy?\u201d map to the same semantic space, so the system finds the right content regardless of phrasing.</p>
      <p>SpringVox takes this further by combining semantic search with strict workspace isolation. Every search is filtered to your organisation\u2019s approved documents only.</p>
      <h2>The Bottom Line</h2>
      <p>Keyword search gives your team homework. AI search gives your team answers. For internal knowledge, that difference saves hours every week.</p>
    `,
    author: 'SpringVox Team',
    authorRole: 'Engineering',
    date: '8 May 2026',
    readTime: '3 min read',
    category: 'Product',
    image: '/blog/ai-vs-traditional.svg',
  },
  {
    slug: 'securing-company-knowledge-with-workspace-isolation',
    title: 'Securing Company Knowledge with Workspace Isolation',
    description:
      'How multi-tenant workspace isolation keeps each organisation\u2019s documents, chats, and AI answers private and protected.',
    content: `
      <p>When organisations adopt AI tools for internal knowledge, data privacy is the first concern. Who can see our documents? Are our chat histories shared across companies? Can the AI accidentally learn from one tenant and reveal it to another?</p>
      <p>SpringVox addresses these questions with workspace isolation. Each organisation operates inside its own private boundary within the platform.</p>
      <h2>What Workspace Isolation Means</h2>
      <p>Every piece of data in SpringVox is tagged with a workspace ID. This includes uploaded documents, text chunks, vector embeddings, chat messages, and user profiles. Every database query, vector search, and API call enforces this boundary at the application level.</p>
      <p>When a user asks a question, the system retrieves context only from that user\u2019s workspace. Documents from Company A never appear in search results for Company B, even if both use the same AI model.</p>
      <h2>Platform Admin Privacy Boundary</h2>
      <p>SpringVox operators with the platform admin role can manage workspaces, view metadata, and monitor system health. By default, they do not read uploaded document text or browse private chat conversations. This boundary is by design, not by convention.</p>
      <h2>Why This Matters</h2>
      <p>Workspace isolation means compliance teams can approve SpringVox for internal use without worrying about cross-tenant data leakage. It also means IT leaders can roll out AI-powered knowledge search with confidence.</p>
    `,
    author: 'SpringVox Team',
    authorRole: 'Security',
    date: '1 May 2026',
    readTime: '4 min read',
    category: 'Security',
    image: '/blog/workspace-isolation.svg',
  },
  {
    slug: 'how-to-reduce-onboarding-time-with-ai',
    title: 'How to Reduce New Hire Onboarding Time with AI',
    description:
      'New hires ask the same questions. Give them instant answers from your onboarding documents instead of waiting for a busy team member.',
    content: `
      <p>Onboarding a new hire typically involves a stack of documents, a series of handover meetings, and weeks of \u201clet me ask my manager\u201d moments. Many of those questions are repetitive, and the answers already exist in your onboarding materials.</p>
      <p>SpringVox helps by making those answers instantly available through a simple AI chat interface.</p>
      <h2>The Problem with Traditional Onboarding</h2>
      <p>New hires spend the first few weeks searching for information. Where is the IT setup guide? What does the expenses policy say? Who handles compliance training requests? Each question either interrupts a colleague or sends the new hire searching through shared drives and email chains.</p>
      <p>This slows ramp-up time and adds friction to what should be an exciting period.</p>
      <h2>AI-Powered Onboarding Support</h2>
      <p>Upload your onboarding handbook, IT setup guides, HR policies, and training materials into a SpringVox workspace. When new hires ask questions, they get immediate answers drawn from those approved documents, with source citations they can verify.</p>
      <p>This does not replace human support. It reduces the volume of repetitive questions so team leads and HR can focus on meaningful conversations instead of answering the same policy question for the fifth time.</p>
      <h2>Measurable Impact</h2>
      <p>Teams using SpringVox for onboarding report fewer interruption-based questions, faster time-to-answer for new hires, and better documentation coverage as admins see which questions their documents fail to answer.</p>
    `,
    author: 'SpringVox Team',
    authorRole: 'Product',
    date: '24 Apr 2026',
    readTime: '3 min read',
    category: 'Use Cases',
    image: '/blog/onboarding.svg',
  },
  {
    slug: 'voyage-embeddings-springvox',
    title: 'Why We Use Voyage AI for Document Embeddings',
    description:
      'A look at how SpringVox uses Voyage\u2019s embedding models to power accurate, batched, and cost-effective document retrieval.',
    content: `
      <p>Embeddings are the backbone of semantic search in a RAG system. They convert text into numerical vectors that capture meaning, enabling the system to find relevant content even when the exact words do not match.</p>
      <p>SpringVox uses Voyage AI as the default embedding provider for document and query embeddings. Here is why.</p>
      <h2>Accuracy and Relevance</h2>
      <p>Voyage\u2019s embedding models, particularly voyage-4-lite, deliver strong retrieval accuracy for enterprise document content. They handle the kind of formal, instructional, and policy language that appears in internal company documents.</p>
      <h2>Batched Ingestion for Stability</h2>
      <p>When a workspace admin uploads documents, SpringVox processes them through a batched embedding pipeline. Text chunks are sent to Voyage in batches of 20, with a maximum of 2 concurrent requests and a 500ms delay between batches. This keeps ingestion stable even for large document sets and avoids rate-limit errors.</p>
      <h2>Provider Flexibility</h2>
      <p>SpringVox is built with a provider abstraction layer. While Voyage is the default, organisations can switch to Gemini embeddings by changing environment variables. The system adapts its vector dimensions and model selection automatically.</p>
      <p>This flexibility means SpringVox can evolve as embedding technology improves, without requiring a platform rebuild.</p>
    `,
    author: 'SpringVox Team',
    authorRole: 'Engineering',
    date: '18 Apr 2026',
    readTime: '3 min read',
    category: 'Technology',
    image: '/blog/embeddings.svg',
  },
];

export function getBlogPosts(): BlogPost[] {
  return blogPosts;
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogCategories(): string[] {
  return Array.from(new Set(blogPosts.map((post) => post.category)));
}
