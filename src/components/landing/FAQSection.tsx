"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";

const faqs = [
  {
    q: "How does Rekall-IQ keep my company data private?",
    a: "Each organisation gets its own isolated workspace. Data is stored in your private vector index, and answers are generated only from documents you upload. We never train on your data or share it across tenants.",
  },
  {
    q: "What file types does Rekall-IQ support?",
    a: "Rekall-IQ supports PDF, DOCX, XLSX, CSV, PPTX, and TXT files. You can upload them directly through the workspace dashboard, and our parser extracts the text for secure indexing.",
  },
  {
    q: "Can I try Rekall-IQ before committing?",
    a: "Yes. The Free plan gives you a full workspace setup with document uploads and chat capabilities. No credit card is required to start.",
  },
  {
    q: "How are answers grounded in my documents?",
    a: "Answers are generated exclusively from content in your uploaded documents. Each answer can show source citations so your team can verify the original document and section.",
  },
  {
    q: "What kind of support is included?",
    a: "All plans include email support. Business and Enterprise plans include priority support with faster response times and dedicated onboarding assistance.",
  },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
} as const;

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-[var(--surface-2)]"
      >
        <span className="pr-4 text-sm font-semibold text-[var(--ink)] sm:text-base">
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-[var(--ink-muted)] transition duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--line)] px-6 pb-5 pt-4">
              <p className="text-sm leading-7 text-[var(--ink-soft)]">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[var(--surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">
            FAQs
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
            Frequently asked questions.
          </h2>
          <p className="mt-5 text-base leading-8 text-[var(--ink-soft)]">
            Everything you need to know about Rekall-IQ.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              {...reveal}
              transition={{ ...reveal.transition, delay: index * 0.06 }}
            >
              <FAQItem
                faq={faq}
                isOpen={openIndex === index}
                onToggle={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
