import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const narrativeSteps = [
  { type: 'materia_prima', label: 'Materia-prima ou Lixo' },
  { type: 'preparacao', label: 'Preparacao' },
  { type: 'transformacao', label: 'Transformacao' },
  { type: 'manipulacao', label: 'Manipulacao' },
  { type: 'moldagem', label: 'Moldagem' },
  { type: 'revelacao', label: 'Revelacao' },
  { type: 'producao', label: 'Producao' },
  { type: 'transporte', label: 'Transporte' },
  { type: 'instalacao_uso', label: 'Instalacao ou Uso Final' },
  { type: 'resultado_final', label: 'Resultado Final' },
];

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 2000) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const clampQuantity = (value: unknown) => {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 10;
  return Math.min(10, Math.max(2, Math.round(quantity)));
};

const getActiveSteps = (quantity: number) => {
  if (quantity >= narrativeSteps.length) return narrativeSteps;
  if (quantity <= 2) return [narrativeSteps[0], narrativeSteps[narrativeSteps.length - 1]];

  const result = [narrativeSteps[0]];

  for (let index = 1; index < quantity - 1; index += 1) {
    const exactIndex = 1 + (index * (narrativeSteps.length - 2)) / (quantity - 1);
    const roundedIndex = Math.round(exactIndex);
    const step = narrativeSteps[Math.min(narrativeSteps.length - 2, Math.max(1, roundedIndex))];

    if (!result.includes(step)) result.push(step);
  }

  result.push(narrativeSteps[narrativeSteps.length - 1]);
  return result.slice(0, quantity);
};

const checkAccess = async (req: any, res: any) => {
  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' });
    return null;
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Failed to check access' });
    return null;
  }

  const canUseAgent =
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUseAgent) {
    res.status(403).json({ error: 'Access not released' });
    return null;
  }

  return user;
};

const sceneSchema = {
  type: Type.OBJECT,
  required: [
    'sceneNumber',
    'stepType',
    'stepLabel',
    'title',
    'visualDescription',
    'asmrAudio',
    'cameraMovement',
    'continuity',
    'optimizedPrompt',
  ],
  properties: {
    sceneNumber: { type: Type.INTEGER },
    stepType: { type: Type.STRING },
    stepLabel: { type: Type.STRING },
    title: { type: Type.STRING },
    visualDescription: { type: Type.STRING },
    asmrAudio: { type: Type.STRING },
    cameraMovement: { type: Type.STRING },
    continuity: { type: Type.STRING },
    optimizedPrompt: { type: Type.STRING },
  },
};

const buildGeneratePrompt = (body: any) => {
  const material = cleanText(body?.material, 180) || 'Tampinhas e plastico reciclavel';
  const outcome = cleanText(body?.outcome, 180) || 'Mesa lateral loft industrial';
  const characterDescription =
    cleanText(body?.characterDescription, 500) ||
    'Um artesao de maos firmes e calejadas com roupas simples de trabalho de algodao escuro';
  const customContext =
    cleanText(body?.customContext, 600) ||
    'Iluminacao natural dramatica de entardecer com poeira organica suspensa no ar';
  const customTransformIdea = cleanText(body?.customTransformIdea, 900);
  const promptQuantity = clampQuantity(body?.promptQuantity);
  const activeSteps = getActiveSteps(promptQuantity);

  return {
    promptQuantity,
    prompt: `
Gere um roteiro completo de transformacao artesanal cinematografica em JSON contendo exatamente ${promptQuantity} cenas.

Informacoes do projeto:
- Materia-prima/lixo principal: ${material}
- Produto final visado: ${outcome}
- Descricao do personagem artesao: ${characterDescription}
- Contexto visual/atmosfera: ${customContext}
- Ideia livre do usuario: ${customTransformIdea || 'Nenhuma direcao adicional.'}

Etapas obrigatorias:
${activeSteps.map((step, index) => `Cena ${index + 1}: ${step.label} (${step.type})`).join('\n')}

REGRAS CRITICAS:
1. Retorne exatamente ${promptQuantity} cenas, na ordem cronologica.
2. O estilo deve ser documental realista, satisfatorio, artesanal, para TikTok/Reels.
3. Mostre transformacao fisica real: cortar, lixar, derreter, moldar, prensar, limpar, montar, polir ou testar.
4. Sem dialogo e sem musica. O foco sonoro e ASMR realista: atrito, lixa, estalos, poeira, metal, madeira, plastico, concreto, vidro ou ferramenta.
5. Use continuidade visual absoluta do protagonista: roupas, maos, pele, acessorios, ferramentas e ambiente devem permanecer coerentes.
6. Inclua poros visiveis, suor natural, unhas imperfeitas, marcas de poeira e esforco fisico nas maos/bracos quando houver pessoa em cena.
7. Ambiente vivo e usado: poeira no ar, ferramentas gastas, ferrugem, rachaduras, bancada marcada, luz natural entrando lateralmente.
8. Camera handheld de smartphone real, foco respirando, tremor leve natural e profundidade curta.
9. A ultima cena deve mostrar o produto final "${outcome}" acabado, polido, testado ou exibido com conclusao clara.
10. O campo optimizedPrompt deve estar em ingles, pronto para Sora, Veo, Runway, Kling ou Luma, incluindo "no text, no subtitles, no watermark".
11. Os demais campos devem estar em Portugues do Brasil.

Retorne apenas JSON valido.
`.trim(),
    systemInstruction:
      'Voce e um diretor cinematografico de documentarios reais de altissimo nivel, especializado em prompts de transformacao artesanal, reciclagem, ASMR e videos satisfatorios hiper-realistas.',
  };
};

const buildParsePrompt = (idea: string) => ({
  prompt: `Analise esta ideia de video de transformacao artesanal e extraia parametros estruturados: "${idea}"`,
  systemInstruction:
    'Voce e um assistente tecnico de criacao de videos de transformacao, reciclagem, marcenaria e artesanato. Responda em Portugues do Brasil, de forma direta e pronta para preencher formulario.',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const user = await checkAccess(req, res);
  if (!user) return;

  const action = cleanText(req.body?.action, 40) || 'generate';
  const genAI = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  try {
    if (action === 'parse') {
      const idea = cleanText(req.body?.idea, 900);
      if (!idea) {
        return res.status(400).json({ error: 'Descreva sua ideia para a IA configurar.' });
      }

      const { prompt, systemInstruction } = buildParsePrompt(idea);
      const result = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: ['material', 'outcome', 'characterDescription', 'customContext'],
            properties: {
              material: { type: Type.STRING },
              outcome: { type: Type.STRING },
              characterDescription: { type: Type.STRING },
              customContext: { type: Type.STRING },
            },
          },
        },
      });

      return res.status(200).json({ config: JSON.parse(result.text || '{}') });
    }

    const { prompt, systemInstruction, promptQuantity } = buildGeneratePrompt(req.body);
    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['scenes'],
          properties: {
            scenes: {
              type: Type.ARRAY,
              minItems: promptQuantity,
              maxItems: promptQuantity,
              items: sceneSchema,
            },
          },
        },
      },
    });

    const data = JSON.parse(result.text || '{}');
    return res.status(200).json({ scenes: Array.isArray(data.scenes) ? data.scenes : [] });
  } catch (error: any) {
    console.error('Transformacao videos agent error:', error);
    const message =
      error.status === 429 || error.message?.includes('429')
        ? 'Limite de uso da IA atingido agora. Tente novamente mais tarde.'
        : error.message || 'Nao foi possivel gerar o roteiro.';

    return res.status(error.status || 500).json({ error: message });
  }
}
