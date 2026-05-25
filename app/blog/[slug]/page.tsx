import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { getBlogPost, getBlogPosts } from "@/src/lib/blog";
import { LandingNavbar } from "@/src/components/landing/LandingNavbar";
import { LandingFooter } from "@/src/components/landing/LandingFooter";

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
    title: `${post.title} | SpringVox Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-slate-900 selection:text-white flex flex-col font-sans">
      <LandingNavbar />

      <main className="flex-grow pt-24 pb-16 sm:pt-28 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-8"
          >
            <ArrowLeft size={15} />
            Back to Blog
          </Link>

          <article className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={13} />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {post.description}
            </p>

            <div className="mt-6 flex items-center gap-4 border-b border-slate-200 pb-6 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800 uppercase">
                {post.author[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {post.author}
                </p>
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{post.authorRole}</span>
                  <span className="text-slate-300">·</span>
                  <CalendarDays size={12} />
                  <span>{post.date}</span>
                </p>
              </div>
            </div>

            <div
              className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-sm prose-p:leading-7 prose-p:text-slate-600 prose-p:mb-4
                prose-a:text-cyan-700 prose-a:font-semibold prose-a:hover:underline
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-ul:my-4 prose-ul:space-y-2
                prose-ol:my-4 prose-ol:space-y-2
                prose-li:text-sm prose-li:leading-7 prose-li:text-slate-600
                prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:text-cyan-700 prose-code:font-mono
                prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-950 prose-pre:p-4
                prose-pre:overflow-x-auto
                prose-blockquote:border-l-2 prose-blockquote:border-cyan-400/60 prose-blockquote:pl-4 prose-blockquote:text-slate-500 prose-blockquote:not-italic
                prose-img:rounded-2xl prose-img:max-w-full
                prose-hr:my-8 prose-hr:border-slate-200"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-12 border-t border-slate-200 pt-8 text-center">
              <p className="text-sm text-slate-500 mb-4">
                Thank you for reading.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft size={15} />
                More Articles
              </Link>
            </div>
          </article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
