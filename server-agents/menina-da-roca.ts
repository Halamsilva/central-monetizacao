import { GoogleGenAI, Type } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { CTAS, LIST_OF_TASKS, type RuralTask } from '../src/roca-types.js';

type ScenarioKey = 'natural' | 'sensual' | 'provocative' | 'urban' | 'beach' | 'custom';

const technicalPrefix =
  'realistic natural human skin captured by a regular smartphone camera, sun-exposed uneven skin tone, subtle natural facial oil, slight sweat on forehead and around nose, mild under-eye darkness, natural asymmetry, soft irregular skin texture, slightly rough cheeks from sun and dust, darker tanned neck, realistic calloused dry hands, visible skin variation without exaggeration, pores only subtly visible at close distance, no skin smoothing, no beauty filter, no retouching, no waxy skin, no plastic skin, no CGI face, no doll-like face, no perfect symmetry, no glamorous skin, no over-sharpening, shot on a regular mid-range Android smartphone, vertical 9:16, handheld homemade recording, natural auto exposure, slight focus breathing, minor hand shake, normal mobile video compression, realistic smartphone sharpness, no cinematic lens, no studio lighting, no HDR look, no commercial polish, no beauty filter, no studio face, no polished skin, no fashion model face, no wax texture, no plastic face, no over-detailed pores, no CGI realism, no airbrushed skin, no artificial symmetry, ';

const technicalSuffix =
  ', 1 segundo final em silencio, mantendo contato visual, sem musica, sem texto na tela, sem legendas, sem emojis';

const SKIN_BOILERPLATE =
  'realistic natural human skin captured by a regular smartphone camera, sun-exposed uneven skin tone, subtle natural facial oil, slight sweat on forehead and around nose, mild under-eye darkness, natural asymmetry, absolutely no facial hair, no peach fuzz, clean-shaven smooth skin, soft irregular skin texture, slightly rough cheeks from sun and dust, darker tanned neck, realistic calloused dry hands from rural work, visible veins and dirt residue on fingers, visible skin variation without exaggeration, pores only subtly visible at close distance, no skin smoothing, no beauty filter, no retouching, no waxy skin, no plastic skin, no CGI face, no doll-like face, no perfect symmetry, no glamorous skin, no over-sharpening';

const CAMERA_BOILERPLATE =
  'shot on a regular mid-range Android smartphone, vertical 9:16, handheld homemade recording, natural auto exposure, slight focus breathing, minor hand shake, normal mobile video compression, realistic smartphone sharpness, strictly no starting face close-up, strictly no starting avatar close-up, do not start with a face zoom or close-up of the character, start directly with a stable medium shot or chest-up framing showing her actively working with her hands and environment visible, no cinematic lens, no studio lighting, no HDR look, no commercial polish, no beauty filter, no studio face, no polished skin, no fashion model face, no wax texture, no plastic face, no artificial symmetry';

const geminiConfigMessage =
  'A chave da IA configurada no servidor foi recusada pelo Google. O modo off-line foi ativado automaticamente.';

const getGeminiErrorMessage = (error: any) => {
  const rawMessage = String(error?.message || '');
  const rawStatus = String(error?.status || '');

  if (rawStatus === '429' || rawMessage.includes('429')) {
    return 'Limite de uso da IA atingido agora. Use o modo off-line ou tente novamente mais tarde.';
  }

  const isKeyProblem =
    rawStatus === '403' ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('CONSUMER_SUSPENDED') ||
    rawMessage.includes('api_key') ||
    rawMessage.includes('API key');

  return isKeyProblem ? geminiConfigMessage : 'Erro ao gerar prompts com IA. O modo off-line foi ativado automaticamente.';
};

const getLanguageConfig = (language: unknown) => {
  const key = cleanText(language, 40).toLowerCase();
  const configs: Record<string, { label: string; rules: string; promptLabel: string }> = {
    brasil: {
      label: 'Portuguese (Brazil)',
      promptLabel: 'Brazilian Portuguese',
      rules:
        'O campo spokenLine DEVE ser gerado em portugues do Brasil, com tom carismatico e sutilmente sedutor de fazenda/roca. O CTA final deve ser em portugues, como "Me segue".',
    },
    estados_unidos: {
      label: 'English (United States)',
      promptLabel: 'English',
      rules:
        'O campo spokenLine DEVE ser gerado em ingles de estilo country-girl americana. O CTA final deve ser em ingles, como "Follow me". Nao use portugues.',
    },
    mexico: {
      label: 'Spanish (Mexico)',
      promptLabel: 'Spanish',
      rules:
        'O campo spokenLine DEVE ser gerado em espanhol mexicano de estilo rural/rancheira. O CTA final deve ser em espanhol, como "Sigueme". Nao use portugues.',
    },
  };

  return configs[key] || configs.brasil;
};

