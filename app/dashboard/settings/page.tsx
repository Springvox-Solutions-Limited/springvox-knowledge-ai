"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import {
  isWorkspaceAdminRole,
  type UserProfile,
  type WorkspaceSettings,
} from "@/src/lib/workspace";
import { cn } from "@/src/lib/utils";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";

const EMPTY_SETTINGS: WorkspaceSettings = {
  id: "",
  name: "",
  slug: "",
  status: "active",
  plan: "pilot",
  logo_url: "",
  primary_color: "#14B8A6",
  welcome_message: "",
  assistant_name: "",
  support_email: "",
  industry: "",
  website: "",
  updated_at: null,
};

const fieldClassName =
  "h-9 rounded-[8px] border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[13px] text-[var(--ink)] transition-colors placeholder:text-[var(--ink-muted)] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)] focus-visible:ring-offset-0";

const DEFAULT_WELCOME = "Ask questions from your approved company documents.";

function getContrastText(hex: string): string {
  const value = (hex || "").replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#04110e" : "#ffffff";
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || !isWorkspaceAdminRole(currentProfile.role)) {
        router.replace("/dashboard");
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/workspace/settings", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setError("Failed to load workspace settings");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSettings(data.workspace);
      setLoading(false);
    }

    loadSettings();
  }, [router]);

  const handleChange = (field: keyof WorkspaceSettings, value: string) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/workspace/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save workspace settings");
      }

      setSettings(data.workspace);
      setMessage("Workspace settings updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save workspace settings",
      );
    } finally {
      setSaving(false);
    }
  };

  if (profile && !isWorkspaceAdminRole(profile.role)) {
    return null;
  }

  const accent = settings.primary_color || "#14B8A6";
  const previewName = settings.name?.trim() || "Workspace name";
  const previewInitial = (settings.name?.trim() || "W").slice(0, 1).toUpperCase();

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Company settings"
        subtitle="Workspace identity, branding, and assistant defaults."
      />

      {loading ? (
        <div className="admin-shell-card flex items-center gap-2.5 px-4 py-4 text-[12px] text-[var(--ink-muted)]">
          <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />
          Loading workspace settings
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="admin-shell-card min-w-0 overflow-hidden">
              <Section
                title="Workspace"
                description="Name, identifier, and contact details used across the product."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Workspace name" htmlFor="workspace-name">
                    <Input
                      id="workspace-name"
                      value={settings.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={fieldClassName}
                      placeholder="Acme Corp"
                    />
                  </Field>
                  <Field
                    label="System identifier"
                    htmlFor="workspace-slug"
                    hint="Fixed after onboarding."
                  >
                    <Input
                      id="workspace-slug"
                      value={settings.slug || ""}
                      disabled
                      className={cn(
                        fieldClassName,
                        "border-dashed bg-[var(--surface-2)] text-[var(--ink-muted)] disabled:opacity-100",
                      )}
                    />
                  </Field>
                  <Field label="Industry" htmlFor="workspace-industry">
                    <Input
                      id="workspace-industry"
                      value={settings.industry || ""}
                      onChange={(e) => handleChange("industry", e.target.value)}
                      className={fieldClassName}
                      placeholder="Technology"
                    />
                  </Field>
                  <Field
                    label="Website"
                    htmlFor="workspace-website"
                    hint="Include the protocol, for example https://."
                  >
                    <Input
                      id="workspace-website"
                      value={settings.website || ""}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className={fieldClassName}
                      placeholder="https://company.com"
                    />
                  </Field>
                  <Field
                    label="Support email"
                    htmlFor="workspace-support-email"
                    hint="Shown where users ask for help."
                  >
                    <Input
                      id="workspace-support-email"
                      value={settings.support_email || ""}
                      onChange={(e) =>
                        handleChange("support_email", e.target.value)
                      }
                      className={fieldClassName}
                      placeholder="admin@company.com"
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title="Branding"
                description="The mark and accent used for this workspace."
                className="border-t border-[var(--line)]"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Logo URL"
                    htmlFor="workspace-logo"
                    hint="A square PNG or SVG works best."
                  >
                    <Input
                      id="workspace-logo"
                      value={settings.logo_url || ""}
                      onChange={(e) => handleChange("logo_url", e.target.value)}
                      className={fieldClassName}
                      placeholder="https://assets.company.com/logo.png"
                    />
                  </Field>
                  <Field
                    label="Primary color"
                    htmlFor="workspace-color"
                    hint="Hex value used for the workspace mark."
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-9 w-9 shrink-0 rounded-[8px] border border-[var(--line)]"
                        style={{ backgroundColor: accent }}
                      />
                      <Input
                        id="workspace-color"
                        value={settings.primary_color || ""}
                        onChange={(e) =>
                          handleChange("primary_color", e.target.value)
                        }
                        className={cn(fieldClassName, "flex-1")}
                        placeholder="#14B8A6"
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section
                title="Assistant"
                description="How the assistant introduces itself across the workspace."
                className="border-t border-[var(--line)]"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Assistant name"
                    htmlFor="workspace-assistant"
                    hint="Used in greetings and answer labels."
                  >
                    <Input
                      id="workspace-assistant"
                      value={settings.assistant_name || ""}
                      onChange={(e) =>
                        handleChange("assistant_name", e.target.value)
                      }
                      className={fieldClassName}
                      placeholder="Rekall-IQ AI"
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field
                    label="Welcome message"
                    htmlFor="workspace-welcome"
                    hint="Shown above the ask composer."
                  >
                    <Textarea
                      id="workspace-welcome"
                      rows={4}
                      value={settings.welcome_message || ""}
                      onChange={(e) =>
                        handleChange("welcome_message", e.target.value)
                      }
                      className={cn(
                        fieldClassName,
                        "h-auto min-h-24 resize-y py-2 leading-5",
                      )}
                      placeholder="Describe how the assistant should greet users..."
                    />
                  </Field>
                </div>
              </Section>
            </div>

            <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
              <div className="admin-shell-card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                  <h2 className="text-[12px] font-medium text-[var(--ink)]">
                    Preview
                  </h2>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    Live
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2.5">
                    {settings.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.logo_url}
                        alt={settings.name || "Workspace logo"}
                        className="h-9 w-9 shrink-0 rounded-[8px] border border-[var(--line)] object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-medium"
                        style={{
                          backgroundColor: accent,
                          color: getContrastText(accent),
                        }}
                      >
                        {previewInitial}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[var(--ink)]">
                        {previewName}
                      </p>
                      <p className="truncate text-[11px] text-[var(--ink-muted)]">
                        {settings.assistant_name || "Assistant name"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[8px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3">
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Welcome message
                    </p>
                    <p className="mt-1.5 text-[12px] leading-5 text-[var(--ink-soft)]">
                      {settings.welcome_message || DEFAULT_WELCOME}
                    </p>
                  </div>

                  <dl className="mt-4 divide-y divide-[var(--line-soft)] border-t border-[var(--line)] text-[12px]">
                    <PreviewRow
                      label="Support"
                      value={settings.support_email || "Not set"}
                    />
                    <PreviewRow
                      label="Sector"
                      value={settings.industry || "Not set"}
                    />
                    <PreviewRow
                      label="Website"
                      value={settings.website || "Not set"}
                    />
                  </dl>
                </div>
              </div>
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] py-3 sm:flex-row sm:items-center sm:justify-between lg:sticky lg:bottom-0 lg:z-10 lg:bg-[var(--canvas)]">
            <p
              role={error ? "alert" : message ? "status" : undefined}
              className={cn(
                "text-[12px] leading-5",
                error
                  ? "text-red-300"
                  : message
                    ? "text-emerald-300"
                    : "text-[var(--ink-muted)]",
              )}
            >
              {error || message || "Changes apply to every session after saving."}
            </p>
            <AppButton
              type="submit"
              disabled={saving}
              className="h-9 shrink-0 px-3 text-[12px]"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "Saving..." : "Save changes"}
            </AppButton>
          </div>
        </form>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("p-4 sm:p-5", className)}>
      <div className="mb-4">
        <h2 className="text-[13px] font-semibold text-[var(--ink)]">{title}</h2>
        <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[12px] font-medium text-[var(--ink-soft)]"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-[11px] leading-4 text-[var(--ink-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-[var(--ink-muted)]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[var(--ink-soft)]">
        {value}
      </dd>
    </div>
  );
}
