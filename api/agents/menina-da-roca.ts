import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type ScenarioKey = 'natural' | 'sensual' | 'urban' | 'beach' | 'custom';

const technicalPrefix =
  'realistic natural human skin captured by a regular smartphone camera, vertical 9:16, handheld homemade recording, natural auto exposure, slight focus breathing, minor hand shake, normal mobile video compression, realistic smartphone sharpness, no studio lighting, no HDR look, no commercial polish, no beauty filter, no retouching, no CGI face, no doll-like face, no text overlay, no subtitles, no emojis, ';

const technicalSuffix =
  ', 1 segundo final em silencio, mantendo contato visual, sem musica, sem texto na tela, sem legendas, sem emojis';

const scenarios: Record<ScenarioKey, { label: string; prompt: string; instruction: string }> = {
  natural: {
    label: 'Tradicional',
    prompt:
      'mulher brasileira adulta 21+, beleza natural, carisma rural, roupa simples e decente, quintal, campo, roca, rio ou cozinha humilde, luz natural, camera fixa ou levemente tremida, olhar direto para a camera, tom baixo, intimo e emocional',
    instruction:
      'tom emocional, rural, proximo e simples, com foco em autenticidade, carisma e conexao com o publico',
  },
  sensual: {
    label: 'Sensual Brasileira',
    prompt:
      'mulher brasileira adulta 21+, visual confiante e elegante, roupa de verao ou look casual que valoriza presenca sem nudez, beira de rio ou cercado de madeira na roca ao entardecer, luz dourada, sorriso cativante, movimentos naturais',
    instruction:
      'tom envolvente e caloroso, sensualidade leve e adulta, sem nudez, sem ato sexual e sem foco explicito no corpo',
  },
  urban: {
    label: 'Urbano/Paredao',
    prompt:
      'mulher brasileira adulta 21+, estilo urbano confiante, cabelo bem cuidado, acessorios discretos, roupa casual moderna, rua de comunidade com grafite ou paredao ao fundo, por do sol urbano, olhar confiante e atitude elegante',
    instruction:
      'tom direto, confiante e urbano, com presenca forte e linguagem de video curto',
  },
  beach: {
    label: 'Praia Tropical',
    prompt:
      'mulher brasileira adulta 21+, pele iluminada pelo sol, cabelo com efeito praia, roupa de praia adequada sem nudez, areia clara, coqueiros e mar ao fundo, luz solar natural, sorriso leve e movimentos fluidos',
    instruction:
      'tom alegre, relaxado e solar, transmitindo liberdade, leveza e beleza natural',
  },
  custom: {
    label: 'Personalizado',
    prompt: '',
    instruction:
      'siga o estilo definido pelo usuario, mantendo pessoa adulta 21+, conteudo seguro, sem nudez e sem ato sexual',
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
    ['natural', 'sensual', 'urban', 'beach', 'custom'].includes(String(item))
  );

  return modes.length ? modes.slice(0, 5) : ['natural'];
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
Crie conteudo com pessoas adultas 21+, linguagem brasileira natural e foco em retencao emocional.

Regras obrigatorias:
- Todas as personagens devem ser adultas 21+.
- Nao gere nudez, ato sexual, menores de idade, erotizacao de menores ou linguagem explicita.
- Pode haver charme, confianca e sensualidade leve adulta quando solicitado, sempre sem nudez e sem ato sexual.
- Falas com 15 a 20 palavras, no maximo 8 segundos.
- Toda fala deve terminar com convite natural para seguir o perfil.
- Responda somente JSON valido no schema pedido.

Estilos selecionados:
${modeInstructions}

${intenseMode ? 'Modo intenso: aumente confianca, presenca, olhar magnetico e provocacao leve adulta, sem conteudo explicito.' : ''}
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
        ? 'presenca mais confiante, olhar magnetico, movimentos lentos, charme adulto sem nudez, '
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
