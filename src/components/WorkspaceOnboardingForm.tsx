"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { getDefaultRouteForRole, getRoleLabel, type AnyAppRole } from "@/src/lib/workspace";
import { supabase } from "@/src/lib/supabase";
import { isValidEmail, slugifyWorkspaceName } from "@/src/lib/onboarding";
import { validatePassword } from "@/src/lib/password-policy";
import { getCurrentUserProfile } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { AppButton } from "@/src/components/ui/app-button";

type InviteDetails = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  workspace_name: string;
  assistant_name: string;
};

type SlugStatus = {
  checking: boolean;
  message: string | null;
  available: boolean | null;
};

const inputClass =
  "h-10 rounded-md border-[var(--line)] bg-[var(--canvas)] px-3 text-[13px] text-[var(--ink)] shadow-none placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]";

export default function WorkspaceOnboardingForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";

  const [mode, setMode] = useState<"create" | "join">(inviteToken ? "join" : "create");
  const [step, setStep] = useState(0);
  const [joinStep, setJoinStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({
    checking: false,
    message: null,
    available: null,
  });

  const [companyName, setCompanyName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const createSteps = ["Workspace", "Your account", "Review"];
  const joinSteps = ["Invitation", "Your account"];
  const steps = mode === "join" ? joinSteps : createSteps;
  const currentStep = mode === "join" ? joinStep : step;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMode(inviteToken ? "join" : "create");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [inviteToken]);

  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;

    async function loadInvite() {
      try {
        const response = await fetch(`/api/invitations/${inviteToken}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Invalid invite");
        if (!cancelled) setInviteDetails(data.invitation);
      } catch (inviteError) {
        if (!cancelled) {
          setError(inviteError instanceof Error ? inviteError.message : "Invalid invite");
        }
      }
    }

    void loadInvite();
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  function switchMode(next: "create" | "join") {
    setMode(next);
    setStep(0);
    setJoinStep(0);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
    if (next === "create") router.replace("/register");
  }

  async function checkSlug(slug: string) {
    if (!slug) {
      setSlugStatus({ checking: false, message: null, available: null });
      return false;
    }

    setSlugStatus({ checking: true, message: "Checking availability…", available: null });

    try {
      const response = await fetch(`/api/workspaces/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();
      if (!response.ok) {
        setSlugStatus({ checking: false, message: data.error || "Slug unavailable", available: false });
        return false;
      }
      const available = Boolean(data.available);
      setSlugStatus({
        checking: false,
        message: available ? "Available" : "Already taken",
        available,
      });
      return available;
    } catch {
      setSlugStatus({ checking: false, message: "Could not check availability", available: false });
      return false;
    }
  }

  function validateCreateStep(current: number) {
    const nextErrors: Record<string, string> = {};

    if (current === 0) {
      if (!companyName.trim()) nextErrors.companyName = "Company name is required.";
      if (!workspaceSlug.trim()) nextErrors.workspaceSlug = "Workspace URL is required.";
    }

    if (current === 1) {
      if (!fullName.trim()) nextErrors.fullName = "Your name is required.";
      if (!isValidEmail(email.trim())) nextErrors.email = "Enter a valid work email.";
      const passwordError = validatePassword(password);
      if (passwordError) nextErrors.password = passwordError;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function continueCreate() {
    if (!validateCreateStep(step)) return;

    if (step === 0 && slugStatus.available !== true) {
      const available = await checkSlug(workspaceSlug);
      if (!available) {
        setFieldErrors({ workspaceSlug: "Choose an available workspace URL." });
        return;
      }
    }

    setError(null);
    setStep((current) => Math.min(current + 1, 2));
  }

  async function createWorkspace() {
    if (!validateCreateStep(0) || !validateCreateStep(1)) return;
    if (slugStatus.available === false) {
      setFieldErrors({ workspaceSlug: "Choose an available workspace URL." });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          slug: workspaceSlug,
          fullName,
          email,
          password,
          industry,
          website,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create workspace");

      if (data.requiresEmailVerification) {
        setSuccess("Workspace created. Check your email to verify your account before signing in.");
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      const signInResult = await supabase.auth.signInWithPassword({ email, password });
      if (signInResult.error) throw signInResult.error;

      const profile = await getCurrentUserProfile();
      router.push(profile ? getDefaultRouteForRole(profile.role) : "/dashboard");
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create workspace");
    } finally {
      setLoading(false);
    }
  }

  async function joinWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Your name is required.";
    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!inviteToken) throw new Error("Invite token is missing");

      const registerResponse = await fetch("/api/auth/register-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken, fullName, password }),
      });
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(registerData.error || "Unable to create invite account");

      const signInResult = await supabase.auth.signInWithPassword({
        email: registerData.email,
        password,
      });
      if (signInResult.error) throw signInResult.error;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Authentication session expired");

      const acceptResponse = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ token: inviteToken }),
      });
      const acceptData = await acceptResponse.json();
      if (!acceptResponse.ok) throw new Error(acceptData.error || "Unable to accept invitation");

      const profile = await getCurrentUserProfile();
      router.push(profile ? getDefaultRouteForRole(profile.role) : "/dashboard/chat");
      router.refresh();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to join workspace");
    } finally {
      setLoading(false);
    }
  }

  function handleInviteLinkSubmit() {
    const trimmed = inviteLink.trim();
    if (!trimmed) {
      setError("Paste your invite link or invite token");
      return;
    }
    try {
      const token = trimmed.includes("/invite/")
        ? trimmed.split("/invite/").pop()?.split(/[?#]/)[0]
        : trimmed;
      if (!token) throw new Error("Invite token not found");
      router.push(`/register?invite=${encodeURIComponent(token)}`);
    } catch {
      setError("Enter a valid invite link or token");
    }
  }

  const panel = (
    <div className="w-full">
      <div className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)]">
        <ShieldCheck size={13} className="text-[var(--accent-jade)]" />
        Secure workspace setup
      </div>
      <h1 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-[var(--ink)] sm:text-[32px]">
        {mode === "join" ? "Join your workspace" : "Create your workspace"}
      </h1>
      <p className="mt-1.5 max-w-[52ch] text-[13px] leading-6 text-[var(--ink-soft)]">
        {mode === "join"
          ? "Use your invitation to create an account in the workspace you were invited to."
          : "Set up the shared knowledge base your team will use. You can change most details later."}
      </p>

      {!inviteToken ? (
        <div className="mt-5 flex gap-1 border-b border-[var(--line)]">
          <button
            type="button"
            onClick={() => switchMode("create")}
            className={cn(
              "-mb-px border-b-2 px-1 pb-2 text-[12px] font-medium transition-colors",
              mode === "create" ? "border-[var(--accent-jade)] text-[var(--ink)]" : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            Create workspace
          </button>
          <button
            type="button"
            onClick={() => switchMode("join")}
            className={cn(
              "-mb-px ml-4 border-b-2 px-1 pb-2 text-[12px] font-medium transition-colors",
              mode === "join" ? "border-[var(--accent-jade)] text-[var(--ink)]" : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            Join with invite
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        <StepRail steps={steps} current={currentStep} />
      </div>

      <div className="mt-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        {mode === "create" ? (
          <>
            {step === 0 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[14px] font-medium text-[var(--ink)]">Workspace details</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">This is how your team will find the workspace.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <Field label="Company name" required error={fieldErrors.companyName}>
                    <Input
                      value={companyName}
                      onChange={(event) => {
                        const next = event.target.value;
                        setCompanyName(next);
                        if (!workspaceSlug) setWorkspaceSlug(slugifyWorkspaceName(next));
                      }}
                      className={inputClass}
                      placeholder="Acme Corporation"
                      autoFocus
                    />
                  </Field>
                  <Field label="Workspace URL" required error={fieldErrors.workspaceSlug}>
                    <div className="flex h-10 items-center rounded-md border border-[var(--line)] bg-[var(--canvas)] px-3 transition-colors focus-within:border-[var(--accent-jade)] focus-within:ring-2 focus-within:ring-[var(--accent-jade-100)]">
                      <span className="shrink-0 font-meta text-[11px] text-[var(--ink-muted)]">/</span>
                      <Input
                        value={workspaceSlug}
                        onChange={(event) => {
                          const nextSlug = slugifyWorkspaceName(event.target.value);
                          setWorkspaceSlug(nextSlug);
                          setSlugStatus({ checking: false, message: null, available: null });
                        }}
                        onBlur={() => void checkSlug(workspaceSlug)}
                        className="h-9 min-w-0 flex-1 border-0 bg-transparent pl-1.5 pr-0 shadow-none focus-visible:ring-0"
                        placeholder="acme-corp"
                        aria-describedby="workspace-url-hint"
                      />
                    </div>
                  </Field>
                </div>
                <p id="workspace-url-hint" className="text-[10px] leading-4 text-[var(--ink-muted)]">
                  Your team will open this workspace at <span className="font-meta text-[var(--ink-soft)]">/{workspaceSlug || "your-workspace"}</span>.
                </p>

                {workspaceSlug ? (
                  <div className={cn("flex items-center gap-1.5 text-[11px]", slugStatus.available === true ? "text-emerald-300" : slugStatus.available === false ? "text-red-300" : "text-[var(--ink-muted)]")}>
                    {slugStatus.checking ? <Loader2 size={12} className="animate-spin" /> : slugStatus.available === true ? <Check size={12} /> : null}
                    {slugStatus.message || "Checking availability…"}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Industry" optional>
                    <Input value={industry} onChange={(event) => setIndustry(event.target.value)} className={inputClass} placeholder="Technology" />
                  </Field>
                  <Field label="Website" optional>
                    <Input value={website} onChange={(event) => setWebsite(event.target.value)} className={inputClass} placeholder="https://company.com" />
                  </Field>
                </div>
              </div>
            ) : step === 1 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[14px] font-medium text-[var(--ink)]">Your admin account</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">This account becomes the first workspace admin.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required error={fieldErrors.fullName}>
                    <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} placeholder="Jane Doe" autoComplete="name" autoFocus />
                  </Field>
                  <Field label="Work email" required error={fieldErrors.email}>
                    <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="jane@company.com" autoComplete="email" />
                  </Field>
                </div>
                <Field label="Password" required error={fieldErrors.password}>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 10 characters" autoComplete="new-password" />
                </Field>
                <p className="flex items-start gap-1.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                  Use at least 10 characters with a letter and a number. We will send a verification email before you can sign in.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[14px] font-medium text-[var(--ink)]">Review and create</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Everything is ready. The workspace will start on the free beta plan.</p>
                </div>
                <dl className="divide-y divide-[var(--line-soft)] rounded-md border border-[var(--line)] bg-[var(--canvas)] px-3">
                  <ReviewRow label="Company" value={companyName} onEdit={() => setStep(0)} />
                  <ReviewRow label="Workspace" value={`/${workspaceSlug}`} onEdit={() => setStep(0)} />
                  <ReviewRow label="Admin" value={`${fullName} · ${email}`} onEdit={() => setStep(1)} />
                  {industry ? <ReviewRow label="Industry" value={industry} onEdit={() => setStep(0)} /> : null}
                  {website ? <ReviewRow label="Website" value={website} onEdit={() => setStep(0)} /> : null}
                </dl>
                <p className="text-[10px] leading-4 text-[var(--ink-muted)]">
                  By creating a workspace you agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => current - 1)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
              ) : <span />}
              {step < 2 ? (
                <AppButton type="button" onClick={() => void continueCreate()} disabled={slugStatus.checking} className="h-9 px-3 text-[12px]">
                  Continue
                  <ArrowRight size={13} />
                </AppButton>
              ) : (
                <AppButton type="button" onClick={() => void createWorkspace()} disabled={loading} className="h-9 px-3 text-[12px]">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
                  Create workspace
                </AppButton>
              )}
            </div>
          </>
        ) : (
          <>
            {joinStep === 0 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[14px] font-medium text-[var(--ink)]">Invitation</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Confirm the workspace and role before creating your account.</p>
                </div>
                {inviteDetails ? (
                  <div className="rounded-md border border-[var(--line)] bg-[var(--canvas)] p-3 text-[12px]">
                    <p className="font-medium text-[var(--ink)]">Joining {inviteDetails.workspace_name}</p>
                    <p className="mt-1 text-[var(--ink-soft)]">{inviteDetails.email}</p>
                    <p className="mt-1 text-[var(--ink-muted)]">Role: {getRoleLabel(inviteDetails.role as AnyAppRole)}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Field label="Invite link or token">
                      <Input value={inviteLink} onChange={(event) => setInviteLink(event.target.value)} className={inputClass} placeholder="Paste the invitation link" />
                    </Field>
                    <AppButton type="button" tone="secondary" onClick={handleInviteLinkSubmit} className="h-9 px-3 text-[12px]">
                      Continue with invite
                    </AppButton>
                  </div>
                )}
              </div>
            ) : (
              <form id="join-form" onSubmit={joinWorkspace} className="space-y-4">
                <div>
                  <h2 className="text-[14px] font-medium text-[var(--ink)]">Your account</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Set the name and password you will use in this workspace.</p>
                </div>
                <Field label="Full name" required error={fieldErrors.fullName}>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} placeholder="Jane Doe" autoComplete="name" autoFocus />
                </Field>
                <Field label="Password" required error={fieldErrors.password}>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 10 characters" autoComplete="new-password" />
                </Field>
              </form>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => (joinStep === 0 ? router.push("/login") : setJoinStep(0))}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
              >
                <ArrowLeft size={13} />
                {joinStep === 0 ? "Sign in" : "Back"}
              </button>
              {joinStep === 0 ? (
                <AppButton type="button" onClick={() => setJoinStep(1)} disabled={!inviteDetails} className="h-9 px-3 text-[12px]">
                  Continue
                  <ArrowRight size={13} />
                </AppButton>
              ) : (
                <AppButton type="submit" form="join-form" disabled={loading || !inviteDetails} className="h-9 px-3 text-[12px]">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Join workspace
                </AppButton>
              )}
            </div>
          </>
        )}
      </div>

      {(error || success) ? (
        <Alert className={cn("mt-3 rounded-md", error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300")}>
          <AlertDescription className="text-[12px]">{error || success}</AlertDescription>
        </Alert>
      ) : null}

      <p className="mt-5 text-[11px] text-[var(--ink-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent-jade)] hover:text-[var(--accent-jade-hover)]">Sign in</Link>
      </p>
    </div>
  );

  if (embedded) {
    return <div className="mx-auto w-full max-w-[560px] min-w-0">{panel}</div>;
  }

  return <div className="public-card w-full max-w-[640px] p-5 sm:p-7">{panel}</div>;
}

function StepRail({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Signup progress">
      {steps.map((label, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                complete || active
                  ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--accent-jade)]"
                  : "border-[var(--line)] text-[var(--ink-muted)]",
              )}
              aria-current={active ? "step" : undefined}
            >
              {complete ? <Check size={12} /> : index + 1}
            </span>
            <span className={cn("truncate text-[11px]", active ? "text-[var(--ink)]" : "text-[var(--ink-muted)]")}>{label}</span>
            {index < steps.length - 1 ? <span className="h-px flex-1 bg-[var(--line)]" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, children, required, optional, error }: { label: string; children: React.ReactNode; required?: boolean; optional?: boolean; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] font-medium text-[var(--ink-soft)]">
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
        {optional ? <span className="ml-1 text-[10px] font-normal text-[var(--ink-muted)]">Optional</span> : null}
      </span>
      {children}
      {error ? <span className="block text-[11px] text-red-300" role="alert">{error}</span> : null}
    </label>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[11px] text-[var(--ink-muted)]">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-right text-[12px] text-[var(--ink-soft)]">
        <span className="truncate">{value}</span>
        <button type="button" onClick={onEdit} className="shrink-0 text-[10px] text-[var(--accent-jade)] hover:text-[var(--accent-jade-hover)]">Edit</button>
      </dd>
    </div>
  );
}
