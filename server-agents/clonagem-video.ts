import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { buildForensicVideoPrompt } from './clonagemPrompt.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const clean = (value: unknown, maxLength = 500) =>
  String(value || '').trim().slice(0, maxLength);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Sessao invalida. Faca login novamente.' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Erro ao conferir acesso.' });
    return null;
  }

  const canUse =
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
];

const extractText = (response: any) => {
  if (!response) return '';
  if (typeof response.text === 'string' && response.text.trim()) return response.text.trim();

  if (typeof response.text === 'function') {
    try {
      const value = response.text();
      if (typeof value === 'string' && value.trim()) return value.trim();
    } catch {
      // segue para os candidates
    }
  }

  const candidates = response.candidates;
  if (Array.isArray(candidates)) {
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts;
      if (Array.isArray(parts)) {
        const text = parts
          .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
          .filter(Boolean)
          .join('\n')
          .trim();
        if (text) return text;
      }
    }
  }

  return '';
};

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout de ${ms}ms excedido`)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

const stringifyError = (err: any) => {
  try {
    return (typeof err === 'string' ? err : JSON.stringify(err)) + ' ' + (err?.message || '');
  } catch {
    return String(err?.message || err || '');
  }
};

const isQuotaExhausted = (err: any) => {
  const str = stringifyError(err);
  return (
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('Quota exceeded') ||
    str.includes('exceeded your current quota') ||
    err?.status === 429 ||
    err?.code === 429
  );
};

const isPermissionDenied = (err: any) => {
  const str = stringifyError(err);
  return (
    str.includes('PERMISSION_DENIED') ||
    str.includes('denied access') ||
    str.includes('API key not valid') ||
    str.includes('API_KEY_INVALID') ||
    err?.status === 403 ||
    err?.code === 403
  );
};

const isTransient = (err: any) => {
  const status = err?.status || err?.code || err?.statusCode;
  const str = stringifyError(err);
  return (
    status === 503 ||
    str.includes('503') ||
    str.includes('UNAVAILABLE') ||
    str.includes('high demand') ||
    str.includes('overloaded') ||
    str.includes('temporarily unavailable') ||
    str.includes('Timeout')
  );
};

const buildModelConfig = (modelName: string, systemInstruction: string) => {
  const config: any = {
    systemInstruction,
    temperature: 0.2,
    maxOutputTokens: 16384,
  };

  if (
    modelName.includes('3.6-flash') ||
    modelName.includes('3-flash') ||
    modelName.includes('3.7-flash') ||
    modelName.includes('3.8-flash')
  ) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }

  return config;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  const fileUri = clean(req.body?.fileUri, 500);
  const fileName = clean(req.body?.fileName, 300);
  const mimeType = clean(req.body?.mimeType, 80) || 'video/mp4';
  const language = clean(req.body?.language, 40) || 'brasil';

  if (!fileUri) {
    return res.status(400).json({ error: 'Nenhum video foi recebido.' });
  }

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({
      error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.',
    });
  }

  const { systemInstruction, prompt } = buildForensicVideoPrompt(language);
  const videoPart: any = { fileData: { fileUri, mimeType } };

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  let lastError: any = null;
  let result = '';

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [{ parts: [videoPart, { text: prompt }] }],
          config: buildModelConfig(model, systemInstruction),
        }),
        60000
      );

      const text = extractText(response);
      if (text) {
        result = text;
        break;
      }

      lastError = new Error(`O modelo ${model} nao retornou texto.`);
    } catch (error: any) {
      lastError = error;
      console.error(`[clonagem-video] modelo ${model} falhou:`, String(error?.message || error).slice(0, 400));

      if (isPermissionDenied(error)) break;

      // cota e alta demanda seguem direto para o proximo modelo (cada um tem sua cota)
      if (isQuotaExhausted(error) || isTransient(error)) continue;

      if (String(error?.message || '').toLowerCase().includes('not found')) continue;
    }
  }

  if (!result && lastError && isTransient(lastError)) {
    await sleep(1500);

    for (const model of ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-lite-latest']) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: [{ parts: [videoPart, { text: prompt }] }],
            config: buildModelConfig(model, systemInstruction),
          }),
          60000
        );

        const text = extractText(response);
        if (text) {
          result = text;
          break;
        }
      } catch (error: any) {
        lastError = error;
      }
    }
  }

  if (fileName) {
    try {
      await ai.files.delete({ name: fileName });
    } catch {
      // limpeza opcional
    }
  }

  if (!result) {
    const denied = isPermissionDenied(lastError);
    const quota = isQuotaExhausted(lastError);
    const transient = isTransient(lastError);

    let message = 'Nao consegui analisar o video agora. Tente novamente.';
    if (denied) {
      message =
        'Sua chave do Google AI Studio foi recusada (permissao negada). Crie uma chave nova em aistudio.google.com/app/apikey e coloque em Configuracoes.';
    } else if (quota) {
      message = 'Limite de uso da IA atingido agora. Tente novamente em alguns minutos.';
    } else if (transient) {
      message = 'Os servidores do Google estao com alta demanda. Clique em Tentar Novamente.';
    } else if (lastError?.message) {
      message = String(lastError.message).slice(0, 400);
    }

    const status = transient ? 503 : denied ? 400 : quota ? 429 : 500;
    return res.status(status).json({
      error: message,
      detail: String(lastError?.message || '').slice(0, 600),
    });
  }

  return res.status(200).json({ ok: true, result });
}