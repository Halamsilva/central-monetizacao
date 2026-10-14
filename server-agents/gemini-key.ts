import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const cleanApiKey = (value: unknown) => String(value || '').trim();

export const maskGeminiApiKey = (value: unknown) => {
  const apiKey = cleanApiKey(value);
  if (!apiKey) return '';

  if (apiKey.length <= 10) return `${apiKey.slice(0, 2)}...${apiKey.slice(-2)}`;

  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
};

export const getStoredGeminiApiKey = async (serviceSupabase?: any) => {
  const supabase = serviceSupabase || getServiceSupabase();
  if (!supabase) return '';

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'gemini_api_key')
    .maybeSingle();

  if (error) {
    const missingSettingsTable =
      ['PGRST205', '42P01'].includes(error.code) ||
      String(error.message || '').includes('app_settings');

    if (!missingSettingsTable) return '';

    const { data: fallback, error: fallbackError } = await supabase
      .from('agents')
      .select('prompt')
      .eq('category', '__system')
      .eq('title', '__app_setting:gemini_api_key')
      .maybeSingle();

    if (fallbackError || !fallback?.prompt) return '';

    try {
      return cleanApiKey(JSON.parse(fallback.prompt)?.apiKey);
    } catch {
      return '';
    }
  }

  return cleanApiKey(data?.value?.apiKey);
};

export const getUserGeminiApiKey = async (serviceSupabase: any, userId?: string) => {
  if (!serviceSupabase || !userId) return '';

  try {
    const { data, error } = await serviceSupabase
      .from('user_secrets')
      .select('gemini_api_key')
      .eq('id', userId)
      .maybeSingle();

    if (error) return '';

    return cleanApiKey(data?.gemini_api_key);
  } catch {
    return '';
  }
};

// Prioridade: a chave do proprio aluno. Sem chave propria, usa a chave da plataforma
// (admin). Quando a cota da plataforma acabar, o aluno cadastra a sua em Configuracoes.
export const getActiveGeminiApiKey = async (serviceSupabase?: any, userId?: string) => {
  const candidates = await getGeminiApiKeyCandidates(serviceSupabase, userId);
  return candidates[0] || '';
};

// Lista ordenada de chaves para tentar uma apos a outra: chave do aluno, chave da
// plataforma e, por ultimo, a variavel de ambiente. Se o Google negar o acesso a uma
// delas (PERMISSION_DENIED), o agente tenta a proxima em vez de quebrar.
export const getGeminiApiKeyCandidates = async (serviceSupabase?: any, userId?: string) => {
  const supabase = serviceSupabase || getServiceSupabase();

  const userKey = await getUserGeminiApiKey(supabase, userId);
  const storedKey = await getStoredGeminiApiKey(supabase);
  const envKey = cleanApiKey(process.env.GEMINI_API_KEY);

  return Array.from(new Set([userKey, storedKey, envKey].filter((key) => key.length > 20)));
};

const GEMINI_FRIENDLY_MESSAGES: Array<{ test: (value: string) => boolean; message: string }> = [
  {
    test: (value) => /PERMISSION_DENIED|denied access|403/i.test(value),
    message:
      'A chave de IA em uso foi negada pelo Google (acesso ao Gemini negado neste projeto). Cadastre uma nova chave do Google AI Studio em Configuracoes ou aguarde a troca da chave da plataforma.',
  },
  {
    test: (value) => /API_KEY_INVALID|API key not valid|invalid api key|400/i.test(value),
    message:
      'A chave de IA cadastrada e invalida. Gere uma nova chave do Google AI Studio e salve em Configuracoes.',
  },
  {
    test: (value) => /RESOURCE_EXHAUSTED|quota|429/i.test(value),
    message:
      'A cota da chave de IA acabou neste momento. Use sua propria chave do Google AI Studio em Configuracoes ou tente novamente mais tarde.',
  },
  {
    test: (value) => /503|UNAVAILABLE|high demand|overloaded/i.test(value),
    message:
      'Os servidores do Google estao com alta demanda temporaria. Tentamos modelos alternativos; tente novamente em instantes.',
  },
];

export const describeGeminiError = (error: any) => {
  const raw = String(error?.message || error || '');
  const code = String(error?.status || error?.code || '');
  const hit = GEMINI_FRIENDLY_MESSAGES.find(({ test }) => test(raw) || test(code));

  return {
    code: /PERMISSION_DENIED/.test(raw) ? 'PERMISSION_DENIED' : code || 'GEMINI_ERROR',
    accessDenied: /PERMISSION_DENIED|denied access/i.test(raw) || Number(error?.status || error?.code) === 403,
    retryable: /503|UNAVAILABLE|high demand|overloaded|429|RESOURCE_EXHAUSTED/i.test(raw),
    message: hit?.message || 'Nao foi possivel gerar agora com a IA. Tente novamente em instantes.',
    raw: raw.slice(0, 400),
  };
};
