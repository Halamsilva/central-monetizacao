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

const checkAdminAccess = async (serviceSupabase: any, token?: string) => {
  if (!token) {
    return { ok: false as const, status: 401, error: 'Sessao expirada. Faca login novamente.' };
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Sessao invalida. Faca login novamente.' };
  }

  const { data: adminProfile, error: adminError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError) {
    return { ok: false as const, status: 500, error: 'Nao foi possivel conferir permissao de admin.' };
  }

  if (adminProfile?.role !== 'admin' || adminProfile?.access_status === 'blocked') {
    return { ok: false as const, status: 403, error: 'Apenas administradores podem importar ou diagnosticar alunos.' };
  }

  return { ok: true as const, userId: user.id };
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

  const brazilianDate = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (brazilianDate) {
    return new Date(
      Date.UTC(
        Number(brazilianDate[3]),
        Number(brazilianDate[2]) - 1,
        Number(brazilianDate[1]),
        Number(brazilianDate[4] || 0),
        Number(brazilianDate[5] || 0),
        Number(brazilianDate[6] || 0)
      )
    );
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

const getEmailFromQuery = (req: any) => {
  const value = req.query?.email;
  return normalizeEmail(Array.isArray(value) ? value[0] : value);
};

const getDiagnosis = (profile: any, purchases: any[]) => {
  const latestPurchase = purchases[0];
  const now = Date.now();

  if (profile?.access_status === 'active') {
    return {
      status: 'active',
      title: 'Liberado na Central',
      detail: 'Esse e-mail ja esta ativo na lista de alunos.',
    };
  }

  if (profile?.access_status === 'blocked') {
    return {
      status: 'blocked',
      title: 'Aluno bloqueado',
      detail: 'Esse e-mail existe na Central, mas esta bloqueado manualmente.',
    };
  }

  if (!latestPurchase) {
    return {
      status: 'missing_purchase',
      title: 'Compra nao encontrada',
      detail: 'Nao existe compra/importacao da Kiwify para esse e-mail. Importe pelo CSV ou confira se o aluno usou outro e-mail na compra.',
    };
  }

  const releaseAt = latestPurchase.release_at ? new Date(latestPurchase.release_at) : null;
  const isReleased = releaseAt ? releaseAt.getTime() <= now : latestPurchase.purchase_status === 'active';

  if (!profile) {
    return {
      status: isReleased ? 'released_without_profile' : 'waiting_without_profile',
      title: isReleased ? 'Compra liberada, sem conta na Central' : 'Compra encontrada, aluno ainda sem conta',
      detail: isReleased
        ? 'A compra ja passou do prazo. O aluno precisa criar login na Central com esse mesmo e-mail.'
        : 'A compra existe, mas o aluno ainda precisa criar login com esse mesmo e-mail.',
      release_at: latestPurchase.release_at,
    };
  }

  if (!isReleased) {
    const daysRemaining = releaseAt
      ? Math.max(1, Math.ceil((releaseAt.getTime() - now) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      status: 'waiting_period',
      title: 'Aguardando prazo de liberacao',
      detail: daysRemaining
        ? `Compra encontrada. Faltam aproximadamente ${daysRemaining} dia(s) para liberar.`
        : 'Compra encontrada, mas ainda esta dentro do prazo.',
      release_at: latestPurchase.release_at,
      days_remaining: daysRemaining,
    };
  }

  return {
    status: 'needs_sync',
    title: 'Compra liberada, perfil ainda pendente',
    detail: 'A compra ja permite acesso. O aluno deve entrar novamente; se continuar pendente, aprove manualmente ou reimporte o e-mail.',
    release_at: latestPurchase.release_at,
  };
};

const diagnoseEmail = async (req: any, res: any, serviceSupabase: any) => {
  const email = getEmailFromQuery(req);

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Informe um e-mail valido para diagnosticar.' });
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('id, email, full_name, role, access_status, approved_at, created_at')
    .eq('email', email)
    .eq('role', 'student')
    .maybeSingle();

  if (profileError) {
    console.error('Legacy diagnosis profile error:', profileError);
    return res.status(500).json({ error: 'Erro ao buscar perfil do aluno.' });
  }

  const { data: purchases, error: purchaseError } = await serviceSupabase
    .from('kiwify_purchases')
    .select('email, purchase_status, paid_at, release_at, product_id, updated_at')
    .eq('email', email)
    .order('release_at', { ascending: false })
    .limit(5);

  if (purchaseError) {
    console.error('Legacy diagnosis purchase error:', purchaseError);
    return res.status(500).json({ error: 'Erro ao buscar compras da Kiwify.' });
  }

  return res.status(200).json({
    ok: true,
    email,
    profile,
    purchases: purchases || [],
    diagnosis: getDiagnosis(profile, purchases || []),
  });
};

const importLegacyStudents = async (req: any, res: any, serviceSupabase: any) => {
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
};

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const adminCheck = await checkAdminAccess(serviceSupabase, token);

  if (!adminCheck.ok) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  if (req.method === 'GET') {
    return diagnoseEmail(req, res, serviceSupabase);
  }

  return importLegacyStudents(req, res, serviceSupabase);
}
