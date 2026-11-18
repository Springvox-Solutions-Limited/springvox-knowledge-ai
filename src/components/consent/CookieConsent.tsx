"use client";

import Link from "next/link";
import { Check, Info, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/src/lib/utils";
import {
  detectGlobalPrivacyControl,
  readConsent,
  saveConsent,
  type ConsentChoices,
  type ConsentMethod,
  type CookieConsentRecord,
} from "./consent-store";

export const OPEN_COOKIE_PREFERENCES_EVENT = "rekall:open-cookie-preferences";

const SAVED_CONFIRMATION_MS = 8000;

/** Open the preference dialog from anywhere on the public site. */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
}

interface CookiePreferencesLinkProps {
  className?: string;
  children?: ReactNode;
}

/**
 * A button that reads as a text link, for the site footer and policy pages.
 */
export function CookiePreferencesLink({
  className,
  children = "Cookie preferences",
}: CookiePreferencesLinkProps) {
  return (
    <button
      type="button"
      data-cookie-preferences-link=""
      aria-haspopup="dialog"
      onClick={openCookiePreferences}
      className={cn(
        "inline-flex items-center rounded-[4px] text-left text-[12px] leading-5 text-[var(--ink-soft)] underline decoration-[var(--line)] decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--ink)] hover:decoration-[var(--accent-jade)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

function describeSavedChoice(record: CookieConsentRecord): string {
  if (record.analytics && record.marketing) {
    return "Optional analytics and marketing are on.";
  }

  if (record.analytics) {
    return "Analytics is on. Marketing is off.";
  }

  if (record.marketing) {
    return "Analytics is off. Marketing is on.";
  }

  return "Optional cookies are off.";
}

interface ConsentSwitchProps {
  checked: boolean;
  disabled?: boolean;
  labelledBy: string;
  describedBy: string;
  onToggle: (next: boolean) => void;
}

function ConsentSwitch({
  checked,
  disabled = false,
  labelledBy,
  describedBy,
  onToggle,
}: ConsentSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onToggle(!checked)}
      className={cn(
        "-m-2 inline-flex shrink-0 items-center rounded-full p-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-6 w-10 items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none",
          checked
            ? "border-[var(--accent-jade)] bg-[var(--accent-jade)]"
            : "border-[var(--line)] bg-[var(--surface-2)]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "block h-4 w-4 rounded-full transition-transform duration-150 motion-reduce:transition-none",
            checked
              ? "translate-x-5 bg-[#04100e]"
              : "translate-x-1 bg-[var(--ink-muted)]",
          )}
        />
      </span>
    </button>
  );
}

interface ConsentCategoryProps {
  title: string;
  titleId: string;
  descriptionId: string;
  description: string;
  note: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}

function ConsentCategory({
  title,
  titleId,
  descriptionId,
  description,
  note,
  checked,
  disabled = false,
  onToggle,
}: ConsentCategoryProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 sm:py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p
            id={titleId}
            className="text-[13px] font-medium leading-5 text-[var(--ink)]"
          >
            {title}
          </p>
          <span className="font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
            {note}
          </span>
        </div>
        <p
          id={descriptionId}
          className="mt-1 text-[12px] leading-[18px] text-[var(--ink-soft)]"
        >
          {description}
        </p>
      </div>

      <ConsentSwitch
        checked={checked}
        disabled={disabled}
        labelledBy={titleId}
        describedBy={descriptionId}
        onToggle={onToggle}
      />
    </div>
  );
}

type ConsentView = "hidden" | "banner" | "saved";

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ConsentView>("hidden");
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gpcDetected, setGpcDetected] = useState(false);
  const [prefs, setPrefs] = useState<ConsentChoices>({
    analytics: false,
    marketing: false,
  });
  const [savedRecord, setSavedRecord] = useState<CookieConsentRecord | null>(
    null,
  );
  const [persistenceFailed, setPersistenceFailed] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const focusSavedRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const baseId = useId();
  const bannerTitleId = `${baseId}-banner-title`;
  const bannerDescriptionId = `${baseId}-banner-description`;
  const bannerGpcId = `${baseId}-banner-gpc`;
  const dialogTitleId = `${baseId}-dialog-title`;
  const dialogDescriptionId = `${baseId}-dialog-description`;
  const analyticsTitleId = `${baseId}-analytics-title`;
  const analyticsDescriptionId = `${baseId}-analytics-description`;
  const marketingTitleId = `${baseId}-marketing-title`;
  const marketingDescriptionId = `${baseId}-marketing-description`;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      setView("hidden");
      setVisible(false);
    }, SAVED_CONFIRMATION_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    // Deferring past the first paint keeps server and client markup identical
    // and gives the entrance transition a frame to run from.
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      setGpcDetected(detectGlobalPrivacyControl());

      const stored = readConsent();
      if (stored) {
        setPrefs({
          analytics: stored.analytics,
          marketing: stored.marketing,
        });
        return;
      }

      setView("banner");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted || view !== "banner") {
      return;
    }

    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [mounted, view]);

  const openPreferences = useCallback(() => {
    if (dialogRef.current?.open) {
      return;
    }

    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement ? active : null;

    const stored = readConsent();
    setPrefs(
      stored
        ? { analytics: stored.analytics, marketing: stored.marketing }
        : { analytics: false, marketing: false },
    );
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    const onRequestOpen = () => openPreferences();
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onRequestOpen);
    return () =>
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, onRequestOpen);
  }, [openPreferences]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (dialogOpen && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Very old browsers can fail here; keep the panel reachable.
        dialog.setAttribute("open", "");
      }
    } else if (!dialogOpen && dialog.open) {
      dialog.close();
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const { body } = document;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [dialogOpen]);

  useEffect(() => {
    if (view !== "saved" || dialogOpen) {
      return;
    }

    let frame = 0;

    if (focusSavedRef.current) {
      focusSavedRef.current = false;
      frame = window.requestAnimationFrame(() => {
        savedRef.current?.focus({ preventScroll: true });
      });
    }

    scheduleHide();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      clearHideTimer();
    };
  }, [view, dialogOpen, scheduleHide, clearHideTimer]);

  const dismissSaved = useCallback(() => {
    const hadFocus = savedRef.current?.contains(document.activeElement) ?? false;

    clearHideTimer();
    setView("hidden");
    setVisible(false);

    if (hadFocus) {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>("[data-cookie-preferences-link]")
          ?.focus({ preventScroll: true });
      });
    }
  }, [clearHideTimer]);

  const persistChoice = useCallback(
    (choices: ConsentChoices, method: ConsentMethod) => {
      const result = saveConsent(choices, method);

      setSavedRecord(result.record);
      setPrefs({
        analytics: result.record.analytics,
        marketing: result.record.marketing,
      });
      setPersistenceFailed(!result.persisted);
      focusSavedRef.current = true;
      setDialogOpen(false);
      setView("saved");
      setVisible(true);
    },
    [],
  );

  const acceptAll = useCallback(() => {
    persistChoice({ analytics: true, marketing: true }, "accept_all");
  }, [persistChoice]);

  const rejectOptional = useCallback(() => {
    persistChoice({ analytics: false, marketing: false }, "reject_optional");
  }, [persistChoice]);

  const saveCustom = useCallback(() => {
    persistChoice(prefs, "custom");
  }, [persistChoice, prefs]);

  const closePreferences = useCallback(() => {
    const dialog = dialogRef.current;
    const opener = openerRef.current;

    if (dialog?.open) {
      dialog.close();
    }
    setDialogOpen(false);

    // The native dialog restores focus itself. When the opener was the
    // banner's manage link, closing removes that link from the DOM, so fall
    // back to the persistent footer control instead.
    window.requestAnimationFrame(() => {
      if (opener && opener.isConnected) {
        return;
      }

      document
        .querySelector<HTMLElement>("[data-cookie-preferences-link]")
        ?.focus({ preventScroll: true });
    });
  }, []);

  const keepFocusInDialog = useCallback(
    (event: ReactKeyboardEvent<HTMLDialogElement>) => {
      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    },
    [],
  );

  if (!mounted) {
    return null;
  }

  const showSaved = view === "saved" && savedRecord !== null;

  return (
    <>
      {view !== "hidden" && !dialogOpen ? (
        <div
          data-cookie-consent=""
          className={cn(
            "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] sm:inset-x-auto sm:left-6 sm:w-[420px]",
            "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
            visible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          {view === "banner" ? (
            <section
              aria-labelledby={bannerTitleId}
              aria-describedby={
                gpcDetected
                  ? `${bannerDescriptionId} ${bannerGpcId}`
                  : bannerDescriptionId
              }
              className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_rgba(0,0,0,0.32)] [@media(max-height:720px)]:p-3 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id={bannerTitleId}
                  className="text-[14px] font-medium leading-5 text-[var(--ink)] [@media(max-height:720px)]:text-[12px] [@media(max-height:720px)]:leading-4"
                >
                  Cookies on Rekall-IQ
                </h2>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={openPreferences}
                  className="-m-1 shrink-0 rounded-[4px] p-1 text-[12px] leading-4 text-[var(--ink-soft)] underline decoration-[var(--line)] decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--ink)] hover:decoration-[var(--accent-jade)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none [@media(max-height:720px)]:text-[11px]"
                >
                  Manage preferences
                </button>
              </div>

              <p
                id={bannerDescriptionId}
                className="mt-2 text-[12.5px] leading-5 text-[var(--ink-soft)] [@media(max-height:720px)]:mt-1.5 [@media(max-height:720px)]:text-[11.5px] [@media(max-height:720px)]:leading-4"
              >
                <span className="[@media(max-height:720px)]:hidden">
                  We use necessary cookies to run the site and remember this
                  choice. Optional analytics help us understand which pages are
                  useful. Nothing optional loads until you accept. We do not use
                  marketing cookies today.
                </span>
                <span className="hidden [@media(max-height:720px)]:inline">
                  {gpcDetected
                    ? "Necessary cookies run the site. Optional categories start off because Global Privacy Control is on."
                    : "Necessary cookies run the site. Optional analytics wait for your choice. No marketing cookies today."}
                </span>
              </p>

              {gpcDetected ? (
                <p
                  id={bannerGpcId}
                  className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-4 text-[var(--ink-muted)] [@media(max-height:720px)]:hidden"
                >
                  <Info
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="mt-px shrink-0"
                  />
                  Global Privacy Control detected. Optional categories start
                  off.
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2 [@media(max-height:720px)]:mt-3">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--accent-jade)] px-4 text-[13px] font-medium text-[#04100e] transition-colors duration-150 hover:bg-[var(--accent-jade-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none [@media(max-height:720px)]:h-9 [@media(max-height:720px)]:text-[12px]"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={rejectOptional}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--line)] bg-transparent px-4 text-[13px] font-medium text-[var(--ink)] transition-colors duration-150 hover:border-[var(--ink-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none [@media(max-height:720px)]:h-9 [@media(max-height:720px)]:text-[12px]"
                >
                  Reject optional
                </button>
              </div>
            </section>
          ) : null}

          {showSaved && savedRecord ? (
            <div
              ref={savedRef}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              tabIndex={-1}
              onMouseEnter={clearHideTimer}
              onMouseLeave={scheduleHide}
              onFocus={clearHideTimer}
              onBlur={scheduleHide}
              className="flex items-start gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_rgba(0,0,0,0.32)] outline-none sm:p-5"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--accent-jade)]"
              >
                <Check size={16} strokeWidth={1.5} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-5 text-[var(--ink)]">
                  {persistenceFailed
                    ? "Your choice applies to this visit"
                    : "Your choice was saved"}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-4 text-[var(--ink-muted)]">
                  {persistenceFailed
                    ? "This browser blocked local storage, so the choice will not be remembered."
                    : describeSavedChoice(savedRecord)}
                </p>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={openPreferences}
                  className="mt-2 inline-flex rounded-[4px] text-[11.5px] leading-4 text-[var(--ink-soft)] underline decoration-[var(--line)] decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--ink)] hover:decoration-[var(--accent-jade)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
                >
                  Change preferences
                </button>
              </div>

              <button
                type="button"
                aria-label="Dismiss cookie confirmation"
                onClick={dismissSaved}
                className="-m-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        id="cookie-preferences-dialog"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault();
          closePreferences();
        }}
        onKeyDown={keepFocusInDialog}
        onClose={() => setDialogOpen(false)}
        className="fixed inset-0 z-[100] m-0 h-full w-full max-w-none overflow-y-auto border-0 bg-transparent p-0 text-[var(--ink)] [&::backdrop]:bg-[rgba(4,8,7,0.72)]"
      >
        <div
          className="flex min-h-full items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePreferences();
            }
          }}
        >
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[540px] flex-col overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_40px_rgba(0,0,0,0.32)]">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] p-4 sm:p-6">
              <div>
                <h2
                  id={dialogTitleId}
                  className="text-[18px] font-medium leading-6 text-[var(--ink)]"
                >
                  Cookie preferences
                </h2>
                <p
                  id={dialogDescriptionId}
                  className="mt-1.5 text-[13px] leading-5 text-[var(--ink-soft)]"
                >
                  Choose whether optional cookies and similar storage may be
                  used. Necessary technologies stay on, and you can change this
                  at any time.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close cookie preferences"
                onClick={closePreferences}
                className="-m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--ink-muted)] transition-colors duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
              >
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6">
              {gpcDetected ? (
                <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5 sm:mt-4 sm:p-3">
                  <Info
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--ink-muted)]"
                  />
                  <p className="text-[12px] leading-[18px] text-[var(--ink-soft)]">
                    <span className="font-medium text-[var(--ink)]">
                      Global Privacy Control detected.
                    </span>{" "}
                    Optional categories start off and stay off unless you turn
                    them on.
                  </p>
                </div>
              ) : null}

              <div className="divide-y divide-[var(--line-soft)]">
                <ConsentCategory
                  title="Necessary"
                  titleId={`${baseId}-necessary-title`}
                  descriptionId={`${baseId}-necessary-description`}
                  description="Keeps the site working, keeps signed-in sessions secure where you have an account, and remembers this choice."
                  note="Always on"
                  checked
                  disabled
                  onToggle={() => undefined}
                />
                <ConsentCategory
                  title="Analytics"
                  titleId={analyticsTitleId}
                  descriptionId={analyticsDescriptionId}
                  description="Helps us understand which pages are useful. No analytics script is active on this site today; if one is added, it will load only after you allow it."
                  note="No script yet"
                  checked={prefs.analytics}
                  onToggle={(analytics) =>
                    setPrefs((current) => ({ ...current, analytics }))
                  }
                />
                <ConsentCategory
                  title="Marketing"
                  titleId={marketingTitleId}
                  descriptionId={marketingDescriptionId}
                  description="Measures campaigns or personalises advertising. No marketing script is active on this site today; if one is added, it will load only after you allow it."
                  note="No script yet"
                  checked={prefs.marketing}
                  onToggle={(marketing) =>
                    setPrefs((current) => ({ ...current, marketing }))
                  }
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <Link
                href="/privacy#cookies"
                onClick={closePreferences}
                className="inline-flex w-fit items-center text-[11.5px] leading-4 text-[var(--ink-muted)] underline decoration-[var(--line)] decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--ink)] hover:decoration-[var(--accent-jade)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
              >
                Cookies in our privacy policy
              </Link>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={closePreferences}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--line)] bg-transparent px-4 text-[13px] font-medium text-[var(--ink)] transition-colors duration-150 hover:border-[var(--ink-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCustom}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--accent-jade)] px-4 text-[13px] font-medium text-[#04100e] transition-colors duration-150 hover:bg-[var(--accent-jade-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] motion-reduce:transition-none"
                >
                  Save preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default CookieConsent;
