import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type ScenarioKey = 'natural' | 'sensual' | 'provocative' | 'urban' | 'beach' | 'custom';

const technicalPrefix =
  'realistic natural human skin captured by a regular smartphone camera, sun-exposed uneven skin tone, subtle natural facial oil, slight sweat on forehead and around nose, mild under-eye darkness, natural asymmetry, soft irregular skin texture, slightly rough cheeks from sun and dust, darker tanned neck, realistic calloused dry hands, visible skin variation without exaggeration, pores only subtly visible at close distance, no skin smoothing, no beauty filter, no retouching, no waxy skin, no plastic skin, no CGI face, no doll-like face, no perfect symmetry, no glamorous skin, no over-sharpening, shot on a regular mid-range Android smartphone, vertical 9:16, handheld homemade recording, natural auto exposure, slight focus breathing, minor hand shake, normal mobile video compression, realistic smartphone sharpness, no cinematic lens, no studio lighting, no HDR look, no commercial polish, no beauty filter, no studio face, no polished skin, no fashion model face, no wax texture, no plastic face, no over-detailed pores, no CGI realism, no airbrushed skin, no artificial symmetry, ';

const technicalSuffix =
  ', 1 segundo final em silencio, mantendo contato visual, sem musica, sem texto na tela, sem legendas, sem emojis';

const scenarios: Record<ScenarioKey, { label: string; prompt: string; instruction: string }> = {
  natural: {
    label: 'Tradicional',
    prompt:
      'Mulher brasileira adulta de beleza deslumbrante, rosto angelical e harmonico, natural, corpo curvilineo perfeito e saudavel, aparencia real porem extremamente atraente, roupa simples: biquini, short jeans e top justo, sem luxo, sem marcas, cenario simples/rural: quintal, campo, roca, rio ou cozinha humilde, luz natural, sol bate em parte do seu corpo realcando sua pele radiante, camera fixa ou levemente tremida, enquadramento do peito para cima, direcao emocional: olhar direto para a camera, tom baixo, intimo, pausas naturais',
    instruction:
      'O tom deve ser emocional, intimo e rural, mantendo a simplicidade e a beleza estonteante da modelo adulta.',
  },
  sensual: {
    label: 'Sensual Brasileira',
    prompt:
      'Modelo brasileira adulta deslumbrante de beleza internacional, pele muito bronzeada com marcas de sol impecaveis, corpo curvilineo escultural, rosto simetrico com tracos marcantes, cabelos naturais sedosos levemente baguncados pelo vento, roupa: biquini reduzido de croche ou top de amarrar que valoriza o busto, cenario: beira de rio ou cercado de madeira na roca ao entardecer, luz dourada realcando as curvas perfeitas e o brilho da pele, olhar magnetico e profundo, sorriso cativante, presenca brasileira autentica, quente e belissima',
    instruction:
      'O tom deve ser envolvente, caloroso e levemente sensual, com foco maximo na beleza das curvas e no charme brasileiro da modelo adulta.',
  },
  provocative: {
    label: 'Sexy Mode',
    prompt:
      'Mulher brasileira adulta de beleza hipnotizante, rosto perfeito com olhar fatal, sensualidade intensa, presenca magnetica e provocativa, corpo curvilineo em destaque absoluto, silhueta escultural, roupa sexy e ousada: mini biquini revelador ou shorts curtissimos desabotoados e top decotado, sem marcas, cenario: interior de um celeiro rustico ou cachoeira isolada, luz dramatica de baixo contraste realcando a textura da pele perfeita e gotas de agua/suor, olhar sedutor e intenso fixo na lente, labios entreabertos e umidos, movimentos lentos e provocativos, respiracao levemente ofegante',
    instruction:
      'O tom deve ser significativamente mais sexy, provocativo e ousado. Foque em olhares intensos, clima intimo e beleza avassaladora da modelo adulta.',
  },
  urban: {
    label: 'Urbano/Paredao',
    prompt:
      "Modelo brasileira urbana adulta de beleza impactante, estilo 'mandraka' chique, tracos faciais definidos e belos, cabelos com luzes ou naturais bem cuidados e brilhantes, argolas grandes, roupa: short biker e top curto de marca esportiva ou biquini com jaqueta aberta, cenario: rua de comunidade com grafite colorido ao fundo ou perto de um paredao de som automotivo, luzes de neon ou por do sol urbano realcando sua beleza magnetica, olhar confiante e desafiador, batom marcante, atitude de quem manda na area com elegancia e beleza",
    instruction:
      'O tom deve ser confiante, direto e urbano, focando na beleza poderosa da modelo adulta e na atitude das ruas.',
  },
  beach: {
    label: 'Praia Tropical',
    prompt:
      "Mulher brasileira adulta de beleza radiante e solar, pele iluminada pelo sol e salitre, rosto fresco e encantador, cabelos molhados ou com efeito 'beach waves' natural, corpo bronzeado e tonificado, roupa: biquini de fita ou saida de praia transparente, cenario: areia branca, coqueiros ao fundo e mar azul cristalino, luz solar intensa realcando a beleza natural e a textura da pele impecavel, olhar relaxado e convidativo, sorriso leve e belo, movimentos fluidos e naturais",
    instruction:
      'O tom deve ser alegre, relaxado e solar, transmitindo a liberdade e a beleza estonteante da mulher adulta em um dia de praia.',
  },
  custom: {
    label: 'Personalizado',
    prompt: '',
    instruction:
      'Siga o estilo definido pelo usuario no cenario personalizado.',
  },
};

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 1800) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const parseImage = (image: unknown) => {
  const dataUrl = String(image || '');
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);

  if (!matches) return null;

  return {
    mimeType: matches[1],
    data: matches[2],
  };
};

