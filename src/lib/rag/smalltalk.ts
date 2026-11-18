export type SmallTalkType = 'greeting' | 'thanks' | 'identity' | 'capability' | 'farewell';

export type SmallTalkMatch = {
  type: SmallTalkType;
  reply: string;
};

// Whole-message patterns only. A real question attached to a greeting
// (e.g. "hi, what's the PTO policy?") is longer and won't full-match, so it
// still goes through normal grounded retrieval.
const PATTERNS: Array<{ type: SmallTalkType; re: RegExp; reply: string }> = [
  {
    type: 'greeting',
    re: /^(hi|hey+|hello|yo|hiya|howdy|sup|good\s*(morning|afternoon|evening|day)|greetings)[\s!.,?]*$/i,
    reply:
      "Hello! I'm your Rekall-IQ assistant. I answer questions using your organisation's approved documents — with sources. Ask me about a policy, procedure, report, or anything your team has uploaded.",
  },
  {
    type: 'thanks',
    re: /^(thanks|thank you|thanks a lot|thx|ty|cheers|much appreciated|appreciate it|great|perfect|awesome)[\s!.,?]*$/i,
    reply: "You're welcome! Ask me anything else from your approved documents whenever you're ready.",
  },
  {
    type: 'farewell',
    re: /^(bye|goodbye|see you|see ya|cya|later|that'?s all|that is all|done|no thanks)[\s!.,?]*$/i,
    reply: "Thanks for stopping by — I'll be right here whenever you need answers from your documents.",
  },
  {
    type: 'identity',
    re: /^(who are you|what are you|what'?s your name|your name|introduce yourself)[\s!.,?]*$/i,
    reply:
      "I'm the Rekall-IQ assistant for your workspace. I answer questions strictly from your organisation's approved documents and show you the sources — I don't use the public internet or outside knowledge.",
  },
  {
    type: 'capability',
    re: /^(help|what can you do|what do you do|how (can|do) you (work|help)|how does this work|what (can|should) i ask|what can i ask you)[\s!.,?]*$/i,
    reply:
      "I answer questions from your organisation's approved documents and cite the sources. Try asking about a specific policy, procedure, figure, or document. You can switch answer modes (Summary, Detailed, Executive, Technical) above the box, and scope a question to a single collection.",
  },
];

/**
 * Returns a friendly canned reply when the entire message is small talk
 * (greeting, thanks, identity, capability, farewell), otherwise null so the
 * message goes through normal grounded retrieval.
 */
export function detectSmallTalk(question: string): SmallTalkMatch | null {
  const q = question.trim();
  // Real questions are longer; keep grounding for anything substantial.
  if (!q || q.length > 64) return null;

  for (const { type, re, reply } of PATTERNS) {
    if (re.test(q)) return { type, reply };
  }
  return null;
}
