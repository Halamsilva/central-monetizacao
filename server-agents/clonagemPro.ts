import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { recordAiMetric } from './aiGateway.js';
import { buildForensicVideoPromptPro } from './clonagemProPrompt.js';
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
  'gemini-3.5-flash',
];

const TRANSLATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

const getLanguageLabel = (value: unknown) => {
  const normalized = String(value || 'brasil').toLowerCase().trim();

  if (normalized === 'estados_unidos' || normalized === 'en' || normalized === 'english') {
    return 'English (United States)';
  }

  if (normalized === 'mexico' || normalized === 'es' || normalized === 'spanish' || normalized === 'espanol') {
    return 'Spanish (Mexico) / Español';
  }

  return 'Português do Brasil';
};

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
    maxOutputTokens: 32768,
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

// Traduz/localiza uma analise ja gerada para outro idioma, sem reenviar o video.
const handleTranslate = async (res: any, ai: any, body: any) => {
  const text = String(body?.text || '').trim();

  if (!text) {
    return res.status(400).json({ error: 'Texto da analise nao fornecido.' });
  }

  const languageLabel = getLanguageLabel(body?.targetLanguage);

  const systemInstruction = `You are a Chief Forensic Video Translation & Cinematic Prompt Localization Specialist specialized in SEEDANCE 2.5 (ByteDance).
Your mission is to translate and localize the complete video breakdown, forensic descriptions, and AI cloning prompts into 100% native ${languageLabel}.

STRICT MANDATORY RULES:
1. Preserve 100% of the markdown structure, timestamps (00:00:00, 0s-8s, 2s-4s, etc), character tags ([P1], [P2]), sections, numbers, and scene delimiters ('---').
2. CRITICAL SEEDANCE 2.5 (BYTEDANCE) ADAPTATION RULES:
   - NEVER translate or alter the multimodal reference token '@image1'.
   - Keep the Seedance 2.5 official 6-part formula tags ([Subject], [Action / Time-Coded Beats], [Scene & Environment], [Visual Style & Lighting], [Camera Movement], [Audio & Native Dialogue]).
   - Keep all time-coded bracketed beats intact ([0s], [2s], [4s], [6s], [8s]).
3. Translate ALL text, section headers, character descriptions, biometric details, spoken dialogue, and cloning prompts into 100% fluent, native ${languageLabel}.
4. Spoken dialogue MUST be translated accurately and naturally into ${languageLabel}.
5. ZERO words from any other language in your response.
6. Output ONLY the translated markdown content, no introductory notes.`;

  const prompt = `Translate and localize the following forensic video analysis completely into 100% native ${languageLabel}, strictly maintaining all Seedance 2.5 prompt formats and @image1 tokens:\n\n${text}`;

  let translatedText = '';

  for (const model of TRANSLATE_MODELS) {
    const startedAt = Date.now();
    try {
      const response: any = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [{ text: prompt }],
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 32768,
          },
        }),
        45000,
      );

      const extracted = extractText(response);
      if (extracted) {
        translatedText = extracted;
        recordAiMetric({ agent: 'clonagem-pro', provider: 'gemini', model, outcome: 'success', durationMs: Date.now() - startedAt });
        break;
      }
    } catch (error: any) {
      recordAiMetric({
        agent: 'clonagem-pro',
        provider: 'gemini',
        model,
        outcome: 'error',
        status: Number(error?.status || error?.code) || undefined,
        code: String(error?.name || error?.code || 'ERROR'),
        durationMs: Date.now() - startedAt,
      });
      console.error(`[clonagem-pro:[translate] modelo ${model} falhou:`, String(error?.message || error).slice(0, 300));
    }
  }

  if (!translatedText) {
    return res.status(500).json({ error: 'Nao foi possivel traduzir a analise no momento.' });
  }

  return res.json({ ok: true, result: translatedText, targetLanguage: languageLabel });
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

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({
      error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.',
    });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  if (String(req.body?.action || '') === 'translate') {
    return handleTranslate(res, ai, req.body);
  }

  const fileUri = clean(req.body?.fileUri, 500);
  const fileName = clean(req.body?.fileName, 300);
  const mimeType = clean(req.body?.mimeType, 80) || 'video/mp4';
  const language = clean(req.body?.language, 40) || 'brasil';

  if (!fileUri) {
    return res.status(400).json({ error: 'Nenhum video foi recebido.' });
  }

  const { systemInstruction, prompt, targetLanguage } = buildForensicVideoPromptPro(language);
  console.log(`[clonagem-pro] idioma solicitado: ${language} -> destino: ${targetLanguage}`);

  const videoPart: any = { fileData: { fileUri, mimeType } };

  let lastError: any = null;
  let result = '';

  for (const model of CANDIDATE_MODELS) {
    const startedAt = Date.now();
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [{ parts: [videoPart, { text: prompt }] }],
          config: buildModelConfig(model, systemInstruction),
        }),
        90000,
      );

      const text = extractText(response);
      if (text) {
        result = text;
        recordAiMetric({ agent: 'clonagem-pro', provider: 'gemini', model, outcome: 'success', durationMs: Date.now() - startedAt });
        break;
      }

      lastError = new Error(`O modelo ${model} nao retornou texto.`);
    } catch (error: any) {
      lastError = error;
      recordAiMetric({
        agent: 'clonagem-pro',
        provider: 'gemini',
        model,
        outcome: 'error',
        status: Number(error?.status || error?.code) || undefined,
        code: String(error?.name || error?.code || 'ERROR'),
        durationMs: Date.now() - startedAt,
      });
      console.error(`[clonagem-pro] modelo ${model} falhou:`, String(error?.message || error).slice(0, 400));

      if (isPermissionDenied(error)) break;
      if (isQuotaExhausted(error) || isTransient(error)) continue;
      if (String(error?.message || '').toLowerCase().includes('not found')) continue;
    }
  }

  if (!result && lastError && isTransient(lastError)) {
    await sleep(1500);

    for (const model of ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-lite-latest']) {
      const startedAt = Date.now();
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: [{ parts: [videoPart, { text: prompt }] }],
            config: buildModelConfig(model, systemInstruction),
          }),
          90000,
        );

        const text = extractText(response);
        if (text) {
          result = text;
          recordAiMetric({ agent: 'clonagem-pro', provider: 'gemini', model, outcome: 'success', durationMs: Date.now() - startedAt });
          break;
        }
      } catch (error: any) {
        lastError = error;
        recordAiMetric({
          agent: 'clonagem-pro',
          provider: 'gemini',
          model,
          outcome: 'error',
          status: Number(error?.status || error?.code) || undefined,
          code: String(error?.name || error?.code || 'ERROR'),
          durationMs: Date.now() - startedAt,
        });
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
        'A chave de IA em uso foi recusada pelo Google (permissao negada). Crie uma chave nova em aistudio.google.com/app/apikey e coloque em Configuracoes.';
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
