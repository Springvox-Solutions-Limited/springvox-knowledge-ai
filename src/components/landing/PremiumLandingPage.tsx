"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSearch,
  FileText,
  Fingerprint,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers3,
  LibraryBig,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { cn } from "@/src/lib/utils";
import { StatsSection } from "./StatsSection";
import { FAQSection } from "./FAQSection";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
} as const;

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog" },
];

const securityStats = [
  { label: "Workspace isolation", value: "Tenant-scoped" },
  { label: "Answer policy", value: "Source-grounded" },
  { label: "Processing", value: "Background jobs" },
  { label: "Admin view", value: "Metadata only" },
];

const problems = [
  "Approved policies are scattered across drives, inboxes, and chat threads — and hard to find when it matters.",
  "New hires ask the same onboarding questions again and again, pulling senior staff away from their work.",
  "People rely on memory or outdated copies instead of the approved source, creating compliance risk.",
  "Leaders have no visibility into which questions the documentation simply fails to answer.",
];

const workflow = [
  {
    title: "Upload approved documents",
    copy: "Admins add PDFs, DOCX, CSV, XLSX, PPTX, and TXT files to a private workspace library.",
    icon: LibraryBig,
  },
  {
    title: "Parse and prepare knowledge",
    copy: "Rekall-IQ extracts readable text, prepares sections, and indexes them for secure retrieval.",
    icon: Workflow,
  },
  {
    title: "Ask in plain English",
    copy: "Staff ask questions without learning folder structures, search operators, or internal jargon.",
    icon: MessageSquareText,
  },
  {
    title: "Receive sourced answers",
    copy: "Answers stay grounded in uploaded documents with compact citations and source context.",
    icon: FileSearch,
  },
];

const capabilities = [
  { title: "Smart document parsing", copy: "Clean text from PDF, DOCX, XLSX, CSV, PPTX, and TXT — with advanced parsing for complex, scanned, or table-heavy files.", icon: Layers3 },
  { title: "Background processing", copy: "Documents parse, index, and become searchable in the background while your team keeps working.", icon: Database },
  { title: "Source-grounded answers", copy: "Replies are built only from your documents and cite the exact files they came from.", icon: FileText },
  { title: "Collections & scoping", copy: "Group documents by department and let staff scope a question to a single collection for sharper answers.", icon: LibraryBig },
  { title: "Document intelligence", copy: "Every upload gets an automatic summary, keywords, and category so files are findable by meaning.", icon: Search },
  { title: "Answer-quality tools", copy: "Evaluations and unanswered-question tracking help admins catch weak answers and close knowledge gaps.", icon: BarChart3 },
  { title: "Roles & isolated workspaces", copy: "Invite admins and viewers into private, access-controlled company workspaces.", icon: Users },
  { title: "Source preview & history", copy: "Open the original file beside an answer, and keep private chat history to continue context.", icon: MessageSquareText },
];

const graphNodes = [
  { label: "HR policies", x: "14%", y: "32%" },
  { label: "Onboarding", x: "32%", y: "18%" },
  { label: "Compliance", x: "71%", y: "25%" },
  { label: "Support SOPs", x: "82%", y: "58%" },
  { label: "Training docs", x: "28%", y: "72%" },
  { label: "Finance rules", x: "57%", y: "76%" },
];

const industries = [
  { name: "Telecom", icon: Network, copy: "Policy, support, compliance, and service knowledge." },
  { name: "Banking", icon: Landmark, copy: "Controlled answers for internal procedures and operations." },
  { name: "Healthcare", icon: HeartPulse, copy: "Approved operational guidance for staff-facing teams." },
  { name: "Education", icon: GraduationCap, copy: "Admissions, policies, handbooks, and admin workflows." },
  { name: "Legal", icon: ShieldCheck, copy: "Source-backed document Q&A for internal teams." },
  { name: "Support Teams", icon: Users, copy: "Faster answers from playbooks, FAQs, and escalation guides." },
  { name: "Government", icon: Building2, copy: "Workspace-controlled access to official internal knowledge." },
];

