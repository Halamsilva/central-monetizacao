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
    return { ok: false as const, status: 403, error: 'Apenas administradores podem configurar esse link.' };
  }

  return { ok: true as const, user };
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
    const { data, error } = await serviceSupabase
      .from('app_settings')
      .select('value')
      .eq('key', 'ai_accounts_link')
      .maybeSingle();

    if (error) {
      return res.status(200).json({
        url: adminCheck.user.app_metadata?.ai_accounts_link || process.env.AI_ACCOUNTS_LINK || '',
        videoUrl: adminCheck.user.app_metadata?.ai_accounts_video_url || '',
      });
    }

    return res.status(200).json({
      url: data?.value?.url || adminCheck.user.app_metadata?.ai_accounts_link || process.env.AI_ACCOUNTS_LINK || '',
      videoUrl: data?.value?.videoUrl || adminCheck.user.app_metadata?.ai_accounts_video_url || '',
    });
  }

  const url = String(req.body?.url || '').trim();
  const videoUrl = String(req.body?.videoUrl || '').trim();

  if (url && !/^https?:\/\/.+/i.test(url)) {
    return res.status(400).json({
      error: 'Cole um link valido com http ou https.',
    });
  }

  if (videoUrl && !/^https?:\/\/.+/i.test(videoUrl)) {
    return res.status(400).json({
      error: 'Cole um link de video valido com http ou https.',
    });
  }

  const { error } = await serviceSupabase
    .from('app_settings')
    .upsert(
      {
        key: 'ai_accounts_link',
        value: { url, videoUrl },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    const { error: metadataError } = await serviceSupabase.auth.admin.updateUserById(
      adminCheck.user.id,
      {
        app_metadata: {
          ...adminCheck.user.app_metadata,
          ai_accounts_link: url,
          ai_accounts_video_url: videoUrl,
        },
      }
    );

    if (metadataError) {
      return res.status(500).json({
        error: 'Nao foi possivel salvar o link.',
      });
    }

    return res.status(200).json({ ok: true, storage: 'auth_metadata' });
  }

  return res.status(200).json({ ok: true });
}
