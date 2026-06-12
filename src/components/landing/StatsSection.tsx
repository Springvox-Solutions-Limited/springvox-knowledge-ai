"use client";

import { motion } from "motion/react";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
} as const;

const stats = [
  { value: "100%", label: "Answers cite their sources" },
  { value: "6", label: "File formats: PDF, DOCX, XLSX, PPTX, CSV, TXT" },
  { value: "Isolated", label: "A private workspace per organisation" },
  { value: "Zero", label: "Customer data used to train AI models" },
];

export function StatsSection() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface-2)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              {...reveal}
              transition={{ ...reveal.transition, delay: index * 0.08 }}
              className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
            >
              <p className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--ink-muted)]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
