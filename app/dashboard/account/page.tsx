"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/src/lib/supabase";
import {
  getAccessToken,
  getCurrentUserProfile,
  getCurrentWorkspaceSettings,
} from "@/src/lib/auth-client";
import { getRoleLabel, type AnyAppRole } from "@/src/lib/workspace";
import { Input } from "@/components/ui/input";
import { validatePassword } from "@/src/lib/password-policy";
import { MfaSettings } from "@/src/components/account/MfaSettings";

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
    const policyError = validatePassword(password);
    if (policyError) {
      toast.error(policyError);
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

  if (loading || !info) {
    return (
      <div className="mx-auto w-full max-w-[840px] px-5 pb-24 pt-6 sm:px-8 sm:pt-8">
        <div className="h-6 w-32 rounded bg-[var(--surface)] opacity-60" />
        <div className="mt-5 h-24 rounded-[10px] bg-[var(--surface)] opacity-60" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[840px] px-5 pb-24 pt-6 sm:px-8 sm:pt-8 lg:pb-12">
      <header className="border-b border-[var(--line)] pb-5">
        <h1 className="text-[24px] font-medium leading-8 tracking-[-0.02em] text-[var(--ink)]">
          Account
        </h1>
        <p className="mt-1 text-[12px] leading-5 text-[var(--ink-muted)]">
          Your profile, workspace, and sign-in security.
        </p>
      </header>

      <section className="flex items-center gap-3 border-b border-[var(--line)] py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface-2)] text-[14px] font-medium text-[var(--ink)]">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[var(--ink)]">{displayName}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--ink-muted)]">
            <Mail size={11} className="shrink-0" />
            <span className="truncate">{info.email}</span>
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--line)] py-5">
        <h2 className="text-[13px] font-medium text-[var(--ink)]">Profile</h2>
        <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-muted)]">
          The name shown in this workspace.
        </p>
        <form onSubmit={saveName} className="mt-3.5 flex max-w-[420px] flex-col gap-2 sm:flex-row">
          <label htmlFor="display-name" className="sr-only">
            Display name
          </label>
          <Input
            id="display-name"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            maxLength={80}
            placeholder="Your name"
            className="h-9 rounded-[8px] border-[var(--line)] bg-[var(--canvas)] px-2.5 text-[13px]"
          />
          <button
            type="submit"
            disabled={savingName || !nameDraft.trim() || nameDraft.trim() === (info.fullName || "")}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-muted)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingName ? <Loader2 size={13} className="animate-spin motion-reduce:animate-none" /> : null}
            Save
          </button>
        </form>
      </section>

      <section className="border-b border-[var(--line)] py-5">
        <h2 className="text-[13px] font-medium text-[var(--ink)]">Workspace</h2>
        <dl className="mt-2 max-w-[420px] text-[12px]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-2">
            <dt className="text-[var(--ink-muted)]">Workspace</dt>
            <dd className="min-w-0 truncate text-[var(--ink-soft)]">{info.workspaceName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] py-2">
            <dt className="text-[var(--ink-muted)]">Role</dt>
            <dd className="text-[var(--ink-soft)]">{getRoleLabel(info.role)}</dd>
          </div>
        </dl>
      </section>

      <section className="border-b border-[var(--line)] py-5">
        <h2 className="text-[13px] font-medium text-[var(--ink)]">Password</h2>
        <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-muted)]">
          Use at least 10 characters with a letter and a number. You stay signed in on this device.
        </p>
        <form onSubmit={updatePassword} className="mt-3.5 grid max-w-[560px] gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-[11px] text-[var(--ink-muted)]">
              New password
            </label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-9 rounded-[8px] border-[var(--line)] bg-[var(--canvas)] px-2.5 text-[13px]"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-[11px] text-[var(--ink-muted)]">
              Confirm
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-9 rounded-[8px] border-[var(--line)] bg-[var(--canvas)] px-2.5 text-[13px]"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword || !password}
            className="mt-auto inline-flex h-9 items-center justify-center rounded-[8px] border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-muted)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingPassword ? <Loader2 size={13} className="animate-spin motion-reduce:animate-none" /> : null}
            Update
          </button>
        </form>
      </section>

      <MfaSettings />

      <section className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[13px] font-medium text-[var(--ink)]">Sign out</h2>
          <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-muted)]">
            End this session on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
        >
          {signingOut ? (
            <Loader2 size={13} className="animate-spin motion-reduce:animate-none" />
          ) : (
            <LogOut size={13} />
          )}
          Sign out
        </button>
      </section>
    </div>
  );
}
