import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const cleanText = (value: unknown, maxLength = 5000) =>
  String(value || '').trim().slice(0, maxLength);

const sendError = (res: any, status: number, error: string) =>
  res.status(status).json({ ok: false, error });

const getAIErrorMessage = (error: any) => {
  const message = String(error?.message || error || '').toLowerCase();

  if (error?.status === 429 || message.includes('quota') || message.includes('rate limit')) {
    return 'Limite de IA atingido agora. Tente novamente mais tarde.';
  }

  if (
    error?.status === 403 ||
    message.includes('permission') ||
    message.includes('api key') ||
    message.includes('suspended')
  ) {
    return 'A chave de IA do sistema recusou a geracao agora. Verifique a configuracao da API.';
  }

  if (message.includes('payload') || message.includes('too large') || message.includes('request entity')) {
    return 'A imagem ou o texto ficou grande demais. Use uma imagem menor e tente novamente.';
  }

  return 'Nao consegui gerar agora. Tente novamente em alguns instantes.';
};

const parseImage = (image: unknown) => {
  const dataUrl = String(image || '');
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!matches) return null;
  if (matches[2].length > 2_200_000) {
    throw new Error('image_too_large');
  }
  return { mimeType: matches[1], data: matches[2] };
};

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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Method not allowed');
    }

    const apiKey = await getActiveGeminiApiKey();
    if (!apiKey) {
      return sendError(res, 500, 'GEMINI_API_KEY is not configured');
    }

    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return sendError(res, 500, 'SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    const user = await checkAccess(serviceSupabase, req, res);
    if (!user) return;

    const agentId = cleanText(req.body?.agentId, 120);
    const values = req.body?.values && typeof req.body.values === 'object' ? req.body.values : {};
    const image = parseImage(req.body?.image);

    if (!agentId) {
      return sendError(res, 400, 'Agente nao informado.');
    }

    const { data: agent, error: agentError } = await serviceSupabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError || !agent) {
      return sendError(res, 404, 'Agente nao encontrado.');
    }

    let config: any;
    try {
      config = JSON.parse(agent.prompt || '{}');
    } catch {
      return sendError(res, 400, 'Este agente nao esta configurado como interno.');
    }

    if (config?.kind !== 'configurable_agent') {
      return sendError(res, 400, 'Este agente nao esta configurado como interno.');
    }

    const fields = Array.isArray(config.fields) ? config.fields : [];
    const requiredMissing = fields.find(
      (field: any) => field.required && !cleanText(values[field.key], 2000)
    );

    if (requiredMissing) {
      return sendError(res, 400, `Preencha: ${requiredMissing.label || requiredMissing.key}`);
    }

    const userInput = fields
      .map((field: any) => `${field.label || field.key}: ${cleanText(values[field.key], 3000) || 'Nao informado'}`)
      .join('\n');

    const prompt = `
${cleanText(config.masterPrompt, 12000)}

Dados preenchidos pelo aluno:
${userInput}

Regras finais:
- Responda em portugues brasileiro.
- Entregue direto o resultado final, pronto para copiar e usar.
- Nao explique que voce e uma IA.
- Se o pedido envolver imagem, use a imagem como referencia do produto/tema.
`.trim();

    const ai = new GoogleGenAI({ apiKey });
    const contents: any = image
      ? { parts: [{ inlineData: image }, { text: prompt }] }
      : prompt;

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents,
    });

    return res.status(200).json({
      ok: true,
      title: config.outputTitle || 'Resultado gerado',
      text: result.text || '',
    });
  } catch (error: any) {
    console.error('Configurable agent error:', error);
    const isImageTooLarge = String(error?.message || '').includes('image_too_large');
    return sendError(
      res,
      isImageTooLarge ? 413 : Number(error?.status || 500),
      isImageTooLarge ? 'A imagem ficou grande demais. Envie uma foto menor.' : getAIErrorMessage(error)
    );
  }
}

