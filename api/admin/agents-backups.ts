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
    return { ok: false as const, status: 403, error: 'Apenas administradores podem acessar a lixeira.' };
  }

  return { ok: true as const };
};

const isMissingTable = (error: any) =>
  error?.code === '42P01' || error?.code === 'PGRST205' || /agent_deleted_backups/i.test(error?.message || '');

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao esta configurada.' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const adminCheck = await checkAdminAccess(serviceSupabase, token);

  if (!adminCheck.ok) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  if (req.method === 'GET') {
    const { data, error } = await serviceSupabase
      .from('agent_deleted_backups')
      .select('id, agent_id, agent_snapshot, deleted_at')
      .order('deleted_at', { ascending: false })
      .limit(30);

    if (error) {
      if (isMissingTable(error)) return res.status(200).json({ ok: true, backups: [], unavailable: true });
      return res.status(500).json({ error: error.message || 'Erro ao carregar lixeira.' });
    }

    return res.status(200).json({ ok: true, backups: data || [] });
  }

  const backupId = String(req.body?.id || '').trim();
  if (!backupId) {
    return res.status(400).json({ error: 'ID do backup nao informado.' });
  }

  const { data: backup, error: fetchError } = await serviceSupabase
    .from('agent_deleted_backups')
    .select('*')
    .eq('id', backupId)
    .maybeSingle();

  if (fetchError) {
    if (isMissingTable(fetchError)) return res.status(404).json({ error: 'Lixeira ainda nao configurada no banco.' });
    return res.status(500).json({ error: fetchError.message || 'Erro ao buscar backup.' });
  }

  if (!backup?.agent_snapshot) {
    return res.status(404).json({ error: 'Backup nao encontrado.' });
  }

  const { error: restoreError } = await serviceSupabase
    .from('agents')
    .upsert(backup.agent_snapshot, { onConflict: 'id' });

  if (restoreError) {
    return res.status(500).json({ error: restoreError.message || 'Erro ao restaurar agente.' });
  }

  await serviceSupabase
    .from('agent_deleted_backups')
    .delete()
    .eq('id', backupId);

  return res.status(200).json({ ok: true, restored: backup.agent_snapshot });
}
