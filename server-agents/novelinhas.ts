import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

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
    return `2D graphic novel style, dramatic cartoon illustration, thick dark ink outlines, high contrast shading, high-impact highlights, hand-drawn digital painting texture, comic book ink detailing, stylized expressive features, dramatic atmospheric shadows, cinematic camera motion, no text, no subtitles, no overlays, no watermark.`;
  }

  if (isAnimation) {
    return `3D animation style, Pixar/Disney/Dreamworks quality, cute expressive character design, detailed textures, vibrant colors, soft cinematic lighting, 8k render, no text, no subtitles, no watermark.`;
  }

  if (level === 'extreme') {
    return `raw documentary photography, ultra-detailed human skin texture, visible micro-pores, tiny blemishes, small scars, fine wrinkles, natural asymmetry, natural skin oils, sweat droplets, fine facial hair, eyelash roots, realistic subsurface scattering, no beauty filters, no plastic skin, no text, no subtitles, no watermark.`;
  }

  if (level === 'ultimate') {
    return `supreme high-fidelity human skin texture, hyper-realistic open skin pores, fine skin ridges, microscopic skin texture wrinkles, freckles, sunspots, vellus peach fuzz on cheeks and jawline backlit by cinematic key light, visible sweat beads trickling down forehead, neck and temple, natural oily glow, natural flushes or redness, physically accurate translucency and subsurface scattering, raw photo quality, Arri Alexa LF, Master Anamorphic prime lens, gritty dramatic documentary, zero composition smoothing or AI-look, no text, no subtitles, no overlays, no watermark.`;
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
  const visualMode = /cartoon/i.test(theme)
    ? '"2D graphic novel style", "bold outlines", "comic illustration"'
    : '"raw photo quality", "visible skin pores", "cinematic lighting"';

  return {
    prompt: `
Crie prompts cinematográficos separados para uma novelinha vertical viral, com profundidade psicológica, diálogos naturais e clímax emocional de altíssimo impacto.

Tema central: ${theme}
País/estilo cultural das falas: ${country}
Quantidade de cenas: ${scenes}
Tom narrativo: ${tone}
Emoção principal a provocar no público: ${emotion}
Contexto adicional: ${context || 'Não informado'}
${previousStory ? `\nESTA É UMA CONTINUAÇÃO (PARTE 2). Mantenha os personagens, roupas, ambiente e conflitos principais da história anterior. Continue de onde parou.\nHISTÓRIA ANTERIOR:\n${previousStory}\n` : ''}

REGRAS CRÍTICAS DE ARTE E ROTEIRO:
1. Gere exatamente ${scenes} prompts de cena principais, incluindo o PROMPT GANCHO CHAMATIVO CENA 00.
2. Cada fala deve estar em um prompt único. Nunca coloque mais de uma fala longa no mesmo prompt.
3. Nunca passe de 3 personagens centrais.
4. A CENA 00 deve mostrar mais de um personagem em confronto ou interação direta, com impacto brutal para parar o scroll.
5. Evite histórias superficiais ou previsíveis. Traga dores humanas reais, orgulho ferido, injustiça, segredo guardado, milagre, redenção ou reviravolta chocante.
6. As falas devem refletir o idioma, dialeto e estilo de ${country}. Se for Estados Unidos, falas em inglês. Se for Espanha ou México, falas em espanhol. Se for Brasil, falas em português do Brasil.
7. As falas devem ser cruas, diretas, realistas, afiadas e naturais, com subtexto e hesitações humanas. Não use linguagem poética ou robótica.
8. Toda linha de fala deve ter aspas duplas e pontuação final dentro das aspas.
9. Não use markdown, não use negrito, não use tabela e não cite que você é uma IA.
10. Não inclua texto, legenda, título, marca d'água ou overlays no vídeo.
11. Cada cena deve conectar causalmente com a anterior: gancho, desenvolvimento, escalada, clímax e cliffhanger.
12. Em todo diálogo, o falante e o ouvinte devem manter contato visual direto, olho no olho, sem olhar para o vazio, lados ou fora da tela.
13. Antes de cada fala, inclua exatamente: IDENTIFICAÇÃO DO ORADOR: [Sexo], [Descrição física simplificada], vestindo [Cor e tipo de roupa].
14. Não use narrador em off nas cenas principais. Narrador só pode aparecer no PROMPT EXTRA DE CTA.
15. A última cena principal deve ser o grande impacto: descoberta devastadora, plot twist, milagre, confissão, decisão moral desesperadora ou cliffhanger máximo.
16. Descreva reações físicas fortes: olhos úmidos, lábios trêmulos, respiração suspensa, dentes cerrados, pupilas dilatadas, silêncio pesado, choque ou alívio.
17. Inclua em cada cena um PROMPT DE IMAGEM em inglês, otimizado para Midjourney/Flux, descrevendo a composição visual da cena sem textos ou marcas.

REGRAS DO TEMA:
${themeRules}

DIREÇÃO EMOCIONAL:
A história, os diálogos, os confrontos verbais, as microexpressões, a paleta de cores e o ritmo devem maximizar a emoção: ${emotion}. O público precisa sentir essa emoção de forma clara.

PADRÃO VISUAL OBRIGATÓRIO EM TODOS OS PROMPTS:
${skinRules}
Clothing with microscopic fabric detail, cinematic camera language, depth of field, believable environment, realistic eye reflections, no text, no subtitles, no overlays, no watermark.

RESTRIÇÕES VISUAIS:
Evitar: ${/cartoon/i.test(theme) ? 'realismo fotorrealista documental, pele realista demais, ' : 'cartoon, '}anime, pele plástica, render 3D quando não for tema Infantil/Frutas, texto, legendas, marcas d'água.

FORMATO OBRIGATÓRIO:
PROMPT GANCHO CHAMATIVO CENA 00:
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
PROMPT DE IMAGEM: [prompt de imagem hiper-detalhado em inglês, com personagens, expressões faciais, roupas, enquadramento de câmera, iluminação cinemática, tom de pele e atmosfera profunda, sem texto, sem legenda e sem marca d'água]

PROMPT CENA 1:
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
PROMPT DE IMAGEM: [prompt de imagem hiper-detalhado em inglês, sem texto, sem legenda e sem marca d'água]

Continue nesse mesmo formato até PROMPT CENA ${Math.max(1, scenes - 1)}.
Repita toda a estrutura em cada prompt, mesmo que o personagem já tenha aparecido. Reforce obsessivamente ${visualMode} e "no text, no subtitles" em todos os prompts.

ESTRUTURA DA RESPOSTA:
1. PROMPT GANCHO CHAMATIVO CENA 00: impacto extremo e impossível de ignorar.
2. PROMPT CENA 1 até PROMPT CENA ${Math.max(1, scenes - 3)}: desenvolvimento do conflito.
3. PROMPT CENA ${Math.max(1, scenes - 2)}: clímax ou twist.
4. PROMPT CENA ${Math.max(1, scenes - 1)}: cliffhanger máximo com final impactante.
5. ---SEO-START---
6. SEO no mesmo idioma e estilo de ${country}.
7. PROMPT CENA EXTRA DE GANCHO.
8. PROMPT EXTRA DE CTA com narrador em off.

Depois dos prompts, escreva exatamente:
---SEO-START---
SEO:
TITULO:
DESCRICAO:
HASHTAGS:

Por fim, inclua:
PROMPT CENA EXTRA DE GANCHO:
PROMPT EXTRA DE CTA:
O PROMPT EXTRA DE CTA deve ser dito por um narrador com voz grossa de pessoa real, no idioma de ${country}, com a mensagem: "Deixe o like, siga o perfil e comente 'parte 2' para assistir ao próximo episódio deste vídeo."
`.trim(),
    systemInstruction:
      'Você é um roteirista e diretor de cinema especialista em prompts cinematográficos realistas para vídeos verticais virais. A resposta deve vir em blocos separados por cena, pronta para copiar e colar em geradores de vídeo.',
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = await getActiveGeminiApiKey();
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

