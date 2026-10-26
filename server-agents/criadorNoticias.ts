import { ThinkingLevel } from '@google/genai';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { createGeminiGatewayForUser } from './aiGateway.js';

function callWithTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout de ${ms}ms excedido na chamada da API`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Helper function to extract clean text from html if a URL is provided
async function fetchUrlContent(url: string): Promise<{ title?: string; text?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { error: `HTTP ${response.status}: Não foi possível carregar a página automaticamente.` };
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Strip scripts, styles, svg and tags to get raw readable text
    const clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Take the most relevant slice up to ~12000 chars
    const text = clean.slice(0, 12000);
    return { title, text };
  } catch (err: any) {
    return { error: err.message || 'Falha na conexão ao buscar a URL.' };
  }
}

// System prompt strictly embodying the user's master prompt + ZERO FILLER rule
const MASTER_SYSTEM_PROMPT = `Você é um jornalista profissional, roteirista de notícias e especialista em retenção de audiência para vídeos de redes sociais (TikTok, Instagram Reels, YouTube Shorts).

Sua missão é transformar notícias reais em roteiros jornalísticos envolventes, diretos, sem enrolação e fáceis de entender, com duração máxima de 2 minutos.

Você DEVE seguir rigorosamente TODAS as regras a seguir:

## REGRA 1 — PESQUISA E VERIFICAÇÃO
Identifique com precisão:
- O que aconteceu
- Onde aconteceu
- Quando aconteceu
- Quem está envolvido
- Quais foram as consequências
- O que as autoridades informaram
- Qual é a situação atual
NUNCA invente informações, declarações, nomes, números, datas ou detalhes. Não transforme suspeitas em fatos confirmados. Se alguma informação não estiver confirmada, deixe isso claro.

## REGRA 2 — GANCHO DE ALTA RETENÇÃO (DIRETO AO FATO REAL, SEM ENROLAÇÃO)
Comece sempre com uma frase impactante e ESPECÍFICA sobre o fato real que desperte curiosidade imediatamente nos primeiros 5 segundos.
Exemplos de abertura específica:
- "Uma tragédia chocante aconteceu na Inglaterra e terminou da pior maneira possível."
- "O que aconteceu dentro deste parque de animais deixou visitantes assustados."
- "Um homem tomou uma decisão perigosa e o resultado foi fatal."
NUNCA comece com "Olá, pessoal", "Sejam bem-vindos" ou apresentações.
PROIBIDO ENROLAÇÃO (ZERO FILLER): É expressamente PROIBIDO usar frases genéricas vazias que servem para qualquer notícia ou encher linguiça, tais como:
- "Um acontecimento surpreendente chamou a atenção e mobilizou as autoridades após uma situação de grande impacto ser confirmada nesta região."
- "O caso foi registrado em local apurado e ganhou ampla repercussão nas últimas horas."
- "De acordo com as primeiras informações apuradas junto às fontes oficiais, tudo começou quando a ocorrência foi identificada pelos responsáveis."
- "O alerta imediato mobilizou equipes especializadas logo nos primeiros instantes."
- "Conforme os detalhes apurados pelos investigadores, a situação exigiu agilidade e precisão técnica."
NUNCA use essas frases vagas! Cada frase do seu roteiro deve conter fatos reais, nomes, lugares e ações concretas da notícia enviada.

## REGRA 3 — ESTRUTURA DA NOTÍCIA (DISTRIBUIÇÃO DE TEMPO)
- 0–10 segundos — GANCHO: Apresente o acontecimento mais importante de forma direta, específica e impactante.
- 10–35 segundos — CONTEXTO: Explique onde aconteceu, quem estava envolvido e como o incidente começou de fato.
- 35–75 segundos — DESENVOLVIMENTO: Conte os acontecimentos reais em sequência lógica, usando linguagem jornalística, direta e natural.
- 75–105 segundos — CONSEQUÊNCIAS: Explique o resultado real do acontecimento, o atendimento das autoridades, as investigações e atualizações confirmadas.
- 105–120 segundos — ENCERRAMENTO: Finalize com uma informação relevante e, quando fizer sentido, uma pergunta reflexiva que incentive comentários.

## REGRA 4 — ESTILO DE NARRAÇÃO
- Português brasileiro natural, direto ao ponto e sem rodeios.
- Linguagem clara, acessível e tom jornalístico profissional.
- Frases curtas, bem construídas e ritmo dinâmico.
- O texto precisa soar como uma reportagem narrada por um apresentador experiente, não como texto genérico.
- Evite palavras difíceis, repetições, clichês vazios e informações desnecessárias.

