import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const toCleanString = (value: unknown, maxLength = 600) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const clampScenes = (value: unknown) => {
  const scenes = Number(value);
  if (!Number.isFinite(scenes)) return 6;
  return Math.min(60, Math.max(4, Math.round(scenes)));
};

const buildNovelinhasPrompt = (body: any) => {
  const theme = toCleanString(body?.theme, 80) || 'Drama emocionante';
  const country = toCleanString(body?.country, 60) || 'Brasil';
  const scenes = clampScenes(body?.scenes);
  const context = toCleanString(body?.context, 900);
  const tone = toCleanString(body?.tone, 80) || 'dramatico e ultra-realista';

  return {
    prompt: `
Crie um roteiro completo para uma novelinha vertical viral.

Tema central: ${theme}
Pais/estilo cultural das falas: ${country}
Quantidade de cenas: ${scenes}
Tom narrativo: ${tone}
Contexto adicional: ${context || 'Nao informado'}

Formato obrigatório:
1. Titulo forte.
2. Logline curta.
3. Personagens principais com motivacao clara.
4. Roteiro cena por cena, numerado de 1 a ${scenes}.
5. Em cada cena inclua:
   - Local da cena.
   - Acao visual.
   - Falas curtas e naturais.
   - Emocao principal.
   - Gancho para a proxima cena.
6. Final com virada emocional.
7. Sugestao de legenda curta para TikTok/Reels.
8. Sugestao de texto na tela para os 3 primeiros segundos.

Regras:
- Escreva em portugues do Brasil quando o pais for Brasil.
- Evite respostas genericas.
- Deixe o roteiro pronto para gravacao.
- Use conflito, curiosidade e viradas a cada cena.
- Nao cite que voce e uma IA.
`.trim(),
    systemInstruction:
      'Voce e um roteirista senior especializado em novelinhas verticais virais para TikTok, Reels e Shorts. Gere roteiros emocionais, claros e prontos para producao, com falas naturais e ritmo de retencao alto.',
  };
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

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: 'Failed to check access' });
  }

  const canUseAgent =
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUseAgent) {
    return res.status(403).json({ error: 'Access not released' });
  }

  try {
    const { prompt, systemInstruction } = buildNovelinhasPrompt(req.body);
    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction },
    });

    return res.status(200).json({ text: result.text || '' });
  } catch (error: any) {
    console.error('Novelinhas agent error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate script' });
  }
}
