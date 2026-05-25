"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  AudioLines,
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

import { SpringVoxLogo } from "@/src/components/brand/SpringVoxLogo";
import { cn } from "@/src/lib/utils";

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
];

const securityStats = [
  { label: "Workspace isolation", value: "Tenant-scoped" },
  { label: "Answer policy", value: "Source-grounded" },
  { label: "Processing", value: "Background jobs" },
  { label: "Admin view", value: "Metadata only" },
];

const problems = [
  "Policies scattered across drives, inboxes, and old folders — costing 3+ hours/week in searching",
  "New hires asking the same onboarding questions repeatedly — slowing adoption by 30%",
  "Teams relying on memory instead of approved information — creating compliance risk",
  "Leaders unable to see which questions documents fail to answer — hidden knowledge gaps",
];

const workflow = [
  {
    title: "Upload approved documents",
    copy: "Admins add PDFs, DOCX, CSV, XLSX, PPTX, and TXT files to a private workspace library.",
    icon: LibraryBig,
  },
  {
    title: "Parse and prepare knowledge",
    copy: "SpringVox extracts readable text, prepares sections, and indexes them for secure retrieval.",
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
  { title: "Smart Document Parsing (supports all file types)", copy: "Retrieve answers from approved company documents in seconds.", icon: Search },
  { title: "Source citations", copy: "Show supporting files and sections beside each AI answer.", icon: FileText },
  { title: "Analytics", copy: "Track usage, coverage, unanswered questions, and team activity.", icon: BarChart3 },
  { title: "Speech-to-text", copy: "Let teams ask questions naturally with voice-enabled workflows.", icon: AudioLines },
  { title: "Never Wait for Processing (uploads happen instantly)", copy: "Keep uploads asynchronous with durable document processing.", icon: Database },
  { title: "Complete Workspace Privacy (your data never mixes)", copy: "Invite admins and staff into controlled company workspaces.", icon: Users },
  { title: "Multi-user workspaces", copy: "Invite admins and staff into controlled company workspaces.", icon: Users },
  { title: "Chat history", copy: "Keep recent chats organized so teams can continue context quickly.", icon: MessageSquareText },
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

const testimonials = [
  {
    quote: "SpringVox turns our approved documents into answers staff can trust. It feels controlled without feeling complicated.",
    name: "Maya O.",
    role: "Operations Director",
    metric: "Reduced onboarding time by 35%",
  },
  {
    quote: "The source-first experience is the difference. Our team can ask quickly and still verify where answers came from.",
    name: "Daniel K.",
    role: "Head of Compliance",
    metric: "100% compliance coverage on policy questions",
  },
  {
    quote: "It reduces repetitive onboarding questions and shows us exactly where our documentation needs improvement.",
    name: "Priya S.",
    role: "People Ops Lead",
    metric: "Handled 5000+ questions in first month",
  },
];

const pricing = [
  {
    name: "Pilot",
    price: "Free",
    copy: "Up to 500 questions/month",
    fullPrice: "Pilot — Free • Up to 500 questions/month",
    features: ["Workspace setup", "Document uploads", "Chat with sources", "Admin dashboard"],
    highlighted: false,
  },
  {
    name: "Business",
    price: "Starting at $299/month",
    copy: "Unlimited everything",
    fullPrice: "Business — Starting at $299/month • Unlimited everything",
    features: ["Everything in Pilot", "Advanced parsing", "Analytics", "Users and invitations", "Knowledge gaps"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom pricing",
    copy: "Dedicated support",
    fullPrice: "Enterprise — Custom pricing • Dedicated support",
    features: ["Platform admin controls", "Privacy reviews", "Custom workflows", "Priority support"],
    highlighted: false,
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
      const THREE = await import("three");
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 100);
      camera.position.z = 6;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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
        color: 0x22d3ee,
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

    mountScene();
    return () => cleanup();
  }, []);

  return <div ref={containerRef} aria-hidden className="absolute inset-0 opacity-70 mix-blend-screen" />;
}

function AmbientGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.26),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#07111f_0%,#081525_48%,#f8fafc_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute left-1/2 top-12 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-cyan-300/10 bg-cyan-300/5 blur-3xl" />
      <HeroParticleField />
      {Array.from({ length: 22 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-cyan-300/70 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
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
            ? "border-slate-200/70 bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
            : "border-white/65 bg-white/88 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl",
        )}
      >
        <Link href="/" className="flex min-w-0 items-center">
          <SpringVoxLogo
            variant="full"
            theme="light"
            imageClassName="h-9 w-auto max-w-[165px] object-contain"
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "text-sm font-medium transition",
                scrolled ? "text-slate-600 hover:text-slate-950" : "text-slate-700 hover:text-slate-950",
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
              scrolled ? "text-slate-700 hover:bg-slate-100" : "text-slate-700 hover:bg-white/70",
            )}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="hidden items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:bg-cyan-50 sm:inline-flex sm:px-5"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/60 lg:hidden"
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
          className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-white/92 p-2 shadow-[0_22px_55px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:hidden"
        >
          <div className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:bg-[#132744]"
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
      <div className="absolute -inset-5 rounded-[2.5rem] bg-cyan-400/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-slate-400 sm:flex">
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
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">Staff assistant</p>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] text-cyan-100">Workspace: Acme Health</span>
              </div>
              <div className="ml-auto max-w-xl rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.22)]">
                What does the onboarding policy say a new support hire should complete in week one?
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Answer</p>
                <p className="text-sm leading-6 text-slate-200">
                  New support hires should complete orientation, review the customer data policy, meet their team lead, and finish compliance training before handling live requests.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {["Employee_Handbook.pdf", "Support_Onboarding.docx"].map((source) => (
                    <div key={source} className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                        <FileText size={14} />
                        <span className="truncate">{source}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div className="h-full w-3/4 rounded-full bg-cyan-300" />
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Document pipeline</p>
              <div className="mt-4 space-y-3">
                {["Parse complex PDF", "Prepare answer sections", "Index secure workspace", "Ready for questions"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs font-bold text-cyan-200">{index + 1}</span>
                      <span className="text-sm text-slate-200">{item}</span>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.03))] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Knowledge graph</p>
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
            <stop stopColor="#22d3ee" stopOpacity="0.1" />
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
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
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
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
            Enterprise AI grounded in your documents
          </div>
          <h1 className="mt-7 text-4xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl lg:leading-[0.94]">
            Your Company Knowledge. AI-Powered Answers.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Upload your documents once. Let your entire team ask questions and get instant, source-grounded answers without hunting through folders or emails.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <Link href="/register" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_38px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto">
                Start Free
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <p className="text-xs text-slate-400">No credit card required • 7-day free trial</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link href="/get-started" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/12 sm:w-auto">
                Book Demo
                <ChevronRight size={16} />
              </Link>
              <p className="text-xs text-slate-400">15-min call with product expert</p>
            </div>
          </div>
        </motion.div>
        <HeroDashboard />
        <div className="mx-auto mt-8 grid max-w-6xl divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur md:grid-cols-4 md:divide-x md:divide-y-0">
          {securityStats.map((stat) => (
            <div key={stat.label} className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
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
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">The knowledge problem</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Your team should not have to hunt for approved answers.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            SpringVox replaces scattered internal knowledge with one controlled AI workspace where documents, staff questions, and trusted answers finally connect.
          </p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {problems.map((problem, index) => (
            <motion.div key={problem} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                <FileText size={18} />
              </div>
              <p className="text-sm leading-7 text-slate-600">{problem}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">AI workflow</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Upload, ask, verify, improve.</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">A premium AI workflow that still feels simple enough for everyday teams.</p>
        </motion.div>
        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          {workflow.map((step, index) => (
            <motion.div key={step.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-cyan-200">
              <div className="absolute -right-3 top-10 hidden h-px w-6 bg-cyan-200 lg:block" />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <step.icon size={22} />
              </div>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section id="platform" className="relative overflow-hidden bg-[#07111f] py-20 text-white sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Platform capabilities</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Enterprise document intelligence, without the noise.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item, index) => (
            <motion.div key={item.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.035 }} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <item.icon size={19} />
              </div>
              <h3 className="mt-6 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Dashboard showcase</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">A command center for company knowledge.</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">See uploads, processing states, sourced answers, analytics, and knowledge gaps in one premium workspace.</p>
        </motion.div>
        <motion.div {...reveal} className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_100px_rgba(15,23,42,0.12)]">
          <div className="grid border-b border-slate-200 bg-slate-950 text-white lg:grid-cols-[16rem_1fr]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">SpringVox workspace</p>
              <div className="mt-6 space-y-2">
                {["Chat", "Documents", "Analytics", "Users"].map((item, index) => (
                  <div key={item} className={cn("rounded-xl px-3 py-2 text-sm", index === 0 ? "bg-cyan-300 text-slate-950" : "text-slate-400")}>{item}</div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-[1fr_18rem] lg:p-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">AI answer</p>
                <h3 className="mt-4 text-xl font-semibold">Can staff access the customer data policy remotely?</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">Yes, staff can access the policy through approved company systems after completing security training and using workspace credentials.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {["Customer_Data_Policy.pdf", "Remote_Work_Guide.docx"].map((item) => (
                    <div key={item} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">{item}</div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Coverage</p>
                  <p className="mt-3 text-4xl font-semibold">92%</p>
                  <div className="mt-4 h-2 rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-emerald-300" /></div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Processing</p>
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
    <section className="bg-[#07111f] py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">AI knowledge graph</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Connect documents, departments, and workflows.</h2>
          <p className="mt-5 text-base leading-8 text-slate-400">A topology-inspired knowledge layer that maps company policies, departments, procedures, and answers without turning SpringVox into an infrastructure tool.</p>
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
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Industries</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Built for organisations with serious internal knowledge.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((item) => (
            <motion.div key={item.name} {...reveal} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-cyan-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
                <item.icon size={19} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-950">{item.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <motion.div {...reveal}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Security and compliance</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Trust-first AI for business knowledge.</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">SpringVox is designed around workspace isolation, role-based access, private storage, and source-grounded answer behavior.</p>
        </motion.div>
        <div className="grid gap-4">
          {securityControls.map((item) => (
            <motion.div key={item.title} {...reveal} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <item.icon size={21} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
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
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">What teams feel</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Premium AI without losing control.</h2>
        </motion.div>
        <div className="mt-8 flex justify-center">
          <p className="text-sm font-medium text-slate-600">Trusted by 200+ enterprise teams</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <motion.div key={item.name} {...reveal} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm leading-7 text-slate-700">"{item.quote}"</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-cyan-700">{item.metric}</p>
              <p className="mt-4 font-semibold text-slate-950">{item.name}</p>
              <p className="text-sm text-slate-500">{item.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCardsSection() {
  return (
    <section id="pricing" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Simple, transparent pricing.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {pricing.map((plan) => (
            <motion.div key={plan.name} {...reveal} className={cn("rounded-3xl border p-6 transition hover:-translate-y-1", plan.highlighted ? "border-cyan-300 bg-slate-950 text-white shadow-[0_30px_90px_rgba(34,211,238,0.16)]" : "border-slate-200 bg-white")}>
              <p className={cn("text-sm font-semibold", plan.highlighted ? "text-cyan-200" : "text-cyan-700")}>{plan.name}</p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{plan.price}</h3>
              <p className={cn("mt-1 text-xs leading-6", plan.highlighted ? "text-slate-400" : "text-slate-500")}>{plan.copy}</p>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm">
                    <Check size={16} className={plan.highlighted ? "text-cyan-200" : "text-emerald-600"} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">*Billed annually, save 20%</p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#07111f] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_36%)]" />
      <motion.div {...reveal} className="relative mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur sm:p-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Enterprise AI workspace for the future</p>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Give every team a safer way to ask company knowledge.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">Start with approved documents, invite your team, and bring source-grounded AI into daily work.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
            Start Free
            <ArrowRight size={16} />
          </Link>
          <Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12">
            Book Demo
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.05)] sm:p-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-950 sm:text-4xl">250+</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Enterprise Customers</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="hidden h-12 w-px bg-slate-200 lg:block" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-950 sm:text-4xl">5M+</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Questions Answered</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="hidden h-12 w-px bg-slate-200 lg:block" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-950 sm:text-4xl">98%</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Uptime</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="hidden h-12 w-px bg-slate-200 lg:block" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-950 sm:text-4xl">4.8/5</p>
              <p className="mt-2 text-sm font-medium text-slate-600">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "How is SpringVox different from ChatGPT or Claude?",
      answer: "SpringVox uses ONLY your approved documents — not the public internet. Your answers stay grounded in company sources with full citations. No hallucinations, no external data leakage.",
    },
    {
      question: "How long does document processing take?",
      answer: "Most documents process in 2-5 minutes. Large batches process in background while you continue working. You'll see processing status in your admin dashboard.",
    },
    {
      question: "Can I control what questions get answered?",
      answer: "Yes. Only documents you upload are used. Staff can only ask questions — they can't access, download, or modify documents. Admins control everything.",
    },
    {
      question: "Is my data stored securely?",
      answer: "Your data never leaves your private workspace. We use enterprise-grade encryption, role-based access, and SOC 2 compliance. Full details in our Security Overview.",
    },
    {
      question: "What file types do you support?",
      answer: "PDFs, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), CSV, TXT, and more via LlamaParse. No file size limits.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal} className="text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Frequently Asked Questions</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">Everything you need to know about SpringVox.</p>
        </motion.div>
        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => (
            <motion.div key={index} {...reveal} transition={{ ...reveal.transition, delay: index * 0.05 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-cyan-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-6 text-left hover:bg-slate-50"
              >
                <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
                <ChevronRight
                  size={20}
                  className={cn("shrink-0 text-slate-400 transition", openIndex === index && "rotate-90")}
                />
              </button>
              {openIndex === index && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <p className="text-sm leading-6 text-slate-600">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingComparisonTable() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-950">Feature</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-950">Pilot</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-950">Business</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-950">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                { label: "Documents", pilot: "10", business: "Unlimited", enterprise: "Unlimited" },
                { label: "Active Users", pilot: "3", business: "Unlimited", enterprise: "Unlimited" },
                { label: "Analytics", pilot: "Basic", business: "Advanced", enterprise: "Custom" },
                { label: "API Access", pilot: "—", business: "✓", enterprise: "✓" },
                { label: "Priority Support", pilot: "—", business: "✓", enterprise: "✓" },
                { label: "SLA Guarantee", pilot: "—", business: "99.5%", enterprise: "99.9%" },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-950">{row.label}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">{row.pilot}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">{row.business}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function PremiumLandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white font-sans">
      <PremiumNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <WorkflowSection />
        <CapabilitiesSection />
        <ShowcaseSection />
        <KnowledgeGraphSection />
        <IndustriesSection />
        <SecuritySection />
        <TestimonialsPricingSection />
        <StatsSection />
        <FAQSection />
        <PricingCardsSection />
        <PricingComparisonTable />
        <FinalCTA />
      </main>
    </div>
  );
}
