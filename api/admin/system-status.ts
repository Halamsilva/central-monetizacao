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

const cleanApiKey = (value: unknown) => String(value || '').trim();

const maskGeminiApiKey = (value: unknown) => {
  const apiKey = cleanApiKey(value);
  if (!apiKey) return '';

  if (apiKey.length <= 10) return `${apiKey.slice(0, 2)}...${apiKey.slice(-2)}`;

  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
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

const writeFallbackSetting = async (serviceSupabase: any, key: string, value: Record<string, any>) => {
  const payload = {
    title: `__app_setting:${key}`,
    description: 'Internal platform setting. Do not publish.',
    image: '',
    category: '__system',
    agent_link: '',
    prompt: JSON.stringify(value),
    featured: false,
    is_published: false,
  };

  const { data: existing } = await serviceSupabase
    .from('agents')
    .select('id')
    .eq('category', '__system')
    .eq('title', `__app_setting:${key}`)
    .maybeSingle();

  if (existing?.id) {
    return serviceSupabase
      .from('agents')
      .update(payload)
      .eq('id', existing.id);
  }

  return serviceSupabase
    .from('agents')
    .insert(payload);
};

const deleteFallbackSetting = async (serviceSupabase: any, key: string) =>
  serviceSupabase
    .from('agents')
    .delete()
    .eq('category', '__system')
    .eq('title', `__app_setting:${key}`);

const readAppSetting = async (serviceSupabase: any, key: string) => {
  const { data, error } = await serviceSupabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (!error) return data?.value || null;
  if (isMissingSettingsTable(error)) return readFallbackSetting(serviceSupabase, key);

  return null;
};

const writeAppSetting = async (serviceSupabase: any, key: string, value: Record<string, any>) => {
  const { error } = await serviceSupabase
    .from('app_settings')
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (!error) return { error: null };
  if (isMissingSettingsTable(error)) return writeFallbackSetting(serviceSupabase, key, value);

  return { error };
};

const getStoredGeminiApiKey = async (serviceSupabase: any) => {
  const value = await readAppSetting(serviceSupabase, 'gemini_api_key');
  return cleanApiKey(value?.apiKey);
};

const getGeminiSettings = async (serviceSupabase: any) => {
  const storedGeminiKey = await getStoredGeminiApiKey(serviceSupabase);
  const fallbackGeminiKey = process.env.GEMINI_API_KEY || '';
  const activeGeminiKey = storedGeminiKey || fallbackGeminiKey;

  return {
    configured: Boolean(activeGeminiKey),
    usingStoredKey: Boolean(storedGeminiKey),
    maskedKey: maskGeminiApiKey(activeGeminiKey),
    fallbackConfigured: Boolean(fallbackGeminiKey),
    detail: activeGeminiKey
      ? `${storedGeminiKey ? 'Chave do painel admin' : 'Chave da Vercel'} configurada (${maskGeminiApiKey(activeGeminiKey)})`
      : 'API key ausente',
  };
};

const getMenuSettings = async (serviceSupabase: any) => {
  const value = await readAppSetting(serviceSupabase, 'menu_visibility');

  return {
    hiddenTabs: Array.isArray(value?.hiddenTabs)
      ? value.hiddenTabs.filter((item: unknown) => typeof item === 'string')
      : [],
  };
};

export default async function handler(req: any, res: any) {
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
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

  if (req.method === 'PATCH') {
    if (Array.isArray(req.body?.hiddenTabs)) {
      const hiddenTabs = req.body.hiddenTabs
        .filter((item: unknown) => typeof item === 'string')
        .map((item: string) => item.trim())
        .filter(Boolean);

      const { error } = await writeAppSetting(serviceSupabase, 'menu_visibility', {
        hiddenTabs,
        updatedAt: new Date().toISOString(),
      });

      if (error) {
        return res.status(500).json({
          error: 'Nao foi possivel salvar a visibilidade das abas.',
          detail: error.message || null,
          code: error.code || null,
        });
      }

      return res.status(200).json({
        ok: true,
        menuSettings: await getMenuSettings(serviceSupabase),
      });
    }

    const apiKey = String(req.body?.apiKey || '').trim();

    if (!apiKey) {
      return res.status(400).json({ error: 'Cole uma chave de API antes de salvar.' });
    }

    if (apiKey.length < 20) {
      return res.status(400).json({ error: 'Essa chave parece curta demais. Confira e tente novamente.' });
    }

    const { error } = await writeAppSetting(serviceSupabase, 'gemini_api_key', {
      apiKey,
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      return res.status(500).json({
        error: 'Nao foi possivel salvar a chave. Confira se a tabela app_settings existe.',
        detail: error.message || null,
        code: error.code || null,
      });
    }

    return res.status(200).json({
      ok: true,
      geminiSettings: await getGeminiSettings(serviceSupabase),
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await serviceSupabase.from('app_settings').delete().eq('key', 'gemini_api_key');
    if (error && isMissingSettingsTable(error)) {
      await deleteFallbackSetting(serviceSupabase, 'gemini_api_key');
    } else {
      await deleteFallbackSetting(serviceSupabase, 'gemini_api_key');
    }

    return res.status(200).json({
      ok: true,
      geminiSettings: await getGeminiSettings(serviceSupabase),
    });
  }

  const tables = await Promise.all([
    checkTable(serviceSupabase, 'profiles'),
    checkTable(serviceSupabase, 'agents'),
    checkTable(serviceSupabase, 'kiwify_purchases'),
    checkTable(serviceSupabase, 'agent_deleted_backups'),
  ]);

  const geminiSettings = await getGeminiSettings(serviceSupabase);
  const menuSettings = await getMenuSettings(serviceSupabase);

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
        ok: geminiSettings.configured,
        label: 'Gemini',
        detail: geminiSettings.detail,
      },
    },
    geminiSettings,
    menuSettings,
    tables,
  });
}
