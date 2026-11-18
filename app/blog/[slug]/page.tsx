import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SiteShell } from "@/src/components/marketing/SiteShell";
import { getBlogPost, getBlogPosts } from "@/src/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell>
      <article>
        <header className="border-b border-[var(--line)]">
          <div className="mx-auto max-w-[820px] px-6 py-14 sm:px-8 sm:py-20">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-meta text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
              All notes
            </Link>

            <p className="mt-8 font-meta text-[11px] text-[var(--ink-muted)]">
              {post.category} · {post.date} · {post.readTime}
            </p>

            <h1 className="mt-4 font-display text-[36px] leading-[1.08] tracking-[-0.02em] text-[var(--ink)] sm:text-[48px]">
              {post.title}
            </h1>

            <p className="mt-5 max-w-[62ch] text-[17px] leading-8 text-[var(--ink-soft)]">
              {post.description}
            </p>

            <p className="mt-6 font-meta text-[11px] text-[var(--ink-muted)]">
              {post.author} · {post.authorRole}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-[820px] px-6 py-12 sm:px-8 sm:py-16">
          <div
            className="site-prose"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
            <p className="font-meta text-[11px] text-[var(--ink-muted)]">
              {post.author}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-meta text-[12px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              More notes
            </Link>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