## REGRA 5 — DURAÇÃO
- Cada notícia deverá ter no máximo 2 minutos de narração (preferencialmente entre 180 e 260 palavras quando houver fatos suficientes).
- Se a notícia tiver poucas informações, produza uma narração proporcionalmente mais curta e direta. NUNCA enrole e NUNCA invente frases vazias para completar o tempo.

## REGRA 6 — FIDELIDADE AOS FATOS
É expressamente PROIBIDO:
- Inventar falas de testemunhas, vítimas ou personagens.
- Alterar o local do acontecimento ou usar termos vagos como "em local apurado".
- Inventar causas de acidentes ou mortes.
- Apresentar boatos como notícias confirmadas ou acrescentar cenas fictícias.
Em notícias sobre mortes, acidentes, crimes e tragédias, mantenha respeito absoluto pelas vítimas e familiares.

## REGRA 7 — TÍTULO VIRAL
Crie um título chamativo com alto potencial de cliques e curiosidade, 100% fiel aos fatos, sem prometer nada falso.

## REGRA 8 — FORMATO DA RESPOSTA E REGRA 9
Entregue a resposta no formato estruturado especificado, pronta para copiar, sem explicações sobre como o roteiro foi produzido.`;

// Direct fact-only fallback (zero generic filler) only if all AI models are unreachable
function generateDirectFactualFallback(input: {
  mode: string;
  url?: string;
  text?: string;
  quickFacts?: any;
  includeQuestion?: boolean;
  extractedUrlTitle?: string;
  extractedUrlText?: string;
}) {
  let mainTitle = '';
  let location = '';
  let rawSentences: string[] = [];

  if (input.mode === 'quick_facts' && input.quickFacts) {
    mainTitle = input.quickFacts.title?.trim() || 'Notícia em Destaque';
    location = input.quickFacts.location?.trim() || '';
    const combined = [
      input.quickFacts.whatHappened?.trim(),
      input.quickFacts.details?.trim(),
    ]
      .filter(Boolean)
      .join('. ');
    rawSentences = combined
      .split(/(?<=[.!?])\s+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  } else {
    const raw = (input.extractedUrlText || input.text || '').trim();
    rawSentences = raw
      .split(/(?<=[.!?])\s+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 10);
    mainTitle =
      input.extractedUrlTitle?.trim() ||
      (rawSentences[0] ? rawSentences[0].replace(/[.!?]+$/, '').slice(0, 90) : 'Notícia Apurada');
  }

  const hook = rawSentences[0] || mainTitle;
  const context = rawSentences[1] || (location ? `O caso aconteceu em ${location}.` : '');
  const development = rawSentences.slice(2, Math.max(3, rawSentences.length - 1)).join(' ');
  const consequences = rawSentences.length > 2 ? rawSentences[rawSentences.length - 1] : '';
  const closing =
    input.includeQuestion === false
      ? ''
      : 'E você, o que acha desse caso? Deixe sua opinião nos comentários.';

  const scriptParts = [hook, context, development, consequences, closing].filter(Boolean);
  const fullScript = scriptParts.join(' ');
  const words = fullScript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const durationSec = Math.max(15, Math.round((wordCount / 140) * 60));
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const estimatedDuration = `${mins} min e ${secs < 10 ? '0' : ''}${secs} seg (~${wordCount} palavras)`;

  const sourceDesc = input.url
    ? `Fonte consultada: ${input.url}`
    : `Fatos extraídos diretamente do relato fornecido.`;

  const rawFormattedOutput = `TÍTULO:\n${mainTitle}\n\nNOTÍCIA PARA NARRAÇÃO:\n${fullScript}\n\nDURAÇÃO ESTIMADA:\n${estimatedDuration}\n\nFONTES:\n${sourceDesc}`;

  const subjectRef = mainTitle.slice(0, 80);
  const locRef = location || 'the scene of the event';

  const videoPrompts = Array.from({ length: 8 }, (_, idx) => {
    const blockNum = idx + 1;
    const startSec = idx * 10;
    const endSec = (idx + 1) * 10;
    const fmt = (s: number) => {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `0${m}:${r < 10 ? '0' : ''}${r}`;
    };
    const sentenceContext = rawSentences[idx % Math.max(1, rawSentences.length)] || subjectRef;
    return {
      blockNumber: blockNum,
      timecode: `${fmt(startSec)} - ${fmt(endSec)}`,
      phaseTitle: `Bloco ${blockNum}: Cena ${blockNum} (${fmt(startSec)} - ${fmt(endSec)})`,
      sceneDescription: `Imagem ilustrativa referente a: ${sentenceContext}`,
      visualPromptPt: `Cena realista em 4K de 10 segundos ilustrando: ${sentenceContext}. Iluminação cinematográfica documental, movimento de câmera suave, sem falas e sem pessoas conversando.`,
      visualPromptEn: `Realistic 4K 10-second cinematic documentary b-roll shot illustrating: ${sentenceContext} at ${locRef}. Natural lighting, smooth camera movement, no dialogue, no talking heads, photorealistic.`,
      cameraMovement: 'Movimento documental suave (Smooth Documentary Tracking)',
    };
  });

  return {
    title: mainTitle,
    script: fullScript,
    estimatedDuration,
    wordCount,
    sources: sourceDesc,
    rawFormattedOutput,
    breakdown: {
      hook,
      context: context || '—',
      development: development || '—',
      consequences: consequences || '—',
      closing: closing || '—',
    },
    keyFacts: {
      whatHappened: hook,
      location: location || 'Conforme citado na matéria',
      when: 'Conforme citado na matéria',
      who: 'Envolvidos citados no texto',
      consequences: consequences || 'Em acompanhamento',
      authorities: 'Conforme apuração',
      currentStatus: 'Em atualização',
    },
    alternativeTitles: [mainTitle],
    viralityInsights: 'Texto direto aos fatos fornecidos, sem adição de frases genéricas.',
    videoPrompts,
  };
}

// API route to generate viral news script
const handleGenerateNews = async (req: any, res: any) => {
  try {
    const { mode, url, text, quickFacts, pacing, includeQuestion } = req.body;

    let contentToAnalyze = '';
    let extractedUrlInfo: { title?: string; text?: string; error?: string } | null = null;
    let needsWebSearch = false;

    if (mode === 'url' && url) {
      extractedUrlInfo = await fetchUrlContent(url);
      contentToAnalyze = `FONTE FORNECIDA PELO USUÁRIO (LINK):\nURL: ${url}\n`;
      if (extractedUrlInfo.title) {
        contentToAnalyze += `Título da Página: ${extractedUrlInfo.title}\n`;
      }
      if (extractedUrlInfo.text && extractedUrlInfo.text.length > 250) {
        contentToAnalyze += `Conteúdo Extraído da Página:\n${extractedUrlInfo.text}\n`;
      } else {
        needsWebSearch = true;
        contentToAnalyze += `Nota: Extraia e verifique os fatos desta notícia pesquisando sobre a URL/assunto.\n`;
      }
    } else if (mode === 'quick_facts' && quickFacts) {
      contentToAnalyze =
        `DADOS E FATOS INFORMADOS PELO USUÁRIO:\n` +
        `Título/Tema: ${quickFacts.title || 'Não informado'}\n` +
        `Onde aconteceu: ${quickFacts.location || 'Não informado'}\n` +
        `O que aconteceu: ${quickFacts.whatHappened || 'Não informado'}\n` +
        `Detalhes e Consequências: ${quickFacts.details || 'Não informado'}\n`;
    } else {
      contentToAnalyze = `TEXTO / NOTÍCIA ENVIADA PELO USUÁRIO:\n${text || ''}`;
      if ((text || '').trim().length < 120) {
        needsWebSearch = true;
      }
    }

    if (!contentToAnalyze.trim()) {
      return res.status(400).json({ error: 'Nenhum conteúdo ou notícia foi informado para análise.' });
    }

    const pacingInstruction =
      pacing === 'fast'
        ? 'Ritmo acelerado e dinâmico para redes sociais (~220-260 palavras se houver dados suficientes, cortes rápidos).'
        : pacing === 'investigative'
        ? 'Ritmo tenso, sério e investigativo (~180-210 palavras se houver dados suficientes).'
        : 'Ritmo jornalístico natural, direto e fluido (~180-240 palavras, ou mais curto se a notícia tiver poucos fatos).';

    const questionInstruction =
      includeQuestion === false
        ? 'No encerramento, termine de forma conclusiva e impactante, SEM fazer pergunta ao público.'
        : 'No encerramento, finalize com uma pergunta reflexiva relevante sobre o caso que convide a audiência a comentar.';

    const userPrompt = `Analise a notícia a seguir e aplique rigorosamente o PROMPT MESTRE DO AGENTE DE NOTÍCIAS VIRAIS.