const getChosenTask = (body: any): RuralTask => {
  const customTask = cleanText(body?.customTask, 240);
  if (customTask) {
    return {
      id: 'custom',
      name: customTask,
      clothing: 'simple farm clothes',
      environment: 'outdoors in a simple rural setting',
      actionEnglish: `performing the custom activity: ${customTask}`,
    };
  }

  const selectedTaskIds = Array.isArray(body?.selectedTaskIds) ? body.selectedTaskIds.map(String) : [];
  return LIST_OF_TASKS.find((task) => selectedTaskIds.includes(task.id)) || LIST_OF_TASKS[0];
};

const getClothingInstruction = (body: any) => {
  if (body?.isPantiesMode) {
    const style = cleanText(body?.pantyStyle, 40) || 'romantica';
    return `one of 5 distinct, highly detailed lingerie or panties styles matching the selected style "${style}", with each scene using a different variation, wet rural work fabric, sweat, dust and realistic farm effort`;
  }

  if (body?.isSexy18) {
    return 'sensual hot rural outfit or a micro bikini top, wet tight crop top, clinging fabric with glistening sweat, bikini top under unbuttoned farm shirt, short micro denim shorts';
  }

  return '';
};

const buildRocaGenerationPrompt = (body: any, task: RuralTask) => {
  const languageConfig = getLanguageConfig(body?.language);
  const customContext = cleanText(body?.customContext, 1200);
  const preferredCtas = Array.isArray(body?.preferredCtas)
    ? body.preferredCtas.map((cta: unknown) => cleanText(cta, 120)).filter(Boolean)
    : [];
  const ctas = preferredCtas.length ? preferredCtas : CTAS.slice(0, 8);
  const characterDetails = cleanText(body?.characterDetails, 1200);
  const clothingInstruction = getClothingInstruction(body);

  return `
Voce e um gerador profissional de falas e prompts para videos curtos virais no TikTok, focado no nicho de mulheres da roca/country-girl.
Gere exatamente 5 cenas para a mesma atividade rural: "${task.name}".

FALAS-BASE DE REFERENCIA:
1. "Se eu largasse essa vida da roca pra morar com voce... sera que voce cuidaria mesmo de mim? Me segue pra eu saber."
2. "Depois de passar o dia inteiro no sol da fazenda, tudo que eu queria era alguem pra dividir silencio comigo. Se voce for diferente... me segue."
3. "Eu passo o dia mexendo na terra, cuidando dos animais e trabalhando sem parar... mas as vezes queria alguem cuidando de mim tambem. Entao me segue."
4. "Meu pai sempre fala que homem de verdade quase nao existe mais. Sera que ele ta certo? Se voce for diferente... me segue."

REGRAS:
- Todas as falas devem ser naturais, intimas, simples e com vulnerabilidade emocional rural.
- Nunca peca likes, comentarios ou compartilhamentos. O CTA deve ser exclusivamente seguir o perfil.
- A mulher deve estar realmente trabalhando, com esforco fisico, suor, poeira e movimento rural real.
- A acao nao pode parecer pose parada de modelo.
- ${languageConfig.rules}
- CTAs favoritos para variar: ${ctas.join(' | ')}.
- Roupa base da tarefa: ${task.clothing}.
- Cenario base: ${task.environment}.
- Acao base: ${task.actionEnglish}.
${clothingInstruction ? `- Diretriz visual extra de roupa: ${clothingInstruction}.` : ''}
${body?.isSexy18 || body?.isPantiesMode ? '- Modo +18 ativado: use subtexto provocativo, sensual adulto, flertador e romantico-quente, sem linguagem vulgar explicita.' : ''}
${characterDetails ? `- Caracteristicas fisicas da personagem: ${characterDetails}.` : ''}
${customContext ? `- Instrucao extra do usuario: ${customContext}.` : ''}

Retorne somente JSON puro com exatamente 5 objetos. Cada objeto deve ter:
- spokenLine: fala no idioma solicitado, terminando com CTA de seguir.
- clothingAdjustment: descricao em ingles de roupas, suor, poeira e detalhes visuais.
- actionSpecifics: descricao em ingles da acao fisica rural real.
- characterAppearance: descricao em ingles das caracteristicas fisicas da personagem para manter consistencia visual.
`.trim();
};