const principles = [
  {
    title: "Grounded, not guessing",
    copy: "Every answer is built from your approved documents and shows its sources. If it isn't in your files, Rekall-IQ says so instead of inventing one.",
  },
  {
    title: "Private by design",
    copy: "Each organisation works inside its own isolated workspace. Admins control exactly what's uploaded and who can access it.",
  },
  {
    title: "Improves with use",
    copy: "Built-in feedback and unanswered-question tracking show you precisely where your documentation needs work.",
  },
  {
    title: "Organised by department",
    copy: "Group documents into collections — HR, Finance, Legal, Operations — and let staff scope a question to one area for sharper, less ambiguous answers.",
  },
  {
    title: "See the original, instantly",
    copy: "Open the source file in-app from any answer — PDF, Word, Excel, and more — to verify it yourself without downloads or leaving the chat.",
  },
  {
    title: "Answers that fit the moment",
    copy: "Switch between Summary, Detailed, Executive, and Technical so the same source reads right for a quick check or a deep dive.",
  },
];

const pricing = [
  {
    name: "Essential",
    price: "$0",
    period: "free during beta",
    copy: "For teams validating secure document AI in a controlled workspace. No credit card required.",
    capacity: ["Up to 20 documents", "Up to 25 users", "1,000 questions / month"],
    features: [
      "Grounded chat with sources",
      "Collections & document scoping",
      "In-app file preview",
      "Answer modes (Summary → Technical)",
      "Admin dashboard & basic analytics",
    ],
    highlighted: false,
    badge: null,
    cta: "Start free",
    ctaHref: "/register",
  },
  {
    name: "Business",
    price: "$299",
    period: "per month",
    copy: "For organisations rolling Rekall-IQ out across departments.",
    capacity: ["Up to 200 documents", "Up to 250 users", "15,000 questions / month"],
    features: [
      "Everything in Essential",
      "Advanced parsing (LlamaParse)",
      "Full analytics & usage metering",
      "Knowledge-gap tracking",
      "Answer-quality evaluations",
      "Roles, users & invitations",
    ],
    highlighted: true,
    badge: "Most popular",
    cta: "Start free trial",
    ctaHref: "/register",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your org",
    copy: "For regulated teams needing custom capacity, rollout guidance, and advanced controls.",
    capacity: ["Custom document & user limits", "Custom monthly volume", "Dedicated onboarding"],
    features: [
      "Everything in Business",
      "Configurable usage limits",
      "Audit logs & security review",
      "Priority support",
      "Roadmap: SSO & source connectors",
    ],
    highlighted: false,
    badge: null,
    cta: "Book a 15-min call",
    ctaHref: "mailto:hello@springvoxsl.com",
  },
];

const securityControls = [
  {
    title: "Workspace isolation",
    copy: "Each organisation works inside its own private workspace.",
    icon: Fingerprint,
  },
  {
    title: "Role-based access",
    copy: "Admins manage uploads and users while staff keep a simple chat experience.",
    icon: LockKeyhole,
  },
  {
    title: "Source-grounded responses",
    copy: "Answers are prepared from uploaded documents and can show citations.",
    icon: ShieldCheck,
  },
];

function HeroParticleField() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cleanup = () => {};

    async function mountScene() {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      // Bail gracefully on devices/GPUs without a usable WebGL context
      // (e.g. older Intel integrated graphics). The particle field is purely
      // decorative, so we silently skip it rather than crash the page.
      const probe = document.createElement("canvas");
      const hasWebGL = Boolean(
        probe.getContext("webgl2") ||
          probe.getContext("webgl") ||
          probe.getContext("experimental-webgl"),
      );
      if (!hasWebGL) {
        return;
      }

      const THREE = await import("three");

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        // WebGL context creation failed at runtime — skip the effect.
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 100);
      camera.position.z = 6;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const particleCount = 180;
      const positions = new Float32Array(particleCount * 3);

      for (let index = 0; index < particleCount; index += 1) {
        positions[index * 3] = (Math.random() - 0.5) * 9;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 4.8;
        positions[index * 3 + 2] = (Math.random() - 0.5) * 5;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x14b8a6,
        size: 0.018,
        transparent: true,
        opacity: 0.55,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let frameId = 0;
      const animate = () => {
        points.rotation.y += 0.0009;
        points.rotation.x = Math.sin(Date.now() * 0.00018) * 0.04;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      const resize = () => {
        const width = container.clientWidth;
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener("resize", resize);
      animate();

      cleanup = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    mountScene().catch(() => {
      // Decorative-only; ignore any WebGL/three.js failure.
    });
    return () => cleanup();
  }, []);

  return <div ref={containerRef} aria-hidden className="absolute inset-0 opacity-70 mix-blend-screen" />;
}

function AmbientGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.26),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#070908_0%,#0b1413_48%,#0a0c0b_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute left-1/2 top-12 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-[var(--accent-jade-100)] bg-teal-300/5 blur-3xl" />
      <HeroParticleField />
      {Array.from({ length: 22 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-teal-300/70 shadow-[0_0_20px_rgba(20,184,166,0.8)]"
          style={{
            left: `${8 + ((index * 37) % 86)}%`,
            top: `${9 + ((index * 19) % 68)}%`,
          }}
          animate={{ opacity: [0.12, 0.85, 0.12], y: [0, -18, 0] }}
          transition={{ duration: 4 + (index % 5), repeat: Infinity, delay: index * 0.18 }}
        />
      ))}
    </div>
  );
}

function PremiumNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-3 py-3 transition-all duration-300 sm:px-4",
          scrolled
            ? "border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
            : "border-white/65 bg-[var(--surface)] shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl",
        )}
      >
        <Link href="/" className="flex min-w-0 items-center">
          <BrandLogo
            variant="full"
            theme="light"
            imageClassName="h-9 w-auto max-w-[165px] object-contain"
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm font-medium transition",
                scrolled ? "text-[var(--ink-soft)] hover:text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={cn(
              "hidden rounded-xl px-4 py-2 text-sm font-semibold transition md:inline-flex",
              scrolled ? "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface)]",
            )}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="hidden items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-[0_0_28px_rgba(20,184,166,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-jade-50)] sm:inline-flex sm:px-5"
          >
            Start Free
            <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-sm transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/60 md:hidden"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <motion.div
          id="landing-mobile-menu"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-[var(--surface)] p-2 shadow-[0_22px_55px_rgba(15,23,42,0.14)] backdrop-blur-2xl md:hidden"
        >
          <div className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm font-bold text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)]"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:bg-[var(--accent-jade-hover)]"
            >
              Start Free
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}