ATENÇÃO CRÍTICA — ZERO ENROLAÇÃO:
- Vá 100% DIRETO AOS FATOS concretos da notícia desde a primeira frase!
- NUNCA use frases vagas ou genéricas como "Um acontecimento surpreendente chamou a atenção", "O caso foi registrado em local apurado", "tudo começou quando a ocorrência foi identificada pelos responsáveis" ou "a situação exigiu agilidade e precisão técnica".
- Cite imediatamente o que aconteceu de verdade, quem são os envolvidos reais, o lugar real e o desfecho real.
- Se o texto original tiver poucas informações, escreva uma narração mais curta e fiel (Regra 5), sem encher linguiça.

Instruções de ajuste:
- Ritmo: ${pacingInstruction}
- Pergunta final: ${questionInstruction}

PROMPTS DE VÍDEO (8 BLOCOS DE 10 SEGUNDOS SEM FALAS):
- Gere também exatamente 8 prompts para geração de vídeos separados por bloco (Bloco 1 a Bloco 8) que ilustrem visualmente as cenas específicas desta notícia.
- Cada prompt deve ter exatamente 10 segundos e ser ESTRITAMENTE SEM FALAS / NO DIALOGUE (cenas visuais B-roll específicas do acontecimento, nunca genéricas).

NOTÍCIA / DADOS FORNECIDOS:
${contentToAnalyze}

