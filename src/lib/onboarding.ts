const RESERVED_WORKSPACE_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'login',
  'platform',
  'register',
  'springvox',
  'www',
]);

export function slugifyWorkspaceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function isValidWorkspaceSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isReservedWorkspaceSlug(slug: string) {
  return RESERVED_WORKSPACE_SLUGS.has(slug);
}

export function validateWorkspaceSlug(slug: string) {
  const normalized = slug.trim().toLowerCase();

  if (!normalized) {
    return { valid: false, normalized, error: 'Workspace slug is required' };
  }

  if (normalized.length < 3 || normalized.length > 48) {
    return {
      valid: false,
      normalized,
      error: 'Workspace slug must be between 3 and 48 characters',
    };
  }

  if (!isValidWorkspaceSlug(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Workspace slug must use lowercase letters, numbers, and hyphens only',
    };
  }

  if (isReservedWorkspaceSlug(normalized)) {
    return { valid: false, normalized, error: 'That workspace slug is reserved' };
  }

  return { valid: true, normalized };
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
