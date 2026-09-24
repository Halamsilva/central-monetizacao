import { createServiceClient, isFirebaseAdminConfigured } from './_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const getProtectedVideoUrl = async (serviceSupabase: any) => {
  const { data, error } = await serviceSupabase
    .from('app_settings')
    .select('value')
    .eq('key', 'ai_accounts_link')
    .maybeSingle();

  if (!error && typeof data?.value?.videoUrl === 'string' && data.value.videoUrl.trim()) {
    return data.value.videoUrl.trim();
  }

  const { data: admins } = await serviceSupabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .neq('access_status', 'blocked')
    .limit(10);

  for (const adminProfile of admins || []) {
    const { data: adminUser } = await serviceSupabase.auth.admin.getUserById(adminProfile.id);
    const metadataVideoUrl = adminUser?.user?.app_metadata?.ai_accounts_video_url;

    if (typeof metadataVideoUrl === 'string' && metadataVideoUrl.trim()) {
      return metadataVideoUrl.trim();
    }
  }

  return '';
};

const isMissingSettingsTable = (error: any) =>
  ['PGRST205', '42P01'].includes(error?.code) ||
  String(error?.message || '').includes('app_settings');

const readFallbackSetting = async (serviceSupabase: any, key: string) => {
  const { data, error } = await serviceSupabase
    .from('agents')
    .select('prompt')
    .eq('category', '__system')
    .eq('title', `__app_setting:${key}`)
    .maybeSingle();

  if (error || !data?.prompt) return null;

  try {
    return JSON.parse(data.prompt);
  } catch {
    return null;
  }
};

const getHiddenTabs = async (serviceSupabase: any) => {
  const { data, error } = await serviceSupabase
    .from('app_settings')
    .select('value')
    .eq('key', 'menu_visibility')
    .maybeSingle();

  if (error) {
    if (isMissingSettingsTable(error)) {
      const fallback = await readFallbackSetting(serviceSupabase, 'menu_visibility');
      return Array.isArray(fallback?.hiddenTabs)
        ? fallback.hiddenTabs.filter((item: unknown) => typeof item === 'string')
        : [];
    }

    return [];
  }

  if (!Array.isArray(data?.value?.hiddenTabs)) return [];

  return data.value.hiddenTabs.filter((item: unknown) => typeof item === 'string');
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();

  if (!serviceSupabase) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao esta configurada.' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Sessao invalida. Faca login novamente.' });
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: 'Nao foi possivel conferir permissao.' });
  }

  const allowed =
    profile?.role === 'admin' ||
    (profile?.access_status === 'active' && user.app_metadata?.ai_accounts_access === true);

  const includeContent = req.query?.content === '1' || req.query?.content === 'true';

  return res.status(200).json({
    allowed,
    hiddenTabs: await getHiddenTabs(serviceSupabase),
    videoUrl: allowed && includeContent ? await getProtectedVideoUrl(serviceSupabase) : undefined,
  });
}