async function generateWithFallback(ai: GoogleGenAI, payload: { contents: any; config?: any }) {
  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
  ];
  let lastError: any = null;

  for (const model of [...new Set(models)]) {
    try {
      return await ai.models.generateContent({
        model,
        contents: payload.contents,
        config: payload.config,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

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

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

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

  const apiKey = await getActiveGeminiApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const user = await checkAccess(req, res);
  if (!user) return;

  const action = cleanText(req.body?.action, 40);
  if (action === 'analyze-image') {
    const image = parseImage(req.body?.characterImage);

    if (!image) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem foi recebida para analise.' });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const result = await generateWithFallback(genAI, {
        contents: {
          parts: [
            { inlineData: image },
            {
              text: `
Analise detalhadamente a foto desta modelo para geracao de imagens consistentes.
Extraia em uma unica frase corrida, sem topicos, as principais caracteristicas estruturais fisicas e faciais:
penteado, tipo/cor/comprimento do cabelo, tom de pele, tracos faciais, olhos, expressao, detalhes marcantes.
Retorne apenas o texto descritivo simples e direto, pronto para prompt de imagem.
`.trim(),
            },
          ],
        },
      });

      return res.status(200).json({
        success: true,
        description: cleanText(result.text, 1200),
      });
    } catch (error: any) {
      console.error('Menina da roca image analysis error:', error);
      return res.status(error.status || 500).json({
        success: false,
        error: getGeminiErrorMessage(error),
      });
    }
  }

  if (action === 'generate-prompts') {
    const task = getChosenTask(req.body);
    const image = parseImage(req.body?.characterImage);
    const languageConfig = getLanguageConfig(req.body?.language);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const textPart = {
        text: image
          ? `${buildRocaGenerationPrompt(req.body, task)}

INSTANTE CRITICO DE CONSISTENCIA:
A imagem anexada e a referencia visual da personagem. Analise e preencha characterAppearance de cada cena com cabelo, pele, rosto, olhos, expressao e detalhes marcantes para manter consistencia.`
          : buildRocaGenerationPrompt(req.body, task),
      };
      const contents = image
        ? { parts: [{ inlineData: image }, textPart] }
        : textPart.text;

      const result = await generateWithFallback(genAI, {
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                spokenLine: {
                  type: Type.STRING,
                  description: `The emotional spoken sentence in ${languageConfig.label}, always concluding with a follow CTA.`,
                },
                clothingAdjustment: {
                  type: Type.STRING,
                  description: 'A short details block in English describing clothes, dirt marks and sweat.',
                },
                actionSpecifics: {
                  type: Type.STRING,
                  description: 'A short details block in English describing the rural physical action.',
                },
                characterAppearance: {
                  type: Type.STRING,
                  description: 'Detailed physical features for visual consistency.',
                },
              },
              required: ['spokenLine', 'clothingAdjustment', 'actionSpecifics', 'characterAppearance'],
            },
          },
        },
      });

      const generatedItems = JSON.parse(result.text || '[]');
      const items = Array.isArray(generatedItems) ? generatedItems.slice(0, 5) : [];
      const characterDetails = cleanText(req.body?.characterDetails, 1200);
      const imageReference = image
        ? ', using the uploaded reference avatar image as an absolute facial and character identity reference, strictly matching the face, hair texture/length/color, facial symmetry, and physical identity of the uploaded photo'
        : '';
      const typedReference = characterDetails ? `, with physical features of a woman described as ${characterDetails}` : '';

      const prompts = items.map((item: any, index: number) => {
        const appearance = cleanText(item?.characterAppearance, 1200);
        const finalAppearance = appearance
          ? `${imageReference}, displaying the following precise physical features analyzed from the reference picture: ${appearance}${typedReference}`
          : `${imageReference}${typedReference}`;
        const spoken = cleanText(item?.spokenLine, 360);
        const clothing = cleanText(item?.clothingAdjustment, 900) || task.clothing;
        const actionSpecifics = cleanText(item?.actionSpecifics, 900) || task.actionEnglish;

        const fullPrompt =
          `${SKIN_BOILERPLATE}, ${CAMERA_BOILERPLATE}, Young rural Brazilian woman${finalAppearance}, naturally beautiful, curvy body, real and accessible appearance, Brazilian model features, emotionally expressive eyes, Simple rural clothing according to the task being performed: ${clothing}, Simple humble rural environments only: ${task.environment}, Natural sunlight hitting parts of the body, visible heat, sweat and dust from physical work, The woman must always be actively performing a REAL rural task with true physical labor, manual exertion, getting her hands dirty, showing realistic physical effort and dynamic body movement while working, absolutely not posing like a fashion model, in normal caught-on-camera rustic motion: ${actionSpecifics}, Camera fixed or slightly shaky, strictly no starting face zoom, strictly no starting close-up of her avatar or face, do not start with any close-up or face-only framing, start directly with a stable medium shot or chest-up framing showcasing her hands, body, and work environment, Emotional direction: direct eye contact with the camera during pauses, intimate low voice, emotional vulnerability, natural pauses while working. The literal spoken sentence MUST be written inside the prompt exactly as it will be spoken in ${languageConfig.promptLabel}: "${spoken}", 1 second final silence maintaining eye contact with the camera, No music, no subtitles, no text on screen, no emojis`
            .replace(/\s+/g, ' ')
            .trim();

        return {
          id: `prompt-${index + 1}`,
          task: task.name,
          spokenLine: spoken,
          fullPrompt,
        };
      });

      return res.status(200).json({ success: true, prompts });
    } catch (error: any) {
      console.error('Menina da roca prompt generation error:', error);
      return res.status(error.status || 500).json({
        success: false,
        error: getGeminiErrorMessage(error),
      });
    }
  }

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

