"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";

import { AppButton } from "@/src/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/src/lib/supabase";

type FactorRow = {
  id: string;
  friendly_name?: string | null;
  status: string;
  factor_type: string;
};

export function MfaSettings() {
  const [factors, setFactors] = useState<FactorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFactors() {
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      setFactors((data?.totp ?? []) as FactorRow[]);
    } catch (listError) {
      setError(listError instanceof Error ? listError.message : "Could not load two-factor settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadFactors();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function startEnrollment() {
    setStarting(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Rekall-IQ",
      });
      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : "Could not start two-factor setup.");
    } finally {
      setStarting(false);
    }
  }

  async function verifyEnrollment() {
    if (!factorId || code.trim().length < 6) return;
    setVerifying(true);
    setError(null);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setCode("");
      setMessage("Two-factor authentication is enabled.");
      await loadFactors();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "That code did not work.");
    } finally {
      setVerifying(false);
    }
  }

  async function removeFactor(id: string) {
    if (!window.confirm("Remove two-factor authentication from this account?")) return;
    setRemoving(id);
    setError(null);
    try {
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (removeError) throw removeError;
      setMessage("Two-factor authentication removed.");
      await loadFactors();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove two-factor authentication.");
    } finally {
      setRemoving(null);
    }
  }

  const verified = factors.filter((factor) => factor.status === "verified");

  return (
    <section className="border-b border-[var(--line)] py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)]">
            <ShieldCheck size={14} className="text-[var(--ink-muted)]" />
            Two-factor authentication
          </h2>
          <p className="mt-0.5 max-w-[54ch] text-[12px] leading-5 text-[var(--ink-muted)]">
            Require a code from your authenticator app when signing in.
          </p>
        </div>
        {!qrCode ? (
          <AppButton
            type="button"
            tone={verified.length ? "secondary" : "primary"}
            onClick={() => void startEnrollment()}
            disabled={starting}
            className="h-8 shrink-0 px-2.5 text-[11px]"
          >
            {starting ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
            {verified.length ? "Add another" : "Enable"}
          </AppButton>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-3 text-[12px] text-[var(--ink-muted)]">Checking factors…</p>
      ) : qrCode ? (
        <div className="mt-4 flex flex-col gap-4 rounded-[10px] border border-[var(--line)] bg-[var(--canvas)] p-4 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Authenticator QR code" className="h-36 w-36 shrink-0 rounded-md bg-white p-2" />
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[var(--ink)]">Scan this with your authenticator app</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--ink-muted)]">
              If you cannot scan, enter this secret manually:
            </p>
            <code className="mt-1 block break-all rounded-md bg-[var(--surface)] px-2 py-1 font-mono text-[10px] text-[var(--ink-soft)]">{secret}</code>
            <div className="mt-3 flex max-w-[220px] gap-2">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                aria-label="Six-digit authenticator code"
                className="h-9 rounded-md border-[var(--line)] bg-[var(--surface)] text-[13px] tracking-[0.2em]"
              />
              <AppButton type="button" onClick={() => void verifyEnrollment()} disabled={verifying || code.length < 6} className="h-9 px-3 text-[12px]">
                {verifying ? <Loader2 size={13} className="animate-spin" /> : null}
                Verify
              </AppButton>
            </div>
          </div>
        </div>
      ) : verified.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {verified.map((factor) => (
            <div key={factor.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] px-2.5 py-2">
              <span className="text-[12px] text-[var(--ink-soft)]">{factor.friendly_name || "Authenticator app"}</span>
              <button
                type="button"
                onClick={() => void removeFactor(factor.id)}
                disabled={removing === factor.id}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-muted)] hover:text-red-300 disabled:opacity-40"
              >
                {removing === factor.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-[11px] text-emerald-300">{message}</p> : null}
      {error ? <p role="alert" className="mt-3 text-[11px] text-red-300">{error}</p> : null}
    </section>
  );
}
