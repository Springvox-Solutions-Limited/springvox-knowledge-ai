import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBlogPosts, getBlogCategories } from "@/src/lib/blog";
import { BlogCard } from "@/src/components/blog/BlogCard";
import { LandingNavbar } from "@/src/components/landing/LandingNavbar";
import { LandingFooter } from "@/src/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Blog | Rekall-IQ",
  description:
    "Insights on enterprise AI, document search, RAG architecture, workspace security, and making company knowledge useful for every team.",
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();
  const categories = getBlogCategories();

  return (
    <div className="min-h-screen bg-[var(--surface-2)] selection:bg-[var(--accent-jade)] selection:text-[#04110e] flex flex-col font-sans">
      <LandingNavbar />

      <main className="flex-grow pt-24 pb-16 sm:pt-28 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-[var(--line)] pb-8 mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-jade)] mb-2">
              Resources
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              Blog
            </h1>
            <p className="mt-3 text-lg text-[var(--ink-soft)] max-w-3xl leading-relaxed">
              Insights on enterprise AI, document search, RAG architecture,
              workspace security, and making company knowledge useful for every
              team.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">
              All
            </span>
            {categories.map((category) => (
              <span
                key={category}
                className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-xs font-semibold text-[var(--ink-soft)] hover:border-[var(--accent-jade-100)] hover:text-[var(--accent-jade)] transition cursor-pointer"
              >
                {category}
              </span>
            ))}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
              <p className="text-[var(--ink-muted)] text-sm">No posts yet.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          <div className="mt-16 rounded-3xl border border-[var(--line)] bg-gradient-to-br from-teal-50/80 to-white p-8 sm:p-10 text-center">
            <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
              Want to see Rekall-IQ in action?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)] max-w-lg mx-auto">
              Create a workspace, upload a document, and ask your first
              question. No credit card required.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition hover:bg-[var(--accent-jade-hover)]"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
