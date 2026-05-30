import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 5000) =>
  String(value || '').trim().slice(0, maxLength);

const parseImage = (image: unknown) => {
  const dataUrl = String(image || '');
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!matches) return null;
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  const agentId = cleanText(req.body?.agentId, 120);
  const values = req.body?.values && typeof req.body.values === 'object' ? req.body.values : {};
  const image = parseImage(req.body?.image);

  if (!agentId) {
    return res.status(400).json({ error: 'Agente nao informado.' });
  }

  const { data: agent, error: agentError } = await serviceSupabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .maybeSingle();

  if (agentError || !agent) {
    return res.status(404).json({ error: 'Agente nao encontrado.' });
  }

  let config: any;
  try {
    config = JSON.parse(agent.prompt || '{}');
  } catch {
    return res.status(400).json({ error: 'Este agente nao esta configurado como interno.' });
  }

  if (config?.kind !== 'configurable_agent') {
    return res.status(400).json({ error: 'Este agente nao esta configurado como interno.' });
  }

  const fields = Array.isArray(config.fields) ? config.fields : [];
  const requiredMissing = fields.find(
    (field: any) => field.required && !cleanText(values[field.key], 2000)
  );

  if (requiredMissing) {
    return res.status(400).json({ error: `Preencha: ${requiredMissing.label || requiredMissing.key}` });
  }

  const userInput = fields
    .map((field: any) => `${field.label || field.key}: ${cleanText(values[field.key], 3000) || 'Nao informado'}`)
    .join('\n');

  const prompt = `
${cleanText(config.masterPrompt, 12000)}

Dados preenchidos pelo aluno:
${userInput}

Responda em portugues brasileiro, de forma organizada, pronta para copiar e usar.
`.trim();

  try {
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
    return res.status(error.status || 500).json({
      error: error.status === 429 ? 'Limite de IA atingido agora. Tente novamente mais tarde.' : error.message || 'Erro ao gerar resposta.',
    });
  }
}
