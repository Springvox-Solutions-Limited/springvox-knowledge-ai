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
};

const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-enterprise-rag',
    title: 'What enterprise RAG actually does',
    description:
      'Retrieval-augmented generation keeps an answer inside a defined document set. Here is what that changes for company knowledge.',
    content: `
      <p>Retrieval-augmented generation, or RAG, is the architecture behind Rekall-IQ. It joins two steps: find the passages that bear on a question, then write an answer from those passages rather than from everything the model has seen.</p>
      <p>For a company, the difference is the boundary. A general assistant can answer from the open web, from an outdated copy, or from nothing at all. A RAG system answers from the corpus you gave it, and can name the files it used.</p>
      <h2>The three steps</h2>
      <ol>
        <li><strong>Retrieve.</strong> The question is embedded and matched against your document chunks, with a workspace filter applied.</li>
        <li><strong>Augment.</strong> The most relevant passages are compressed into context for the model.</li>
        <li><strong>Generate.</strong> The answer is written from that context, with citations back to the source.</li>
      </ol>
      <p>If the retrieved passages do not support an answer, the correct behaviour is to say so. That is a product decision, not a model feature, and it is the one that makes a RAG system usable in a compliance conversation.</p>
      <h2>Why teams move to it</h2>
      <p>Keyword search returns a list of documents. Someone still has to open them, read them, and reconcile the versions. RAG returns the answer with the evidence attached, which removes the reading pass and leaves the checking pass.</p>
      <p>For HR, legal, and support teams, the checking pass is the part that matters. A citation that opens the exact page makes review quick enough to happen every time.</p>
    `,
    author: 'Rekall-IQ Team',
    authorRole: 'Product',
    date: '15 May 2026',
    readTime: '4 min read',
    category: 'Technology',
  },
  {
    slug: 'ai-document-search-vs-traditional-search',
    title: 'AI document search versus keyword search',
    description:
      'Keyword search matches terms. Semantic search matches meaning. The difference decides whether staff find the policy.',
    content: `
      <p>Most organisations still rely on keyword search for internal information. Type a phrase, get a list of files, then read until you find the sentence you needed. It works when you already know the vocabulary.</p>
      <p>It fails when you do not. A search for “remote work policy” misses a document titled “working from home guidelines”, even though it is the right file.</p>
      <h2>What changes with embeddings</h2>
      <p>Semantic search converts text into vectors that capture meaning. “Can I work from home?” and “What is the remote work policy?” land close together, so the system retrieves the same passage for both.</p>
      <p>Rekall-IQ combines that with keyword candidates for exact names, codes, and phrases, then merges and deduplicates the results. Exact identifiers still need exact matching.</p>
      <h2>The boundary still matters</h2>
      <p>Better retrieval does not remove the need for a boundary. Every candidate is filtered to the workspace before it can be used, and the answer names the files it came from.</p>
      <p>Keyword search gives your team homework. Semantic search gives them an answer they can check.</p>
    `,
    author: 'Rekall-IQ Team',
    authorRole: 'Engineering',
    date: '8 May 2026',
    readTime: '3 min read',
    category: 'Product',
  },
  {
    slug: 'securing-company-knowledge-with-workspace-isolation',
    title: 'What workspace isolation means in practice',
    description:
      'A private workspace is a query-level guarantee, not a setting. Here is where the boundary is enforced.',
    content: `
      <p>When an organisation adopts a tool for internal knowledge, the first question is who can see the documents. The second is whether another customer’s data can appear in an answer.</p>
      <p>Rekall-IQ answers both with a workspace boundary that is enforced at query time.</p>
      <h2>Where the boundary lives</h2>
      <p>Documents, chunks, chat messages, invitations, notifications, audit logs, and usage records all carry a workspace identifier. Database reads and writes validate the authenticated profile’s workspace.</p>
      <p>Vector search applies the identifier as a payload filter in Qdrant. A retrieval cannot return another workspace’s passage, even when the question text is identical.</p>
      <p>Row-level security is enabled on every table and is never bypassed. Service-role access stays on the server and is never exposed to the browser.</p>
      <h2>The admin boundary</h2>
      <p>Platform operators manage workspace health, plans, and lifecycle. By default they see metadata rather than document text or private conversations.</p>
      <p>That boundary is a design decision, not a promise about good behaviour. It is enforced in the application and documented on the security page.</p>
    `,
    author: 'Rekall-IQ Team',
    authorRole: 'Security',
    date: '1 May 2026',
    readTime: '4 min read',
    category: 'Security',
  },
  {
    slug: 'how-to-reduce-onboarding-time-with-ai',
    title: 'Onboarding questions are a documentation problem',
    description:
      'New hires ask the same twenty questions. Most of them already have an approved answer in a document nobody can find.',
    content: `
      <p>Onboarding a new hire involves a stack of documents, a set of handover meetings, and several weeks of “let me ask my manager”. Many of those questions repeat across every intake.</p>
      <p>That is not a training failure. It is a retrieval failure. The answer exists in the handbook, in a policy, or in a checklist, and it is hard to reach under time pressure.</p>
      <h2>What a cited workspace changes</h2>
      <p>Upload the onboarding handbook, IT setup guide, HR policies, and training material into one workspace. A new hire asks in plain language and gets an answer drawn from those files, with the page attached.</p>
      <p>The point is not to remove the team lead from onboarding. It is to stop the team lead from being the search engine for questions the documents already answer.</p>
      <h2>What to measure</h2>
      <p>Track the questions that return no good source. That list tells you which part of the handbook is missing, and it is more useful than a satisfaction score for deciding what to write next.</p>
    `,
    author: 'Rekall-IQ Team',
    authorRole: 'Product',
    date: '24 Apr 2026',
    readTime: '3 min read',
    category: 'Use cases',
  },
  {
    slug: 'voyage-embeddings-springvox',
    title: 'Why we embed documents with Voyage',
    description:
      'The embedding provider decides how well a workspace retrieves policy language. Here is the current choice and the trade-off.',
    content: `
      <p>Embeddings turn text into vectors that capture meaning. They are what allow a retrieval system to find a relevant passage when the words in the question do not match the words in the document.</p>
      <p>Rekall-IQ uses Voyage AI as the default embedding provider, with Gemini embeddings available as a fallback.</p>
      <h2>The ingestion trade-off</h2>
      <p>Documents are embedded in batches so a large upload stays stable. Chunks are sent in groups, with limited concurrency and a delay between batches, rather than fired off all at once.</p>
      <p>That pacing matters more than raw throughput. A failed batch leaves a document half-indexed, which is worse than a slower upload.</p>
      <h2>Changing providers</h2>
      <p>Embedding providers produce vectors with different dimensions, so switching one requires reindexing the workspace into a compatible collection. The provider is a deployment decision, not a per-question toggle.</p>
      <p>Keeping the abstraction explicit means the retrieval layer can improve without rebuilding the product around it.</p>
    `,
    author: 'Rekall-IQ Team',
    authorRole: 'Engineering',
    date: '18 Apr 2026',
    readTime: '3 min read',
    category: 'Technology',
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
