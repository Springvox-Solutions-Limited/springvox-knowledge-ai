"use client";

import { useEffect, useState } from 'react';
import { Loader2, Save, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { isAdminRole, type UserProfile, type WorkspaceSettings } from '@/src/lib/workspace';

const EMPTY_SETTINGS: WorkspaceSettings = {
  id: '',
  name: '',
  slug: '',
  logo_url: '',
  primary_color: '#FF6B00',
  welcome_message: '',
  assistant_name: '',
  support_email: '',
  industry: '',
  website: '',
  updated_at: null,
};

const fieldClassName =
  'w-full rounded-xl border border-[#2D3039] bg-[#101217] px-4 py-3 text-sm text-[#E2E8F0] focus:border-accent/50 focus:outline-none';

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

      if (!currentProfile || !isAdminRole(currentProfile.role)) {
        router.replace('/dashboard');
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/workspace/settings', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setError('Failed to load workspace settings');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSettings(data.workspace);
      setLoading(false);
    }

    loadSettings();
  }, []);

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
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save workspace settings');
      }

      setSettings(data.workspace);
      setMessage('Workspace settings updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save workspace settings');
    } finally {
      setSaving(false);
    }
  };

  if (profile && !isAdminRole(profile.role)) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Company Branding</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">Workspace Settings</h1>
        <p className="text-sm text-slate-500">
          Configure how your workspace and assistant appear to users.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-[#2D3039] bg-[#15171C] px-6 py-8 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-accent" />
          Loading workspace settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl border border-[#2D3039] bg-[#101217] p-3">
                  <Settings2 size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#E2E8F0]">Workspace Profile</h2>
                  <p className="text-sm text-slate-500">These details shape the in-app workspace experience.</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Workspace / company name">
                  <input value={settings.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={fieldClassName} />
                </Field>
                <Field label="Slug">
                  <input value={settings.slug || ''} disabled className={`${fieldClassName} opacity-60`} />
                </Field>
                <Field label="Assistant name">
                  <input value={settings.assistant_name || ''} onChange={(e) => handleChange('assistant_name', e.target.value)} className={fieldClassName} />
                </Field>
                <Field label="Primary color">
                  <input value={settings.primary_color || ''} onChange={(e) => handleChange('primary_color', e.target.value)} className={fieldClassName} placeholder="#FF6B00" />
                </Field>
                <Field label="Support email">
                  <input value={settings.support_email || ''} onChange={(e) => handleChange('support_email', e.target.value)} className={fieldClassName} placeholder="support@company.com" />
                </Field>
                <Field label="Website">
                  <input value={settings.website || ''} onChange={(e) => handleChange('website', e.target.value)} className={fieldClassName} placeholder="https://company.com" />
                </Field>
                <Field label="Industry">
                  <input value={settings.industry || ''} onChange={(e) => handleChange('industry', e.target.value)} className={fieldClassName} />
                </Field>
                <Field label="Logo URL">
                  <input value={settings.logo_url || ''} onChange={(e) => handleChange('logo_url', e.target.value)} className={fieldClassName} placeholder="https://..." />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Welcome message">
                  <textarea
                    rows={4}
                    value={settings.welcome_message || ''}
                    onChange={(e) => handleChange('welcome_message', e.target.value)}
                    className={`${fieldClassName} resize-none`}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Brand preview</p>
              <div className="mt-5 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,23,28,0.96),rgba(13,15,18,0.96))] p-5">
                <div className="flex items-center gap-3">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={settings.name || 'Workspace logo'}
                      className="h-11 w-11 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl font-bold text-black"
                      style={{ backgroundColor: settings.primary_color || '#FF6B00' }}
                    >
                      {(settings.name || 'S').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#E2E8F0]">{settings.name || 'Workspace name'}</p>
                    <p className="text-xs text-slate-500">{settings.assistant_name || 'Assistant name'}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/8 bg-[#101217] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Viewer welcome</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {settings.welcome_message || 'Ask questions from your approved company documents.'}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-[#101217] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Support email</p>
                    <p className="mt-2 text-sm text-slate-300">{settings.support_email || 'Not set'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#101217] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Industry</p>
                    <p className="mt-2 text-sm text-slate-300">{settings.industry || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(message || error) && (
            <div className={`rounded-2xl border p-4 text-sm ${error ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-green-500/20 bg-green-500/5 text-green-300'}`}>
              {error || message}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-black">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