const normalizeModes = (value: unknown): ScenarioKey[] => {
  if (!Array.isArray(value)) return ['natural'];

  const modes = value.filter((item): item is ScenarioKey =>
    ['natural', 'sensual', 'provocative', 'urban', 'beach', 'custom'].includes(String(item))
  );

  return modes.length ? modes.slice(0, 6) : ['natural'];
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

const buildSystemInstruction = (modes: ScenarioKey[], intenseMode: boolean, customScenario: string) => {
  const modeInstructions = modes.map((mode) => scenarios[mode].instruction).join('\n');

  return `
Voce e um gerador profissional de prompts para videos curtos virais em VEO3 e SORA.
Crie conteudo para publico adulto, linguagem brasileira natural e foco em engajamento e retencao emocional.

Regras obrigatorias:
- Todas as personagens devem ser adultas 21+.
- Nao gere nudez, ato sexual, menores de idade, erotizacao de menores ou linguagem explicita.
- Pode haver charme, confianca, sensualidade adulta intensa, provocacao e estetica +18 quando solicitado.
- Falas com 15 a 20 palavras, no maximo 8 segundos.
- Toda fala deve terminar com convite natural para seguir o perfil.
- Responda somente JSON valido no schema pedido.

Estilos selecionados:
${modeInstructions}

${intenseMode ? 'Modo Sexy: o tom deve ser extremamente mais sexy, provocativo e ousado. Foque em olhares intensos, clima intimo, roupas reduzidas e frases que desafiem o espectador em um tom baixo e sedutor.' : ''}
${customScenario ? `Detalhes personalizados do usuario: ${customScenario}` : ''}
`.trim();
};

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

  const selectedModes = normalizeModes(req.body?.selectedModes);
  const intenseMode = Boolean(req.body?.intenseMode);
  const customScenario = cleanText(req.body?.customScenario, 1200);
  const image = parseImage(req.body?.image);

  try {
    const parts: any[] = [
      {
        text: `
Crie 5 falas originais e envolventes para videos curtos.
Se houver imagem de referencia, descreva a pessoa de forma curta, respeitosa e objetiva.
Use os estilos selecionados: ${selectedModes.map((mode) => scenarios[mode].label).join(', ')}.
Retorne tambem uma descricao curta da referencia quando houver imagem.
`.trim(),
      },
    ];

    if (image) {
      parts.push({ inlineData: image });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: buildSystemInstruction(selectedModes, intenseMode, customScenario),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modelDescription: { type: Type.STRING },
            dialogues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['modelDescription', 'dialogues'],
        },
      },
    });

    if (!result.text) {
      return res.status(500).json({ error: 'Empty Gemini response' });
    }

    const parsed = JSON.parse(result.text);
    const dialogues = Array.isArray(parsed.dialogues) ? parsed.dialogues.slice(0, 5) : [];
    const modelDescription = cleanText(parsed.modelDescription, 280);

    const prompts = dialogues.map((dialogue: string, index: number) => {
      const mode = selectedModes[index % selectedModes.length];
      const scenario = scenarios[mode];
      const baseScenario =
        mode === 'custom' && customScenario
          ? customScenario
          : customScenario
            ? `${scenario.prompt}. Adicional: ${customScenario}`
            : scenario.prompt;
      const reference = modelDescription ? `referencia da pessoa: ${modelDescription}. ` : '';
      const intensity = intenseMode
        ? 'adicione: sensualidade extrema, olhar sedutor, roupa muito curta ou biquini revelador, labios umidos, movimentos lentos e provocativos, '
        : '';

      return {
        id: index,
        mode,
        modeLabel: scenario.label,
        text: `${technicalPrefix}${reference}${baseScenario}, ${intensity}a fala literal que ela dira: "${cleanText(
          dialogue,
          260
        )}"${technicalSuffix}`,
      };
    });

    return res.status(200).json({
      modelDescription,
      prompts,
    });
  } catch (error: any) {
    console.error('Menina da roca agent error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro ao gerar prompts.',
    });
  }
}