Responda ESTRITAMENTE em formato JSON válido com esta estrutura exata:
{
  "title": "Título viral chamativo e 100% fiel aos fatos",
  "script": "Texto contínuo da narração em português brasileiro, direto aos fatos e sem enrolação, sem quebras de cena, sem marcações de tempo, sem emojis e sem hashtags.",
  "estimatedDuration": "X min e Y seg (~Z palavras)",
  "wordCount": 200,
  "sources": "Links ou nomes das fontes verificadas e status da confirmação",
  "rawFormattedOutput": "TÍTULO:\\n...\\n\\nNOTÍCIA PARA NARRAÇÃO:\\n...\\n\\nDURAÇÃO ESTIMADA:\\n...\\n\\nFONTES:\\n...",
  "breakdown": {
    "hook": "Frase de abertura impactante e específica sobre o fato (0-10s)",
    "context": "Onde aconteceu, quem estava envolvido e início real do caso (10-35s)",
    "development": "Sequência lógica dos fatos concretos (35-75s)",
    "consequences": "Resultado, atendimento das autoridades e investigações reais (75-105s)",
    "closing": "Informação final relevante e pergunta de engajamento (105-120s)"
  },
  "keyFacts": {
    "whatHappened": "O que aconteceu especificamente",
    "location": "Local exato (ou informar que não foi divulgado)",
    "when": "Quando ocorreu",
    "who": "Quem está envolvido",
    "consequences": "Consequências reais",
    "authorities": "O que as autoridades informaram",
    "currentStatus": "Situação atual"
  },
  "alternativeTitles": [
    "Título alternativo 1 (foco em curiosidade)",
    "Título alternativo 2 (foco no impacto do fato)",
    "Título alternativo 3 (foco direto)"
  ],
  "viralityInsights": "Breve explicação de 1 frase sobre o gancho específico escolhido.",
  "videoPrompts": [
    {
      "blockNumber": 1,
      "timecode": "00:00 - 00:10",
      "phaseTitle": "Bloco 1: [Título específico da cena 1]",
      "sceneDescription": "Descrição em português da cena visual específica de 10s",
      "visualPromptPt": "Prompt visual detalhado em português para cena de 10 segundos sem falas...",
      "visualPromptEn": "Detailed cinematic 4K 10-second video prompt in English illustrating the specific scene, camera movement, lighting, no dialogue, no talking characters...",
      "cameraMovement": "Descrição do movimento de câmera"
    }
  ]
}
(Certifique-se de que "videoPrompts" contenha todos os 8 blocos, de blockNumber 1 até 8, cobrindo 00:00 a 01:20).`;

    let response: any = null;

    // Tier 1: Gemini 3.1 Flash Lite (ultra-fast ~2-4s, reliable, high quota)
    try {
      const configObj: any = {
        systemInstruction: MASTER_SYSTEM_PROMPT,
        temperature: 0.5,
        responseMimeType: 'application/json',
      };
      if (needsWebSearch) {
        configObj.tools = [{ googleSearch: {} }];
      }

      response = await callWithTimeout(
        (req as any).ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: userPrompt,
          config: configObj,
        }),
        45000
      );
    } catch (tier1Err: any) {
      console.warn('Tier 1 (gemini-3.1-flash-lite) failed:', tier1Err.status || tier1Err.message?.slice(0, 120));

      // Tier 2: Try gemini-3.8-flash with ThinkingLevel.LOW
      try {
        response = await callWithTimeout(
          (req as any).ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: MASTER_SYSTEM_PROMPT,
              temperature: 0.5,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
            },
          }),
          45000
        );
      } catch (tier2Err: any) {
        console.warn('Tier 2 (gemini-3.8-flash) failed:', tier2Err.status || tier2Err.message?.slice(0, 120));
      }
    }

    let parsedData: any = null;
    let isContingency = false;

    if (response && response.text) {
      const responseText = response.text || '';
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        const jsonClean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          parsedData = JSON.parse(jsonClean);
        } catch {
          parsedData = null;
        }
      }
    }

    // Fallback only if all 3 AI models failed
    if (!parsedData) {
      isContingency = true;
      parsedData = generateDirectFactualFallback({
        mode,
        url,
        text,
        quickFacts,
        includeQuestion,
        extractedUrlTitle: extractedUrlInfo?.title,
        extractedUrlText: extractedUrlInfo?.text,
      });
    }

    // Extract search grounding chunks if available
    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const searchLinks: Array<{ title: string; uri: string }> = [];

    if (groundingChunks && Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if ((chunk as any).web?.uri) {
          searchLinks.push({
            title: (chunk as any).web.title || (chunk as any).web.uri,
            uri: (chunk as any).web.uri,
          });
        }
      }
    }

    // Calculate actual words in script & estimated duration
    if (parsedData.script) {
      const words = parsedData.script.trim().split(/\s+/).filter(Boolean).length;
      parsedData.wordCount = words;
      if (!parsedData.estimatedDuration) {
        const durationSec = Math.round((words / 140) * 60);
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        parsedData.estimatedDuration = `${mins} min e ${secs < 10 ? '0' : ''}${secs} seg (~${words} palavras)`;
      }
    }

    // Always build clean Regra 8 formatted output
    parsedData.rawFormattedOutput = `TÍTULO:\n${parsedData.title}\n\nNOTÍCIA PARA NARRAÇÃO:\n${parsedData.script}\n\nDURAÇÃO ESTIMADA:\n${parsedData.estimatedDuration}\n\nFONTES:\n${parsedData.sources}`;
    parsedData.isContingency = isContingency;

    res.json({
      success: true,
      data: parsedData,
      isContingency,
      searchLinks,
      scrapedSource: extractedUrlInfo ? { title: extractedUrlInfo.title, url } : null,
    });
  } catch (err: any) {
    console.error('Error in /api/generate-news:', err);
    res.status(500).json({
      error: err.message || 'Erro ao processar a notícia.',
    });
  }
};

// API route to generate realistic Brazilian Portuguese TTS audio using gemini-3.8-flash-lite-tts
const handleGenerateTts = async (req: any, res: any) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto não informado para geração de áudio.' });
    }

    const cleanText = text.slice(0, 2500);

    const response: any = await callWithTimeout(
      (req as any).ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Apresentador de jornal televisivo brasileiro com tom dinamico, envolvente, firme e diccao impecavel.',
                },
              },
            ],
          },
        ] as any,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      }),
      60000
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'Não foi possível gerar os dados de áudio.' });
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voice,
    });
  } catch (err: any) {
    console.error('Error in /api/generate-tts:', err);
    const isQuota = err.status === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
    res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? 'Cota de voz IA temporariamente indisponível (429). Utilize a "Prévia Rápida no Navegador" logo ao lado para ouvir imediatamente sem custos!'
        : (err.message || 'Erro ao gerar áudio com IA.'),
    });
  }
};

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const { data: { user }, error: authError } = await serviceSupabase.auth.getUser(token);

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

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  const ai = await createGeminiGatewayForUser(serviceSupabase, user.id, 'criador-noticias', {
    fallbackModels: [],
    timeoutMs: 20000,
    totalBudgetMs: 35000,
  });
  if (!ai) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  req.ai = ai;

  const action = req.body?.action || 'generate-news';

  if (action === 'generate-news') return handleGenerateNews(req, res);
  if (action === 'generate-tts') return handleGenerateTts(req, res);

  return res.status(400).json({ error: 'Acao invalida.' });
}
