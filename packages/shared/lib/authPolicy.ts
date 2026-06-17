/**
 * Server-side auth policy helpers (service-role context).
 * Allowed sign-in domains are controlled from the admin portal
 * (settings/project → data.allowedDomains).
 */
const DEFAULT_DOMAINS = ['modon.com', 'insiteinternational.com'];

export function emailDomain(email: string): string | null {
  return email?.split('@')[1]?.trim().toLowerCase() || null;
}

export async function getAllowedDomains(sb: any): Promise<string[]> {
  try {
    const { data } = await sb.from('settings').select('data').eq('id', 'project').maybeSingle();
    const list = (data?.data as any)?.allowedDomains;
    return Array.isArray(list) && list.length ? list.map((d: string) => String(d).toLowerCase()) : DEFAULT_DOMAINS;
  } catch {
    return DEFAULT_DOMAINS;
  }
}

export async function isDomainAllowed(sb: any, email: string): Promise<boolean> {
  const d = emailDomain(email);
  if (!d) return false;
  return (await getAllowedDomains(sb)).includes(d);
}

/** Does an account with this email exist in the database (auth-backed users table)? */
export async function accountExists(sb: any, email: string): Promise<{ exists: boolean; id?: string; name?: string }> {
  const norm = email?.trim().toLowerCase();
  if (!norm) return { exists: false };
  const { data } = await sb.from('users').select('id,email,data').ilike('email', norm).maybeSingle();
  if (!data) return { exists: false };
  return { exists: true, id: data.id, name: (data.data as any)?.name };
}
