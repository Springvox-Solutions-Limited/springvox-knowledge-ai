"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/src/lib/supabase";
import { getAccessToken, getCurrentUserProfile, getCurrentWorkspaceSettings } from "@/src/lib/auth-client";
import { getRoleLabel, type AnyAppRole } from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/src/components/ui/skeleton-card";

type AccountInfo = {
  email: string | null;
  fullName: string | null;
  role: AnyAppRole;
  workspaceName: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profile, workspace] = await Promise.all([
          getCurrentUserProfile(),
          getCurrentWorkspaceSettings(),
        ]);
        if (profile) {
          setInfo({
            email: profile.email,
            fullName: profile.full_name,
            role: profile.role,
            workspaceName: workspace?.name || "Workspace",
          });
          setNameDraft(profile.full_name || "");
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast.success("Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = nameDraft.trim();
    if (!next) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (next === (info?.fullName || "")) return;
    try {
      setSavingName(true);
      const token = await getAccessToken();
      if (!token) throw new Error("Your session has expired.");
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update your name.");
      setInfo((current) => (current ? { ...current, fullName: next } : current));
      toast.success("Name updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your name.");
    } finally {
      setSavingName(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = info?.fullName || info?.email?.split("@")[0] || "Your account";
  const initial = (info?.fullName || info?.email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="admin-page mx-auto w-full max-w-3xl">
      <AppPageHeader
        title="Account"
        subtitle="Your profile, workspace, and sign-in security."
      />

      {loading || !info ? (
        <SkeletonCard />
      ) : (
        <>
          {/* Identity */}
          <section className="admin-shell-card p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-jade)] text-lg font-bold text-[#04110e]">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-[var(--ink)]">{displayName}</p>
                <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-[var(--ink-muted)]">
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{info.email}</span>
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Role</dt>
                <dd className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
                  <ShieldCheck size={14} className="text-[var(--accent-jade)]" />
                  {getRoleLabel(info.role)}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Workspace</dt>
                <dd className="mt-1.5 truncate text-sm font-semibold text-[var(--ink)]">{info.workspaceName}</dd>
              </div>
            </dl>
          </section>

          {/* Profile */}
          <section className="admin-shell-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[var(--ink)]">Display name</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">The name shown to your workspace.</p>
            <form onSubmit={saveName} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="display-name" className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  Name
                </label>
                <Input
                  id="display-name"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="admin-input"
                  maxLength={80}
                  placeholder="Your name"
                />
              </div>
              <AppButton
                type="submit"
                disabled={savingName || !nameDraft.trim() || nameDraft.trim() === (info.fullName || "")}
                className="h-11 shrink-0"
              >
                {savingName ? <Loader2 size={15} className="animate-spin" /> : null}
                Save
              </AppButton>
            </form>
          </section>

          {/* Security */}
          <section className="admin-shell-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[var(--ink)]">Change password</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Use at least 8 characters.</p>
            <form onSubmit={updatePassword} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="admin-input"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  Confirm
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="admin-input"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
              <AppButton type="submit" disabled={savingPassword || !password} className="h-11 shrink-0">
                {savingPassword ? <Loader2 size={15} className="animate-spin" /> : null}
                Update
              </AppButton>
            </form>
          </section>

          {/* Sign out */}
          <section className="admin-shell-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Sign out</h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">End your session on this device.</p>
            </div>
            <AppButton tone="secondary" onClick={signOut} disabled={signingOut} className="shrink-0">
              {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              Sign out
            </AppButton>
          </section>
        </>
      )}
    </div>
  );
}
