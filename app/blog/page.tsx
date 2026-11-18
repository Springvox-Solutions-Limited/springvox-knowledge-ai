import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, Quote } from "lucide-react";

import { BlogCard } from "@/src/components/blog/BlogCard";
import { SiteShell } from "@/src/components/marketing/SiteShell";
import {
  ArrowLink,
  ButtonLink,
  PageHero,
  SectionLabel,
} from "@/src/components/marketing/ui";
import { getBlogCategories, getBlogPosts } from "@/src/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on cited answers, document retrieval, workspace isolation, and making company knowledge trustworthy.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();
  const categories = getBlogCategories();
  const [featured, ...rest] = posts;

  return (
    <SiteShell>
      <PageHero
        label="Blog"
        title="Notes on company knowledge"
        intro="How cited answers work, what workspace isolation actually means, and where document retrieval still fails."
        aside={
          <div className="grid gap-px overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--line)] sm:w-[20rem]">
            <div className="bg-[var(--canvas)] p-4">
              <p className="text-[19px] font-medium leading-none tracking-[-0.03em] text-[var(--ink)] tabular-nums">
                {posts.length}
              </p>
              <p className="mt-1.5 font-meta text-[8px] text-[var(--ink-muted)]">
                notes, no newsletter
              </p>
            </div>
            <div className="bg-[var(--canvas)] p-4">
              <p className="text-[19px] font-medium leading-none tracking-[-0.03em] text-[var(--ink)]">
                {categories.length}
              </p>
              <p className="mt-1.5 font-meta text-[8px] text-[var(--ink-muted)]">
                topics · technology, product, security
              </p>
            </div>
          </div>
        }
      />

      <section className="border-b border-[var(--line)]">
        <div className="mk-shell py-12 sm:py-16">
          {featured ? (
            <Link
              href={`/blog/${featured.slug}`}
              data-reveal
              className="group grid gap-px overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="flex flex-col justify-between bg-[var(--canvas)] p-6 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-meta text-[9px] text-[var(--ink-muted)]">
                    <span className="rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2 py-0.5 text-[var(--accent-jade)]">
                      Featured
                    </span>
                    <span>{featured.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featured.readTime}</span>
                  </div>
                  <h2 className="mt-5 max-w-[18ch] text-[clamp(1.75rem,3.4vw,2.75rem)] font-medium leading-[1.06] tracking-[-0.035em] text-[var(--ink)]">
                    {featured.title}
                  </h2>
                  <p className="mt-4 max-w-[54ch] text-[13px] leading-6 text-[var(--ink-soft)]">
                    {featured.description}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                  <span className="font-meta text-[9px] text-[var(--ink-muted)]">
                    {featured.date} · {featured.author}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent-jade)]">
                    Read the note
                    <ArrowUpRight
                      size={12}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </div>

              <div className="relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-[var(--surface)] p-6 sm:p-8">
                <div
                  aria-hidden="true"
                  className="mk-grid-bg absolute inset-0 opacity-40 [background-size:32px_32px]"
                />
                <div className="relative flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-meta text-[9px] text-[var(--ink-muted)]">
                    <FileText size={11} strokeWidth={1.5} aria-hidden="true" />
                    Source-grounded
                  </span>
                  <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                    Preview
                  </span>
                </div>
                <div className="relative mt-6 rounded-[10px] border border-[var(--line)] bg-[var(--canvas)] p-4">
                  <Quote size={14} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
                  <p className="mt-3 text-[12px] leading-6 text-[var(--ink-soft)]">
                    An answer that cannot be traced to a document is a guess. The
                    citation is the part that makes the answer usable.
                  </p>
                  <p className="mt-3 border-t border-[var(--line)] pt-2 font-meta text-[8px] text-[var(--ink-muted)]">
                    Rekall-IQ · editorial note
                  </p>
                </div>
              </div>
            </Link>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-4">
            <span className="rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2.5 py-1 font-meta text-[9px] text-[var(--accent-jade)]">
              All
            </span>
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-[var(--line)] px-2.5 py-1 font-meta text-[9px] text-[var(--ink-muted)]"
              >
                {category}
              </span>
            ))}
            <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">
              Newest first
            </span>
          </div>

          {rest.length === 0 ? (
            <p className="py-12 text-[15px] text-[var(--ink-soft)]">No posts yet.</p>
          ) : (
            <div className="grid gap-x-12 gap-y-12 py-10 sm:grid-cols-2">
              {rest.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[var(--surface-2)]">
        <div className="mk-shell grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div data-reveal>
            <SectionLabel>See it on your own documents</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[26ch] text-[var(--ink)]">
              Create a workspace, upload one approved document, and ask a question
              you already know the answer to.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink
              href="/register"
              icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
            >
              Create a workspace
            </ButtonLink>
            <ArrowLink href="/docs" className="self-center px-2">
              Read the docs
            </ArrowLink>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
