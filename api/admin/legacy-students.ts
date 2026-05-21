import { createClient } from '@supabase/supabase-js';

type ImportEntry = {
  email: string;
  paidAt?: string;
};

type KiwifyAccessStatus = 'pending' | 'active';

const normalizeEmail = (email?: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const parseEntries = (value: unknown): ImportEntry[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        email: normalizeEmail(item?.email),
        paidAt: typeof item?.paidAt === 'string' ? item.paidAt.trim() : undefined,
      }))
      .filter((item) => item.email.includes('@'));
  }

  const text = String(value || '');

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [emailPart, paidAtPart] = line.split(/[;,|\t]/).map((part) => part.trim());
      return {
        email: normalizeEmail(emailPart),
        paidAt: paidAtPart || undefined,
      };
    })
    .filter((item) => item.email.includes('@'));
};

const parsePaidAt = (value: string | undefined, releaseDelayDays: number) => {
  if (!value) {
    const oldPurchase = new Date();
    oldPurchase.setUTCDate(oldPurchase.getUTCDate() - releaseDelayDays);
    oldPurchase.setUTCMinutes(oldPurchase.getUTCMinutes() - 5);
    return oldPurchase;
  }

  const normalized = value.includes('/') ? value.split('/').reverse().join('-') : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    const oldPurchase = new Date();
    oldPurchase.setUTCDate(oldPurchase.getUTCDate() - releaseDelayDays);
    oldPurchase.setUTCMinutes(oldPurchase.getUTCMinutes() - 5);
    return oldPurchase;
  }

  return date;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { data: adminProfile, error: adminError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError) {
    return res.status(500).json({ error: 'Failed to check admin access' });
  }

  if (adminProfile?.role !== 'admin' || adminProfile?.access_status === 'blocked') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const entries = parseEntries(req.body?.entries || req.body?.text);
  const uniqueEntries = Array.from(
    new Map(entries.map((entry) => [entry.email, entry])).values()
  ).slice(0, 500);

  if (!uniqueEntries.length) {
    return res.status(400).json({ error: 'Nenhum e-mail valido encontrado.' });
  }

  const releaseDelayDays = Number(process.env.KIWIFY_RELEASE_DELAY_DAYS || 7);
  const now = Date.now();
  let activeCount = 0;
  let pendingCount = 0;
  let matchedProfiles = 0;

  for (const entry of uniqueEntries) {
    const paidAt = parsePaidAt(entry.paidAt, releaseDelayDays);
    const releaseAt = addDays(paidAt, releaseDelayDays);
    const status: KiwifyAccessStatus = releaseAt.getTime() <= now ? 'active' : 'pending';

    if (status === 'active') activeCount += 1;
    if (status === 'pending') pendingCount += 1;

    const { error: purchaseError } = await serviceSupabase
      .from('kiwify_purchases')
      .upsert(
        {
          email: entry.email,
          kiwify_order_id: `legacy-${entry.email}`,
          product_id: 'legacy_import',
          purchase_status: status,
          paid_at: paidAt.toISOString(),
          release_at: releaseAt.toISOString(),
          raw_payload: {
            source: 'admin_legacy_import',
            email: entry.email,
            paid_at: paidAt.toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (purchaseError) {
      console.error('Legacy purchase import error:', purchaseError);
      return res.status(500).json({ error: `Erro ao importar ${entry.email}.` });
    }

    const profileUpdate: Record<string, string | null> = {
      access_status: status,
    };

    if (status === 'active') profileUpdate.approved_at = new Date().toISOString();
    if (status === 'pending') profileUpdate.approved_at = null;

    const { data: updatedProfiles, error: profileError } = await serviceSupabase
      .from('profiles')
      .update(profileUpdate)
      .eq('email', entry.email)
      .eq('role', 'student')
      .select('id');

    if (profileError) {
      console.error('Legacy profile update error:', profileError);
      return res.status(500).json({ error: `Erro ao atualizar perfil de ${entry.email}.` });
    }

    matchedProfiles += updatedProfiles?.length || 0;
  }

  return res.status(200).json({
    ok: true,
    imported: uniqueEntries.length,
    active: activeCount,
    pending: pendingCount,
    matched_profiles: matchedProfiles,
  });
}
