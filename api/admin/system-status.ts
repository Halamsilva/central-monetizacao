import { createClient } from '@supabase/supabase-js';

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

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false as const, status: 500, error: 'Nao foi possivel conferir permissao de admin.' };
  }

  if (!profile || profile.role !== 'admin' || profile.access_status === 'blocked') {
    return { ok: false as const, status: 403, error: 'Apenas administradores podem ver o status.' };
  }

  return { ok: true as const };
};

const checkTable = async (serviceSupabase: any, table: string) => {
  const { count, error } = await serviceSupabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  return {
    table,
    ok: !error,
    count: count ?? null,
    error: error?.message || null,
    code: error?.code || null,
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY nao esta configurada.',
      services: {
        supabase: { ok: false, label: 'Supabase Service Role' },
      },
    });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const adminCheck = await checkAdminAccess(serviceSupabase, token);

  if (!adminCheck.ok) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  const tables = await Promise.all([
    checkTable(serviceSupabase, 'profiles'),
    checkTable(serviceSupabase, 'agents'),
    checkTable(serviceSupabase, 'kiwify_purchases'),
    checkTable(serviceSupabase, 'generation_jobs'),
    checkTable(serviceSupabase, 'generation_worker_status'),
    checkTable(serviceSupabase, 'agent_deleted_backups'),
  ]);

  const workerStatus = tables.find((table) => table.table === 'generation_worker_status');
  let flowWorker = null;

  if (workerStatus?.ok) {
    const { data } = await serviceSupabase
      .from('generation_worker_status')
      .select('status, message, online_until, updated_at, flow_project_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    flowWorker = data || null;
  }

  return res.status(200).json({
    ok: true,
    checked_at: new Date().toISOString(),
    services: {
      supabase: {
        ok: true,
        label: 'Supabase',
      },
      kiwifyWebhook: {
        ok: Boolean(process.env.KIWIFY_WEBHOOK_TOKEN),
        label: 'Webhook Kiwify',
        detail: process.env.KIWIFY_WEBHOOK_TOKEN ? 'Token configurado' : 'Token ausente',
      },
      resend: {
        ok: Boolean(process.env.RESEND_API_KEY),
        label: 'E-mail Resend',
        detail: process.env.RESEND_API_KEY ? 'API key configurada' : 'API key ausente',
      },
      gemini: {
        ok: Boolean(process.env.GEMINI_API_KEY),
        label: 'Gemini',
        detail: process.env.GEMINI_API_KEY ? 'API key configurada' : 'API key ausente',
      },
      flowWorker: {
        ok: Boolean(flowWorker && ['online', 'working'].includes(flowWorker.status)),
        label: 'Worker Flow/Veo',
        detail: flowWorker?.message || flowWorker?.status || 'Sem status recente',
        data: flowWorker,
      },
    },
    tables,
  });
}
