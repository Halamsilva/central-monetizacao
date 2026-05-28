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

const buildSkinRules = (level: string, theme: string) => {
  const isCartoon = /cartoon/i.test(theme);
  const isAnimation = /infantil|frutas/i.test(theme);

  if (isCartoon) {
    return `2D graphic novel style, dramatic cartoon illustration, thick dark ink outlines, textured digital painting, expressive faces, high contrast moonlit lighting, cinematic camera motion, no text, no subtitles, no watermark.`;
  }

  if (isAnimation) {
    return `3D animation style, Pixar/Disney/Dreamworks quality, cute expressive character design, detailed textures, vibrant colors, soft cinematic lighting, 8k render, no text, no subtitles, no watermark.`;
  }

  if (level === 'extreme') {
    return `raw documentary photography, ultra-detailed human skin texture, visible micro-pores, tiny blemishes, small scars, fine wrinkles, natural asymmetry, natural skin oils, sweat droplets, fine facial hair, eyelash roots, realistic subsurface scattering, no beauty filters, no plastic skin, no text, no subtitles, no watermark.`;
  }

  if (level === 'ultimate') {
    return `supreme high-fidelity human skin texture, hyper-realistic open skin pores, fine skin ridges, freckles, sunspots, vellus peach fuzz on cheeks and jawline, visible sweat beads on forehead and neck, natural oily glow, physically accurate translucency, raw photo quality, Arri Alexa LF, Master Anamorphic prime lens, ultra-shallow depth of field f/1.4, gritty dramatic documentary, no AI-look, no text, no subtitles, no watermark.`;
  }

  return `raw photo quality, 8k uhd, cinematic lighting, realistic skin texture, visible pores, natural lighting, subtle imperfections, no plastic skin, no text, no subtitles, no watermark.`;
};

const buildThemeRules = (theme: string) => {
  const lower = theme.toLowerCase();
  const rules: string[] = [];

  if (lower.includes('dorama')) {
    rules.push('DORAMA: personagens coreanos, nomes coreanos, estética de drama sul-coreano, tensão romântica ou familiar, gestos contidos e olhar emocional intenso.');
  }

  if (lower.includes('gregos') || lower.includes('grega')) {
    rules.push('DEUSES GREGOS: use deuses do Olimpo como personagens, roupas inspiradas na Grécia Antiga, adornos de ouro e drama épico moderno.');
  }

  if (lower.includes('infantil')) {
    rules.push('INFANTIL: história adequada para crianças, aventura, amizade e lição moral. Visual em animação 3D premium, sem conflito pesado ou violência.');
  }

  if (lower.includes('jesus') || lower.includes('ressurrei') || lower.includes('religioso')) {
    rules.push(`VIDA DE JESUS: ambientação na Judeia do século I, figuras bíblicas, luz divina volumétrica e milagres com reverência. Jesus deve ser descrito como homem do Oriente Médio do século I, cerca de 33 anos, pele oliva bronzeada, traços semitas, olhos castanhos profundos, cabelos castanho-escuros longos até os ombros, barba cheia irregular, túnica simples de linho cru bege envelhecido, mãos calejadas de carpinteiro e aparência histórica autêntica.`);
  }

  if (lower.includes('roça') || lower.includes('rural') || lower.includes('fazenda')) {
    rules.push('ROÇA: fazendas, plantações, estradas de terra, pele queimada de sol, mãos calejadas, roupas de trabalho rural, botas sujas e dialeto caipira/interiorano.');
  }

  if (lower.includes('comédia') || lower.includes('comedia')) {
    rules.push('COMÉDIA BRASILEIRA: humor popular, personagens expressivos, mal-entendidos, gírias brasileiras naturais e situações de quiproquó.');
  }

  if (lower.includes('soldado') || lower.includes('guerra')) {
    rules.push('SOLDADO VOLTANDO DA GUERRA: trauma, olhar distante, uniforme gasto, poeira, cicatrizes não gráficas, reintegração difícil, melancolia e reencontro emocional.');
  }

  if (lower.includes('frutas')) {
    rules.push('FRUTAS: personagens CGI estilo Pixar com cabeça literal de fruta e corpo humanoide em cenário real/documental. Use no máximo 3 personagens entre banana, melancia, maçã, abacaxi e morango.');
  }

  if (lower.includes('tempo')) {
    rules.push('VIAGEM NO TEMPO: use anacronismos, eras diferentes, paradoxos e reação dos personagens diante de tecnologia ou costumes fora de época.');
  }

  if (lower.includes('cartoon')) {
    rules.push('CARTOON EMOCIONANTE: visual 2D de novela gráfica, contornos escuros, cenário dramático com luar, câmera compatível com Veo 3, movimento simples e expressivo.');
  }

  if (lower.includes('brasileiros') || lower.includes('reais')) {
    rules.push('BRASILEIROS REAIS: retrate trabalhadores, mães batalhadoras, feirantes, entregadores, motoristas, periferia, casas simples, ruas brasileiras e diálogos populares autênticos.');
  }

  if (lower.includes('animal')) {
    rules.push('CAUSA ANIMAL: resgate ou defesa de animal vulnerável, sem violência gráfica, sem ferimentos sangrentos. Use perigo iminente, confronto ético e reviravolta heroica.');
  }

  if (lower.includes('drama') || lower.includes('novelinha') || lower.includes('superação')) {
    rules.push('DRAMA/NOVELINHA: foco em superação, cura emocional, redenção, esperança, choro realista e final com forte vontade de ver a continuação.');
  }

  return rules.length ? rules.join('\n') : 'Siga o tema solicitado com realismo cultural, drama humano e virada emocional forte.';
};

