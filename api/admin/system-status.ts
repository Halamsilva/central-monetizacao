import { createServiceClient, isFirebaseAdminConfigured, isVerifiedOwner } from '../_firebase.js';
import { sendAccessEmail } from '../_emails.js';
import { getGeminiApiKeyCandidates, describeGeminiError } from '../../server-agents/gemini-key.js';
import { GoogleGenAI } from '@google/genai';

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

// Testa cada chave de Gemini disponivel contra a API do Google e devolve o erro exato.
// Sem isso, so vemos "PERMISSION_DENIED" na tela e nao sabemos qual chave usar.
const testGeminiKeys = async (serviceSupabase: any, overrideKey?: string) => {
  const models = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
  const sources = await getGeminiApiKeyCandidates(serviceSupabase);
  const keys = overrideKey
    ? [{ source: 'informada no teste', key: overrideKey }]
    : [
        { source: 'chave da plataforma (app_settings)', key: sources[1] || '' },
        { source: 'variavel GEMINI_API_KEY da Vercel', key: sources[2] || '' },
      ].filter((entry) => entry.key);

  const results = [];

  for (const { source, key } of keys) {
    let okModel = '';
    let lastDetail: any = null;

    for (const model of models) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model,
          contents: 'Responda apenas: ok',
          config: { temperature: 0, maxOutputTokens: 8 },
        });

        if (String(response.text || '').trim()) {
          okModel = model;
          break;
        }
      } catch (error: any) {
        const description = describeGeminiError(error);
        lastDetail = description;
      }
    }

    results.push({
      source,
      maskedKey: maskGeminiApiKey(key),
      ok: Boolean(okModel),
      workingModel: okModel || null,
      code: okModel ? null : lastDetail?.code || 'GEMINI_ERROR',
      accessDenied: okModel ? false : Boolean(lastDetail?.accessDenied),
      message: okModel ? `Respondeu normalmente em ${okModel}.` : lastDetail?.message || 'Falhou sem detalhe.',
      raw: okModel ? null : lastDetail?.raw || null,
    });
  }

  return results;
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

  // Acao de diagnostico/reenvio: /api/admin/system-status?test_email=aluno@email.com
  const testEmail = String(req.query?.test_email || '').trim().toLowerCase();

  // Diagnostico da chave de IA: /api/admin/system-status?test_gemini=1
  if (req.method === 'GET' && String(req.query?.test_gemini || '') === '1') {
    const overrideKey = String(req.body?.apiKey || req.query?.api_key || '').trim();

    return res.status(200).json({
      ok: true,
      results: await testGeminiKeys(serviceSupabase, overrideKey),
      hint: overrideKey
        ? 'Testando a chave informada.'
        : 'Testando a chave da plataforma e a da Vercel. Se todas falharem com PERMISSION_DENIED, o projeto do Google negou o acesso: habilite a API Generative Language no projeto da chave ou gere a chave em outro projeto.',
    });
  }

  if (req.method === 'GET' && testEmail) {
    if (!testEmail.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail valido.' });
    }

    const result = await sendAccessEmail('access_released', {
      to: testEmail,
      name: 'Aluno',
      idempotencyKey: `admin-email-${testEmail}-${Date.now()}`,
    });

    return res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      skipped: Boolean(result.skipped),
      reason: result.reason || null,
      error: result.error || null,
      from: process.env.RESEND_FROM_EMAIL || 'Central Monetizacao <nao-responda@halamsilva.com.br> (padrao)',
      appUrl: process.env.APP_URL || 'https://www.halamsilva.com.br (padrao - configure APP_URL)',
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
    });
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

    // Testa antes de gravar: nao adianta salvar chave que o Google nega.
    if (req.body?.testBeforeSave !== false) {
      const [test] = await testGeminiKeys(serviceSupabase, apiKey);

      if (!test?.ok) {
        return res.status(400).json({
          error: 'O Google recusou essa chave. Nada foi salvo.',
          detail: test?.message || null,
          code: test?.code || null,
          accessDenied: Boolean(test?.accessDenied),
          hint: 'Gere a chave em aistudio.google.com/apikey usando um projeto com a API Generative Language habilitada.',
        });
      }
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
        from: process.env.RESEND_FROM_EMAIL || 'Central Monetizacao <nao-responda@halamsilva.com.br> (padrao)',
        appUrl: process.env.APP_URL || 'https://www.halamsilva.com.br (padrao - configure APP_URL)',
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