function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-14 w-full max-w-6xl [perspective:1400px]"
    >
      <div className="absolute -inset-5 rounded-[2.5rem] bg-teal-400/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-[var(--ink-muted)] sm:flex">
            <Search size={13} />
            Ask your company knowledge...
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
            Grounded
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-200/80">Staff assistant</p>
                <span className="rounded-full border border-[var(--accent-jade-100)] bg-teal-300/10 px-3 py-1 text-[10px] text-teal-100">Workspace: Acme Health</span>
              </div>
              <div className="ml-auto max-w-xl rounded-2xl bg-teal-400 px-5 py-4 text-sm font-semibold text-[var(--ink)] shadow-[0_0_32px_rgba(20,184,166,0.22)]">
                What does the onboarding policy say a new support hire should complete in week one?
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Answer</p>
                <p className="text-sm leading-6 text-slate-200">
                  New support hires should complete orientation, review the customer data policy, meet their team lead, and finish compliance training before handling live requests.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {["Employee_Handbook.pdf", "Support_Onboarding.docx"].map((source) => (
                    <div key={source} className="rounded-xl border border-[var(--accent-jade-100)] bg-teal-300/5 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-100">
                        <FileText size={14} />
                        <span className="truncate">{source}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div className="h-full w-3/4 rounded-full bg-teal-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Ready documents", "148"],
                ["Questions answered", "2.8k"],
                ["Open gaps", "12"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Document pipeline</p>
              <div className="mt-4 space-y-3">
                {["Parse complex PDF", "Prepare answer sections", "Index secure workspace", "Ready for questions"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-300/10 text-xs font-bold text-teal-200">{index + 1}</span>
                      <span className="text-sm text-slate-200">{item}</span>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.03))] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Knowledge graph</p>
              <KnowledgeGraph compact />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KnowledgeGraph({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("relative mx-auto mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20", compact ? "h-56" : "h-[28rem] bg-slate-950")}>
      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 600 360" fill="none">
        <defs>
          <linearGradient id="graphLine" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#14b8a6" stopOpacity="0.1" />
            <stop offset="1" stopColor="#10b981" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {graphNodes.map((node, index) => (
          <motion.line
            key={node.label}
            x1="300"
            y1="180"
            x2={`${Number.parseInt(node.x, 10) * 6}`}
            y2={`${Number.parseInt(node.y, 10) * 3.6}`}
            stroke="url(#graphLine)"
            strokeWidth="1.2"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: index * 0.08 }}
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-[var(--accent-jade-100)] bg-teal-300/10 text-teal-100 shadow-[0_0_40px_rgba(20,184,166,0.3)]">
        <Sparkles size={26} />
      </div>
      {graphNodes.map((node) => (
        <div
          key={node.label}
          className="absolute rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] font-semibold text-slate-200 backdrop-blur"
          style={{ left: node.x, top: node.y }}
        >
          {node.label}
        </div>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 text-white sm:pt-32 lg:pt-36">
      <AmbientGrid />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--accent-jade-100)] bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(20,184,166,0.9)]" />
            Enterprise AI grounded in your documents
          </div>
          <h1 className="mt-7 text-4xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl lg:leading-[0.94]">
            Your Company Knowledge. AI-Powered Answers.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Stop wasting hours searching for policies. Rekall-IQ gives every team member a secure AI assistant that answers instantly from approved company documents.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-6 py-3.5 text-sm font-bold text-[var(--ink)] shadow-[0_0_38px_rgba(20,184,166,0.28)] transition hover:-translate-y-0.5 hover:bg-teal-200 sm:w-auto">
              Start Free
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/12 sm:w-auto">
              Book a 15-min call
              <ChevronRight size={16} />
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">No credit card required to start</p>
        </motion.div>
        <HeroDashboard />
        <div className="mx-auto mt-8 grid max-w-6xl divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur md:grid-cols-4 md:divide-x md:divide-y-0">
          {securityStats.map((stat) => (
            <div key={stat.label} className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">{stat.label}</p>
              <p className="mt-2 text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="bg-[var(--surface-2)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">The knowledge problem</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
            Your team should not have to hunt for approved answers.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--ink-soft)]">
            Rekall-IQ replaces scattered internal knowledge with one controlled AI workspace where documents, staff questions, and trusted answers finally connect.
          </p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {problems.map((problem, index) => (
            <motion.div key={problem} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-teal-200">
                <FileText size={18} />
              </div>
              <p className="text-sm leading-7 text-[var(--ink-soft)]">{problem}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="relative overflow-hidden bg-[var(--surface)] py-20 sm:py-28">
      <div id="how-it-works" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">AI workflow</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">Upload, ask, verify, improve.</h2>
          <p className="mt-5 text-base leading-8 text-[var(--ink-soft)]">A premium AI workflow that still feels simple enough for everyday teams.</p>
        </motion.div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((step, index) => (
            <motion.div key={step.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }} className="group relative rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[var(--accent-jade-100)]">
              <div className="absolute -right-3 top-10 hidden h-px w-6 bg-teal-200 lg:block" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-jade-50)] text-[var(--accent-jade)] ring-1 ring-[var(--accent-jade-100)]">
                <step.icon size={22} />
              </div>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{step.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section id="platform" className="relative overflow-hidden bg-[var(--brand-sidebar)] py-20 text-white sm:py-28">
      <div id="features" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">Platform capabilities</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Enterprise document intelligence, without the noise.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item, index) => (
            <motion.div key={item.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.035 }} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-[var(--accent-jade-100)] hover:bg-teal-300/[0.06]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent-jade-100)] bg-teal-300/10 text-teal-100">
                <item.icon size={19} />
              </div>
              <h3 className="mt-6 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseSection() {
  return (
    <section className="bg-[var(--surface-2)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">Dashboard showcase</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">A command center for company knowledge.</h2>
          <p className="mt-5 text-base leading-8 text-[var(--ink-soft)]">See uploads, processing states, sourced answers, analytics, and knowledge gaps in one premium workspace.</p>
        </motion.div>
        <motion.div {...reveal} className="mt-12 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_35px_100px_rgba(15,23,42,0.12)]">
          <div className="grid border-b border-[var(--line)] bg-slate-950 text-white lg:grid-cols-[16rem_1fr]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-200">Rekall-IQ workspace</p>
              <div className="mt-6 space-y-2">
                {["Chat", "Documents", "Analytics", "Users"].map((item, index) => (
                  <div key={item} className={cn("rounded-xl px-3 py-2 text-sm", index === 0 ? "bg-teal-300 text-[var(--ink)]" : "text-[var(--ink-muted)]")}>{item}</div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-[1fr_18rem] lg:p-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">AI answer</p>
                <h3 className="mt-4 text-xl font-semibold">Can staff access the customer data policy remotely?</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">Yes, staff can access the policy through approved company systems after completing security training and using workspace credentials.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {["Customer_Data_Policy.pdf", "Remote_Work_Guide.docx"].map((item) => (
                    <div key={item} className="rounded-2xl border border-[var(--accent-jade-100)] bg-teal-300/10 p-4 text-sm text-teal-100">{item}</div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Coverage</p>
                  <p className="mt-3 text-4xl font-semibold">92%</p>
                  <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-emerald-300" /></div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Processing</p>
                  <div className="mt-4 space-y-3">
                    {["Handbook.pdf", "SOP.xlsx", "Benefits.pptx"].map((item) => (
                      <div key={item} className="flex items-center justify-between text-sm text-slate-300">
                        <span>{item}</span>
                        <span className="text-emerald-300">Ready</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function KnowledgeGraphSection() {
  return (
    <section className="bg-[var(--brand-sidebar)] py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">AI knowledge graph</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Connect documents, departments, and workflows.</h2>
          <p className="mt-5 text-base leading-8 text-[var(--ink-muted)]">A topology-inspired knowledge layer that maps company policies, departments, procedures, and answers without turning Rekall-IQ into an infrastructure tool.</p>
        </motion.div>
        <motion.div {...reveal}>
          <KnowledgeGraph />
        </motion.div>
      </div>
    </section>
  );
}

function IndustriesSection() {
  return (
    <section id="industries" className="bg-[var(--surface)] py-20 sm:py-28">
      <div id="use-cases" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">Industries</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">Built for organisations with serious internal knowledge.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((item) => (
            <motion.div key={item.name} {...reveal} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[var(--accent-jade-100)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-teal-200">
                <item.icon size={19} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-[var(--ink)]">{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="bg-[var(--surface-2)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">Security and compliance</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">Trust-first AI for business knowledge.</h2>
          <p className="mt-5 text-base leading-8 text-[var(--ink-soft)]">Rekall-IQ is designed around workspace isolation, role-based access, private storage, and source-grounded answer behavior.</p>
        </motion.div>
        <div className="grid gap-4">
          {securityControls.map((item) => (
            <motion.div key={item.title} {...reveal} className="flex gap-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-jade-50)] text-[var(--accent-jade)]">
                <item.icon size={21} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.copy}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsPricingSection() {
  return (
    <section id="pricing" className="bg-[var(--surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">Why Rekall-IQ</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">Premium AI without losing control.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((item) => (
            <motion.div key={item.title} {...reveal} className="rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] p-6">
              <h3 className="text-base font-semibold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{item.copy}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricing.map((plan) => (
            <motion.div key={plan.name} {...reveal} className={cn("relative flex flex-col rounded-3xl border p-6 transition hover:-translate-y-1", plan.highlighted ? "border-[var(--accent-jade-100)] bg-slate-950 text-white shadow-[0_30px_90px_rgba(20,184,166,0.16)]" : "border-[var(--line)] bg-[var(--surface)]")}>
              {plan.badge ? (
                <span className="absolute -top-3 right-6 rounded-full bg-teal-300 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink)]">
                  {plan.badge}
                </span>
              ) : null}
              <p className={cn("text-sm font-semibold", plan.highlighted ? "text-teal-200" : "text-[var(--accent-jade)]")}>{plan.name}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <h3 className="text-3xl font-semibold tracking-tight">{plan.price}</h3>
                <span className={cn("text-xs", plan.highlighted ? "text-slate-400" : "text-[var(--ink-muted)]")}>{plan.period}</span>
              </div>
              <p className={cn("mt-3 text-sm leading-6", plan.highlighted ? "text-slate-300" : "text-[var(--ink-soft)]")}>{plan.copy}</p>

              <div className={cn("mt-5 space-y-1.5 rounded-2xl border p-4", plan.highlighted ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface-2)]")}>
                {plan.capacity.map((line) => (
                  <p key={line} className={cn("text-xs font-medium", plan.highlighted ? "text-slate-200" : "text-[var(--ink-soft)]")}>{line}</p>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm">
                    <Check size={16} className={cn("shrink-0", plan.highlighted ? "text-teal-200" : "text-emerald-300")} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href={plan.ctaHref}
                className={cn(
                  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
                  plan.highlighted
                    ? "bg-teal-300 text-[var(--ink)] hover:bg-teal-200"
                    : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
                )}
              >
                {plan.cta}
                <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl border border-[var(--line)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                  <th className="p-4 font-semibold text-[var(--ink-soft)] sm:p-5">Feature</th>
                  <th className="p-4 text-center font-semibold text-[var(--ink-soft)] sm:p-5">Essential</th>
                  <th className="p-4 text-center font-semibold text-[var(--accent-jade)] sm:p-5">Business</th>
                  <th className="p-4 text-center font-semibold text-[var(--ink-soft)] sm:p-5">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {[
                  ["Grounded chat with sources", "✓", "✓", "✓"],
                  ["Collections & document scoping", "✓", "✓", "✓"],
                  ["In-app file preview", "✓", "✓", "✓"],
                  ["Advanced parsing (LlamaParse)", "—", "✓", "✓"],
                  ["Analytics & usage metering", "—", "✓", "✓"],
                  ["Knowledge-gap tracking", "—", "✓", "✓"],
                  ["Answer-quality evaluations", "—", "✓", "✓"],
                  ["Custom limits & audit review", "—", "—", "✓"],
                  ["Priority support", "—", "—", "✓"],
                ].map(([feature, free, business, enterprise]) => (
                  <tr key={feature} className="transition hover:bg-[var(--surface-2)]">
                    <td className="p-4 font-medium text-[var(--ink-soft)] sm:p-5">{feature}</td>
                    <td className="p-4 text-center text-[var(--ink-muted)] sm:p-5">{free}</td>
                    <td className="p-4 text-center font-medium text-emerald-300 sm:p-5">{business}</td>
                    <td className="p-4 text-center text-[var(--ink-muted)] sm:p-5">{enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--brand-sidebar)] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.22),transparent_36%)]" />
      <motion.div {...reveal} className="relative mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur sm:p-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">Enterprise AI workspace for the future</p>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Give every team a safer way to ask company knowledge.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">Start with approved documents, invite your team, and bring source-grounded AI into daily work.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:bg-teal-200">
            Start Free
            <ArrowRight size={16} />
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12">
            Book a 15-min call
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--ink-muted)]">No credit card required. Free plan includes full workspace features.</p>
      </motion.div>
    </section>
  );
}

export function PremiumLandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--surface)] font-sans">
      <PremiumNavbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ProblemSection />
        <WorkflowSection />
        <CapabilitiesSection />
        <ShowcaseSection />
        <KnowledgeGraphSection />
        <IndustriesSection />
        <SecuritySection />
        <TestimonialsPricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
    </div>
  );
}
