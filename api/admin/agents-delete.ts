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
    return { ok: false as const, status: 403, error: 'Apenas administradores podem excluir agentes.' };
  }

  return { ok: true as const };
};

export default async function handler(req: any, res: any) {
  if (!['POST', 'DELETE'].includes(req.method)) {
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

  const agentId = String(req.body?.id || req.query?.id || '').trim();

  if (!agentId) {
    return res.status(400).json({ error: 'ID do agente nao informado.' });
  }

  const { data: agent, error: fetchError } = await serviceSupabase
    .from('agents')
    .select('id, title')
    .eq('id', agentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Agent fetch before delete error:', fetchError);
    return res.status(500).json({ error: fetchError.message || 'Erro ao buscar agente.' });
  }

  if (!agent) {
    return res.status(404).json({ error: 'Agente nao encontrado.' });
  }

  const { error: deleteError } = await serviceSupabase
    .from('agents')
    .delete()
    .eq('id', agentId);

  if (deleteError) {
    console.error('Agent delete error:', deleteError);
    return res.status(500).json({ error: deleteError.message || 'Erro ao excluir agente.' });
  }

  return res.status(200).json({ ok: true, deleted: agent });
}
