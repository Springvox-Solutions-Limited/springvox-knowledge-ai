/**
 * Cookie consent persistence.
 *
 * The public site has no analytics or marketing scripts today, but the
 * record is written in the shape future loaders should read before they
 * inject anything optional. Browser-only: never call these helpers during
 * render or on the server.
 */

export const CONSENT_STORAGE_KEY = 'rekall_cookie_consent_v1';
export const CONSENT_VERSION = 1 as const;

export type ConsentMethod = 'accept_all' | 'reject_optional' | 'custom';

export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord extends ConsentChoices {
  version: typeof CONSENT_VERSION;
  necessary: true;
  updatedAt: string;
  method: ConsentMethod;
}

export interface SaveConsentResult {
  record: CookieConsentRecord;
  /** False when the browser blocks storage, for example in some private modes. */
  persisted: boolean;
}

const CONSENT_METHODS: readonly ConsentMethod[] = [
  'accept_all',
  'reject_optional',
  'custom',
];

function isConsentMethod(value: unknown): value is ConsentMethod {
  return (
    typeof value === 'string' &&
    (CONSENT_METHODS as readonly string[]).includes(value)
  );
}

function isConsentRecord(value: unknown): value is CookieConsentRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === CONSENT_VERSION &&
    record.necessary === true &&
    typeof record.analytics === 'boolean' &&
    typeof record.marketing === 'boolean' &&
    typeof record.updatedAt === 'string' &&
    Number.isFinite(Date.parse(record.updatedAt)) &&
    isConsentMethod(record.method)
  );
}

/**
 * Read the saved choice. Returns null for missing, malformed, or older
 * records, so an outdated schema can never silently opt someone in.
 */
export function readConsent(): CookieConsentRecord | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isConsentRecord(parsed)) {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist a choice. The returned record is always safe to hold in memory,
 * even when the browser refuses to store it.
 */
export function saveConsent(
  choices: ConsentChoices,
  method: ConsentMethod,
): SaveConsentResult {
  const record: CookieConsentRecord = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: Boolean(choices.analytics),
    marketing: Boolean(choices.marketing),
    updatedAt: new Date().toISOString(),
    method,
  };

  let persisted = false;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      persisted = true;
    } catch {
      persisted = false;
    }
  }

  return { record, persisted };
}

/** Remove the saved choice. Useful for support flows and tests. */
export function clearConsent(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Nothing to do when storage is unavailable.
  }
}

interface NavigatorWithGlobalPrivacyControl extends Navigator {
  globalPrivacyControl?: boolean;
}

/**
 * Global Privacy Control is a browser signal, not a cookie. Absence of the
 * property is treated as false.
 */
export function detectGlobalPrivacyControl(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return (
    (navigator as NavigatorWithGlobalPrivacyControl).globalPrivacyControl === true
  );
}
