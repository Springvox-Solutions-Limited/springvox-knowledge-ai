"use client";

import { useState } from "react";

const REASONS = ["Evaluate the product", "Pricing", "Security review", "Support"];
const SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; delivered: boolean }
  | { state: "error"; message: string };

const fieldClass =
  "mt-1.5 w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[15px] text-[var(--ink)] transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-jade)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]";

const labelClass = "block text-[13px] font-medium text-[var(--ink-soft)]";

function buildMailto(data: FormData) {
  const reason = String(data.get("reason") || "Website");
  const company = String(data.get("company") || "");
  const name = String(data.get("name") || "");
  const subject = `[Contact] ${reason} — ${company || name}`;
  const body = [
    `Name: ${name}`,
    `Email: ${String(data.get("email") || "")}`,
    `Company: ${company || "Not given"}`,
    `Team size: ${String(data.get("teamSize") || "Not given")}`,
    `Reason: ${reason}`,
    "",
    String(data.get("message") || ""),
  ].join("\n");
  return `mailto:hello@springvoxsl.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [fallbackHref, setFallbackHref] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const mailto = buildMailto(data);
    setStatus({ state: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          teamSize: data.get("teamSize"),
          reason: data.get("reason"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        delivered?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setFallbackHref(mailto);
        setStatus({
          state: "error",
          message:
            payload.error ??
            "That did not send. Email hello@springvoxsl.com and we will pick it up.",
        });
        return;
      }

      form.reset();
      setFallbackHref(payload.delivered ? null : mailto);
      setStatus({ state: "sent", delivered: Boolean(payload.delivered) });
    } catch {
      setFallbackHref(mailto);
      setStatus({
        state: "error",
        message:
          "That did not send. Check your connection, or email hello@springvoxsl.com.",
      });
    }
  }

  if (status.state === "sent") {
    return (
      <div
        role="status"
        className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-6"
      >
        <h2 className="font-display text-[24px] leading-8 text-[var(--ink)]">
          Message received
        </h2>
        {status.delivered ? (
          <p className="mt-3 max-w-[52ch] text-[15px] leading-7 text-[var(--ink-soft)]">
            It is in the inbox now. We reply from a real address.
          </p>
        ) : (
          <p className="mt-3 max-w-[52ch] text-[15px] leading-7 text-[var(--ink-soft)]">
            The form is not connected to a mail provider on this deployment yet. Send the
            same details to{" "}
            <a
              href="mailto:hello@springvoxsl.com"
              className="text-[var(--accent-jade)] underline underline-offset-4"
            >
              hello@springvoxsl.com
            </a>{" "}
            and we will pick it up.
          </p>
        )}
        {!status.delivered && fallbackHref ? (
          <a
            href={fallbackHref}
            className="mt-4 inline-flex rounded-[8px] border border-[var(--line)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink-muted)]"
          >
            Open this message in your email app
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            maxLength={100}
            className={fieldClass}
            placeholder="Ada Okonkwo"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            className={fieldClass}
            placeholder="ada@company.com"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <input
            id="company"
            name="company"
            required
            autoComplete="organization"
            maxLength={120}
            className={fieldClass}
            placeholder="Company name"
          />
        </div>
        <div>
          <label htmlFor="teamSize" className={labelClass}>
            Team size
          </label>
          <select
            id="teamSize"
            name="teamSize"
            required
            defaultValue=""
            className={fieldClass}
          >
            <option value="" disabled>
              Select a range
            </option>
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="reason" className={labelClass}>
          What do you need
        </label>
        <select id="reason" name="reason" required defaultValue="Evaluate the product" className={fieldClass}>
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={4000}
          className={fieldClass}
          placeholder="What should your team be able to find, and which documents would it come from?"
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-[12px] leading-5 text-[var(--ink-muted)]">
        We use these details to answer your message. See the{" "}
        <a
          href="/privacy"
          className="text-[var(--accent-jade)] underline underline-offset-4"
        >
          privacy policy
        </a>
        .
      </p>

      {status.state === "error" ? (
        <div role="alert">
          <p className="text-[13px] leading-6 text-red-300">{status.message}</p>
          {fallbackHref ? (
            <a
              href={fallbackHref}
              className="mt-3 inline-flex rounded-[8px] border border-[var(--line)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink-muted)]"
            >
              Send these details by email instead
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status.state === "sending"}
          className="inline-flex rounded-[10px] bg-[var(--accent-jade)] px-5 py-3 text-[15px] font-medium text-[#04110e] transition-colors hover:bg-[var(--accent-jade-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status.state === "sending" ? "Sending" : "Send message"}
        </button>
        <span aria-live="polite" className="font-meta text-[11px] text-[var(--ink-muted)]">
          {status.state === "sending" ? "Sending your message" : ""}
        </span>
      </div>
    </form>
  );
}
