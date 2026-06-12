import type { Metadata } from 'next';
import { HelpPageLayout } from '@/src/components/help/HelpPageLayout';
import {
  AnswerWithSourcesMock,
  ChatComposerMock,
  GuideCallout,
  GuideFaq,
  GuideFigure,
  GuideSection,
  GuideStep,
  GuideSteps,
  Kbd,
} from '@/src/components/help/GuideKit';

export const metadata: Metadata = {
  title: 'User Guide | Rekall-IQ',
  description:
    'How to ask questions, read sources, and get the most accurate answers from your company knowledge base in Rekall-IQ.',
};

export default function UserGuidePage() {
  return (
    <HelpPageLayout
      title="User Guide"
      description="Everything you need to ask great questions and trust the answers. Rekall-IQ answers only from your organisation's approved documents — never the public internet."
      activePath="/help/user-guide"
    >
      <GuideSection id="getting-started" eyebrow="Step 1" title="Signing in">
        <GuideSteps>
          <GuideStep title="Open your invite link or the login page">
            Your workspace admin either creates your account or emails you an invitation link.
          </GuideStep>
          <GuideStep title="Set your name and password">
            The first time you accept an invite, you choose the password you&apos;ll use going forward.
          </GuideStep>
          <GuideStep title="Land on “Ask Questions”">
            After signing in you go straight to the chat screen, ready to ask your first question.
          </GuideStep>
        </GuideSteps>
        <GuideCallout tone="note" title="Forgot your password?">
          Password resets are handled by your workspace admin — reach out to them and they can re-send an invite.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="asking" eyebrow="Step 2" title="Asking a question">
        <p>
          Type your question in plain English in the box at the bottom and press <Kbd>Enter</Kbd>. Use{' '}
          <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> for a new line. Rekall-IQ searches your approved documents, then
          writes an answer grounded in what it finds — streaming in live as it goes.
        </p>
        <GuideFigure caption="The question box, answer-mode tabs, and document scope sit together at the bottom of the chat.">
          <ChatComposerMock />
        </GuideFigure>
        <ul className="list-disc space-y-1 pl-5">
          <li>If the documents don&apos;t contain the answer, the assistant says so rather than guessing.</li>
          <li>Ask natural follow-up questions — the assistant keeps the context of your conversation.</li>
          <li>Use the microphone to dictate a question where your browser supports it.</li>
        </ul>
      </GuideSection>

      <GuideSection id="answer-modes" eyebrow="Step 3" title="Choosing an answer mode">
        <p>The tabs above the question box change how the answer is written:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Summary</strong> — a few tight bullet points.</li>
          <li><strong>Detailed</strong> — a balanced, structured answer (the default).</li>
          <li><strong>Executive</strong> — business-focused: decisions, risks, and next actions.</li>
          <li><strong>Technical</strong> — precise steps, values, and terminology from the source.</li>
        </ul>
        <GuideCallout tone="tip" title="Match the mode to the task">
          Reach for <strong>Executive</strong> when you&apos;re briefing a stakeholder, and <strong>Technical</strong> when
          you need exact figures or step-by-step procedures.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="scope" eyebrow="Step 4" title="Scoping to a collection">
        <p>
          If your admin has organised documents into collections (for example <em>HR</em>, <em>Finance</em>, or{' '}
          <em>Operations</em>), use the <strong>Scope</strong> selector to limit a question to one collection. Leave it on{' '}
          <strong>All documents</strong> to search everything.
        </p>
        <GuideCallout tone="tip" title="When scope helps most">
          Scope to a department when the same term means different things across teams — e.g. “coverage” in Finance
          versus Operations.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="sources" eyebrow="Step 5" title="Reading sources and citations">
        <p>
          Every answer shows the <strong>sources</strong> it was built from. Expand them to see which documents were
          used, and click one to open a preview of the original file so you can verify the answer yourself.
        </p>
        <GuideFigure caption="Each answer is followed by the exact documents it drew from — one click from the original.">
          <AnswerWithSourcesMock />
        </GuideFigure>
        <GuideCallout tone="warning" title="Always verify decisions">
          When a real decision depends on an answer, open the source and confirm it. Rekall-IQ is designed to keep you
          one click away from the original document.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="actions" eyebrow="Step 6" title="Working with answers">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Follow-up suggestions</strong> appear under some answers — tap one to keep digging.</li>
          <li><strong>Copy</strong> an answer to paste it elsewhere.</li>
          <li><strong>Regenerate</strong> to get a fresh take on the same question.</li>
          <li><strong>Edit</strong> a previous question to rephrase and re-ask.</li>
          <li><strong>Stop</strong> generation at any time once you have what you need.</li>
        </ul>
      </GuideSection>

      <GuideSection id="feedback" eyebrow="Step 7" title="Giving feedback">
        <p>
          Under each answer you can mark it <strong>Helpful</strong> or <strong>Not helpful</strong>. This is the
          fastest way to get a weak answer improved — your admins use it to find gaps in the knowledge base.
        </p>
      </GuideSection>

      <GuideSection id="history" eyebrow="Step 8" title="Your chat history is private">
        <p>
          Conversations are saved privately to your account. Start a fresh thread with <strong>New Chat</strong>, and
          reopen earlier conversations from the history list. Other members of your workspace cannot see your
          individual chats.
        </p>
      </GuideSection>

      <GuideSection id="faq" eyebrow="Help" title="Frequently asked questions">
        <GuideFaq
          items={[
            {
              q: 'Why did it say “I don’t know”?',
              a: 'The answer isn’t in your approved documents. That’s intentional — Rekall-IQ never guesses or uses the public internet. Ask your admin to upload the relevant document.',
            },
            {
              q: 'Can I ask about anything?',
              a: 'Only what your organisation has uploaded. Rekall-IQ does not browse the web or use outside knowledge, which is what makes its answers safe to act on.',
            },
            {
              q: 'Can other people see my chats?',
              a: 'No. Your conversations are private to your account. Admins see usage analytics and knowledge gaps, not your individual chat threads.',
            },
            {
              q: 'The answer looks wrong — what should I do?',
              a: 'Open the cited source to check, then mark the answer “Not helpful”. That flags it for your admins to fix.',
            },
          ]}
        />
      </GuideSection>
    </HelpPageLayout>
  );
}
