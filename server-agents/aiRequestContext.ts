import { AsyncLocalStorage } from 'node:async_hooks';

type AiRequestContext = { req: any; res: any; agent: string };

const storage = new AsyncLocalStorage<AiRequestContext>();

const quotaNotice =
  'A cota gratuita da sua chave pessoal de IA atingiu o limite. Esta geração pode ter usado uma chave alternativa. Para evitar interrupções, cadastre outra chave em Configurações > Chave de IA.';

export const runWithAiRequestContext = <T>(context: AiRequestContext, callback: () => T): T => {
  const originalJson = context.res?.json?.bind(context.res);

  if (originalJson) {
    context.res.json = (payload: any) => {
      if (context.req?.aiStudentKeyQuotaExceeded && payload && typeof payload === 'object' && !Array.isArray(payload)) {
        payload = { ...payload, aiWarning: quotaNotice };
      }
      return originalJson(payload);
    };
  }

  return storage.run(context, callback);
};

export const markStudentGeminiQuotaExceeded = (apiKey: string) => {
  const context = storage.getStore();
  const studentKey = String(context?.req?.aiStudentGeminiApiKey || '');

  if (!context || !studentKey || apiKey !== studentKey) return;

  context.req.aiStudentKeyQuotaExceeded = true;
  recordQuotaNotice(context.agent);
};

const recordQuotaNotice = (agent: string) => {
  console.info(`[ai-metric] ${JSON.stringify({ agent, provider: 'gemini', outcome: 'student-key-quota-warning' })}`);
};
