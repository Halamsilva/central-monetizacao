import { GoogleGenAI } from '@google/genai';
import { describeGeminiError, getGeminiApiKeyCandidates } from './gemini-key.js';

const DEFAULT_GEMINI_FALLBACKS = [
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

type GeminiGatewayOptions = {
  fallbackModels?: string[];
  timeoutMs?: number;
  totalBudgetMs?: number;
};

type AiMetric = {
  agent: string;
  provider: string;
  model: string;
  outcome: 'success' | 'error' | 'empty' | 'invalid-json';
  durationMs: number;
  status?: number;
  code?: string;
};

export const recordAiMetric = (metric: AiMetric) => {
  // Never log prompts, completions, API keys, or user identifiers.
  console.info(`[ai-metric] ${JSON.stringify(metric)}`);
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, model: string) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(Object.assign(new Error(`Timeout de ${timeoutMs}ms no modelo ${model}.`), { code: 'TIMEOUT' }));
    }, timeoutMs);
    (timer as any).unref?.();
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

const hasOutput = (response: any) => {
  if (String(response?.text || '').trim() || response?.generatedImages?.length) return true;
  const parts = (response?.candidates || []).flatMap((candidate: any) => candidate?.content?.parts || []);
  return parts.some((part: any) => Boolean(part?.text || part?.inlineData?.data || part?.functionCall));
};

const hasValidJsonOutput = (response: any, request: any) => {
  if (request?.config?.responseMimeType !== 'application/json') return true;
  const text = String(response?.text || '').trim();
  if (!text) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

export const createGeminiGateway = (
  apiKeys: string | string[],
  agent: string,
  options: GeminiGatewayOptions = {},
) => {
  const keys = Array.from(
    new Set((Array.isArray(apiKeys) ? apiKeys : [apiKeys]).map((key) => String(key || '').trim()).filter(Boolean)),
  );
  const fallbacks = options.fallbackModels ?? DEFAULT_GEMINI_FALLBACKS;

  return {
    models: {
      generateContent: async (request: any) => {
        const requestedModel = String(request?.model || '').trim();
        const models = Array.from(new Set([requestedModel, ...fallbacks].filter(Boolean)));
        const deadline = Date.now() + (options.totalBudgetMs ?? 75000);
        const timeoutMs = options.timeoutMs ?? 25000;
        let lastError: any = null;
        let attempt = 0;

        for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
          const client = new GoogleGenAI({
            apiKey: keys[keyIndex],
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          for (const model of models) {
            const remaining = deadline - Date.now();
            if (remaining <= 0) break;
            attempt += 1;
            const startedAt = Date.now();

            try {
              const response = await withTimeout(
                client.models.generateContent({ ...request, model }),
                Math.min(timeoutMs, remaining),
                model,
              );

              if (!hasOutput(response) || !hasValidJsonOutput(response, request)) {
                const validJson = hasValidJsonOutput(response, request);
                lastError = new Error(validJson ? 'Resposta vazia do Gemini.' : 'O Gemini retornou JSON invalido.');
                recordAiMetric({
                  agent,
                  provider: 'gemini',
                  model,
                  outcome: validJson ? 'empty' : 'invalid-json',
                  durationMs: Date.now() - startedAt,
                });
                continue;
              }

              const durationMs = Date.now() - startedAt;
              try {
                Object.defineProperty(response, '__aiGateway', {
                  value: { provider: 'gemini', model, durationMs },
                  enumerable: false,
                });
              } catch {
                // SDK response can be immutable; metrics are still emitted below.
              }

              recordAiMetric({ agent, provider: 'gemini', model, outcome: 'success', durationMs });
              return response;
            } catch (error: any) {
              lastError = error;
              const description = describeGeminiError(error);
              const rawStatus = Number(error?.status || error?.code || 0);
              const status = Number.isFinite(rawStatus) && rawStatus > 0 ? rawStatus : undefined;
              const raw = String(error?.message || '');

              recordAiMetric({
                agent,
                provider: 'gemini',
                model,
                outcome: 'error',
                durationMs: Date.now() - startedAt,
                status,
                code: description.code,
              });

              const keyRejected =
                description.accessDenied ||
                status === 401 ||
                /API_KEY_INVALID|API key not valid|invalid api key/i.test(raw);
              if (keyRejected) break;

              const modelUnavailable = /NOT_FOUND|model.*not found|not supported/i.test(raw);
              if (!description.retryable && !modelUnavailable && status !== 400) throw error;
            }
          }

          if (Date.now() >= deadline) break;
        }

        throw lastError || new Error(`Nenhum modelo Gemini respondeu para ${agent}.`);
      },
    },
  };
};

export const createGeminiGatewayForUser = async (
  serviceSupabase: any,
  userId: string | undefined,
  agent: string,
  options: GeminiGatewayOptions = {},
) => {
  const apiKeys = await getGeminiApiKeyCandidates(serviceSupabase, userId);
  return apiKeys.length ? createGeminiGateway(apiKeys, agent, options) : null;
};
