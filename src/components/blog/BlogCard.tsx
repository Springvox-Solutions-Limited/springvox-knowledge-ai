import Link from "next/link";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/src/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">
          {post.category}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={12} />
          {post.readTime}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug tracking-tight text-slate-950 group-hover:text-cyan-800 transition-colors">
        {post.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-2">
        {post.description}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CalendarDays size={13} />
          <span>{post.date}</span>
          <span className="text-slate-300">·</span>
          <span className="font-medium text-slate-500">{post.author}</span>
        </div>

        <span className="flex items-center gap-1 text-xs font-semibold text-cyan-700 transition group-hover:gap-1.5">
          Read <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