const buildNovelinhasPrompt = (body: any) => {
  const theme = toCleanString(body?.theme, 120) || 'Dramas Emocionantes';
  const country = toCleanString(body?.country, 60) || 'Brasil';
  const scenes = clampScenes(body?.scenes);
  const context = toCleanString(body?.context, 900);
  const tone = toCleanString(body?.tone, 80) || 'dramático e ultra-realista';
  const emotion = toCleanString(body?.emotion, 60) || 'Empatia';
  const skinRealism = toCleanString(body?.skinRealism, 30) || 'ultimate';
  const previousStory = toCleanString(body?.previousStory, 4500);
  const skinRules = buildSkinRules(skinRealism, theme);
  const themeRules = buildThemeRules(theme);

  return {
    prompt: `
Crie prompts cinematográficos separados para uma novelinha vertical viral.

Tema central: ${theme}
País/estilo cultural das falas: ${country}
Quantidade de cenas: ${scenes}
Tom narrativo: ${tone}
Emoção principal a provocar no público: ${emotion}
Contexto adicional: ${context || 'Não informado'}
${previousStory ? `\nESTA É UMA CONTINUAÇÃO (PARTE 2). Mantenha os personagens, roupas, ambiente e conflitos principais da história anterior. Continue de onde parou.\nHISTÓRIA ANTERIOR:\n${previousStory}\n` : ''}

REGRAS CRÍTICAS:
1. Gere exatamente ${scenes} prompts principais, incluindo a CENA 00 como gancho.
2. Cada prompt deve ter uma única fala principal. Nunca coloque duas falas longas no mesmo prompt.
3. Nunca passe de 3 personagens centrais.
4. A CENA 00 deve mostrar mais de um personagem em confronto ou interação direta, com impacto imediato para parar o scroll.
5. Use conflito, curiosidade e viradas rápidas. Em temas sensíveis, mostre o conflito como drama e consequência, sem incentivar preconceito real contra grupos protegidos.
6. As falas devem refletir o idioma e estilo de ${country}. Se for Estados Unidos, falas em inglês. Se for Espanha ou México, falas em espanhol. Se for Brasil, falas em português do Brasil.
7. As falas devem ser cruas, diretas, realistas e naturais. Não use linguagem poética ou artificial.
8. Toda linha de fala deve ter aspas duplas e pontuação final dentro das aspas.
9. Não use markdown, não use negrito, não use tabela.
10. Não cite que você é uma IA.
11. Não inclua texto, legenda, marca d'água ou overlays no vídeo.
12. Cada cena deve conectar causalmente com a anterior: gancho, desenvolvimento, escalada, clímax e cliffhanger.
13. Em todo diálogo, o falante e o ouvinte devem manter contato visual direto.
14. Antes de cada fala, inclua exatamente: IDENTIFICAÇÃO DO ORADOR: [Sexo], [Descrição física simplificada], vestindo [Cor e tipo de roupa].
15. Não use narrador em off nas cenas principais. Narrador só pode aparecer no PROMPT EXTRA DE CTA.

REGRAS DO TEMA:
${themeRules}

DIREÇÃO EMOCIONAL:
A história, os diálogos, as microexpressões, a paleta e o ritmo devem maximizar a emoção: ${emotion}. Use reações físicas visíveis como hesitação, respiração presa, olhos marejados, dentes cerrados, sorriso nervoso, silêncio pesado ou alívio, conforme fizer sentido.

PADRÃO VISUAL OBRIGATÓRIO EM TODOS OS PROMPTS:
${skinRules}
Clothing with microscopic fabric detail, cinematic camera language, depth of field, believable environment, realistic eye reflections, no text, no subtitles, no overlays, no watermark.

FORMATO OBRIGATÓRIO:
PROMPT GANCHO CHAMATIVO CENA 00:
DIÁLOGO SUGERIDO: "[fala principal de aproximadamente 8 segundos]"
INSTRUÇÕES VISUAIS:
CENA: ambiente, luz, câmera, clima e ação visual.
PERSONAGENS:
Nome: nome do personagem.
DESCRIÇÃO VISUAL: idade, etnia, corpo, pele, olhos, cabelo, roupas, textura do tecido, marcas reais, suor ou oleosidade natural.
POSTURA: postura corporal e ocupação do espaço.
PERFIL PSICOLÓGICO: estado mental e emoção profunda.
MOTIVAÇÃO: o que o personagem quer agora.
MEDO: o que o personagem tenta evitar.
IDENTIFICAÇÃO DO ORADOR: [Sexo], [Descrição física simplificada], vestindo [Cor e tipo de roupa]
[Nome do Personagem] fala no idioma e estilo de ${country}: "[fala principal com pontuação final dentro das aspas]"

PROMPT CENA 1:
DIÁLOGO SUGERIDO: "[fala principal de aproximadamente 8 segundos]"
INSTRUÇÕES VISUAIS:
CENA:
PERSONAGENS:
Nome:
DESCRIÇÃO VISUAL:
POSTURA:
PERFIL PSICOLÓGICO:
MOTIVAÇÃO:
MEDO:
IDENTIFICAÇÃO DO ORADOR: [Sexo], [Descrição física simplificada], vestindo [Cor e tipo de roupa]
[Nome do Personagem] fala no idioma e estilo de ${country}: "[fala principal com pontuação final dentro das aspas]"

Continue nesse mesmo formato até PROMPT CENA ${Math.max(1, scenes - 1)}.

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
      'Você é um agente especialista em prompts cinematográficos realistas para vídeos verticais virais. Sua resposta deve vir em blocos separados por cena, pronta para copiar e colar em geradores de vídeo.',
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
