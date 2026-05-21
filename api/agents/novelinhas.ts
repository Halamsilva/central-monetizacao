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
  const previousStory = toCleanString(body?.previousStory, 4500);

  return {
    prompt: `
Crie prompts cinematograficos separados para uma novelinha vertical viral.

Tema central: ${theme}
Pais/estilo cultural das falas: ${country}
Quantidade de cenas: ${scenes}
Tom narrativo: ${tone}
Contexto adicional: ${context || 'Nao informado'}
${previousStory ? `\nESTA E UMA CONTINUACAO (PARTE 2). Mantenha os personagens, roupas, ambiente e conflitos principais da historia anterior. Continue de onde parou.\nHISTORIA ANTERIOR:\n${previousStory}\n` : ''}

REGRAS CRITICAS:
1. Gere exatamente ${scenes} prompts principais, incluindo a CENA 00 como gancho.
2. Cada prompt deve ter uma unica fala principal. Nunca coloque duas falas longas no mesmo prompt.
3. Nunca passe de 3 personagens centrais.
4. A CENA 00 deve ser o gancho mais forte, feito para parar o scroll nos primeiros segundos.
5. Use conflito, curiosidade e viradas rapidas, mas evite discurso de odio real contra grupos protegidos. Em temas sensiveis, mostre o conflito como drama e consequencia, sem incentivar preconceito.
6. As falas devem refletir o idioma e estilo de ${country}. Se for EUA, falas em ingles. Se for Espanha ou Mexico, falas em espanhol. Se for Brasil, falas em portugues do Brasil.
7. Nao use markdown, nao use negrito, nao use tabela.
8. Nao cite que voce e uma IA.
9. Nao inclua texto, legenda, marca d'agua ou overlays no video.

PADRAO VISUAL OBRIGATORIO EM TODOS OS PROMPTS:
raw photo quality, 8k uhd, cinematic lighting, ultra-detailed skin texture, subsurface scattering, visible skin pores, fine facial hair, vellus hair, natural skin oils, subtle sweat, realistic eye reflection, microscopic fabric detail, depth of field f/1.8, natural imperfections, gritty realistic atmosphere, no text, no subtitles, no overlays, no watermark.

FORMATO OBRIGATORIO:
PROMPT GANCHO CHAMATIVO CENA 00:
DIALOGO SUGERIDO: "[fala principal de aproximadamente 8 segundos]"
INSTRUCOES VISUAIS:
CENA: ambiente, luz, camera, clima e acao visual.
PERSONAGENS:
Nome: nome do personagem.
DESCRICAO VISUAL: idade, etnia, corpo, pele, olhos, cabelo, roupas, textura do tecido, marcas reais, suor ou oleosidade natural.
POSTURA: postura corporal e ocupacao do espaco.
PERFIL PSICOLOGICO: estado mental e emocao profunda.
MOTIVACAO: o que o personagem quer agora.
MEDO: o que o personagem tenta evitar.
FALA: repita a fala no idioma de ${country}.

PROMPT CENA 1:
DIALOGO SUGERIDO: "[fala principal de aproximadamente 8 segundos]"
INSTRUCOES VISUAIS:
CENA:
PERSONAGENS:
Nome:
DESCRICAO VISUAL:
POSTURA:
PERFIL PSICOLOGICO:
MOTIVACAO:
MEDO:
FALA:

Continue nesse mesmo formato ate PROMPT CENA ${Math.max(1, scenes - 1)}.

Depois dos prompts, escreva exatamente:
---SEO-START---
SEO:
TITULO:
DESCRICAO:
HASHTAGS:

Por fim, inclua:
PROMPT CENA EXTRA DE GANCHO:
PROMPT EXTRA DE CTA:
`.trim(),
    systemInstruction:
      'Voce e um agente especialista em prompts cinematograficos realistas para videos verticais virais. Sua resposta deve vir em blocos separados por cena, pronta para copiar e colar em geradores de video.',
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
