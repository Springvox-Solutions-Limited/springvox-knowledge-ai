"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";

import { getDefaultRouteForRole, getRoleLabel, type AnyAppRole } from "@/src/lib/workspace";
import { supabase } from "@/src/lib/supabase";
import { slugifyWorkspaceName } from "@/src/lib/onboarding";
import { getCurrentUserProfile } from "@/src/lib/auth-client";

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
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [inviteLink, setInviteLink] = useState("");

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
            inviteError instanceof Error ? inviteError.message : "Invalid invite",
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

    setSlugStatus({ checking: true, message: "Checking slug...", available: null });
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
      router.push(profile ? getDefaultRouteForRole(profile.role) : "/dashboard");
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
        throw new Error(registerData.error || "Unable to create invite account");
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
      router.push(profile ? getDefaultRouteForRole(profile.role) : "/dashboard/chat");
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
    <div className="public-card w-full max-w-3xl p-5 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Secure onboarding
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {mode === "join" ? "Join with invitation" : "Create your company workspace"}
            </h1>
            <p className="text-sm leading-7 text-slate-600">
              {mode === "join"
                ? "Create your account for an existing organisation and join the workspace from your invitation."
                : "Create a secure workspace for your team. Upload approved documents and invite staff to ask questions from your company documents."}
            </p>
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
              <Field label="Company Name">
                <input
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
                <input
                  value={workspaceSlug}
                  onChange={(event) => {
                    const nextSlug = slugifyWorkspaceName(event.target.value);
                    setWorkspaceSlug(nextSlug);
                    void checkSlug(nextSlug);
                  }}
                  className="admin-input"
                  placeholder="acme-corp"
                  required
                />
                {workspaceSlug && (
                  <p
                    className={`text-xs ${
                      slugStatus.available
                        ? "text-emerald-600"
                        : slugStatus.available === false
                          ? "text-red-600"
                          : "text-slate-400"
                    }`}
                  >
                    {slugStatus.message}
                  </p>
                )}
              </Field>
              <Field label="Full Name">
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="admin-input"
                  placeholder="Jane Doe"
                  required
                />
              </Field>
              <Field label="Work Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="admin-input"
                  placeholder="jane@company.com"
                  required
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="admin-input"
                  placeholder="Minimum 8 characters"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Industry (Optional)">
                  <input
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                    className="admin-input"
                    placeholder="Technology"
                  />
                </Field>
                <Field label="Website (Optional)">
                  <input
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    className="admin-input"
                    placeholder="https://company.com"
                  />
                </Field>
              </div>
              <button
                type="submit"
                disabled={loading || createDisabled}
                className="app-button-primary flex w-full py-4"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Building2 size={18} />}
                Create company workspace
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinInvite} className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {inviteDetails ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-950">
                      Joining {inviteDetails.workspace_name}
                    </p>
                    <p>Invited email: {inviteDetails.email}</p>
                    <p>Role: {getRoleLabel(inviteDetails.role as AnyAppRole)}</p>
                  </div>
                ) : (
                  <p>Have an invite link? Paste it below or open your invite URL first.</p>
                )}
              </div>
              {!inviteToken && (
                <div className="space-y-3">
                  <Field label="Invite Link or Token">
                    <input
                      value={inviteLink}
                      onChange={(event) => setInviteLink(event.target.value)}
                      className="admin-input"
                      placeholder="https://app.example.com/invite/..."
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={handleInviteLinkSubmit}
                    className="app-button-secondary w-full py-3"
                  >
                    Continue with invite
                  </button>
                </div>
              )}
              {inviteToken && (
                <>
                  <Field label="Full Name">
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="admin-input"
                      placeholder="Jane Doe"
                      required
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="admin-input"
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={loading || !inviteDetails}
                    className="app-button-primary flex w-full py-4"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                    Join with invitation
                  </button>
                </>
              )}
            </form>
          )}

          {(error || success) && (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {error || success}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
              {mode === "join" ? <Mail size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">
                {mode === "join" ? "Join with invitation" : "What happens next"}
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
              <p>Have an invite link? Join your organisation’s existing workspace.</p>
              <p>Your invite role controls what you can do after joining.</p>
              <p>Invited email must match the account that accepts the invitation.</p>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              <p>After creation you will become the company admin for that workspace.</p>
              <p>Default setup includes your company name, assistant name, and welcome message.</p>
              <p>From the dashboard you can upload your first document, invite users, and test Ask Questions.</p>
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-cyan-700 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
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
