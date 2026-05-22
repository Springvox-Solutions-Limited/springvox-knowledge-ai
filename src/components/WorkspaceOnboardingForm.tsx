"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import {
  getDefaultRouteForRole,
  getRoleLabel,
  type AnyAppRole,
} from "@/src/lib/workspace";
import { supabase } from "@/src/lib/supabase";
import { slugifyWorkspaceName } from "@/src/lib/onboarding";
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

export default function WorkspaceOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const [mode, setMode] = useState<"create" | "join">(
    inviteToken ? "join" : "create",
  );
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    message: string | null;
    available: boolean | null;
  }>({ checking: false, message: null, available: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(
    null,
  );

  const [companyName, setCompanyName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const stepLabels =
    mode === "join"
      ? ["Invitation", "Your details", "Access workspace"]
      : ["Company setup", "Admin account", "Launch workspace"];

  useEffect(() => {
    setMode(inviteToken ? "join" : "create");
  }, [inviteToken]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteDetails(null);
      return;
    }

    let cancelled = false;

    async function loadInvite() {
      try {
        const response = await fetch(`/api/invitations/${inviteToken}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid invite");
        }

        if (!cancelled) {
          setInviteDetails(data.invitation);
        }
      } catch (inviteError) {
        if (!cancelled) {
          setError(
            inviteError instanceof Error
              ? inviteError.message
              : "Invalid invite",
          );
        }
      }
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const createDisabled = useMemo(
    () => mode === "create" && slugStatus.available === false,
    [mode, slugStatus.available],
  );

  async function checkSlug(slug: string) {
    if (!slug) {
      setSlugStatus({ checking: false, message: null, available: null });
      return;
    }

    setSlugStatus({
      checking: true,
      message: "Checking slug...",
      available: null,
    });
    try {
      const response = await fetch(
        `/api/workspaces/check-slug?slug=${encodeURIComponent(slug)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        setSlugStatus({
          checking: false,
          message: data.error || "Slug unavailable",
          available: false,
        });
        return;
      }

      setSlugStatus({
        checking: false,
        message: data.available ? "Slug is available" : "Slug is already taken",
        available: data.available,
      });
    } catch {
      setSlugStatus({
        checking: false,
        message: "Unable to check slug right now",
        available: false,
      });
    }
  }

  async function handleCreateWorkspace(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      if (!response.ok) {
        throw new Error(data.error || "Unable to create workspace");
      }

      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInResult.error) {
        throw signInResult.error;
      }

      setSuccess("Workspace created. Redirecting to your dashboard...");
      const profile = await getCurrentUserProfile();
      router.push(
        profile ? getDefaultRouteForRole(profile.role) : "/dashboard",
      );
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create workspace",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinInvite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!inviteToken) {
        throw new Error("Invite token is missing");
      }

      const registerResponse = await fetch("/api/auth/register-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: inviteToken,
          fullName,
          password,
        }),
      });
      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.error || "Unable to create invite account",
        );
      }

      const signInResult = await supabase.auth.signInWithPassword({
        email: registerData.email,
        password,
      });

      if (signInResult.error) {
        throw signInResult.error;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const acceptResponse = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: inviteToken }),
      });
      const acceptData = await acceptResponse.json();

      if (!acceptResponse.ok) {
        throw new Error(acceptData.error || "Unable to accept invitation");
      }

      setSuccess("Invitation accepted. Redirecting to workspace chat...");
      const profile = await getCurrentUserProfile();
      router.push(
        profile ? getDefaultRouteForRole(profile.role) : "/dashboard/chat",
      );
      router.refresh();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to join workspace",
      );
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

      if (!token) {
        throw new Error("Invite token not found");
      }

      router.push(`/register?invite=${encodeURIComponent(token)}`);
    } catch {
      setError("Enter a valid invite link or token");
    }
  }

  return (
    <div className="public-card w-full max-w-5xl min-w-0 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Secure onboarding
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {mode === "join"
                ? "Join with invitation"
                : "Create your company workspace"}
            </h1>
            <p className="text-sm leading-7 text-slate-700">
              {mode === "join"
                ? "Create your account and join the workspace."
                : "Set up a secure workspace for your team to ask questions about company documents."}
            </p>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {stepLabels.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl border px-3 py-2.5",
                    index === 0
                      ? "border-cyan-200 bg-white shadow-sm"
                      : "border-slate-200 bg-white/80",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Step {index + 1}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("create");
                router.replace("/register");
              }}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === "create"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Create workspace
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                mode === "join"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Join with invite
            </button>
          </div>

          {mode === "create" ? (
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <FormSection
                step="Step 1"
                title="Company details"
                description="Set the organisation name your team will recognize."
              >
                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <Field label="Company Name">
                    <Input
                      value={companyName}
                      onChange={(event) => {
                        const nextCompany = event.target.value;
                        setCompanyName(nextCompany);
                        if (!workspaceSlug) {
                          setWorkspaceSlug(slugifyWorkspaceName(nextCompany));
                        }
                      }}
                      className="admin-input"
                      placeholder="Acme Corporation"
                      required
                    />
                  </Field>
                  <Field label="Workspace Slug">
                    <Input
                      value={workspaceSlug}
                      onChange={(event) => {
                        const nextSlug = slugifyWorkspaceName(
                          event.target.value,
                        );
                        setWorkspaceSlug(nextSlug);
                        void checkSlug(nextSlug);
                      }}
                      className="admin-input"
                      placeholder="acme-corp"
                      required
                    />
                  </Field>
                </div>
                {workspaceSlug && (
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs",
                      slugStatus.available
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : slugStatus.available === false
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    {slugStatus.message}
                  </div>
                )}
              </FormSection>

              <FormSection
                step="Step 2"
                title="Workspace admin"
                description="Create the first admin account for your company workspace."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name">
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="admin-input"
                      placeholder="Jane Doe"
                      required
                    />
                  </Field>
                  <Field label="Work Email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="admin-input"
                      placeholder="jane@company.com"
                      required
                    />
                  </Field>
                </div>
                <Field label="Password">
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="admin-input"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </Field>
              </FormSection>

              <FormSection
                step="Step 3"
                title="Optional company context"
                description="Add a little extra information now or update it later from settings."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Industry (Optional)">
                    <Input
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                      className="admin-input"
                      placeholder="Technology"
                    />
                  </Field>
                  <Field label="Website (Optional)">
                    <Input
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      className="admin-input"
                      placeholder="https://company.com"
                    />
                  </Field>
                </div>
              </FormSection>

              <AppButton
                type="submit"
                disabled={loading || createDisabled}
                className="flex w-full"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Building2 size={18} />
                )}
                Create company workspace
              </AppButton>
            </form>
          ) : (
            <form onSubmit={handleJoinInvite} className="space-y-5">
              <FormSection
                step="Step 1"
                title="Invitation details"
                description="Confirm the invited workspace and role before creating your account."
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {inviteDetails ? (
                    <div className="space-y-2">
                      <p className="wrap-anywhere font-semibold text-slate-950">
                        Joining {inviteDetails.workspace_name}
                      </p>
                      <p className="wrap-anywhere">
                        Invited email: {inviteDetails.email}
                      </p>
                      <p>
                        Role: {getRoleLabel(inviteDetails.role as AnyAppRole)}
                      </p>
                    </div>
                  ) : (
                    <p>
                      Have an invite link? Paste it below or open your invite
                      URL first.
                    </p>
                  )}
                </div>
              </FormSection>
              {!inviteToken && (
                <FormSection
                  step="Step 2"
                  title="Open your invitation"
                  description="Paste the invite link or token you received from your workspace admin."
                >
                  <div className="space-y-3">
                    <Field label="Invite Link or Token">
                      <Input
                        value={inviteLink}
                        onChange={(event) => setInviteLink(event.target.value)}
                        className="admin-input"
                        placeholder="https://app.example.com/invite/..."
                      />
                    </Field>
                    <AppButton
                      type="button"
                      onClick={handleInviteLinkSubmit}
                      tone="secondary"
                      className="w-full"
                    >
                      Continue with invite
                    </AppButton>
                  </div>
                </FormSection>
              )}
              {inviteToken && (
                <FormSection
                  step="Step 2"
                  title="Create your account"
                  description="Set the name and password you will use inside this workspace."
                >
                  <div className="space-y-4">
                    <Field label="Full Name">
                      <Input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="admin-input"
                        placeholder="Jane Doe"
                        required
                      />
                    </Field>
                    <Field label="Password">
                      <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="admin-input"
                        placeholder="Minimum 8 characters"
                        required
                      />
                    </Field>
                  </div>
                </FormSection>
              )}

              {inviteToken ? (
                <AppButton
                  type="submit"
                  disabled={loading || !inviteDetails}
                  className="flex w-full"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  Join with invitation
                </AppButton>
              ) : null}
            </form>
          )}

          {(error || success) && (
            <Alert
              className={`rounded-2xl ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <AlertDescription>{error || success}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
              {mode === "join" ? <Mail size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">
                {mode === "join" ? "Invitation overview" : "Setup summary"}
              </p>
              <p className="text-xs text-slate-500">
                {mode === "join"
                  ? "Stay inside the invited workspace."
                  : "Your first user becomes the workspace admin."}
              </p>
            </div>
          </div>

          {mode === "join" ? (
            <div className="space-y-3 text-sm text-slate-600">
              <ChecklistItem>
                Join your organisation's existing workspace with the role
                assigned in your invite.
              </ChecklistItem>
              <ChecklistItem>
                Your invite email stays linked to the account that accepts the
                invitation.
              </ChecklistItem>
              <ChecklistItem>
                After setup, you will land directly inside the invited
                workspace.
              </ChecklistItem>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              <ChecklistItem>
                After creation, you become the Workspace Admin for your company
                workspace.
              </ChecklistItem>
              <ChecklistItem>
                Your team can upload approved documents and ask questions from
                one shared knowledge base.
              </ChecklistItem>
              <ChecklistItem>
                You can invite more staff, manage access, and review analytics
                from the dashboard.
              </ChecklistItem>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  What you will see after setup
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  A clean workspace with documents, users, analytics, and chat
                  ready for your team.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-cyan-700 hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">
          {step}
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />
      <p>{children}</p>
    </div>
  );
}
