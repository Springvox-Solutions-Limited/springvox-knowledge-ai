import Link from "next/link";

import type { BlogPost } from "@/src/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col border-t border-[var(--line)] pt-5 transition-colors hover:border-[var(--accent-jade)]"
    >
      <p className="font-meta text-[11px] text-[var(--ink-muted)]">
        {post.category} · {post.readTime}
      </p>

      <h2 className="mt-4 font-display text-[24px] leading-[1.15] tracking-[-0.01em] text-[var(--ink)] transition-colors group-hover:text-[var(--accent-jade)]">
        {post.title}
      </h2>

      <p className="mt-3 flex-1 text-[14px] leading-7 text-[var(--ink-soft)]">
        {post.description}
      </p>

      <p className="mt-6 font-meta text-[11px] text-[var(--ink-muted)]">
        {post.date}
      </p>
    </Link>
  );
}
