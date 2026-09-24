import { createServiceClient, isFirebaseAdminConfigured } from './_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const getProtectedLink = async (serviceSupabase: any) => {
  const { data, error } = await serviceSupabase
    .from('app_settings')
    .select('value')
    .eq('key', 'ai_accounts_link')
    .maybeSingle();

  if (!error && typeof data?.value?.url === 'string' && data.value.url.trim()) {
    return data.value.url.trim();
  }

  const { data: admins } = await serviceSupabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .neq('access_status', 'blocked')
    .limit(10);

  for (const adminProfile of admins || []) {
    const { data: adminUser } = await serviceSupabase.auth.admin.getUserById(adminProfile.id);
    const metadataLink = adminUser?.user?.app_metadata?.ai_accounts_link;

    if (typeof metadataLink === 'string' && metadataLink.trim()) {
      return metadataLink.trim();
    }
  }

  return process.env.AI_ACCOUNTS_LINK || '';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();

  if (!serviceSupabase) {
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY nao esta configurada.',
    });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({
      error: 'Sessao expirada. Faca login novamente.',
    });
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({
      error: 'Sessao invalida. Faca login novamente.',
    });
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({
      error: 'Nao foi possivel conferir o acesso.',
    });
  }

  const allowed =
    profile?.role === 'admin' ||
    (profile?.access_status === 'active' && user.app_metadata?.ai_accounts_access === true);

  if (!allowed) {
    return res.status(403).json({
      error: 'Esse acesso e vendido a parte. Fale com o suporte para liberar.',
    });
  }

  const protectedLink = await getProtectedLink(serviceSupabase);

  if (!protectedLink) {
    return res.status(500).json({
      error: 'Link das Contas de IA ilimitado ainda nao configurado.',
    });
  }

  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({
    url: protectedLink,
  });
}
