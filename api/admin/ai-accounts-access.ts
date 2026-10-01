import { createServiceClient, isFirebaseAdminConfigured, isVerifiedOwner } from '../_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

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

  if (!isVerifiedOwner(user) || !profile || profile.role !== 'admin' || profile.access_status === 'blocked') {
    return { ok: false as const, status: 403, error: 'Apenas administradores podem liberar esse acesso.' };
  }

  return { ok: true as const };
};

const listEntitlements = async (serviceSupabase: any) => {
  const { data, error } = await serviceSupabase
    .from('profiles')
    .select('id, ai_accounts_access')
    .eq('ai_accounts_access', true);

  if (error) return {};

  const entitlements: Record<string, boolean> = {};

  for (const profile of data || []) {
    if (profile?.id) entitlements[profile.id] = true;
  }

  return entitlements;
};

export default async function handler(req: any, res: any) {
  if (!['GET', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();

  if (!serviceSupabase) {
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY nao esta configurada.',
    });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const adminCheck = await checkAdminAccess(serviceSupabase, token);

  if (!adminCheck.ok) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      entitlements: await listEntitlements(serviceSupabase),
    });
  }

  const studentId = String(req.body?.studentId || '').trim();
  const enabled = req.body?.enabled === true;

  if (!studentId) {
    return res.status(400).json({ error: 'Aluno invalido.' });
  }

  const { data: targetUser, error: getUserError } = await serviceSupabase.auth.admin.getUserById(studentId);

  if (getUserError || !targetUser?.user) {
    return res.status(404).json({ error: 'Aluno nao encontrado no Auth.' });
  }

  const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(studentId, {
    app_metadata: {
      ...targetUser.user.app_metadata,
      ai_accounts_access: enabled,
    },
  });

  if (updateError) {
    return res.status(500).json({ error: 'Nao foi possivel atualizar esse acesso.' });
  }

  await serviceSupabase
    .from('profiles')
    .update({ ai_accounts_access: enabled })
    .eq('id', studentId);

  return res.status(200).json({ ok: true, enabled });
}
