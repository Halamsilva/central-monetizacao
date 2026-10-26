import { GoogleGenAI } from '@google/genai';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getGeminiApiKeyCandidates, describeGeminiError } from './gemini-key.js';
import { recordAiMetric } from './aiGateway.js';

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string) =>
  Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      const timer = setTimeout(() => {
        reject(Object.assign(new Error(`Tempo de resposta esgotado no modelo ${label}.`), { code: 'TIMEOUT' }));
      }, ms);
      (timer as any).unref?.();
    }),
  ]);

// Helper with retry and fallback across multiple models for high demand resilience.
// Tenta varias chaves (a do aluno e a da plataforma): se o Google negar uma delas,
// passa para a proxima em vez de derrubar a geracao.
// Fallback final: quando o Gemini esta em alta demanda/cota, o Groq assume.
async function generateWithGroq(promptInstructions: string, temperature: number) {
  const apiKey = String(process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  const startedAt = Date.now();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature,
        max_tokens: 8000,
        reasoning_effort: 'low',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um roteirista profissional. Siga exatamente o formato e as regras do pedido, sem comentarios extras.',
          },
          { role: 'user', content: promptInstructions },
        ],
      }),
      signal: controller.signal,
    });

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      recordAiMetric({
        agent: 'novelinhas',
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        outcome: 'error',
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      console.warn('[novelinhas] groq falhou:', response.status, String(payload?.error?.message || '').slice(0, 140));
      return null;
    }

    const text = String(payload?.choices?.[0]?.message?.content || '').trim();
    recordAiMetric({
      agent: 'novelinhas',
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      outcome: text ? 'success' : 'empty',
      durationMs: Date.now() - startedAt,
    });
    return text || null;
  } catch (err: any) {
    recordAiMetric({
      agent: 'novelinhas',
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      outcome: 'error',
      code: String(err?.name || err?.code || 'ERROR'),
      durationMs: Date.now() - startedAt,
    });
    console.warn('[novelinhas] groq erro:', String(err?.message || err).slice(0, 140));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function generateWithAgnes(
  promptInstructions: string,
  temperature: number,
  referenceImage?: { mimeType: string; data: string } | null,
) {
  const apiKey = String(process.env.AGNES_API_KEY || '').trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  const startedAt = Date.now();

  try {
    const userContent = referenceImage
      ? [
          { type: 'text', text: promptInstructions },
          { type: 'image_url', image_url: { url: `data:${referenceImage.mimeType};base64,${referenceImage.data}` } },
        ]
      : promptInstructions;

    const response = await fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'agnes-2.5-flash',
        temperature,
        max_tokens: 8000,
        messages: [
          {
            role: 'system',
            content:
              'Você é roteirista de novelinhas em português do Brasil. Siga exatamente o formato solicitado, mantenha os personagens adultos e use a imagem anexada como referência visual obrigatória quando houver. Não omita seções.',
          },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      recordAiMetric({
        agent: 'novelinhas',
        provider: 'agnes',
        model: 'agnes-2.5-flash',
        outcome: 'error',
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      console.warn('[novelinhas] agnes falhou:', response.status, String(payload?.error?.message || '').slice(0, 160));
      return null;
    }

    const content = payload?.choices?.[0]?.message?.content;
    const text = Array.isArray(content)
      ? content.map((part: any) => part?.text || '').join('').trim()
      : String(content || '').trim();

    recordAiMetric({
      agent: 'novelinhas',
      provider: 'agnes',
      model: 'agnes-2.5-flash',
      outcome: text ? 'success' : 'empty',
      durationMs: Date.now() - startedAt,
    });
    return text || null;
  } catch (err: any) {
    recordAiMetric({
      agent: 'novelinhas',
      provider: 'agnes',
      model: 'agnes-2.5-flash',
      outcome: 'error',
      code: String(err?.name || err?.code || 'ERROR'),
      durationMs: Date.now() - startedAt,
    });
    console.warn('[novelinhas] agnes erro:', String(err?.message || err).slice(0, 140));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function generateWithOpenRouter(
  promptInstructions: string,
  temperature: number,
  referenceImage?: { mimeType: string; data: string } | null,
) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return null;

  const models = referenceImage
    ? ['google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'nvidia/nemotron-3.5-super-vl:free']
    : ['xingchen-agi/xing4.0-29b-a4b:free', 'recursive/flint-v1.0:free', 'google/gemma-4-31b-it:free'];

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const startedAt = Date.now();

    try {
      const userContent = referenceImage
        ? [
            { type: 'text', text: promptInstructions },
            {
              type: 'image_url',
              image_url: { url: `data:${referenceImage.mimeType};base64,${referenceImage.data}` },
            },
          ]
        : promptInstructions;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.halamsilva.com.br',
          'X-Title': 'Central Monetizacao',
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: 8000,
          messages: [
            {
              role: 'system',
              content:
                'Você é roteirista profissional. Siga o formato solicitado e mantenha todos os personagens adultos. Não omita seções nem invente informações fora do pedido.',
            },
            { role: 'user', content: userContent },
          ],
        }),
        signal: controller.signal,
      });

      const payload: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        recordAiMetric({
          agent: 'novelinhas',
          provider: 'openrouter',
          model,
          outcome: 'error',
          status: response.status,
          durationMs: Date.now() - startedAt,
        });
        console.warn(
          `[novelinhas] openrouter ${model} falhou:`,
          response.status,
          String(payload?.error?.message || '').slice(0, 160),
        );
        continue;
      }

      const content = payload?.choices?.[0]?.message?.content;
      const text = Array.isArray(content)
        ? content.map((part: any) => part?.text || '').join('').trim()
        : String(content || '').trim();

      if (text) {
        recordAiMetric({
          agent: 'novelinhas',
          provider: 'openrouter',
          model,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        });
        console.log('[novelinhas] gerado pelo OpenRouter (fallback)', model);
        return text;
      }
      recordAiMetric({
        agent: 'novelinhas',
        provider: 'openrouter',
        model,
        outcome: 'empty',
        durationMs: Date.now() - startedAt,
      });
    } catch (err: any) {
      recordAiMetric({
        agent: 'novelinhas',
        provider: 'openrouter',
        model,
        outcome: 'error',
        code: String(err?.name || err?.code || 'ERROR'),
        durationMs: Date.now() - startedAt,
      });
      console.warn(`[novelinhas] openrouter ${model} erro:`, String(err?.message || err).slice(0, 140));
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

async function generateWithModelFallback(
  promptInstructions: string,
  apiKeys: string | string[],
  temperature = 0.85,
  options: { attemptsPerModel?: number; timeoutMs?: number; totalBudgetMs?: number } = {},
  referenceImage?: { mimeType: string; data: string } | null,
) {
  const keys = (Array.isArray(apiKeys) ? apiKeys : [apiKeys]).filter(Boolean);
  const contents = referenceImage
    ? [
        {
          role: 'user',
          parts: [
            { text: promptInstructions },
            { inlineData: { mimeType: referenceImage.mimeType, data: referenceImage.data } },
          ],
        },
      ]
    : promptInstructions;
// Lista ampla: quando um modelo entra em alta demanda (503), os proximos assumem.
  // Os "flash" genericos vem primeiro, os "lite" fecham a fila como rede de seguranca.
  const models = [
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ];
  // 1 tentativa por modelo e 45s: se um modelo engasga, o proximo assume rapido.
  // Antes eram 2 tentativas de 75s e um unico modelo lento travava tudo por 150s.
  const attemptsPerModel = options.attemptsPerModel ?? 1;
  const timeoutMs = options.timeoutMs ?? 45000;
  const deadline = Date.now() + (options.totalBudgetMs ?? 45000);
  let lastError: any = null;

  for (const apiKey of keys) {
    const ai = new GoogleGenAI({ apiKey });

    for (const model of models) {
      if (Date.now() > deadline) break;

      for (let attempt = 0; attempt < attemptsPerModel; attempt++) {
        const startedAt = Date.now();
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model,
              contents,
              config: {
                temperature,
                topP: 0.95,
              },
            }),
            timeoutMs,
            model,
          );

          const generatedText = response.text || '';
          if (generatedText && generatedText.trim().length > 0) {
            recordAiMetric({
              agent: 'novelinhas',
              provider: 'gemini',
              model,
              outcome: 'success',
              durationMs: Date.now() - startedAt,
            });
            return { text: generatedText, modelUsed: model };
          }
          recordAiMetric({
            agent: 'novelinhas',
            provider: 'gemini',
            model,
            outcome: 'empty',
            durationMs: Date.now() - startedAt,
          });
        } catch (err: any) {
          lastError = err;
          const description = describeGeminiError(err);
          recordAiMetric({
            agent: 'novelinhas',
            provider: 'gemini',
            model,
            outcome: 'error',
            status: Number(err?.status || err?.code) || undefined,
            code: description.code,
            durationMs: Date.now() - startedAt,
          });

          // Chave negada pelo Google: nao adianta tentar outros modelos, proxima chave.
          if (description.accessDenied) {
            console.warn(`[novelinhas] chave negada pelo Google (${model}): ${description.raw}`);
            break;
          }

          if (description.retryable && attempt < attemptsPerModel - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));
            continue;
          }

          if (description.retryable) break;

          throw err;
        }
      }
    }
  }

  // Groq free-tier TPM rejeita prompts longos (413); mantenha-o para pedidos curtos.
  const groqText = !referenceImage && promptInstructions.length <= 10000
    ? await generateWithGroq(promptInstructions, temperature)
    : null;
  if (groqText) {
    console.log('[novelinhas] gerado pelo Groq (fallback)');
    return { text: groqText, modelUsed: 'groq/gpt-oss-120b' };
  }

  const agnesText = await generateWithAgnes(promptInstructions, temperature, referenceImage);
  if (agnesText) {
    console.log('[novelinhas] gerado pela Agnes (fallback)');
    return { text: agnesText, modelUsed: 'agnes-2.5-flash' };
  }

  const openRouterText = await generateWithOpenRouter(promptInstructions, temperature, referenceImage);
  if (openRouterText) {
    return { text: openRouterText, modelUsed: 'openrouter/free-fallback' };
  }

  throw lastError || new Error('Não foi possível gerar o roteiro devido à alta demanda temporária.');
}

// ---------------------------------------------------------------------------
// PIPELINE DE VIDEO LONGO (consistencia em 10+ cenas)
// A geracao em chamada unica trunca a saida e perde a identidade dos personagens
// no meio do roteiro. Para videos longos o agente trabalha em duas etapas:
// 1) CONTRATO DE IDENTIDADE (PROMPT 00) + PLANO DE CONTINUIDADE das N cenas
// 2) GERACAO DAS CENAS EM BLOCOS PARALELOS, todos alimentados pelo mesmo
//    contrato canonico e pelo mesmo plano, o que mantem figurino, cenarios,
//    nomes, tom e ritmo iguais da cena 1 ate a ultima.
// ---------------------------------------------------------------------------
const SINGLE_CALL_MAX_SCENES = 8;
const LONG_VIDEO_BLOCK_SIZE = 5;

type LongVideoContext = {
  apiKey: string | string[];
  theme: string;
  country: string;
  tone: string;
  emotion: string;
  skinDirective: string;
  langName: string;
  locale: string;
  numScenes: number;
  themeDirective: string;
  extremeWeightDirective: string;
  ownScriptDirective: string;
  context: string;
  previousStory: string;
  isContinuing: boolean;
  referenceImage?: { mimeType: string; data: string } | null;
};

const countSceneBlocks = (value: string) =>
  (value.match(/PROMPT\s+(?:GANCHO\s+CHAMATIVO\s+)?CENA\s+\d+/gi) || []).length;

const countTag = (value: string, tag: string) =>
  (value.match(new RegExp(`\\[${tag}\\]`, 'gi')) || []).length;

const extractReferenceSheet = (value: string) => {
  const match = value.match(
    /PROMPT\s+00[\s\S]*?(?=\n\s*(?:ROTEIRO\s+DE\s+CONTINUIDADE|PROMPT\s+CENA\s+\d+)|$)/i,
  );
  return match ? match[0].trim() : '';
};

const stripReferenceSheet = (value: string) =>
  value
    .replace(/PROMPT\s+00[\s\S]*?(?=\n\s*PROMPT\s+CENA\s+\d+)/i, '')
    .replace(/ROTEIRO\s+DE\s+CONTINUIDADE[\s\S]*?(?=\n\s*PROMPT\s+CENA\s+\d+)/i, '')
    .trim();

const extractPlan = (value: string) => {
  const match = value.match(/ROTEIRO\s+DE\s+CONTINUIDADE[\s\S]*$/i);
  return match ? match[0].trim() : '';
};

const extractPlanLines = (plan: string, from: number, to: number) => {
  const lines = plan.split('\n');
  const wanted = new Set();
  for (let scene = from; scene <= to; scene += 1) wanted.add(scene);
  return lines
    .filter((line) => {
      const match = line.match(/CENA\s+(\d+)/i);
      return Boolean(match) && wanted.has(Number(match[1]));
    })
    .join('\n')
    .trim();
};

const buildBeatMap = (total: number) => {
  const hookEnd = Math.max(1, Math.min(2, total - 1));
  const falseWin = Math.max(hookEnd + 2, Math.round(total * 0.5));
  const turnEnd = Math.max(falseWin + 1, Math.round(total * 0.75));
  const accelEnd = Math.max(turnEnd + 1, total - 1);

  return [
    `GANCHO EXPLOSIVO: cenas 1 a ${hookEnd} (comece ja no conflito, sem rotina).`,
    `ESCALADA: cenas ${hookEnd + 1} a ${falseWin - 1} (cada cena piora a situação com um fato NOVO).`,
    `ALIVIO FALSO followed de AMEAÇA MAIOR: cena ${falseWin}.`,
    `REVIRAVOLTA que re-precifica tudo: cenas ${falseWin + 1} a ${turnEnd} (revelação em gesto filmável, plantada antes).`,
    `ACELERAÇÃO: cenas ${turnEnd + 1} a ${accelEnd} (segredos à tona, alianças viram, cerco aperta).`,
    `DESFECHO com REVERSÃO PÚBLICA: cena ${total}.`,
  ].join('\n');
};

const buildBiblePrompt = (ctx: LongVideoContext) => `
Você é o mais consagrado diretor cinematográfico e roteirista de novelinhas curtas dramáticas ultra-virais para redes sociais (Kwai, TikTok, Instagram Reels, YouTube Shorts).

REGRA #0 - IDIOMA DE DESTINO (PRIORIDADE MÁXIMA):
Tudo o que o público lê e ouve (história, descrições, falas, título, legenda e hashtags) DEVE estar em ${ctx.langName} (${ctx.locale}). É TERMINANTEMENTE PROIBIDO entregar conteúdo em português quando o idioma de destino for ${ctx.langName} (a única exceção é quando o destino for o próprio Português do Brasil). Os rótulos técnicos (PROMPT CENA, PLANO - CENA, etc.) permanecem exatamente como no padrão.

DIRETRIZ SOBERANA DE TEMA:
${ctx.themeDirective}

ATENÇÃO: É ESTRITAMENTE PROIBIDO DESVIAR DO TEMA '${ctx.theme}'. Toda a trama, personagens principais e locações DEVEM ser 100% fiéis ao tema '${ctx.theme}'.
${ctx.context ? `Contexto opcional do criador (totalmente adaptado para ocorrer DENTRO do tema '${ctx.theme}'): "${ctx.context}"` : ''}
${ctx.extremeWeightDirective}
${ctx.ownScriptDirective}
${ctx.isContinuing ? `ESTA HISTÓRIA É A PARTE 2 (CONTINUAÇÃO). O público JÁ viu a parte 1 e o plano abaixo NAO pode recontar nada do que já foi entregue. O bloco "ULTIMAS CENAS DA PARTE 1" traz o FINAL REAL da historia: comece EXATAMENTE deste ponto.\nCONTEXTO DA PARTE 1 (use só como referência de continuidade):\n"""\n${ctx.previousStory.slice(0, 7000)}\n"""\n` : ''}

PARÂMETROS DA PRODUÇÃO:
- Tema: ${ctx.theme} | País e idioma: ${ctx.country} (${ctx.langName})
- Tom do roteiro: ${ctx.tone} | Emoção dominante: ${ctx.emotion}
- Realismo de pele e imagem: ${ctx.skinDirective}
- TOTAL DE CENAS DO VÍDEO: ${ctx.numScenes} cenas de 8 segundos (episódio longo de aproximadamente ${Math.round(ctx.numScenes * 8)} segundos).
${ctx.referenceImage ? `REFERÊNCIA VISUAL ANEXADA (PRIORIDADE MÁXIMA):
- A imagem anexada é a FICHA OFICIAL dos personagens. Observe com atenção e descreva EXATAMENTE os personagens que aparecem nela: quantidade, formato do rosto/cabeça, material, textura, cores, roupas peça por peça, acessórios e proporções.
- O PROMPT 00 e TODAS as cenas DEVEM usar ESSES MESMOS personagens da imagem. É PROIBIDO inventar personagens diferentes, trocar roupas, mudar cores, mudar o estilo ou criar novas frutas/objetos que não estão na imagem.
- Se a imagem tiver mais de um personagem, use todos como elenco principal da história.
- Os personagens da imagem SUBSTITUEM os exemplos do tema: use as frutas/objetos EXATOS da imagem, não os do exemplo.
` : ''}

################################################################
POLÍTICA DE PERSONAGENS ADULTOS (OBRIGATÓRIA - FLOW / SEEDANCE)
################################################################
- TODOS os personagens são ADULTOS (18 anos ou mais). Escreva sempre "adulto"/"adulta" junto da idade (22, 35, 50...).
- PROIBIDO nomes no diminutivo que remetem a criança (terminações -inha/-inho ou apelidos infantis). Use nomes adultos (ex: "Morango Vitória", "Maracujá Brabo").
- PROIBIDO descrever crianças, adolescentes, "jovem" com aparência infantil, uniforme escolar, jardineira infantil, ou corpo "delicado/pequeno" com baixa estatura.
- Altura mínima: 1,60m para mulheres adultas e 1,70m para homens adultos.
- Roupas sempre adultas (vestido elegante, terno, camisa social, macacão adulto). NUNCA jardineira escolar, shorts infantil ou laços de criança.
- O [Negative Prompt] de TODAS as cenas DEVE incluir: child, minor, teenager, kid, school uniform, loli, childlike proportions.

################################################################
ETAPA 1 DE 2 - CONTRATO DE IDENTIDADE E PLANO DE CONTINUIDADE
################################################################
Este é um VÍDEO LONGO. Você NÃO vai escrever as cenas agora: as ${ctx.numScenes} cenas serão geradas depois, em blocos paralelos, e cada bloco vai ler EXATAMENTE o contrato e o plano que você escrever agora. A consistência do episódio inteiro (mesmo personagem, mesma roupa, mesmo cenário, mesmo tom, sem repetição) depende 100% da qualidade do que você entregar agora.

ENTREGUE EXATAMENTE ESTAS DUAS SEÇÕES, NADA MAIS (proibido escrever cenas prontas, proibido escrever PROMPT MODEL SHEET, proibido escrever bloco SEO):

PROMPT 00 - FICHA DE PERSONAGENS E CENÁRIO MESTRE (REFERENCE SHEET):
[Reference ID: Subject 1 - Nome]: ficha fixa, completa e IMUTÁVEL: nome, idade exata, altura em cm, porte/biotipo, tom e textura de pele, formato do rosto, cor dos olhos, corte e textura do cabelo (barba/bigode se houver), ROUPA completa peça por peça com tecidos e cores, CALÇADOS e ACESSÓRIOS identificadores.
[Reference ID: Subject 2 - Nome]: ... (repita o nível de detalhe para cada personagem, sem exceção)
[Reference ID: Subject N - Nome]: ...
[MARCAS ÚNICAS IMUTÁVEIS (CHARACTER FINGERPRINT)]: para CADA personagem, liste 2 a 3 detalhes visuais exclusivos que NUNCA mudam entre as cenas (ex: visor digital verde na testa, falha na farinha de rosca do lado esquerdo, botão prateado no sobretudo, reflexo azul no olho direito). Esses detalhes são a âncora de consistência e devem ser repetidos em todas as cenas.
[Master Environment Specification - Primary Setting]: descrição detalhada e fixa do cenário mestre (materiais, texturas, janelas, móveis, objetos recorrentes e paleta de luz) que será repetida em todas as cenas.
[Camera, Lighting & Specs]: lente, luz e estilo de imagem fixos do episódio.

ROTEIRO DE CONTINUIDADE (${ctx.numScenes} CENAS):
A linha do plano define QUEM FALA e QUEM RESPONDE. Essa atribuição é LEI: a cena correspondente é obrigada a seguir.
PLANO - CENA 1 | LOCAL: ... | QUEM FALA: Nome exato do personagem | QUEM RESPONDE: Nome exato (ou "ninguem") | ACAO: ... | FALA: "texto EXATO que esse personagem diz" | RESPOSTA: "texto EXATO que o outro responde" (ou "sem resposta") | GANCHO PARA A PROXIMA: ...
PLANO - CENA 2 | LOCAL: ... | QUEM FALA: Nome exato | QUEM RESPONDE: Nome exato (ou "ninguem") | ACAO: ... | FALA: "..." | RESPOSTA: "..." | GANCHO PARA A PROXIMA: ...
(continua até PLANO - CENA ${ctx.numScenes})

ATENÇÃO CRÍTICA - ATRIBUIÇÃO DE FALA (ERRO QUE INVALIDA O EPISÓDIO):
- O NOME em "QUEM FALA" tem que ser o personagem que DIZ a frase em "FALA". Nunca escreva a fala de um personagem na linha de outro.
- O NOME em "QUEM RESPONDE" tem que ser quem DIZ a frase em "RESPOSTA", e essa resposta é a reação DIRETA à fala anterior, de outro personagem.
- Uma mesma frase nunca pode aparecer na linha de duas cenas com donos diferentes.
- Se você trocar o dono de uma fala entre duas cenas do plano, o vídeo final mostra a pessoa errada falando. Está PROIBIDO.

REGRAS INEGOCIÁVEIS DO PLANO (a história inteira tem ${ctx.numScenes} cenas):
1. DISTRIBUIÇÃO DE BATIMENTOS (obrigatória, use exatamente esta escala):
${buildBeatMap(ctx.numScenes)}
2. CADA CENA TEM UM SÓ TURNO: exatamente um momento que vira o jogo (revelação, traição, mudança de aliança ou decisão). Se tiver duas viradas, divida em duas cenas. Cada cena termina em mini-cliffhanger (corte na pergunta, nunca na resposta).
3. ATRIBUIÇÃO DE FALA POR CENA: a linha do plano DEVE declarar sempre QUEM FALA (nome exato do personagem do PROMPT 00), QUEM RESPONDE e o texto literal de cada uma. As falas do plano são copiadas LITERALMENTE para as cenas — é assim que a consistência de dono da fala é garantida.
3. CAUSA E EFEITO: a cena N+1 sempre nasce da cena N (mesmo lugar, mesmo objeto, mesma consequência). É PROIBIDO escrever uma cena que poderia estar em qualquer ordem.
4. NENHUMA REPETIÇÃO: cada linha do plano traz um fato, objeto ou virada NOVO. Proibido repetir ação, fala, briga ou revelação já descrita em outra linha.
5. ESCADA DE ROTAÇÃO DOS GANCHOS: alterne o tipo de gancho entre as cenas (identidade / emoção / realização) para o público não sentir repetição.
6. CUSTO EMOCIONAL CRESCENTE: humilhação, perda e desespero aumentam até a reviravolta; o alívio do meio sempre é seguido de ameaça maior.
7. PROIBIDO CLICHÊ: nada de marido traindo com a empregada, madrasta malvada, herança disputada, "segredo do passado" genérico, casamento cancelado no altar, vilão genérico. Cada premissa nasce de um PROBLEMA CONCRETO e filmável do cotidiano (uma dívida, um boleto, uma mensagem, um documento, uma humilhação pública).
8. PASSAGEM DE TEMPO: quando o tempo avançar, crie UMA cena curta de transição marcada com "MAIS TARDE..." / "NA MANHÃ SEGUINTE..." e mantenha o MESMO figurino dos personagens (trocar de roupa só é permitido se o plano justificar explicitamente a troca e isso acontecer uma única vez).
9. ELENCO FIXO: no máximo 6 personagens no PROMPT 00. Se o plano exigir um personagem novo, ele NASCE com nome, idade e roupa fixos na PRIMEIRA aparição e nunca mais muda.
10. O PLANO É A BÍBLIA DO EPISÓDIO: as cenas serão escritas por blocos independentes que lerão só este contrato. Se uma linha do plano for vaga, a cena correspondente sairá fraca. Escreva cada linha com detalhe filmável e especifico.
11. TODO o conteúdo (fichas, plano, falas) em ${ctx.langName}, exceto os rótulos técnicos em português.
`;

const buildBlockFormatSpec = (ctx: LongVideoContext) => `
VOCÊ É O MAIOR CONSAGRADO DIRETOR CINEMATOGRÁFICO E ROTEIRISTA DE NOVELINHAS ULTRA-VIRAIS (Kwai, TikTok, Reels, YouTube Shorts). Você escreve prompts visuais fotorrealistas 4K no padrão SEEDANCE 2.5 (ByteDance / Dreamina / CapCut) e GOOGLE FLOW, com áudio nativo e lip-sync.

IDIOMA (PRIORIDADE MÁXIMA): tudo que o público lê e ouve (descrições, ações, falas, título, legenda, hashtags) em ${ctx.langName} (${ctx.locale}). É TERMINANTEMENTE PROIBIDO escrever conteúdo em português quando o idioma de destino for ${ctx.langName}. Os rótulos técnicos do formato permanecem exatamente como no padrão (em português).

TEMA OBRIGATÓRIO: '${ctx.theme}' (${ctx.country}). Tom: ${ctx.tone}. Emoção dominante: ${ctx.emotion}. Realismo de imagem: ${ctx.skinDirective}.

FORMATO EXATO DE CADA CENA (repita idêntico em todas, sem pular nenhuma linha):
PROMPT CENA N (SEEDANCE 2.5):
QUEM FALA: [Nome + FICHA FÍSICA FIXA COMPLETA (idade, altura, porte, tom/textura de pele, cabelo/barba, ROUPA exata com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS) + papel dramático, expressão facial, postura e estado emocional]
TOM E INTENÇÃO DA FALA: [tom vocal, cadência, ritmo e respiração em ${ctx.langName}]
DIÁLOGO REAL: "[diálogo real e curto]" (máx. 18 palavras; com réplica, máx. 10 palavras cada e soma das duas nunca passa de 20)
QUEM RESPONDE: [Nome + FICHA FÍSICA FIXA COMPLETA + reação física imediata]
RESPOSTA: "[réplica real e curta]" (ou a cena fica sem esta linha, se a resposta no plano for "sem resposta")
INSTRUÇÕES VISUAIS (PROMPT SEEDANCE 2.5 & GOOGLE FLOW):
[Subject & Character Consistency]: Subject N - Nome (ficha por extenso, idêntica ao PROMPT 00). NUNCA escreva "mesmo personagem".
[Reference Lock - FICHA OBRIGATÓRIA]: ANEXE a ficha do PROMPT 00 (character sheet: frente, 3/4 e corpo inteiro) como IMAGEM DE REFERÊNCIA na ferramenta. O personagem deve sair IDÊNTICO à ficha: rosto, formato do objeto/fruta, textura, cor, roupa, calçados, acessórios, proporções e as MARCAS ÚNICAS (fingerprint) do PROMPT 00. PROIBIDO redesenhar, trocar roupa, mudar cor/textura, envelhecer ou alterar proporções; mantenha a mesma seed e enquadramento quando a ferramenta permitir.
[Environment & Scene Setting]: cenário 3D real e detalhado da cena (piso, paredes, janelas, móveis de fundo, iluminação, profundidade).
[Background Override]: CRITICAL: the reference image has a white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Ground the characters inside the 3D environment with contact shadows. No empty white studio void.
[Action & First-Frame Blocking]: posição inicial, movimento orgânico com causa antes do efeito, postura e respiração.
[Optics & Camera Movement]: two-shot médio (50-85mm, f/1.8, slow push-in) mantendo NA FOTO o rosto e a boca dos DOIS personagens da conversa. PROIBIDO alternating close-ups ou corte para um único personagem durante o diálogo (quebra o lip-sync).
[Dialogue & Native Audio]: FIRST Character [Nome] (ficha completa) speaks: "[diálogo]" with precision lip-sync and [tom]; THEN Character [Nome] (ficha completa) responds: "[resposta]" with precision lip-sync and [tom]. Apenas quem fala move a boca; o outro permanece calado e reagindo; nunca sobreponha as vozes.
[Lighting & Atmosphere]: direção e motivação das luzes coerentes com o cenário.
[Audio & Ambience (SFX)]): paisagem sonora e foley nativos do local.
[Global Style & Physical Realism]: 4K fotorrealista, ${ctx.skinDirective}, física natural, 24fps.
[Negative Prompt]: white background, blank white void, studio cyclorama, plain backdrop, floating characters, artificial studio setup, empty white space, child, minor, teenager, kid, school uniform, loli, childlike proportions.

################################################################
REGRA DE OURO INVIOLÁVEL - CADA FALA NO SEU DONO E NO SEU MOMENTO
################################################################
Este é o erro que mais estraga o vídeo: um personagem falando a fala de outro. Você TEM que seguir esta regra ao pé da letra:

1. DONO FIXO: o texto de "DIÁLOGO REAL" pertence SOMENTE ao personagem declarado em "QUEM FALA". O texto de "RESPOSTA" pertence SOMENTE ao personagem declarado em "QUEM RESPONDE". Copie o texto exatamente como está no PLANO, sem trocar, sem resumir, sem mudar o conteúdo.
2. O PLANO É A LEI: em cada cena, "QUEM FALA" e "QUEM RESPONDE" tem que ser EXATAMENTE os nomes do bloco "QUEM FALA"/"QUEM RESPONDE" da linha "PLANO - CENA N" correspondente. Se o plano diz que é a Dona Clara que fala, é a Dona Clara que fala — mesmo que a frase pareça mais natural na boca de outro personagem.
3. NUNCA antecipe nem repita: não escreva a fala que pertence à cena seguinte, nem repita a fala da cena anterior. Cada personagem abre a boca UMA vez por cena, na ordem escrita.
4. COERÊNCIA DE PAPÉIS: o vocabulário e o tom de cada fala combinam com a idade e o papel do dono (a avó não fala como o neto, o vilão não fala como a vítima). A RESPOSTA reage diretamente à fala anterior, nunca muda de assunto.
5. O bloco [Dialogue & Native Audio] é a FONTE DA VERDADE do áudio: ele DEVE repetir, na MESMA ordem, o nome e o texto exato de QUEM FALA/DIÁLOGO REAL e de QUEM RESPONDE/RESPOSTA. Se o nome ou o texto divergirem do bloco de diálogo acima, corrija antes de entregar.
6. AUTO-VERIFICAÇÃO OBRIGATÓRIA antes de fechar cada cena: releia e confirme (a) QUEM FALA é o dono do DIÁLOGO REAL; (b) QUEM RESPONDE é o dono da RESPOSTA; (c) nenhum terceiro personagem falou; (d) os nomes em [Dialogue & Native Audio] são os mesmos. Se algo estiver errado, reescreva a cena.

OUTRAS REGRAS INEGOCIÁVEIS:
1. Cada cena tem UM SÓ turno e termina em mini-cliffhanger (corte na pergunta, nunca na resposta).
2. A cena N+1 nasce da cena N: mesmo lugar, mesmo objeto, mesma consequência. Proibido repetir ação, fala ou virada já existente no plano.
3. Cenhas de diálogo devem coerir: quem conversa está no MESMO ambiente, se olhando (nada de "ao telefone" numa conversa frente a frente).
4. Fala curta, seca e filmável, em ${ctx.langName}. Proibido discurso, monólogo ou frase genérica de novela.
5. Nenhum "..." ou "mesmo de antes": cada cena sai completa, com o mesmo nível de detalhe das outras.
6. CONSISTÊNCIA COM REFERÊNCIA: toda cena começa com a ficha do PROMPT 00 anexada como imagem de referência. A cena só é válida se o personagem estiver idêntico à ficha (mesmo rosto, roupa, textura, cores e MARCAS ÚNICAS). Se a ferramenta permitir seed, use sempre a mesma.
7. MARCAS ÚNICAS (FINGERPRINT): repita em cada cena os 2-3 detalhes exclusivos de cada personagem definidos no PROMPT 00 (ex: visor verde na testa, falha na farinha do lado esquerdo, botão prateado). Eles são a âncora visual da identidade.
8. PERSONAGENS ADULTOS (POLÍTICA OBRIGATÓRIA): todos os personagens são adultos (18+), com "adulto/adulta" e idade escrita na ficha. PROIBIDO nomes no diminutivo que remetam a criança, crianças, adolescentes, uniforme escolar, jardineira infantil, corpo "delicado/pequeno" com baixa estatura. Altura mínima: 1,60m (mulheres) e 1,70m (homens). O [Negative Prompt] de cada cena DEVE conter: child, minor, teenager, kid, school uniform, loli, childlike proportions.
`;

const normalizeName = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Honorificos que nao identificam personagem (para nao casar "Dona Clara" com qualquer "dona").
const HONORIFICS = new Set(['dona', 'don', 'sr', 'sra', 'senhor', 'senhora', 'menina', 'moço', 'moca']);

const planNameTokens = (value: unknown) =>
  normalizeName(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !HONORIFICS.has(token));

// O nome do plano casa se QUALQUER token distintivo dele aparecer no texto da cena.
const nameMatches = (haystack: string, planName: string) => {
  const tokens = planNameTokens(planName);
  if (!tokens.length) return false;
  const normalized = normalizeName(haystack);
  return tokens.some((token) => normalized.includes(token));
};

const hasNobody = (value: unknown) => {
  const tokens = normalizeName(value)
    .split(' ')
    .filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every((token) => ['ninguem', 'nenhum', 'sem', 'resposta', 'n', 'a', 'nao', 'nada'].includes(token));
};

const extractScenes = (text: string) => {
  const matches = Array.from(
    text.matchAll(/PROMPT\s+(?:GANCHO\s+CHAMATIVO\s+)?CENA\s+(\d+)[^\n:]*:/gi),
  );

  return matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return { number: Number(match[1]) || index + 1, content: text.slice(start, end) };
  });
};

const readPlanOwner = (planLine: string) => {
  const speaker = planLine.match(/QUEM\s+FALA\s*:\s*([^|]+)/i)?.[1] || '';
  const replier = planLine.match(/QUEM\s+RESPONDE\s*:\s*([^|]+)/i)?.[1] || '';
  const line = planLine.match(/(?:^|\|)\s*FALA\s*:\s*"([^"]*)"/i)?.[1] || '';
  const reply = planLine.match(/(?:^|\|)\s*RESPOSTA\s*:\s*"([^"]*)"/i)?.[1] || '';

  return {
    speaker: String(speaker).trim(),
    replier: hasNobody(replier) ? '' : String(replier).trim(),
    line,
    reply,
  };
};

// Confere se cada cena respeitou o dono da fala definido no plano. É a trava que impede
// um personagem de falar a fala de outro — o defeito mais visível do roteiro final.
const findSpeakerMismatches = (blockText: string, plan: string) => {
  const planLines = new Map<string, string>();
  plan
    .split('\n')
    .forEach((line) => {
      const scene = line.match(/CENA\s+(\d+)/i)?.[1];
      if (scene) planLines.set(scene.padStart(3, '0'), line);
    });

  const problems: string[] = [];

  for (const scene of extractScenes(blockText)) {
    const planLine = planLines.get(String(scene.number).padStart(3, '0'));
    if (!planLine) continue;

    const expected = readPlanOwner(planLine);
    if (!expected.speaker || hasNobody(expected.speaker)) continue;

    const speaker = scene.content.match(/QUEM\s+FALA\s*:\s*([^\n]+)/i)?.[1] || '';
    const replier = scene.content.match(/QUEM\s+RESPONDE\s*:\s*([^\n]+)/i)?.[1] || '';
    const dialogue = scene.content.match(/DI[ÁA]LOGO\s+REAL\s*:\s*"([^"]*)"/i)?.[1] || '';
    const reply = scene.content.match(/RESPOSTA\s*:\s*"([^"]*)"/i)?.[1] || '';
    const audio = scene.content.match(/\[Dialogue\s*&\s*Native\s*Audio\]\s*:?\s*([\s\S]*?)(?=\n\s*\[|$)/i)?.[1] || '';

    if (!nameMatches(`${speaker} ${audio}`, expected.speaker)) {
      problems.push(`CENA ${scene.number}: o plano manda "${expected.speaker}" falar, mas a cena entrega a fala a "${normalizeName(speaker).split(' ').filter(Boolean).slice(0, 2).join(' ') || 'ninguem'}".`);
    }

    if (expected.line && dialogue && normalizeName(dialogue) !== normalizeName(expected.line)) {
      problems.push(`CENA ${scene.number}: o DIÁLOGO REAL nao e a fala prevista no plano.`);
    }

    const hasReply = Boolean(normalizeName(reply));
    const declaredReplier = normalizeName(replier).split(' ').filter(Boolean).slice(0, 2).join(' ');
    if (hasReply && !nameMatches(`${replier} ${audio}`, declaredReplier)) {
      problems.push(`CENA ${scene.number}: a RESPOSTA nao esta entregue ao personagem do plano.`);
    }

    if (expected.replier && hasReply && !nameMatches(`${replier} ${audio}`, expected.replier)) {
      problems.push(`CENA ${scene.number}: o plano manda "${expected.replier}" responder, mas a resposta sai em nome de "${declaredReplier || 'ninguem'}".`);
    }

    if (expected.replier && !hasReply) {
      problems.push(`CENA ${scene.number}: faltou a resposta de "${expected.replier}".`);
    }

    if (hasReply && !expected.replier) {
      problems.push(`CENA ${scene.number}: a cena respondeu mas o plano previa cena sem resposta.`);
    }

    if (dialogue && audio && !normalizeName(audio).includes(normalizeName(dialogue).slice(0, 28))) {
      problems.push(`CENA ${scene.number}: [Dialogue & Native Audio] nao repete o DIÁLOGO REAL.`);
    }
  }

  return problems;
};

const buildBlockPrompt = (opts: {
  ctx: LongVideoContext;
  start: number;
  end: number;
  index: number;
  totalBlocks: number;
  isLastBlock: boolean;
  referenceSheet: string;
  plan: string;
}) => {
  const { ctx, start, end, index, totalBlocks, isLastBlock, referenceSheet, plan } = opts;
  const expected = end - start + 1;
  const previousContext = extractPlanLines(plan, Math.max(1, start - 2), start - 1);

  return `${buildBlockFormatSpec(ctx)}
${ctx.themeDirective ? `\nDIRETRIZ OBRIGATÓRIA DO TEMA '${ctx.theme}':\n${ctx.themeDirective}\n` : ''}${ctx.extremeWeightDirective}
################################################################
ETAPA 2 DE 2 - BLOCO ${index} DE ${totalBlocks}: ESCREVA SOMENTE AS CENAS ${start} A ${end}
################################################################
A história inteira tem ${ctx.numScenes} cenas e JÁ FOI PLANEJADA (outros blocos estão sendo escritos em paralelo agora). SUA TAREFA É ESCREVER SOMENTE AS CENAS ${start} A ${end} (${expected} cenas) no formato técnico acima.

CONTRATO DE IDENTIDADE (PROMPT 00) - FONTE CANÔNICA, REPITA IDENTICO E PALAVRA POR PALAVRA:
"""
${referenceSheet || '(Use o plano abaixo como referência de identidade.)'}
"""

PLANO COMPLETO DO EPISÓDIO (é a bíblia da história: escreva exatamente o que o plano define, sem inventar outra trama):
"""
${plan}
"""
${
  previousContext
    ? `
CONTEXTO IMEDIATO (as cenas anteriores deste bloco JA foram escritas a partir deste mesmo plano):
"""
${previousContext}
"""
A cena ${start} DEVE abrir exatamente do ponto em que a cena ${start - 1} terminou, reagindo a ela.`
    : ''
}

REGRAS BLOCO ${index}/${totalBlocks} (PRIORIDADE MÁXIMA):
1. COMECE DIRETO em "PROMPT CENA ${start} (SEEDANCE 2.5):". É TERMINANTEMENTE PROIBIDO reescrever o PROMPT 00, o plano de continuidade, os CHARACTER MODEL SHEETS ou qualquer cena fora da faixa ${start}-${end}.
2. Escreva as ${expected} cenas em sequência, sem pular nem repetir números, com TODOS os rótulos na MESMA ordem e TODAS as 10 seções entre colchetes em cada cena.
3. CONSISTÊNCIA CANÔNICA: em [Subject & Character Consistency] e em QUEM FALA/QUEM RESPONDE, repita a ficha do PROMPT 00 por extenso (idade, altura, porte, tom/textura de pele, rosto, cabelo, roupa peça por peça com cores e tecidos, calçados e acessórios). A identidade é a mesma da cena 1 até a cena ${ctx.numScenes}.
4. CONTINUIDADE: mantenha o cenário mestre do PROMPT 00 e o ambiente da cena anterior. Passagem de tempo só com marcação curta ("MAIS TARDE...") e sem trocar de figurino.
5. Não repita nenhuma fala, ação ou virada já existente no plano antes da cena ${start}.
6. DONO DA FALA (ERRO QUE INVALIDA O BLOCO): em cada cena, QUEM FALA e QUEM RESPONDE tem que ser EXATAMENTE os nomes do bloco "QUEM FALA"/"QUEM RESPONDE" da linha "PLANO - CENA N" correspondente, e o DIÁLOGO REAL e a RESPOSTA tem que ser o TEXTO EXATO previsto no plano, copiado sem trocar nenhuma palavra. Se o plano diz "sem resposta", a cena NÃO tem RESPOSTA nem QUEM RESPONDE. O bloco [Dialogue & Native Audio] repete os mesmos nomes e os mesmos textos, na mesma ordem. NUNCA coloque na boca de um personagem a fala de outro.
${
  isLastBlock
    ? `6. COMO ESTE É O ÚLTIMO BLOCO, ao final das cenas ${start}-${end} entregue também: (a) os CHARACTER MODEL SHEETS (fundo branco puro, 6 ângulos de corpo inteiro + 3 retratos de rosto) de TODOS os personagens que apareceram NO EPISÓDIO INTEIRO; (b) o bloco final "---SEO-START---" com Título Sugerido, Legenda, Gatilho de Engajamento e Hashtags em ${ctx.langName}.`
    : `6. Este NÃO é o último bloco: não gere model sheets nem SEO aqui. Entregue somente as cenas ${start} a ${end}.`
}`;
};

const generateLongVideo = async (ctx: LongVideoContext) => {
  const biblePrompt = buildBiblePrompt(ctx);
  let bible = (
    await generateWithModelFallback(
      biblePrompt,
      ctx.apiKey,
      0.7,
      {
        attemptsPerModel: 1,
        timeoutMs: 45000,
      totalBudgetMs: 45000,
      },
      ctx.referenceImage
    )
  ).text || '';

  if (!bible.trim()) {
    throw new Error('Nenhum texto foi gerado pelo modelo.');
  }

  const planCount = (bible.match(/PLANO\s+-\s*CENA\s+\d+/gi) || []).length;
  let referenceSheet = extractReferenceSheet(bible);
  let plan = extractPlan(bible);

  if (planCount < ctx.numScenes || !referenceSheet || !plan) {
    const retry = await generateWithModelFallback(
      `${biblePrompt}

================================================================
CORRECAO OBRIGATORIA
================================================================
A resposta anterior ficou incompleta. Gere de novo o contrato completo contendo:
- a seção "PROMPT 00 - FICHA DE PERSONAGENS E CENARIO MESTRE (REFERENCE SHEET)" com TODOS os personagens;
- a seção "ROTEIRO DE CONTINUIDADE (${ctx.numScenes} CENAS)" com EXATAMENTE ${ctx.numScenes} linhas, uma para cada cena, no formato "PLANO - CENA N | LOCAL: ... | QUEM FALA: Nome | QUEM RESPONDE: Nome (ou "ninguem") | ACAO: ... | FALA: "texto exato" | RESPOSTA: "texto exato" (ou "sem resposta") | GANCHO PARA A PROXIMA: ...". A atribuicao de fala e obrigatoria: cada nome e o dono real da fala escrita ao lado.`,
      ctx.apiKey,
      0.6,
      { attemptsPerModel: 1, timeoutMs: 45000, totalBudgetMs: 45000 },
      ctx.referenceImage,
    );

    const retryText = retry.text || '';
    const retryPlanCount = (retryText.match(/PLANO\s+-\s*CENA\s+\d+/gi) || []).length;

    if (retryPlanCount > planCount || (!referenceSheet && retryText)) {
      bible = retryText;
      referenceSheet = extractReferenceSheet(bible) || referenceSheet;
      plan = extractPlan(bible) || plan;
    }
  }

  const ranges: Array<{ start: number; end: number }> = [];
  for (let start = 1; start <= ctx.numScenes; start += LONG_VIDEO_BLOCK_SIZE) {
    ranges.push({ start, end: Math.min(ctx.numScenes, start + LONG_VIDEO_BLOCK_SIZE - 1) });
  }

  const blockTexts = await Promise.all(
    ranges.map(async (range, index) => {
      const expected = range.end - range.start + 1;
      const blockPrompt = buildBlockPrompt({
        ctx,
        start: range.start,
        end: range.end,
        index: index + 1,
        totalBlocks: ranges.length,
        isLastBlock: index === ranges.length - 1,
        referenceSheet,
        plan,
      });

      const callBlock = (temperature: number) =>
        generateWithModelFallback(
          blockPrompt,
          ctx.apiKey,
          temperature,
          {
            attemptsPerModel: 1,
            timeoutMs: 45000,
          totalBudgetMs: 45000,
          },
          ctx.referenceImage
        ).then((result) => result.text || '');

      let blockText = await callBlock(0.75);

      const hasAllSections = (text: string) =>
        countSceneBlocks(text) >= expected &&
        countTag(text, 'Subject & Character Consistency') >= expected &&
        countTag(text, 'Dialogue & Native Audio') >= expected &&
        countTag(text, 'Negative Prompt') >= expected;

      if (!hasAllSections(blockText)) {
        const retry = await generateWithModelFallback(
          `${blockPrompt}

================================================================
CORRECAO OBRIGATORIA DO BLOCO
================================================================
Reescreva APENAS as cenas ${range.start} a ${range.end} (${expected} cenas), todas completas, numeradas em sequencia e com TODAS as 10 secoes entre colchetes em cada cena. Comece direto em "PROMPT CENA ${range.start} (SEEDANCE 2.5):" e nao inclua o PROMPT 00 nem o plano.`,
          ctx.apiKey,
          0.7,
          { attemptsPerModel: 1, timeoutMs: 45000, totalBudgetMs: 45000 },
          ctx.referenceImage,
        );

        if (retry.text && countSceneBlocks(retry.text) >= countSceneBlocks(blockText)) {
          blockText = retry.text;
        }
      }

      // Trava de dono da fala: se algum personagem disse a fala de outro, reescreve o bloco.
      let mismatches = findSpeakerMismatches(blockText, plan);

      for (let attempt = 0; mismatches.length && attempt < 1; attempt += 1) {
        console.warn(`[novelinhas] bloco ${range.start}-${range.end} com fala fora do dono: ${mismatches.join(' | ')}`);

        const fixed = await generateWithModelFallback(
          `${blockPrompt}

================================================================
CORRECAO OBRIGATORIA - DONO DA FALA (ERRO GRAVE)
================================================================
As cenas ${range.start} a ${range.end} violaram a regra de dono da fala. Problemas detectados:
${mismatches.map((problem) => `- ${problem}`).join('\n')}

Reescreva as cenas ${range.start} a ${range.end} obeying a regra de ouro:
- QUEM FALA e QUEM RESPONDE tem que ser EXATAMENTE os nomes do PLANO da cena correspondente;
- DIÁLOGO REAL e RESPOSTA tem que ser o TEXTO EXATO previsto no plano, palavra por palavra;
- [Dialogue & Native Audio] repete os mesmos nomes e os mesmos textos, na mesma ordem;
- se o plano disser "sem resposta", a cena nao tem RESPOSTA.
Comece direto em "PROMPT CENA ${range.start} (SEEDANCE 2.5):".`,
          ctx.apiKey,
          0.5,
          { attemptsPerModel: 1, timeoutMs: 45000, totalBudgetMs: 45000 },
          ctx.referenceImage,
        );

        if (fixed.text && countSceneBlocks(fixed.text) >= countSceneBlocks(blockText)) {
          blockText = fixed.text;
        }

        mismatches = findSpeakerMismatches(blockText, plan);
      }

      return stripReferenceSheet(blockText);
    }),
  );

  const orderedBlocks = blockTexts.filter((block) => block && block.trim());
  const header = referenceSheet || bible;

  return [header, ...orderedBlocks].join('\n\n');
};

const handleGenerate = async (req: any, res: any) => {
  try {
    const {
      theme = 'Dramas Emocionantes',
      country = 'Brasil',
      tone = 'Dramático e ultra-realista',
      emotion = 'Empatia',
      skinRealism = 'ultimate',
      scenes = 6,
      context = '',
      previousStory = '',
      userScript = '',
      userScriptMode = '',
    } = req.body || {};

    const skinDescriptorMap: Record<string, string> = {
      standard:
        'Pele cinematográfica orgânica e crua (raw natural skin texture), poros finos naturais visíveis, penugem facial sutil (peach fuzz), dispersão de luz subsuperficial autêntica (subsurface scattering), sem filtros de embelezamento ou aspecto plástico de IA.',
      extreme:
        'Dermo-realismo extremo cinematográfico: microporos nítidos com textura celular visível, brilho natural de sebo e micro-gotículas de transpiração nas têmporas e testa, linhas de expressão marcadas pela emoção, vermelhidão natural nos capilares do nariz e bochechas, córnea ultra-brilhante com reflexo especular nítido do ambiente, textura crua 35mm.',
      ultimate:
        'Nível Máximo de Fotorrealismo Óptico (Shot on ARRI Alexa 65, Master Prime 85mm f/1.4): textura de dermo-realismo e macro-detalhe absoluto, microporos individuais visíveis sem compressão, imperfeições cutâneas autênticas, textura labial vincada natural, lágrimas ou umidade ocular realista com reflexo volumétrico, penugem e pelos individuais nítidos, iluminação com contraste de filme analógico Kodak Vision3 500T, zero sensação sintética ou acabamento de videogame.',
    };

    const themeDirectives: Record<string, string> = {
      'Frutas': `O TEMA OBRIGATÓRIO É 'FRUTAS HUMANIZADAS (NOVELINHA DE FRUTAS EM ANIMAÇÃO 3D)' 🍓🍌🍎🍇.
DIRETRIZ MÁXIMA DE PERSONAGENS DE FRUTA:
Neste tema, TODOS os personagens são OBRIGATORIAMENTE FRUTAS HUMANIZADAS / ANTROPOMÓRFICAS com características humanas completas, personalidades marcantes e aparência estritamente consistente em todos os episódios e cenas!

ESTILO VISUAL OBRIGATÓRIO:
- Animação 3D cinematográfica de alta qualidade (qualidade de longa-metragem Disney/Pixar ou Illumination).
- Personagens extremamente expressivos, com textura realista e tátil da casca da fruta (pequenas sementes douradas na pele do morango, casca cerosa brilhante da maçã, textura aveludada do pêssego, gomos detalhados da tangerina).
- Iluminação profissional volumétrica de animação 3D, cores vibrantes, formato vertical 9:16.

ESTRUTURA OBRIGATÓRIA PARA CRIAR CADA PERSONAGEM (SEGUIR À RISCA NO PROMPT 00 E REPETIR EM TODAS AS CENAS):
- Fruta: Espécie exata (Morango, Banana, Uva, Maçã, Manga, Pera, Abacaxi, Limão, Melancia, Cereja, Abacate, Kiwi, Pêssego).
- Gênero: Feminino ou Masculino.
- Idade aparente: Adulto jovem (18-30), adulto ou idoso.
- Cabeça: formato da fruta (arredondada do morango, alongada e afunilada do abacate), tamanho grande em relação ao corpo, com a superfície da fruta bem visível.
- Textura da fruta: casca ou polpa realista e tátil — sementes amarelo-claras espalhadas na pele do morango, casca rugosa verde-escura nas laterais do abacate, casca cerosa da maçã, gomos da tangerina. A textura da fruta TAMBÉM aparece nos braços, barriga e pernas.
- Cabelo: folhas verdes pontudas no topo da cabeça formando uma coroa natural ou penteado (quando a fruta tiver folhas); nunca cabelo humano comum.
- Rosto: humanoide esculpido na fruta, olhos grandes e expressivos com íris colorida, cílios destacados (femininas), sobrancelhas grossas e arqueadas, nariz pequeno, boca larga e articulada com dentes perfeitos para lip-sync.
- Corpo: proporções humanas estilizadas (ombros, braços, pernas, mãos de cinco dedos), barriga e pernas arredondadas. Quando a história pedir, a personagem pode estar GESTANTE (barriga grande, redonda e projetada para a frente), sempre com o mesmo tamanho durante todo o episódio.
- Roupa: figurino humano completo e coerente com a personalidade (top e shorts, vestido, camisa de time, terno, avental), tecidos e cores fixos que JAMAIS mudam entre as cenas.
- Expressão e postura: descreva o olhar e a emoção de cada momento (carinhoso, desconfiado, alegre, magoado) e a posição do corpo (sentada no sofá com as mãos na barriga, em pé ao lado, etc.).
- Personalidade: marcante de novela (romântica e ciumenta, vilã invejosa e calculista, playboy arrogante, amigo leal e cômico).
- Papel na novela: Protagonista, vilão/vilã, namorado(a), amante, rival, sogra implicante ou mentor.
- Estilo: Animação 3D cinematográfica vertical 9:16.

EXEMPLO CANÔNICO DE REFERÊNCIA:
Morango Vitória, a protagonista (25 anos, mulher adulta):
"Uma personagem feminina ADULTA de 25 anos, antropomórfica inspirada em um morango vermelho maduro. Seu corpo possui formato de morango, com textura natural, pequenas sementes douradas distribuídas pela pele e folhas verdes formando uma espécie de cabelo no topo da cabeça. Possui rosto feminino expressivo de mulher adulta, olhos grandes e expressivos, cílios longos, sobrancelhas bem definidas, nariz pequeno e lábios rosados. Seus braços e pernas possuem proporções humanas de adulta, com mãos de cinco dedos. Usa um vestido rosa elegante de corte adulto, sapatos delicados e uma bolsa combinando. Sua personalidade é romântica, carismática e um pouco ciumenta. Demonstra emoções humanas intensas, como felicidade, tristeza, surpresa, raiva e decepção. Estilo visual: animação 3D cinematográfica, personagem extremamente expressiva, textura realista de fruta, iluminação profissional, cores vibrantes, formato vertical 9:16."

CENÁRIOS DO TEMA FRUTAS:
Os cenários devem ser ambientes 3D cinematográficos na escala das frutas ou cenários requintados estilizados. EXEMPLOS: sala de estar aconchegante com sofá bege, abajur de luz amarelada quente, estante de madeira com livros, plantas decorativas, quadros na parede e janela ao fundo; cozinha gourmet com bancada de carvalho; bistrô de doces artesanais; pomar iluminado por luz dourada; varanda de casa de praia; quarto de casal elegante.
ILUMINAÇÃO OBRIGATÓRIA: luz quente e suave, atmosfera de filme familiar de animação (Pixar / Disney), com sombras macias e profundidade.
É ESTRITAMENTE PROIBIDO fazer humanos comuns como protagonistas neste tema. Os personagens DEVEM SER AS FRUTAS HUMANIZADAS!`,

      'Objetos': `O TEMA OBRIGATÓRIO É 'OBJETOS HUMANIZADOS (NOVELINHA DE OBJETOS E COMIDAS ANTROPOMÓRFICAS)' 🍗🚗🥤📱.
DIRETRIZ MÁXIMA DE PERSONAGENS DE OBJETO:
Neste tema, TODOS os personagens são OBRIGATORIAMENTE OBJETOS OU COMIDAS HUMANIZADOS: o corpo tem proporções humanas, mas é TODO feito do material do objeto (coxinha dourada, metal da lata, lataria, plástico), SEM NENHUMA pele humana. A CABEÇA é o objeto em tamanho grande e o ROSTO é CARTOON/ESTILIZADO formado na própria superfície do objeto (olhos grandes e expressivos, sobrancelhas grossas, boca articulada com dentes) — exatamente como nos vídeos virais de coxinha, carro, latinha e celular. Aparência estritamente consistente em todos os episódios e cenas!

REGRA SEM PARTES HUMANAS (INEGOCIÁVEL):
- NENHUMA parte do corpo pode ter pele humana: braços, mãos, dedos, pernas, pescoço e barriga são do MESMO material e cor do objeto (ex: massa dourada e crocante da coxinha, metal vermelho da latinha).
- As mãos têm cinco dedos, mas os dedos são feitos do material do objeto, nunca de pele humana.
- Roupas (ternos, sobretudos, vestidos, gravatas, sapatos) são tecido/couro normais e podem cobrir o corpo.
- É PROIBIDO qualquer tom de pele humana aparecendo, qualquer mão humana, qualquer rosto humano. O personagem é 100% objeto/comida humanizado.

REGRA DE ROSTO (INEGOCIÁVEL):
- O rosto faz parte do OBJETO: é um rosto 3D cartunesco esculpido/pintado na coxinha, na lata, na lataria ou no plástico, com a mesma textura e cor do objeto ao redor.
- É TERMINANTEMENTE PROIBIDO colocar um rosto humano de pele real (foto de pessoa) dentro do objeto, recorte de rosto, máscara com abertura para o rosto ou cabeça humana aparecendo.
- O personagem NÃO é um humano fantasiado: a cabeça é 100% o objeto com o rosto estilizado nele.

ESTILO VISUAL OBRIGATÓRIO:
- Animação/render 3D cinematográfico de altíssima qualidade (qualidade de filme de animação adulta), com textura real e tátil do objeto: farinha de rosca dourada e crocante da coxinha, lataria pintada e brilhante do carro, metal escovado da latinha, plástico polido do celular, couro e costura do tênis.
- Corpo humano realista com roupas de luxo bem ajustadas, mãos humanas de cinco dedos.
- Iluminação cinematográfica dramática, profundidade de campo, formato vertical 9:16.

ESTRUTURA OBRIGATÓRIA PARA CRIAR CADA PERSONAGEM (SEGUIR À RISCA NO PROMPT 00 E REPETIR EM TODAS AS CENAS):
- Objeto: qual é exatamente (Coxinha, Pastel, Pão de queijo, Hambúrguer, Pizza, Latinha de refrigerante, Garrafa de cerveja, Carro esportivo, Celular, Tênis, Fone de ouvido, Controle de videogame, Sorvete).
- Gênero: Feminino ou Masculino.
- Idade aparente: Adulto jovem (18-30), adulto ou idoso.
- Cabeça: o objeto em tamanho GIGANTE (maior que uma cabeça humana normal), com volume, brilho, formato e textura bem reconhecíveis (metal, farinha de rosca, pintura automotiva, plástico). Elementos do objeto podem aparecer no rosto (ex: visor digital na testa da coxinha, tampa da lata no topo).
- Rosto: rosto 3D CARTOON integrado na superfície do objeto — olhos grandes e expressivos com íris, sobrancelhas grossas e arqueadas, nariz pequeno, boca larga e articulada com dentes perfeitos para lip-sync. NUNCA rosto humano de pele, NUNCA recorte/foto de rosto, NUNCA máscara.
- Corpo: corpo com proporções humanas (ombros, braços, pernas e mãos de cinco dedos), mas 100% revestido do material e da cor do objeto — SEM pele humana em nenhum ponto.
- Roupa: figurino humano de luxo coerente com a personalidade (sobretudo preto, terno risca de giz, camisa social, relógio de ouro, vestido de gala), tecidos e cores fixos que JAMAIS mudam entre as cenas.
- Expressão e postura: descreva o olhar e a emoção de cada momento (arrogante, apaixonado, traído, ameaçador, engraçado) e a posição do corpo (em pé na vitrine, sentado no trono, apontando o dedo, segurando um cronômetro).
- Personalidade: marcante de novela (vilão frio e calculista, playboy arrogante, mocinha batalhadora, amigo engraçado).
- Papel na novela: Protagonista, vilão/vilã, namorado(a), rival, chefe, herdeiro ou mentor.
- Estilo: render 3D cinematográfico vertical 9:16.

EXEMPLO CANÔNICO DE REFERÊNCIA:
Coxinhão, o protagonista:
"Um personagem alto e imponente com corpo de proporções humanas feito inteiramente de massa de coxinha dourada e crocante, coberto de farinha de rosca real, sem nenhuma pele humana. Braços, mãos e dedos são do mesmo material dourado da coxinha. Veste sobretudo preto longo, gola alta preta, calça social preta e sapatos de couro brilhantes. Sua cabeça é uma coxinha gigante com um visor digital verde na testa e um rosto 3D cartunesco formado na própria massa: olhos grandes e furiosos, sobrancelhas grossas franzidas e boca aberta com dentes brancos. Ele segura um cronômetro digital com números vermelhos. Está em uma loja de relógios de luxo com vitrines iluminadas e vista noturna da cidade. Expressão séria, autoritária e ameaçadora. Estilo: render 3D cinematográfico, iluminação dramática, textura real, formato vertical 9:16."

CENÁRIOS DO TEMA OBJETOS:
Ambientes reais e sofisticados em escala humana: loja de relógios de luxo, cobertura com vista noturna da cidade, showroom de carros, tribunal, mansão com escadaria de mármore, restaurante chique, camarim de teatro, academia de luxo, estacionamento subterrâneo iluminado.
ILUMINAÇÃO OBRIGATÓRIA: cinematográfica, contraste alto, luz quente e dramática, sombras profundas.

É ESTRITAMENTE PROIBIDO usar pele humana, mão humana, rosto humano, pessoa fantasiada, máscara de objeto ou cabeça humana neste tema. Os personagens DEVEM SER OS OBJETOS/COMIDAS HUMANIZADOS, 100% feitos do material do objeto, COM ROSTO CARTOON NO PRÓPRIO OBJETO!`,

      'Deuses Gregos': `O TEMA OBRIGATÓRIO É 'DEUSES GREGOS' ⚡🏛️.
A história DEVE se passar na mitologia grega, com divindades do Olimpo (Zeus, Hades, Poseidon, Atena, Afrodite, Ares, etc.), poderes divinos, raios, templos de mármore e confrontos épicos.`,

      'Causa Animal e Reviravoltas': `O TEMA OBRIGATÓRIO É 'CAUSA ANIMAL E REVIRAVOLTAS' 🐾🐕.
A história DEVE girar obrigatoriamente em torno de animais (resgate, abandono, lealdade de um cão/gato, proteção animal, reviravolta onde o animal desmascara um vilão ou salva alguém).`,

      'Vida de Jesus': `O TEMA OBRIGATÓRIO É 'VIDA DE JESUS' 🙏✝️.

AMBIENTAÇÃO OBRIGATÓRIA - NOS DIAS DE HOJE NO BRASIL (NUNCA TEMPOS BÍBLICOS):
- A história DEVE se passar na ATUALIDADE, no cotidiano humano do povo brasileiro: periferia, comunidade, interior, cidade grande, família, trabalho, feira, ônibus, hospital público, salão, oficina, escola, grupo da família no WhatsApp, dívida, desemprego, briga por herança, problema real de gente real.
- É TERMINANTEMENTE PROIBIDO ambientar em tempos bíblicos: nada de deserto, jumento, templos romanos, cenário de época, multidões de época ou vilas antigas. (A ÚNICA coisa de estilo antigo é a APARÊNCIA do personagem Jesus - veja abaixo - que é a assinatura visual dele.)

REGRA SUPREMA DO PERSONAGEM JESUS (PRESENÇA OBRIGATÓRIA + APARÊNCIA CLÁSSICA):
- O PERSONAGEM JESUS DEVE APARECER OBRIGATORIAMENTE em TODAS as histórias deste tema, com a APARÊNCIA CLÁSSICA E INCONFUNDÍVEL DE JESUS (aquela imagem reconhecida no mundo inteiro): homem adulto de aproximadamente 33 anos, pele morena/oliva, CABELO LONGO castanho-escuro ondulado até os ombros, BARBA CHEIA e aparada, olhar sereno, gentil e acolhedor, expressão de paz, bondade e autoridade mansa.
- VESTIMENTA ICÔNICA OBRIGATÓRIA (assinatura visual de Jesus): túnica longa clara (branca, bege ou creme) com faixa/manto de tecido simples na cintura e sandálias rústicas. É ASSIM que o público reconhece Jesus - e ele mantém EXATAMENTE esse visual mesmo quando aparece em cenário moderno.
- É TERMINANTEMENTE PROIBIDO vestir Jesus como homem comum (camiseta, camisa social, calça jeans, terno, tênis) ou mudar o rosto dele (cabelo curto, sem barba, outro estilo). Todo espectador TEM que reconhecer Jesus imediatamente, à primeira olhada, como "Jesus", e não como "um homem qualquer".
- A ficha física de Jesus (cabelo longo, barba cheia, túnica clara com faixa, sandálias) DEVE ser repetida palavra por palavra no PROMPT 00 e em [Subject & Character Consistency] de TODAS as cenas, sempre IDÊNTICA.
- Jesus DEVE ter participação ativa: entra em cena, fala, aconselha, ouve, age e transforma a situação com amor, perdão, compaixão e sabedoria. Ele NÃO é figurante: a presença dele muda o rumo da história.
- Jesus fala de forma simples, humana e direta, com exemplos do dia a dia - NUNCA com discurso de sermão longo, linguagem arcaica ("vós", "verily") ou frase de púlpito.

PROIBIÇÃO DE CLICHÊ BÍBLICO - MILAGRES SÃO GESTOS REAIS DO COTIDIANO:
- É PROIBIDO milagre espetacular literal (multiplicar pães e peixes, andar sobre a água, transformar água em vinho, curar de forma mágica). Os "milagres" desta história são GESTOS HUMANOS REAIS e filmáveis: o emprego que aparece na hora certa, o perdão que desarma uma briga, uma dívida paga por um ato de bondade, a reconciliação de uma família, o vizinho que ajuda, a decisão que muda a vida.
- A lição de fé, amor e esperança DEVE vir dos ACONTECIMENTOS e das escolhas, sem pregação e sem pieguice: o público sente a mensagem, não recebe um sermão.
- A história segue o padrão das novelinhas: problema concreto e atual, escalada, reviravolta e final com emoção verdadeira e lição de fé que aquece o coração.`,

      'Jesus: Milagres e Ressurreição': `O TEMA OBRIGATÓRIO É 'JESUS: MILAGRES E RESSURREIÇÃO' 🙏✨.
A história DEVE retratar milagres bíblicos de Cristo, cura dos aflitos, acolhimento dos humildes e o poder transformador da fé.`,

      'Roça': `O TEMA OBRIGATÓRIO É 'ROÇA' 🤠🌾.
A narrativa DEVE ser ambientada no interior rural brasileiro, sítio, fazenda, com personagens sertanejos, simplicidade, hábitos caipiras e fortes valores morais.`,

      'Comédia Br': `O TEMA OBRIGATÓRIO É 'COMÉDIA BR' 😂🇧🇷.
A história DEVE ter humor do cotidiano brasileiro, confusões familiares, mal-entendidos hilários e personagens carismáticos.`,

      'Soldado voltando da guerra': `O TEMA OBRIGATÓRIO É 'SOLDADO VOLTANDO DA GUERRA' 🪖🎖️.
A história DEVE ter como foco o retorno surpresa e comovente de um soldado militar para sua família, superação de traumas e reencontro emocionante.`,

      'Viagem no Tempo': `O TEMA OBRIGATÓRIO É 'VIAGEM NO TEMPO' ⏳🌀.
A história DEVE envolver saltos temporais, passado/futuro, paradoxos e lições sobre escolhas da vida.`,

      'Cartoon Emocionante': `O TEMA OBRIGATÓRIO É 'CARTOON EMOCIONANTE' 🎨✨.
Estilo visual de animação 3D hiper-expressiva (estilo Pixar/DreamWorks), com personagens carismáticos e mensagem comovente.`,

      'Infantil': `O TEMA OBRIGATÓRIO É 'INFANTIL' 🎈🧸.
História mágica e afetuosa com lições de amizade, bondade e respeito para crianças e família.`,

      'Dorama': `O TEMA OBRIGATORIO E 'DORAMA COREANO (K-DRAMA)'.
NESTA HISTORIA E OBRIGATORIO que TODOS os personagens sejam ASIATICOS DE APARENCIA (coreanos de origem e aparencia coreana) e que a historia tenha a ESTETICA, o RITMO e os CONFLITOS de uma serie coreana de sucesso. Este tema NAO e uma novelinha brasileira com atores asiaticos: e um K-Drama de verdade.

REGRA 1 - APARENCIA OBRIGATORIA DE TODOS OS PERSONAGENS (SEM EXCEÇÃO):
- TODOS os personagens - protagonistas, antagonistas, familiares, amigos, colegas de trabalho, rivais, sogras, chefes, medicos e QUALQUER figurante ao fundo - DEVEM ser de ascendencia e APARENCIA ASIATICA (coreana).
- Rosto: tracos coreanas tipicos - rosto oval ou levemente redondo, macas do rosto suaves, olhos amendoados de palpebra dupla discreta, nariz reto e delicado, labios cheios e delicados, arco da sobrancelha reto e suave.
- Pele: tom claro a oliva, sempre com textura fotorrealista natural (micoporos visiveis, brilho de pele saudavel, ZERO efeito de plastico ou mascara).
- Cabelo: preto ou castanho muito escuro, liso ou com ondas suaves, comprimento medio a longo. NUNCA cabelo loiro, ruivo, cacheado ou de outra etnia.
- Maquiagem de K-Drama: pele luminosa (glass skin), labios com tom rosado ou coral natural, delineado fino e discreto, sobrancelhas naturais. NUNCA maquiagem pesada ocidental.
- DESCRITOR OBRIGATORIO (repita em ingles em [Subject & Character Consistency] de TODAS as cenas): Korean East Asian man or woman, soft oval face, almond eyes, straight delicate nose, full natural lips, fair to olive realistic skin with visible pores, straight dark brown or black hair, natural K-drama glass-skin makeup, coral lips.
- E TERMINANTEMENTE PROIBIDO gerar personagem caucasiano, negro, latino, arabe ou de qualquer outra etnia neste tema. Negative prompt obrigatorio em CADA cena: caucasian features, black person, african features, blonde hair, curly hair, light blue eyes, western facial features.

REGRA 2 - ESTETICA VISUAL DE K-DRAMA (OBRIGATORIA EM TODA CENA):
- Iluminacao: soft key light difusa, luz natural de janela grande, glow suave e luminoso, sombras delicadas. NUNCA iluminacao dura de filme de acao.
- Color grading: paleta fria e limpa com tons pastéis suaves, verdes e azuis suaves. O visual e de serie coreana, nao de cinema americano.
- Enquadramento: planos medios e primeiros planos com profundidade de campo rasa (f/1.8), camera lenta e suave, travelling delicado, close de olhos e maos nos momentos emocionais.
- CENARIOS OBRIGATORIOS: apartamento coreano moderno de piso claro, hanok (casa tradicional coreana de madeira), escritorio de conglomerado de vidro (chaebol), universidade, hospital, cafeteria, shopping de bairro, metro, lavanderia coin laundry, bar de karaoke, cassino de hotel, restaurante de street food coreano (pojangmacha), rua de Seul a noite com letreiros de neon.
- DETALHES DE K-DRAMA OBRIGATORIOS (repetidos em todas as cenas): chuva na janela com luzes da cidade desfocadas ao fundo, reflexo de neon em poca d'agua, varanda com vista de arranha-céu de Seul, hanbok tradicional em cenas de familia, talheres e mesa de comida coreana, onsen ou sauna, cartas e documentos de negocio.

REGRA 3 - ROTEIRO E CONFLITOS DE K-DRAMA (OBRIGATORIO):
- Conflitos tipicos de K-Drama: heranca e disputa familiar, identidade oculta revelada, vinganca planejada por anos, casamento por contrato, chaebol versus pequena empresa, filho illegito revelado em festa, traicao entre amigos de infancia, rivalidade profissional, segredo da mae, reencontro depois de muitos anos.
- Estetica de roteiro: melancolia elegante, expressoes contidas e cheias de tensao, olhares prolongados, silencio cheio de significado, coreografia de emocao coreana.
- SEMPRE termine com o pagamento emocional classico do K-Drama: a vinganca executada, o segredo revelado em publico, ou a reconciliacao que arranca lagrimas. O publico chora E curte.
- A historia DEVE estar no formato vertical 9:16.`,

      'Histórias de Brasileiros Reais': `O TEMA OBRIGATÓRIO É 'HISTÓRIAS DE BRASILEIROS REAIS' 🇧🇷💪.
História verossímil e emocionante de pessoas batalhadoras do Brasil enfrentando desafios e vencendo com honestidade.`,

      'Racismo': `O TEMA OBRIGATÓRIO É 'RACISMO' ✊.
Confronto direto contra o preconceito racial, demonstrando a dignidade inegociável da vítima e a queda moral de quem discrimina.`,

      'Humilhação': `O TEMA OBRIGATÓRIO É 'HUMILHAÇÃO' 👤.
Uma pessoa arrogante humilha alguém vulnerável ou de classe social simples, sofrendo uma reviravolta memorável e merecida.`,

      'Injustiça': `O TEMA OBRIGATÓRIO É 'INJUSTIÇA' ⚖️.
Alguém inocente é falsamente acusado ou penalizado, até que a verdade vem à tona com grande impacto.`,

      'Abuso de Poder': `O TEMA OBRIGATÓRIO É 'ABUSO DE PODER' 👑.
Um chefe, autoridade ou pessoa rica abusa de sua posição contra um subordinado, enfrentando o desmascaramento público.`,

      'Desigualdade Social': `O TEMA OBRIGATÓRIO É 'DESIGUALDADE SOCIAL' 🏚️.
Contraste comovente entre a ostentação superficial e a riqueza de coração dos que têm pouco.`,

      'Superação': `O TEMA OBRIGATÓRIO É 'SUPERAÇÃO' ✨.
Trajetória heroica de superação contra todas as probabilidades através do amor, perseverança e trabalho.`,

      'Gordos': `O TEMA OBRIGATÓRIO É 'GORDOS (PERSONAGENS EXTREMAMENTE OBESOS)' 🍔.
Neste tema, ABSOLUTAMENTE TODOS os personagens da história DEVEM ser EXTREMAMENTE OBESOS (obesidade mórbida), brasileiros e reais, com forte presença física.

DIRETRIZ MÁXIMA DE APARÊNCIA FÍSICA (REGRA INVIOLÁVEL):
- CADA personagem — sem NENHUMA exceção (protagonista, vilão, vítima, familiares, amigos, vizinhos, colegas, crianças, idosos, médicos, atendentes e QUAISQUER figurantes ao fundo) — DEVE ser uma pessoa EXTREMAMENTE obesa, com aparência de 150kg a 300kg.
- Corpo: barriga enorme e caída, braços e pernas muito grossos, ombros largos, silhueta gigantesca que ocupa boa parte do quadro, dobras de pele profundas no pescoço e no abdômen, rosto extremamente redondo e cheio, papada (queixo duplo) bem marcada.

DESCRITOR FÍSICO OBRIGATÓRIO (repita estes termos, em inglês, nos prompts visuais): "extremely obese, morbidly obese body, massive 200kg+ weight, enormous hanging belly, very thick heavy arms and legs, broad shoulders, extremely round full face, huge double chin, deep skin folds on neck and abdomen, heavy body presence, wide silhouette occupying the frame".

REGRAS ANTI-MAGREZA (VIOLAR É PROIBIDO):
- É TERMINANTEMENTE PROIBIDO gerar qualquer personagem magro, em forma, atlético, "corpo normal", "average build", "slim" ou "fit".
- O peso extremo é FIXO e IMUTÁVEL: NUNCA emagreça os personagens do primeiro ao último take. A MESMA silhueta obesa gigantesca DEVE aparecer IDÊNTICA no PROMPT 00 (Ficha de Personagens) e em [Subject & Character Consistency] de TODAS as cenas.
- Em CADA cena, o bloco [Subject & Character Consistency] e o PROMPT 00 DEVEM repetir palavra por palavra o DESCRITOR FÍSICO OBRIGATÓRIO acima para cada personagem.
- Em CADA cena, inclua no [Negative Prompt]: "thin, slim, skinny, fit body, athletic build, average weight, normal body, muscular, toned".

DIRETRIZ NARRATIVA (O PESO É CONTEXTO, NÃO A PIADA):
- A história NÃO deve girar em torno de dieta ou emagrecimento. O peso extremo é apenas a aparência física de TODOS os personagens.
- Conte dramas humanos reais, viciantes e emocionantes: traição, injustiça, humilhação, amor verdadeiro, reviravolta e superação, exatamente como uma novelinha normal, mas com TODOS os personagens extremamente obesos.
- Os personagens vencem pelo caráter, pelo coração e pelas escolhas — NUNCA trate o peso como piada humilhante. No máximo, humor leve, carinhoso e respeitoso.

COTIDIANO BRASILEIRO REAL (FONTE OBRIGATÓRIA DAS HISTÓRIAS):
- Toda história deve nascer de uma situação REAL, reconhecível e do dia a dia do povo brasileiro: periferia, interior, feira, fila do posto de saúde, ônibus lotado, igreja, boteco, salão de beleza, grupo da família no WhatsApp, dívida no cartão, bico, programa social, golpe na internet, rede social e briga por dinheiro.
- O contexto social e econômico é o MOTOR da trama (o peso extremo continua sendo apenas a aparência de TODOS os personagens).
- Traga humor honesto, crítica leve e emoção verdadeira — NUNCA deboche gratuito nem piada humilhante.
- Exemplos do TIPO de premissa desejada (VARIE sempre, NUNCA repita a mesma):
  * Uma família que teve 10 filhos para ganhar mais Bolsa Família e entra em colapso quando o benefício é cortado.
  * Um pobre que mora numa casa caindo aos pedaços e finge ser rico nas redes sociais, até a farsa ser exposta AO VIVO.
* Outras sementes: o vizinho do "golpe do Pix", a tia que vende bolo no sinal, o tio das pirâmides, o "influencer" de fachada, a mãe que faz bico de tudo, o compadre que deve a todos, a fila do INSS, o delivery que não paga, o agiota do bairro, o churrasco que virou briga de família, a loteria que promete tudo.
  * Cada história deve ser ÚNICA e específica: use detalhes concretos (um objeto, um lugar, uma dívida, uma decisão) que só existem nessa história.`,

      'Gordos Suados': `O TEMA OBRIGATÓRIO É 'GORDOS SUADOS — BRASIL PRECÁRIO' 🥵🏚️.
ESTE TEMA COMBINA DUAS DIRETRIZES OBRIGATÓRIAS: (1) TODOS os personagens são EXTREMAMENTE OBESOS (obesidade mórbida) e (2) TODAS as cenas acontecem em LOCAIS BRASILEIROS PRECÁRIOS, SUJOS E DESORDENADOS, com os personagens visivelmente SUADOS.

DIRETRIZ 1 — APARÊNCIA FÍSICA (OBRIGATÓRIA EM TODO PERSONAGEM, SEM EXCEÇÃO):
- TODOS os personagens (protagonistas, vilões, vítimas, familiares, amigos, vizinhos, crianças, idosos, vendedores, vendedores ambulantes, QUEISQUER figurantes ao fundo) DEVEM ser pessoas EXTREMAMENTE obesas, com aparência de 150kg a 300kg, brasileiros e reais.
- Corpo: barriga enorme e caída, braços e pernas muito grossos, ombros largos, silhueta gigantesca que ocupa boa parte do quadro, dobras de pele profundas, rosto extremamente redondo, papada muito marcada.
- SUOR OBRIGATÓRIO E PERMANENTE: pele visivelmente úmida e brilhando, gotas e escorrimentos de suor no rosto, no pescoço, no peito e nas dobras da pele, cabelo grudado na testa e no pescoço, como se saísse de esforço físico ou de calor intenso. A pele deve estar com brilho de umidade (visible sweat, glistening sweaty skin, sweat droplets rolling down the face and neck, damp hair sticking to the forehead).
- Roupa de calor e de trabalho: camiseta larga e úmida, bermuda ou calça de moletom, chinelo, camiseta sem mangas ou regata quando o calor exigir. A roupa fica marcada pelo suor e suja pelo trabalho.
- DESCRITOR FÍSICO OBRIGATÓRIO (repita estes termos em inglês nos prompts visuais): "extremely obese, morbidly obese body, massive 200kg+ weight, enormous hanging belly, very thick heavy arms and legs, broad shoulders, extremely round full face, huge double chin, deep skin folds on neck and abdomen, drenched in sweat, glistening sweaty skin, visible sweat droplets, damp hair stuck to forehead, heavy body presence, wide silhouette occupying the frame".

REGRAS ANTI-MAGREZA E ANTI-SUOR (VIOLAR É PROIBIDO):
- É TERMINANTEMENTE PROIBIDO gerar qualquer personagem magro, em forma, atlético, "corpo normal", "average build", "slim" ou "fit".
- O peso extremo e o suor são FIXOS e IMUTÁVEIS: NUNCA emagreça nem seca os personagens do primeiro ao último take. A MESMA silhueta obesa e suada DEVE aparecer IDÊNTICA no PROMPT 00 e em [Subject & Character Consistency] de TODAS as cenas.
- Em CADA cena inclua no [Negative Prompt]: "thin, slim, skinny, fit body, athletic build, average weight, normal body, muscular, toned, dry skin, clean clothes, luxury setting, spotless room, studio lighting".

DIRETRIZ 2 — CENÁRIO PRECÁRIO E SUJO (OBRIGATÓRIO EM TODA CENA):
- TODAS as cenas acontecem em ambientes brasileiros precarios, modestos, desorganizados e SUJOS: cozinha de periferia com paredes manchadas e mofadas, banheiro pequeno com azulejo antigo, quarto apertado com colchao no chao, varanda de bloco popular, quintal de terra, lanchonete de rua a noite com banquinho de plastico, barraca de feira, salao de beleza de bairro, interior de onibus, fila do posto, galpao, lavanderia comunitaria, calcada de rua.
- DETALHES OBRIGATORIOS DO AMBIENTE (repetidos em todas as cenas): paredes descascadas com manchas de umidade e mofo, piso gasto ou sujo, fiacao exposta, marcacao de fumaca, trincas, mesas e cadeiras de plastico basico, roupa estendida no varal, caixas de papelao. Esses detalhes precisam ser COERENTES entre as cenas da mesma casa (o mesmo mofo na mesma parede, o mesmo tipo de cadeira).
- Iluminação: luz dura de lâmpada fluorescente ou lâmpada pendente com sombra dura, luz de rua amarelada à noite, ou luz natural de janela com ambiente abafado e úmido. NUNCA iluminação de estúdio elegante, NUNCA cenário luxury, NUNCA cozinha americana ou sala limpa.
- O ambiente PODE ser filmado em formato de celular na vertical 9:16, com leve tremor e foco de câmera amadora de celular barato — hiper-realismo caseiro, sem produção de cinema.

DIRETRIZ NARRATIVA (O PESO E O SUOR SÃO CONTEXTO, NÃO A PIADA):
- A história NÃO deve girar em torno de dieta, emagrecimento ou do suor. O peso e o suor são apenas a aparência visual de TODOS os personagens.
- O local precário e sujo também é CONTEXTO da vida real que eles vivem, e não um motivo de humilhação. Trate o ambiente com verdade e AFFETO, como a casa real de uma família brasileira de baixa renda, nunca como piada.
- Conte dramas humanos reais, viciantes e emocionantes: traição, injustiça, humilhação, amor verdadeiro, reviravolta e superação, exatamente como uma novelinha normal, mas com TODOS os personagens extremamente obesos e suados em ambientes precários.
- Os personagens vencem pelo caráter, pelo coração e pelas escolhas — NUNCA trate o peso, o suor ou a pobreza como piada humilhante. No máximo, humor leve, carinhoso e respeitoso.
- Em notícias de morte, acidente ou tragedy, mantenha respeito absoluto. O suor e o peso aqui são verossímeis e humanos, nunca caricatos.

COTIDIANO BRASILEIRO PRECÁRIO REAL (FONTE OBRIGATÓRIA DAS HISTÓRIAS):
- Toda história deve nascer de uma situação REAL e reconhecível do cotidiano brasileiro precário: mudança de bagunça, conta de luz atrasada, fila do INSS, fila do posto de saúde, ônibus lotado, água potável cortada, cozinha de duas bocas, aluguel atrasado, comida que acaba antes do fim do mês, grupo da família no WhatsApp, dívida, bico, programa social, golpe na internet, rede social, briga por dinheiro.
- Exemplos do TIPO de premissa (VARIE sempre, NUNCA repita a mesma):
  * Um pai obeso e suado que perdeu o emprego e esconde isso da família cozinhando na cozinha mofada.
  * Uma mãe que faz bico de tudo para sustentar os filhos e descobre que foi enganada pelo próprio filho.
  * Um homem que jura morar bem nas redes sociais, mas a casa desaba e ele é desmascarado AO VIVO.
  * Outras sementes: o vizinho do "golpe do Pix", a tia que vende bolo no sinal, o tio das pirâmides, a mãe que vende coxinha, o agiota do bairro, o boyfriend de aluguel, o churrasco que virou briga de família, a loteria que promete tudo, o delivery que não paga.
- Cada história deve ser ÚNICA e específica: use detalhes concretos (um objeto, um lugar, uma dívida, uma decisão) que só existem nessa história.`,
    };

    const themeDirective =
      themeDirectives[theme] ||
      `O TEMA OBRIGATÓRIO É '${theme}'. Toda a história, personagens e cenários DEVEM girar rigorosamente em torno deste tema.`;

    const skinDirective =
      theme === 'Frutas'
        ? 'Estilo de animação 3D cinematográfica de alto nível (estilo Pixar / Disney feature animation), textura orgânica e tátil hiper-realista da fruta (pequenas sementes douradas na pele do morango, brilho natural da casca cerosa, translucidez e subsurface scattering), personagens antropomórficos humanizados expressivos com proporções anatômicas estilizadas, roupas humanas elegantes bem ajustadas (vestido, terno, etc.), iluminação profissional e formato vertical 9:16.'
        : theme === 'Objetos'
          ? 'Estilo render 3D cinematográfico de altíssima qualidade: cabeça gigante do objeto com textura real (farinha de rosca da coxinha, pintura automotiva, metal escovado, plástico polido) e ROSTO CARTOON 3D formado na própria superfície do objeto (olhos grandes, sobrancelhas grossas, boca com dentes), corpo com proporções humanas mas 100% feito do material do objeto (SEM pele humana), figurino de luxo, iluminação cinematográfica dramática e formato vertical 9:16. PROIBIDO qualquer pele humana, mão humana ou rosto humano.'
          : (skinDescriptorMap[skinRealism] || skinDescriptorMap.ultimate);

    const languageConfig: Record<
      string,
      {
        langName: string;
        locale: string;
        instruction: string;
      }
    > = {
      'Brasil': {
        langName: 'Português do Brasil',
        locale: 'pt-BR',
        instruction:
          'Todos os diálogos, falas dos personagens, expressões idiomáticas, gírias locais, título do vídeo, legenda e hashtags DEVEM ser gerados obrigatoriamente em PORTUGUÊS DO BRASIL (pt-BR).',
      },
      'Estados Unidos': {
        langName: 'American English',
        locale: 'en-US',
        instruction:
          'ALL dialogues, character spoken lines, idioms, cultural setting, video title, social media caption, and hashtags MUST BE WRITTEN IN NATURAL, FLUENT, COLLOQUIAL AMERICAN ENGLISH (en-US). Characters MUST speak authentic English. It is STRICTLY FORBIDDEN to generate dialogues in Portuguese when United States is selected.',
      },
      'Reino Unido': {
        langName: 'British English',
        locale: 'en-GB',
        instruction:
          'ALL dialogues, character lines, cultural setting, title, caption and hashtags MUST BE WRITTEN IN BRITISH ENGLISH (en-GB). Characters MUST speak authentic British English. It is STRICTLY FORBIDDEN to generate dialogues in Portuguese.',
      },
      'Espanha': {
        langName: 'Español de España (Castellano)',
        locale: 'es-ES',
        instruction:
          'TODOS los diálogos, parlamentos de los personajes, expresiones coloquiales, título del video, descripción y hashtags DEBEN ser generados obligatoriamente en ESPAÑOL DE ESPAÑA (es-ES). Está TERMINANTEMENTE PROHIBIDO escribir los diálogos en portugués.',
      },
      'México': {
        langName: 'Español de México / Latino',
        locale: 'es-MX',
        instruction:
          'TODOS los diálogos, parlamentos de los personajes, modismos mexicanos/latinos, título del video, descripción y hashtags DEBEN ser generados obligatoriamente en ESPAÑOL MEXICANO / LATINO (es-MX). Está TERMINANTEMENTE PROHIBIDO escribir los diálogos en portugués.',
      },
      'França': {
        langName: 'Français',
        locale: 'fr-FR',
        instruction:
          'TOUS les dialogues, répliques des personnages, expressions, titre de la vidéo, légende et hashtags DOIVENT être écrits en FRANÇAIS (fr-FR). Il est STRICTEMENT INTERDIT d’écrire les dialogues en portugais.',
      },
      'Itália': {
        langName: 'Italiano',
        locale: 'it-IT',
        instruction:
          'TUTTI i dialoghi, battute dei personaggi, titolo del video, didascalia e hashtag DEVONO essere generati in ITALIANO (it-IT). È SEVERAMENTE VIETATO scrivere i dialoghi in portoghese.',
      },
      'Alemanha': {
        langName: 'Deutsch',
        locale: 'de-DE',
        instruction:
          'ALLE Skriptdialoge, Zeilen der Charaktere, Titel, Bildunterschriften und Hashtags MÜSSEN in fließendem DEUTSCH (de-DE) verfasst sein. Es ist STRENGSTENS UNTERSAGT, Dialoge auf Portugiesisch zu verfassen.',
      },
    };

    const currentLang = languageConfig[country] || languageConfig['Brasil'];

    const numScenes = Math.min(60, Math.max(4, Number(scenes) || 6));
    const isContinuing = Boolean(previousStory && previousStory.trim().length > 0);

    const referenceBase64 = String(req.body?.referenceImageBase64 || '').replace(
      /^data:image\/[a-z0-9.+-]+;base64,/i,
      '',
    );
    const referenceImage =
      referenceBase64 && referenceBase64.length <= 4200000
        ? {
            mimeType: String(req.body?.referenceImageMime || 'image/jpeg'),
            data: referenceBase64,
          }
        : null;
    req.referenceImage = referenceImage;

    // O usuario pode colar um roteiro ja pronto. Nesse caso a historia dele e CANONICA:
    // a IA nao reescreve, nao troca o desfecho e nao inventa outra trama.
    const ownScript = String(userScript || '').trim();
    const ownScriptMode = String(userScriptMode || '').trim() === 'adapt' ? 'adapt' : 'continue';
    const hasOwnScript = ownScript.length > 0;

    const ownScriptDirective = hasOwnScript
      ? `
################################################################
ROTEIRO DO USUÁRIO (FONTE CANÔNICA E OBRIGATÓRIA DA HISTÓRIA)
################################################################
O usuário JÁ TEM um roteiro pronto. Esse texto abaixo é a VERDADE da história e NÃO PODE ser reescrito, resumido, corrigido, reordenado nem substituído:

"""
${ownScript.slice(0, 6000)}
"""

REGRAS INEGOCIÁVEIS:
1. ACOMPANHE A HISTÓRIA IDÊNTICA ao texto do usuário: mesma ordem de acontecimentos, mesmos nomes, mesmos personagens, mesmos lugares, mesmo tom e MESMO FINAL. É TERMINANTEMENTE PROIBIDO inventar outra história, trocar o desfecho, mudar o nome de qualquer personagem ou acrescentar um enredo parallel que contradiga o roteiro.
2. Reutilize as falas do próprio roteiro do usuário sempre que elas existirem no texto. NÃO reescreva, NÃO modernize e NÃO troque o texto das falas já escritas.
${
  ownScriptMode === 'continue'
    ? `3. MODO CONTINUAR: o roteiro do usuário é o COMEÇO da história. Continue a partir de EXATAMENTE onde o texto termina (mesma cena, mesma hora do dia, mesma situação), criando apenas os acontecimentos seguintes até fechar a história com um desfecho memorável. Não repita e não reconte nada do que já está escrito.`
    : `3. MODO ADAPTAR: NÃO escreva cenas novas. Converta o roteiro do usuário, cena por cena e na MESMA ordem, no formato técnico completo do agente (${numScenes} cenas de 8 segundos, PROMPT 00 com ficha dos personagens, [Subject & Character Consistency], [Dialogue & Native Audio] em ${currentLang.langName}, e o bloco SEO final), preservando integralmente a história, os diálogos e o desfecho do usuário.`
}
4. As ${numScenes} cenas devem cobrir o roteiro do usuário de forma COMPLETA, sem pular nenhum TRECHO RELEVANTE do texto e sem inventar cenas que não estejam no que ele escreveu.
5. Se o roteiro do usuário for curto, complete as cenas restantes com continuação coerente a partir do ponto em que ele parou — sempre respeitando o tom, os personagens e o desfecho descritos por ele.
################################################################
`
      : '';

    const extremeWeightDirective =
      theme === 'Gordos' || theme === 'Gordos Suados'
        ? `
################################################################
REGRA SUPREMA E INEGOCIÁVEL DE PESO EXTREMO (TEMA 'GORDOS'):
################################################################
É OBRIGATÓRIO que TODOS os personagens — SEM NENHUMA EXCEÇÃO (protagonista, vilão, vítima, familiares, amigos, vizinhos, colegas, crianças, idosos, médicos, atendentes e QUAISQUER figurantes ao fundo) — sejam EXTREMAMENTE OBESOS (obesidade mórbida / extremely obese / morbidly obese), com aparência de 150kg a 300kg.

DESCRITOR FÍSICO OBRIGATÓRIO (repita EXATAMENTE estes termos, em inglês, nos prompts visuais de CADA personagem):
"extremely obese, morbidly obese body, massive 200kg+ weight, enormous hanging belly, very thick heavy arms and legs, broad shoulders, extremely round full face, huge double chin, deep skin folds on neck and abdomen, heavy body presence, wide silhouette occupying the frame".

REGRAS ANTI-MAGREZA (VIOLAR É PROIBIDO):
- É TERMINANTEMENTE PROIBIDO gerar qualquer personagem magro, em forma, atlético, "corpo normal", "average build", "slim" ou "fit".
- O peso extremo é FIXO e IMUTÁVEL: NUNCA emagreça os personagens. A MESMA silhueta obesa gigantesca DEVE aparecer IDÊNTICA no PROMPT 00 e em [Subject & Character Consistency] de TODAS as cenas, repetindo palavra por palavra o DESCRITOR FÍSICO OBRIGATÓRIO.
- Em CADA cena, adicione ao [Negative Prompt]: "thin, slim, skinny, fit body, athletic build, average weight, normal body, muscular, toned".
################################################################
`
        : '';

    const promptInstructions = `
Você é o mais consagrado diretor cinematográfico e roteirista de novelinhas curtas dramáticas ultra-virais para redes sociais (Kwai, TikTok, Instagram Reels, YouTube Shorts).
Você cria descrições de cenas completas e prompts visuais ultra-realistas no padrão oficial do SEEDANCE 2.5 (ByteDance / Dreamina / CapCut) e GOOGLE FLOW.
${req.referenceImage ? `
REFERÊNCIA VISUAL ANEXADA (PRIORIDADE MÁXIMA):
- A imagem anexada é a FICHA OFICIAL dos personagens. Observe e descreva EXATAMENTE os personagens que aparecem nela: quantidade, formato da cabeça/objeto, material, textura, cores, roupas peça por peça, acessórios e proporções.
- O PROMPT 00 e TODAS as cenas DEVEM usar ESSES MESMOS personagens da imagem. É TERMINANTEMENTE PROIBIDO inventar personagens diferentes, trocar roupas, mudar cores ou mudar o estilo.
- Se a imagem tiver mais de um personagem, use todos como elenco principal.
- Os personagens da imagem SUBSTITUEM os exemplos do tema: use as frutas/objetos EXATOS da imagem, não os do exemplo.
` : ''}

################################################################
POLÍTICA DE PERSONAGENS ADULTOS (OBRIGATÓRIA - FLOW / SEEDANCE)
################################################################
- TODOS os personagens são ADULTOS (18 anos ou mais). Escreva sempre "adulto"/"adulta" junto da idade (22, 35, 50...).
- PROIBIDO nomes no diminutivo que remetem a criança (terminações -inha/-inho ou apelidos infantis). Use nomes adultos (ex: "Morango Vitória", "Maracujá Brabo").
- PROIBIDO descrever crianças, adolescentes, "jovem" com aparência infantil, uniforme escolar, jardineira infantil, ou corpo "delicado/pequeno" com baixa estatura.
- Altura mínima: 1,60m para mulheres adultas e 1,70m para homens adultos.
- Roupas sempre adultas (vestido elegante, terno, camisa social, macacão adulto). NUNCA jardineira escolar, shorts infantil ou laços de criança.
- O [Negative Prompt] de TODAS as cenas DEVE incluir: child, minor, teenager, kid, school uniform, loli, childlike proportions.

################################################################
REGRA #0 - IDIOMA DE DESTINO (PRIORIDADE MÁXIMA - VALE ACIMA DE TUDO, SEM EXCEÇÃO)
################################################################
IDIOMA DE DESTINO OBRIGATÓRIO: ${currentLang.langName} (${currentLang.locale}).

1. TUDO o que o público lê e ouve DEVE estar em ${currentLang.langName}: a HISTÓRIA, as descrições das cenas, as ações, as falas ("DIÁLOGO REAL:" e "RESPOSTA:"), o áudio nativo, o Título Sugerido, a Legenda e as Hashtags.
2. É TERMINANTEMENTE PROIBIDO entregar história, descrições de cena ou falas em português quando o idioma de destino for ${currentLang.langName} (a única exceção é se o destino for o próprio Português do Brasil).
3. Os RÓTULOS TÉCNICOS do formato ("PROMPT CENA N (SEEDANCE 2.5)", "QUEM FALA:", "TOM E INTENÇÃO DA FALA:", "DIÁLOGO REAL:", "QUEM RESPONDE:", "RESPOSTA:", "INSTRUÇÕES VISUAIS", "[Subject & Character Consistency]", "[Dialogue & Native Audio]" etc.) DEVEM ser mantidos EXATAMENTE como no template (NÃO traduza os rótulos) - mas TODO o conteúdo dentro deles vai em ${currentLang.langName}.
4. Se o roteiro de referência (roteiro do usuário ou história anterior) estiver em outro idioma, mantenha a história IDÊNTICA (fatos, personagens, ordem dos acontecimentos e desfecho) e apenas ESCREVA todo o conteúdo e as falas em ${currentLang.langName} (traduza/adapte as falas para o idioma de destino).
5. ANTES DE ENTREGAR, revise CADA fala e CADA título do SEO e confirme que estão em ${currentLang.langName}. Entrega no idioma errado = tarefa inválida (nota zero).
################################################################

DIRETRIZ SOBERANA DE IDIOMA E LOCALIZAÇÃO CULTURAL:
- País Selecionado: ${country}
- Idioma Obrigatório do Roteiro e Diálogos: ${currentLang.langName} (${currentLang.locale})
${currentLang.instruction}

ATENÇÃO CRÍTICA AO IDIOMA E DIÁLOGOS:
O usuário escolheu expressamente o país "${country}".
Por isso, É ESTRITAMENTE OBRIGATÓRIO que:
1. Todos os diálogos entre aspas em "DIÁLOGO REAL:" e "RESPOSTA:" sejam redigidos no idioma ${currentLang.langName}.
2. REGRA DE DIÁLOGO: NUNCA adicione "diálogo sugerido", coloque SOMENTE O DIÁLOGO REAL que os personagens falam em cena! Diálogos autênticos, impactantes, coloquiais e perfeitamente pontuados.
3. No bloco do Seedance 2.5, a linha "[Dialogue & Native Audio]" DEVE conter o diálogo real no idioma ${currentLang.langName} para que o modelo de IA gere a dublagem e o sincronismo labial nativo no idioma ${currentLang.langName} de ${country}.
4. Título Sugerido, Legenda e Gatilho no SEO final DEVEM ser escritos no idioma ${currentLang.langName}.
5. A HISTÓRIA e as descrições de cena TAMBÉM devem ser escritas no idioma ${currentLang.langName} (o público de ${country} lê tudo nesse idioma).
6. NUNCA gere textos em português se o país escolhido for ${country} (exceto se o país for Brasil).

DIRETRIZ MÁXIMA DE TEMA (REGRA INVIOLÁVEL):
${themeDirective}

ATENÇÃO: É ESTRITAMENTE PROIBIDO DESVIAR DO TEMA '${theme}'! 
Toda a trama, personagens principais e locações DEVEM ser 100% fiéis ao tema '${theme}'.
${context ? `Contexto opcional do criador (deve ser totalmente adaptado para ocorrer DENTRO do tema '${theme}'): "${context}"` : ''}
${extremeWeightDirective}
${ownScriptDirective}

PARÂMETROS DA PRODUÇÃO:
- Tema Selecionado: ${theme}
- País e Idioma Nativo: ${country} (${currentLang.langName})
- Tom do Roteiro: ${tone}
- Emoção Dominante: ${emotion}
- Diretriz de Textura e Realismo: ${skinDirective}
- Quantidade exata de cenas: ${numScenes} cenas
- REGRA ABSOLUTA DE NUMERACAO SEQUENCIAL: entregue EXATAMENTE ${numScenes} cenas, numeradas rigorosamente em sequencia, de "PROMPT CENA 1" ate "PROMPT CENA ${numScenes}", UMA cena por numero, SEM PULAR nenhum numero (é TERMINANTEMENTE PROIBIDO, por exemplo, ir de CENA 3 direto para CENA 8). Cada bloco deve ter o cabecalho "PROMPT CENA N (SEEDANCE 2.5)". Faca a contagem mental: se escreveu a CENA 1, 2 e 3, o proximo bloco e OBRIGATORIAMENTE a CENA 4, e assim por diante, ate a CENA ${numScenes}. Nao repita numeros e nao pule numeros.

${
  hasOwnScript
    ? `ATENÇÃO SUPREMA: o roteiro do usuário acima é a FONTE CANÔNICA desta história e sua prioridade é ABSOLUTA MAIOR do que qualquer sugestão de tema, estrutura, engine ou regra anti-clichê desta minha diretriz. Você NÃO cria uma nova história: você executa o roteiro dele, na ordem dele, com as falas dele, até o final que ele escreveu. As regras de formato (numeração de cenas, PROMPT 00, ficha física, Subject & Character Consistency, SEO) continuam OBRIGATÓRIAS — elas mudam COMO o roteiro é entregue, nunca O QUE acontece.`
    : isContinuing
      ? `ATENÇÃO: Esta é a PARTE 2 da MESMA história (continuação direta) no tema '${theme}'.

CONTEÚDO DA PARTE 1 (JÁ ENTREGUE AO PÚBLICO - use só como referência de continuidade):
"""
${previousStory.slice(0, 7000)}
"""

REGRA OBRIGATÓRIA DA PARTE 2 - PROIBIDO REPETIR:
1. É TERMINANTEMENTE PROIBIDO recontar, resumir, reformular, "melhorar" ou reescrever QUALQUER TRECHO que já foi escrito na parte 1. O público JÁ viu isso. Não comece recontando o que aconteceu antes.
2. A CENA 1 desta parte 2 deve começar EXATAMENTE no ponto em que a parte 1 terminou (veja o bloco "ULTIMAS CENAS DA PARTE 1" acima, que traz o final real da historia), nunca antes dele.
3. Traga SOMENTE acontecimentos NOVOS e um arco novo: novo conflito, nova escalada, nova reviravolta e um desfecho novo que feche ESTA parte.
4. Marque a passagem do tempo na primeira cena ("MAIS TARDE...", "NA MANHA SEGUINTE...", "TRES DIAS DEPOIS...") e reative o gancho em 1 segundo.
5. Mantenha rigorosamente a mesma continuidade visual (mesma ficha física dos personagens, mesmo figurino, mesma ambientação e mesmas regras do universo de '${theme}').`
      : `Desenvolva uma história dramática inédita e comovente EXCLUSIVAMENTE sobre o tema '${theme}', com gancho chocante logo na primeira cena, escalada de conflito no miolo e uma resolução memorável e reflexiva.`
}

================================================================================
REGRAS OBRIGATORIAS DE COERENCIA, IDENTIFICACAO DE FALA E DURACAO
================================================================================
1. COERENCIA NARRATIVA (HISTORIA UNICA E CONTINUA):
   - A historia e UMA so, com inicio, meio e fim, progredindo em CAUSA e EFEITO de uma cena para a outra (a cena 2 continua exatamente de onde a cena 1 parou, e assim por diante).
   - Mantenha SEMPRE os mesmos personagens (nomes, idades, papeis e figurino identicos) do inicio ao fim. Nunca troque nomes, papeis ou aparencia no meio da historia, nem invente personagens novos sem necessidade.
   - Nada de cenas soltas ou desconexas: cada cena avanca o conflito (gancho -> escalada -> revirada -> resolucao).
   - Evite repeticao: cada cena traz um fato NOVO, sem repetir a mesma acao ou a mesma fala de cenas anteriores.

2. IDENTIFICACAO DE QUEM FALA (SEM CONFUSAO):
   - Em CADA cena, diga explicitamente QUEM FALA pelo NOME e repita a FICHA FÍSICA FIXA COMPLETA dele (nome, idade, altura, porte, tom/textura de pele, cabelo, roupa exata com cores/tecidos, calçados e acessórios), para nunca haver duvida de quem esta falando.
   - Se mais de um personagem falar na cena, identifique na ordem quem fala e para quem responde (QUEM FALA -> QUEM RESPONDE), repetindo a FICHA FÍSICA FIXA COMPLETA nos dois.
   - NUNCA atribua a fala ao personagem errado e nunca deixe um personagem mexendo a boca sem falar.

3. DURACAO DAS FALAS (REGRA DURA - MAXIMO 9 SEGUNDOS POR CENA):
   - FALA INDIVIDUAL: no MAXIMO 18 palavras (ideal 10 a 14). Isso da cerca de 5 a 7 segundos em ritmo natural. É PROIBIDO passar de 18 palavras em uma fala unica.
   - CENA COM DIALOGO (duas pessoas falando): CADA fala com no MAXIMO 10 palavras; a SOMA das duas falas NUNCA passa de 20 palavras (cerca de 8 a 9 segundos).
   - Antes de fechar a cena, CONTE as palavras de cada fala. Se passar do limite, REESCREVA mais curta e guarde apenas a essencia.
   - NUNCA use discursos, monologos, explicacoes ou falas longas. Prefira frases curtas, secas e de impacto (estilo novela): "Voce me mentiu.", "Isso nao vai ficar assim.", "Assina aqui e resolvemos."

================================================================================
DIRETRIZ DE OURO DO ROTEIRO (PADRAO DAS MICRO-NOVELAS QUE VIRALIZAM)
================================================================================
Antes de escrever as cenas, planeje mentalmente (NAO escreva o plano no texto final) uma NOVELINHA DE VERDADE seguindo o esqueleto abaixo. Historias soltas, aleatorias ou sem escalada estao ABSOLUTAMENTE PROIBIDAS.

A) LOGLINE E MOTOR DRAMATICO (defina em uma frase):
   - Protagonista + o que ele QUER + o que o IMPEDE + o SEGREDO/MENTIRA que sustenta a trama (o "pavio" que pode explodir). Sem um querer claro e um obstaculo concreto, NAO existe historia.
   - Escolha uma lane de trope que prende: injustica/humilhacao publica, traicao, identidade oculta, heranca/segredo de familia, amor proibido, vinganca ou reviravolta de poder. Entregue o payoff esperado por um caminho INESPERADO.

B) ESPINHA DRAMATICA EM CAUSA E EFEITO (obrigatoria do inicio ao fim):
   - Cena 1: GANCHO EXPLOSIVO — comece JA no conflito, com uma imagem, acao ou PROVA que para o scroll. Nunca comece pela rotina.
   - Cenas iniciais: ESCALADA — cada cena piora a situacao com um fato NOVO; plante a promessa narrativa que sera cobrada depois.
   - MEIO (cena do meio aproximada): REVIRAVOLTA que RE-PRECIFICA a historia — uma informacao nova que faz tudo o que entendiamos mudar de valor.
   - Cenas finais: ACELERACAO — segredos vem a tona, aliancas mudam, o cerco aperta.
   - Ultima cena: DESFECHO com REVERSAO PUBLICA (a derrota do vilao ou a vitoria do protagonista precisa ser VISTA por outros, na frente de testemunhas) e uma licao/emocao memoravel. Pode deixar um fio aberto para continuar.

C) REGRA DO "UM SO TURNO POR CENA":
   - Cada cena tem EXATAMENTE UM momento que vira o jogo (revelacao, traicao, mudanca de alianca ou decisao). Se tiver duas viradas, divida em duas cenas; se nao tiver NENHUMA, corte a cena.
   - Cada cena termina em MINI-CLIFFHANGER: corte na pergunta/revelacao, NUNCA na resposta. Deixe o espectador querendo a proxima cena.

D) ESCADA DE ROTACAO DOS GANCHOS (nunca repita o mesmo tipo duas seguidas):
   - Identidade (alguem nao e quem dizia ser), Emocao (confissao, ruptura ou recusa suspensa) e Realizacao (tudo o que achavamos estava errado). Alterne esses tres tipos entre as cenas.

E) CICLO VICIANTE (DANO -> ALIVIO -> AMEACA MAIOR):
   - Dano (humilhacao, perda ou ameaca) -> um pequeno alivio verdadeiro -> uma ameaca MAIOR antes que o alivio se assente. Mantenha o publico nesse ciclo.

F) "CHOQUE E PROVA; DOR E DETALHE" (emoção concreta e filmavel):
   - O choque deve ser uma PROVA fisica e especifica (uma mensagem, um documento, uma foto, uma alianca, uma transferencia), nunca uma frase vaga de sentimento.
   - A dor deve ser encenada por OBJETOS e detalhes (o contato ainda salvo como "meu amor ❤️", a alianca ainda no dedo, a musica que nunca mudou). Em 9:16, maos, olhos e objetos comunicam mais que fala.

G) PROIBICOES ABSOLUTAS (erros que deixam a historia ruim):
   - Cenas aleatorias/soltas que nao avancam a causa-e-efeito.
   - Repetir a mesma acao ou a mesma fala de uma cena anterior.
   - Personagem sem desejo/objetivo claro, ou que age sem motivo.
   - Resolver o gancho logo no inicio da cena seguinte (a tensao morre).
   - Explicar demais o cliffhanger (corte dois segundos antes do que parece seguro).
   - Vilao generico sem motivacao real; acoes concretas que nao alteram nada.
   - Mais de um turno por cena ou meio da historia sem forca (sem micro-climax).
   - Final sem pagamento emocional e sem reversao publica.

Distribua esses batimentos pelo numero de cenas pedido: gancho no inicio, escalada no meio, revirada no meio, aceleracao e pagamento no fim. Se o numero de cenas for pequeno, comprima SEM perder nenhum desses batimentos.

================================================================================
REGRA ANTI-CLICHE E TESTE DE LOGICA (OBRIGATORIO)
================================================================================
H) PROIBIDO CLICHE (as tramas mais batidas da internet estao VETADAS):
   - É TERMINANTEMENTE PROIBIDO usar: marido traindo com a empregada, madrasta malvada, heranca disputada, filho que so quer dinheiro, "segredo do passado" generico, casamento cancelado no altar, ex que volta para vingar, vilão que sorri maquiavelico no fim.
   - É TERMINANTEMENTE PROIBIDO dialogo genérico de novela, tipo "Eu sempre te amei", "Voce vai pagar por isso", "Nao acreditava em voce". Cada fala tem que soar como uma pessoa REAL falando AQUELA situacao especifica.
   - PROIBIDO repetir gancho, desfecho ou o tipo de virada entre duas historias diferentes.
   - Toda premissa tem que sair de um PROBLEMA CONCRETO do cotidiano (uma divida, um corte, um exame, uma humilhacao publica, uma mentira contada no grupo da familia, um boleto, um post que viraliza), e nao de um conflito generico.
   - PROIBIDO personagens que agem contra a propria personalidade sem motivo (vilao que vira bonzinho do nada, vitima que perdoa sem razao). Cada virada e consequencia das ESCOLHAS mostradas nas cenas.
   - PROIBIDO reviravolta sem explicacao logica ou "finais de porta" vagos. A revelacao final responde a um fato plantado em uma cena anterior.

I) TESTE DE LOGICA (responda mentalmente ANTES de escrever, nao escreva o texto):
   - Qual e o QUERER concreto do protagonista na primeira cena?
   - Por que a cena 2 acontece por causa da cena 1? Se a resposta for "nao tem ligacao", a cena e aleatoria: reescreva ou corte.
   - O que muda de VALOR no meio da historia (a reviravolta)?
   - A resolucao vem das ESCOLHAS do protagonista, nunca de coincidencia ou milagre.
   - Se qualquer resposta nao existir, a historia esta sem sentido. Refaca antes de escrever as cenas.

================================================================================
AJUSTE FINO DA NARRATIVA: LIGACAO DO MEIO (DETALHE + EMOCAO) E REVIRAVOLTA (TENSAO)
================================================================================

J) CONSTRUCAO DO MEIO DA HISTORIA (LIGACAO EM CORRENTE, DETALHE E EMOCAO - OBRIGATORIO):
   - LIGACAO EM CORRENTE: cada cena do meio DEVE abrir reagindo DIRETAMENTE ao que aconteceu na cena anterior (mesmo lugar, mesma pessoa, mesmo objeto, mesma consequencia). O espectador tem que sentir que aquela cena SO EXISTE por causa da anterior. É PROIBIDO escrever cena que poderia estar em qualquer ordem.
   - DETALHE CONCRETO QUE CONTINUA: cada cena do meio carrega UM detalhe fisico especifico que atravessa para a cena seguinte (o boleto amassado, a xicara rachada, o hematoma no braco, a alianca fora do dedo, a mancha no vestido, a conta no celular) e esse detalhe DEVE reaparecer ou ser cobrado depois.
   - APROFUNDAMENTO EMOCIONAL: no meio da historia mostre o protagonista POR DENTRO - o que ele mais teme perder, a memoria que ainda dói, a decisao impossivel que ele adia. Cada cena do meio aumenta a PRESSÃO: o cerco fecha um pouco mais, a humilhacao custa mais caro, a alternativa vai ficando mais estreita.
   - CURVA DA EMOCAO: comece pelo choque do gancho, passe pela humilhacao, pela perda e pelo desespero, e chegue na virada com o personagem no FUNDO DO POCO. Quanto mais fundo o poco, maior o payoff da revirada.
   - FALSA VITORIA: coloque no meio um pequeno alivio verdadeiro (um respiro) que logo em seguida PIORA a situacao (dano -> alivio -> ameaca maior). O meio NUNCA pode ficar parado, repetindo o mesmo tipo de conflito.
   - TRANSICAO EMOCIONAL ENTRE CENAS: a ultima frase/fala de cada cena do meio planta o gancho da seguinte (uma promessa, uma ameaca, uma pergunta sem resposta). Nada de cena que simplesmente "acaba".

K) A REVIRAVOLTA COM TENSAO E EMOCAO MAXIMAS (NAS CENAS FINAIS):
   - PLANTA E PAGA: a revirada DEVE ser plantada antes (um detalhe, um objeto, uma frase dita de passagem no meio da historia) e o publico so entende o valor disso NO MOMENTO da revelacao. Quando a virada cai, ela responde a algo que o espectador ja viu.
   - REVELACAO EM GESTO FISICO: a virada vira a mesa com uma ACAO filmavel (abrir a gaveta, virar o celular na tela, entregar o envelope, arrancar a peruca, apontar o documento), NUNCA apenas com explicacao em dialogo.
   - TENSAO ANTES DO ESTOURO: um segundo de silencio/pausa antes da revelacao (respiração presa, olhar fixo, ambiente silencioso) para a virada cair como um estalo.
   - EMOCAO EXPLICITA NO PROMPT: descreva a reacao fisica de CADA personagem no instante da virada (olhos marejados, maxilar tremendo, maos cerradas ou tremulas, um passo para tras, voz embargada, choro contido) para o motor de video conseguir atuar a cena.
   - DUAS CENAS FINAIS: a penultima entrega a revelacao com FORCA TOTAL (tensao maxima) e a ULTIMA entrega o desfecho emocional mostrando o efeito da virada (reversao publica na frente de testemunhas + licao/emocao memoravel).
   - É PROIBIDO revelar a virada cedo, explica-la demais ou entregar um final que apenas "anuncia" a vitoria sem mostrar o efeito emocional nos personagens.

================================================================================
REGRA CRÍTICA: DESCRIÇÃO PROFUNDA DOS PERSONAGENS & IDENTIFICAÇÃO DE QUEM VAI FALAR
================================================================================
1. IDENTIFICAÇÃO RIGOROSA E DETALHADA DE QUEM VAI FALAR (SEM DIÁLOGO SUGERIDO - APENAS DIÁLOGO REAL):
   Em TODA e qualquer cena, você DEVE descrever claramente quem vai falar e quem responde:
   - QUEM FALA: Nome + FICHA FÍSICA FIXA COMPLETA do personagem que vai falar (idade exata, altura, porte, tom/textura de pele, cabelo, ROUPA exata com cores/tecidos, CALÇADOS e ACESSÓRIOS) + papel dramático na história + estado emocional daquele momento (olhar marejado de dor, maxilar cerrado pela indignação, respiração entrecortada, sorriso caloroso), postura física e o que ele está fazendo fisicamente ao falar. (Exemplo: "QUEM FALA: Carlos (filho mais velho arrependido, 32 anos, 1,78m, magro, pele morena clara, cabelo preto curto, camisa social branca amassada, calça preta de trabalho, botas gastas e aliança de ouro no dedo, com olhar embargado de lágrimas e mãos calejadas trêmulas)").
   - TOM E INTENÇÃO DA FALA: Descreva o tom de voz, ritmo, respiração, cadência e a intenção dramática subjacente da fala no idioma ${currentLang.langName} (se fala com firmeza comovente, sussurro tenso, indignação reprimida, voz embargada pelo choro ou alívio genuíno).
   - DIÁLOGO REAL: O diálogo REAL, autêntico, vivo e cinematográfico que o personagem fala na cena. NUNCA use "diálogo sugerido", coloque SOMENTE O DIÁLOGO REAL! OBRIGATORIAMENTE entre aspas e com pontuação final. LIMITE DURO DE TEMPO: no máximo 18 palavras por fala (cerca de 5 a 7 segundos); NUNCA ultrapasse 9 segundos e, se houver réplica, cada fala tem no máximo 10 palavras e a soma das duas NUNCA passa de 20 palavras. Conte as palavras antes de fechar a cena.
   - QUEM RESPONDE: Se houver diálogo compartilhado na cena, repita a FICHA FÍSICA FIXA COMPLETA do interlocutor da réplica (idade exata, altura, porte, tom/textura de pele, cabelo, ROUPA exata com cores/tecidos, CALÇADOS e ACESSÓRIOS), seu papel dramático na história, sua reação física imediata e sua expressão emocional ao ouvir a fala. (Exemplo: "QUEM RESPONDE: Dona Laura (mãe idosa, 68 anos, 1,60m, obesa, pele clara enrugada, cabelo grisalho preso, vestido floral azul, chinelos e óculos de leitura pendurados em uma corrente, olhar sereno mas magoado)").
   - RESPOSTA: O diálogo REAL da réplica correspondente, também entre aspas e com pontuação final.

================================================================================
REGRA DE OURO DA FALA: CADA FALA NO SEU DONO E NO SEU MOMENTO (INVIOLAVEL)
================================================================================
1. CADA FALA TEM DONO FIXO: o DIÁLOGO REAL pertence UNICAMENTE ao personagem declarado em QUEM FALA; a RESPOSTA pertence UNICAMENTE ao declarado em QUEM RESPONDE.
2. É TERMINANTEMENTE PROIBIDO colocar na boca de um personagem uma fala que é de outro (ex.: o filho falando a fala da mãe), trocar os papéis no meio da cena, ou fazer um personagem responder ANTES de ouvir a fala anterior.
3. UM TURNO POR CENA, NA ORDEM ESCRITA: no máximo QUEM FALA fala uma vez e QUEM RESPONDE responde uma vez, NESTA ordem. Ninguém mais abre a boca na cena. NUNCA antecipe a fala da cena seguinte nem repita a fala da cena anterior.
4. A FALA COMBINA COM O DONO: vocabulário, conteúdo e tom de cada fala refletem a idade, o papel e a personalidade declarados na FICHA FÍSICA do dono (a avó não fala como o neto, o vilão não fala como a vítima).
5. AUTO-VERIFICAÇÃO ANTES DE ENTREGAR CADA CENA: releia a cena e confirme: (a) QUEM FALA é o dono do DIÁLOGO REAL; (b) QUEM RESPONDE é o dono da RESPOSTA; (c) nenhum outro personagem falou. Se não confirmar, reescreva a cena.

2. DESCRIÇÃO RICA E MINUCIOSA DOS PERSONAGENS (SEM DESCRIÇÕES GENÉRICAS OU SUPERFICIAIS):
   Em TODOS os pontos onde os personagens são citados (no Prompt 00, no QUEM FALA/QUEM RESPONDE, em [Subject & Character Consistency] e [Dialogue & Native Audio] de cada cena e nos Character Model Sheets), repita SEMPRE a FICHA FÍSICA FIXA COMPLETA de cada personagem (idêntica, palavra por palavra, do início ao fim), cobrindo OBRIGATORIAMENTE:
   - Nome e idade exata.
   - ALTURA (em centímetros) e PORTE; biótipo e compleição corporal (magro, forte, alto, baixinho, obeso etc.) e postura.
   - TOM DE PELE (claro, moreno, pardo, negro, oliva) e TEXTURA/realismo da pele (${skinDirective}): microporos, dermo-realismo, linhas de expressão naturais, sem filtros plásticos ou aspecto de IA.
   - Estrutura facial completa: formato do rosto, mandíbula, maçãs do rosto, nariz, boca, formato e cor dos olhos, sobrancelhas e expressão marcante.
   - Cabelo: corte exato, comprimento, textura, cor, brilho e caimento dos fios (e barba/bigode, se houver).
   - ROUPAS COMPLETAS E IMUTÁVEIS: cada peça (parte de cima e de baixo), tecidos específicos (linho cru, algodão desgastado, lã, couro envelhecido), cores primárias e secundárias e CALÇADOS.
   - ACESSÓRIOS: óculos, brincos, colares, relógio, anéis/aliança, boné/chapéu, bolsa, cinto, tatuagens, pintas e marcas visuais — todos os itens que diferenciam o personagem.
   - Características suficientemente distintas para que cada personagem tenha identidade cinematográfica única e inconfundível.
   Esta FICHA é um CONTRATO CANÔNICO: NUNCA mude roupa, cor, cabelo, acessórios, altura, idade ou tom de pele de um personagem entre as cenas ou entre as partes da história.
   TRAVA DE IDENTIDADE VISUAL (VERIFICAÇÃO FINAL ANTES DE ENTREGAR): compare a descrição de CADA personagem em CADA cena com a do PROMPT 00. Nome, idade, altura, tom de pele, cabelo, roupa (peças, tecidos e cores), calçados e acessórios DEVEM ser IDÊNTICOS palavra por palavra, e as MARCAS ÚNICAS (fingerprint) do PROMPT 00 DEVEM aparecer em todas as cenas. Toda cena leva o bloco [Reference Lock] instruindo a anexar a ficha do PROMPT 00 como imagem de referência. Qualquer diferença = reescreva a cena usando a versão do PROMPT 00.

DIRETRIZES DE ENGENHARIA DE PROMPT PARA SEEDANCE 2.5 E GOOGLE FLOW (BYTEDANCE / FLOW INGREDIENTS / CAPCUT):
Você DEVE estruturar todos os prompts visuais de vídeo seguindo rigorosamente a arquitetura do SEEDANCE 2.5 e GOOGLE FLOW (Director's Brief com seções rotuladas em colchetes). O Seedance 2.5 e o Flow geram vídeo fotorrealista 4K, física gravitacional precisa e ÁUDIO NATIVO com sincronismo labial.

REGRA CRUCIAL ANTI-FUNDO BRANCO (SOBREPOSIÇÃO OBRIGATÓRIA DE CENÁRIO REAL):
Muitos criadores utilizam a imagem do Prompt 00 como "Ingrediente de Personagem" (Character Ingredient) no Google Flow ou como Imagem de Referência no Seedance. Como o Prompt 00 possui fundo branco neutro de estúdio, se o prompt de cena não especificar detalhadamente o ambiente e não der ordem expressa de substituição, o motor de vídeo gera a cena dentro de um vazio branco artificial!
Portanto, em CADA CENA você DEVE OBRIGATORIAMENTE incluir:
1. [Environment & Scene Setting]: Uma descrição riquíssima e ultra-detalhada do cenário 3D realista da história (paredes, pisos com texturas táteis, janelas, móveis, iluminação ambiente, profundidade e objetos de cena).
2. [Background Override]: Ordem explícita em inglês para o motor de IA (Google Flow / Seedance) ignorar e descartar 100% o fundo branco da imagem de ingrediente e ancorar os personagens dentro do cenário 3D real com sombras de contato e reflexos no chão.
3. [Negative Prompt]: Termos negativos para banir fundo branco, cyclorama e estúdio vazio.

CADA PROMPT DE CENA DEVE CONTER AS SEGUINTES SEÇÕES ROTULADAS:
1. [Subject & Character Consistency]: REPETIÇÃO OBRIGATÓRIA da descrição visual física detalhada e figurino exato de cada personagem presente na cena, mantendo 100% de consistência com o Prompt 00: Subject 1 - Nome (idade, cabelo, feições, roupas exatas e cores); Subject 2 - Nome (feições e roupas idênticas ao Prompt 00). NUNCA resuma com termos vagos como "mesmo personagem" ou "personagem anterior". A lista DEVE incluir TODOS os personagens que falam E quem responde (o personagem do QUEM RESPONDE também entra como um Subject numerado, com a FICHA FÍSICA FIXA COMPLETA: altura, tom/textura de pele, roupa completa com peças/cores, calçados e acessórios).
2. [Environment & Scene Setting]: Cenário físico 3D completo, imersivo e realista onde a cena ocorre (ex: cozinha rústica com mesa de madeira envelhecida, luz dourada de janela e cortinas ao fundo; OU hospital movimentado; OU rua chuvosa à noite).
3. [Background Override]: Ordem expressa: "CRITICAL: The reference image/ingredient has a white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Place the characters fully grounded inside the detailed 3D environment described in [Environment & Scene Setting], with accurate contact shadows and floor interaction. Zero white studio void."
4. [Action & First-Frame Blocking]: Posição inicial dos personagens (blocking), movimento físico orgânico com causa antes do efeito, postura corporal e respiração.
5. [Optics & Camera Movement]: Movimento único contínuo de câmera para o take de vídeo (ex: 85mm lens, slow push-in, low-angle tracking dolly, steady handheld, profundidade de campo rasa f/1.4).
   - REGRA DE CÂMERA PARA LIP-SYNC: o enquadramento DEVE manter na barra os DOIS personagens da conversa (two-shot médio, 4K, rosto e boca dos dois visíveis). É PROIBIDO "alternating close-ups", cut à outro ângulo ou close-up em um único personagem durante o diálogo, porque isso quebra o sincronismo labial de quem está fora de foco.
   - REGRA DE COERÊNCIA: a ação descrita aqui TEM que combinar com a fala da cena (se dois personagens conversam frente a frente, eles ESTÃO no mesmo ambiente se olhando - nunca um "ao telefone" enquanto fala pessoalmente com o outro).
6. [Dialogue & Native Audio]: Instrução direta e EXPLÍCITA para a IA gerar áudio e sincronismo labial nativo, nomeando CADA falante pela FICHA FÍSICA FIXA COMPLETA (nome, idade, altura, porte, tom/textura de pele, cabelo, roupa com peças/tecidos/cores, calçados e acessórios).
   - Se SOMENTE UM personagem falar na cena (sem QUEM RESPONDE), escreva: Character [Nome] ([FICHA FÍSICA COMPLETA: idade, altura, porte, tom/textura de pele, cabelo, roupa com cores/tecidos, calçados e acessórios]) speaks directly: "[Diálogo real da cena]" with precision lip-sync and [tom e cadência emocional da fala].
   - Se HOUVER QUEM RESPONDE (dois falantes), é OBRIGATÓRIO nomear OS DOIS, na ordem exata da fala, cada um com a FICHA FÍSICA COMPLETA. Exemplo: FIRST Character [Nome A] ([FICHA FÍSICA COMPLETA A]) speaks: "[Diálogo real]" with precision lip-sync and [tom]; THEN Character [Nome B] ([FICHA FÍSICA COMPLETA B]) responds: "[Resposta real]" with precision lip-sync and [tom].
   - A ORDEM NUNCA muda: o personagem de QUEM FALA SEMPRE fala primeiro; o de QUEM RESPONDE SEMPRE responde depois. Esse bloco tem que reproduzir as MESMAS falas escritas em DIÁLOGO REAL e RESPOSTA, palavra por palavra, em ${currentLang.langName}.
   - REGRA DE LÁBIO: apenas o personagem cuja fala está tocando move a boca/sincroniza os lábios; o outro permanece CALADO, apenas ouvindo e reagindo com expressão. NUNCA deixe o personagem errado mexendo a boca, e nunca sobreponha as vozes. O personagem que responde no QUEM RESPONDE/RESPOSTA DEVE ter a própria fala e o próprio movimento labial identificados aqui.
7. [Lighting & Atmosphere]: Direção e motivação das luzes (ex: Rembrandt lighting, soft key light, rim light dourada, névoa volumétrica suave, contraste de cinema).
8. [Audio & Ambience (SFX)]: Paisagem sonora gerada nativamente (ruídos ambientes, respiração ofegante, chuva, eco de passos, tecido farfalhando).
9. [Global Style & Physical Realism]: Fotorrealismo 4K, sensor ARRI Alexa LF, ${skinDirective}, micro-texturas celulares visíveis, física natural e 24fps cinematográfico.
10. [Negative Prompt]: white background, blank white void, studio cyclorama, plain backdrop, floating characters, artificial studio setup, empty white space, child, minor, teenager, kid, school uniform, loli, childlike proportions.

================================================================================
ESTRUTURA DE SAÍDA EXATA DOS PROMPTS (MANTENHA RIGOROSAMENTE A ESTRUTURA ANTERIOR):
================================================================================

O texto DEVE iniciar OBRIGATORIAMENTE com os prompts da produção:

PROMPT 00 - FICHA DE PERSONAGENS E CENÁRIO MESTRE (REFERENCE SHEET):
[Prompt fotográfico detalhado de referência multimodal em fundo branco puro (#FFFFFF) com a descrição visual rica de todos os personagens principais lado a lado e a especificação completa do cenário mestre:
[Reference ID: Subject 1 - Name]: Full body, standing pose, neutral expression, clean seamless solid pure white studio background (#FFFFFF), rich detailed facial features, exact garments, colors, fabrics, shoes and textures.
[Reference ID: Subject 2 - Name]: Full body, standing side by side with Subject 1, proportional height, detailed wardrobe and facial features.
[CHARACTER FINGERPRINT - IMMUTABLE UNIQUE MARKS]: for EACH character, list 2-3 exclusive visual details that NEVER change between scenes (ex: a digital green display on the forehead, a crack on the left side of the breading, a silver button on the coat, a blue reflection in the right eye). These details are the consistency anchor and MUST be repeated in every scene.
[Master Environment Specification - Primary Setting]: Detailed physical description of the primary set (exact floor materials, wall textures, windows, architectural features, main furniture, props, and ambient lighting palette) to be maintained consistently across all video scenes.
[Camera, Lighting & Specs]: Shot on Hasselblad H6D-100c, 100mm f/2.8 lens, softbox commercial photography lighting, clean solid white background (#FFFFFF), ultra-sharp focus head-to-toe, raw uncompressed 8K textures, neutral studio poses.]

Em seguida, inicie as cenas de vídeo sequenciais no padrão Seedance 2.5 e Google Flow.
(A CENA 1 contém o gancho explosivo, mas o CABEÇALHO e o formato dela são EXATAMENTE IGUAIS aos de todas as outras cenas.)

PROMPT CENA 1 (SEEDANCE 2.5):
QUEM FALA: [Nome + FICHA FÍSICA FIXA COMPLETA (idade exata, altura, porte/biotipo, tom/textura de pele, cabelo/barba, ROUPA exata com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS) + papel dramático detalhado, expressão facial rica, postura corporal e estado emocional minucioso de quem vai falar]
TOM E INTENÇÃO DA FALA: [Tom vocal, cadência, ritmo e respiração exata no idioma ${currentLang.langName}]
DIÁLOGO REAL: "[Diálogo real que o personagem fala na cena OBRIGATORIAMENTE NO IDIOMA ${currentLang.langName.toUpperCase()} entre aspas com pontuação final - NUNCA use diálogo sugerido, coloque apenas o diálogo real]"
QUEM RESPONDE: [Nome + FICHA FÍSICA FIXA COMPLETA (idade exata, altura, porte/biotipo, tom/textura de pele, cabelo/barba, ROUPA exata com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS) + papel dramático, reação física imediata e estado emocional do interlocutor que responde]
RESPOSTA: "[Diálogo real da réplica OBRIGATORIAMENTE NO IDIOMA ${currentLang.langName.toUpperCase()} entre aspas com pontuação final]"
INSTRUÇÕES VISUAIS (PROMPT SEEDANCE 2.5 & GOOGLE FLOW):
[Subject & Character Consistency]: [REPETIÇÃO OBRIGATÓRIA da FICHA FÍSICA FIXA COMPLETA de TODOS os personagens da cena, INCLUINDO quem fala E quem responde: Subject N - Nome (idade exata, ALTURA em cm, porte/biotipo, tom e textura de pele com ${skinDirective}, formato do rosto, cor dos olhos, cabelo/barba, ROUPA completo com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS exatos estabelecidos no Prompt 00). NUNCA resuma e NUNCA use "mesmo personagem" ou "personagem anterior": repita a ficha por extenso para cada um.]
[Reference Lock - MANDATORY REFERENCE SHEET]: ATTACH the PROMPT 00 character sheet (front, three-quarter and full body) as the REFERENCE IMAGE in the tool. The character must be IDENTICAL to the sheet: face, object/fruit shape, texture, color, outfit, shoes, accessories, proportions and the CHARACTER FINGERPRINT unique marks. NEVER redesign, change outfit, change color/texture, age the character or alter proportions. If the tool supports seed, keep the same seed and framing across scenes.
[Environment & Scene Setting]: [DESCRIÇÃO COMPLETA DO CENÁRIO 3D REAL DA CENA: tipo e acabamento do piso, paredes, janelas, móveis de fundo, iluminação do ambiente e profundidade do cômodo, repetindo os elementos arquitetônicos fixos]
[Background Override]: CRITICAL FOR FLOW INGREDIENTS & SEEDANCE: The character reference image/ingredient has a plain white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Ground the characters naturally inside the detailed 3D environment described above with contact shadows and environmental ambient lighting. DO NOT render an empty white studio void or blank cyclorama.
[Action & First-Frame Blocking]: [Ação detalhada com causa e efeito, gestos físicos e respiração - os dois personagens da conversa ESTÃO juntos no mesmo ambiente, se olhando; a ação NUNCA contradiz o diálogo (nada de "ao telefone" numa conversa frente a frente)]
[Optics & Camera Movement]: [Two-shot médio contínuo mantendo NA FOTO o rosto e a boca dos DOIS personagens da conversa (lente 50-85mm, f/1.8, slow push-in suave) - PROIBIDO alternating close-ups, corte ou close num único personagem durante o diálogo, para preservar o lip-sync dos dois]
[Dialogue & Native Audio]: [OBRIGATÓRIO nomear CADA falante com a FICHA FÍSICA FIXA COMPLETA (nome, idade, altura, porte, tom/textura de pele, cabelo, roupa com peças/tecidos/cores, calçados e acessórios). Se houver QUEM RESPONDE, nomeie OS DOIS na ordem exata: FIRST Character [Nome A] ([FICHA FÍSICA COMPLETA A]) speaks: "[Diálogo real]" with precision lip-sync and [tom]; THEN Character [Nome B] ([FICHA FÍSICA COMPLETA B]) responds: "[Resposta real]" with precision lip-sync and [tom]. A ORDEM NUNCA INVERTE: o de QUEM FALA fala primeiro. Apenas quem está falando move a boca; o outro permanece calado e reagindo. Nunca sobreponha as vozes. IMPORTANT: keep BOTH characters' faces and mouths in frame during the entire exchange (two-shot); the video engines animate the mouth of whoever's words are playing.]
[Lighting & Atmosphere]: [Motivação e fontes de iluminação volumétrica coerentes com o cenário]
[Audio & Ambience (SFX)]: [Foley e efeitos de som ambiente sincronizados com o local]
[Global Style & Physical Realism]: [Cinematografia 4K fotorrealista, ${skinDirective}, física real, 24fps]
[Negative Prompt]: white background, blank white void, studio cyclorama, plain backdrop, floating characters, artificial studio setup, empty white space, child, minor, teenager, kid, school uniform, loli, childlike proportions

PROMPT CENA 2 (SEEDANCE 2.5):
... até PROMPT CENA ${numScenes} (SEEDANCE 2.5):
(OBRIGATORIO para CADA cena, SEM OMITIR NENHUMA SECAO: QUEM FALA, TOM E INTENCAO DA FALA, DIALOGO REAL, QUEM RESPONDE, RESPOSTA e INSTRUCOES VISUAIS contendo TODAS as secoes entre colchetes: [Subject & Character Consistency], [Environment & Scene Setting], [Background Override], [Action & First-Frame Blocking], [Optics & Camera Movement], [Dialogue & Native Audio], [Lighting & Atmosphere], [Audio & Ambience (SFX)], [Global Style & Physical Realism] e [Negative Prompt]. NUNCA encurte, resuma ou pule essas secoes: cada cena tem que sair COMPLETA, com o mesmo nivel de detalhe da CENA 1.)

================================================================================
REGRA DE PADRAO UNICO (INVIOLAVEL - TODAS AS CENAS IDENTICAS EM FORMATO)
================================================================================
- TODAS as ${numScenes} cenas usam EXATAMENTE o mesmo cabeçalho: "PROMPT CENA N (SEEDANCE 2.5):".
- TODAS as cenas usam EXATAMENTE os mesmos rótulos, na MESMA ordem: QUEM FALA, TOM E INTENÇÃO DA FALA, DIÁLOGO REAL, QUEM RESPONDE, RESPOSTA, INSTRUÇÕES VISUAIS (PROMPT SEEDANCE 2.5 & GOOGLE FLOW) com as 10 seções entre colchetes.
- A UNICA coisa que muda de uma cena para a outra é o NÚMERO da cena e o CONTEÚDO (ação, fala, cenário daquele momento). O formato, os rótulos e a ordem são IDENTICOS em todas.
- É TERMINANTEMENTE PROIBIDO: renomear um rótulo, pular uma seção, trocar a ordem das seções, usar "..." ou "mesmo de antes" para economizar, ou entregar uma cena mais curta que as outras.

================================================================================
CHARACTER MODEL SHEETS DOS PERSONAGENS (GERADOS NO FINAL — TODOS OS PERSONAGENS DA HISTÓRIA)
================================================================================
Agora que a história completa foi inteiramente desenvolvida através de todas as ${numScenes} cenas e todos os personagens foram apresentados, gere os Character Model Sheets individuais em fundo branco puro para TODOS os personagens que apareceram ou participaram visualmente da história (sem faltar absolutamente nenhum! Protagonista, antagonistas, familiares, secundários, crianças, idosos, funcionários ou figurantes recorrentes):

CHARACTER MODEL SHEETS DOS PERSONAGENS (FUNDO BRANCO PURO):

Para CADA personagem que participou da história:
PROMPT MODEL SHEET — [NOME DO PERSONAGEM] (FUNDO BRANCO PURO):
Folha profissional de referência do personagem em FUNDO BRANCO PURO (#FFFFFF solid seamless clean white studio background), iluminação neutra de estúdio comercial, sem cenário.
Mostrando EXATAMENTE A MESMA PESSOA várias vezes lado a lado na mesma imagem, nos seguintes 6 ÂNGULOS DE CORPO INTEIRO:
1. Full body front view (corpo inteiro — vista frontal)
2. Full body 3/4 front view (corpo inteiro — 3/4 frontal)
3. Full body left profile view (corpo inteiro — perfil esquerdo)
4. Full body right profile view (corpo inteiro — perfil direito)
5. Full body 3/4 rear view (corpo inteiro — 3/4 traseiro)
6. Full body rear view (corpo inteiro — vista traseira)
E 3 REFERÊNCIAS APROXIMADAS DO ROSTO (facial close-up portraits):
7. Close-up portrait frontal face
8. Close-up portrait 3/4 face
9. Close-up portrait profile face
Prompt fotográfico ultra-detalhado em inglês contendo: nome, idade exata, traços faciais minuciosos, formato dos olhos, mandíbula, nariz, dermo-realismo, corte e textura do cabelo, roupas canônicas exatas, tecidos, cores e calçados fixos estabelecidos na história.
Estilo visual: Ultra-realistic cinematic human character, photorealistic skin, realistic pores, natural facial asymmetry, realistic hair strands, anatomically correct human proportions, professional character reference photography, turnaround model sheet, neutral studio lighting, pure white seamless background (#FFFFFF), full body visible from head to toe, extremely detailed, consistent identity across every view, high-resolution cinematic photography.
${
  theme === 'Frutas'
    ? `(No tema Frutas: 3D character model sheet reference photography, anthropomorphic stylized fruit character, consistent identity across all 6 full-body angles and 3 close-up faces, Pixar/Disney feature animation quality, professional character turnaround sheet, neutral studio lighting, pure white seamless background, high resolution.)`
    : ''
}

(Gere o PROMPT MODEL SHEET individual para CADA personagem que apareceu na história, sem faltar nenhum!)

NÃO utilize asteriscos duplos (**) para negrito dentro do texto gerado.

Ao terminar, inclua a seção final:
---SEO-START---
Título Sugerido: [Título impactante e viral com gatilho de curiosidade no idioma ${currentLang.langName}]
Legenda para Redes Sociais: [Texto envolvente e reflexivo para o post no idioma ${currentLang.langName}]
Gatilho de Engajamento: [Pergunta instigante para gerar debates no idioma ${currentLang.langName}]
Hashtags Recomendadas: #novelinhas #cenas #dramatiktok #historiasreais #viralvideo #emocionante
`;

    if (numScenes > SINGLE_CALL_MAX_SCENES) {
      const longText = await generateLongVideo({
        apiKey: req.geminiApiKeys,
        theme: String(theme),
        country: String(country),
        tone: String(tone),
        emotion: String(emotion),
        skinDirective,
        langName: currentLang.langName,
        locale: currentLang.locale,
        numScenes,
        themeDirective,
        extremeWeightDirective,
        ownScriptDirective,
        context: String(context || ''),
        previousStory: String(previousStory || ''),
        isContinuing,
        referenceImage: req.referenceImage,
      });

      let longSceneOrder = 0;
      const normalizedLongText = longText
        .replace(/(PROMPT\s+)GANCHO\s+CHAMATIVO\s+(CENA\s+\d+)/gi, '$1$2')
        .replace(/(PROMPT\s+CENA\s+\d+)(?!\s*\(SEEDANCE)/gi, '$1 (SEEDANCE 2.5)')
        .replace(/(PROMPT\s+CENA\s+)\d+/gi, (_match, prefix) => `${prefix}${++longSceneOrder}`);

      return res.json({ text: normalizedLongText });
    }

    const countScenes = (value: string) => (value.match(/PROMPT\s+(?:GANCHO\s+CHAMATIVO\s+)?CENA\s+\d+/gi) || []).length;
    const countDetailed = (value: string) => (value.match(/\[Negative Prompt\]/gi) || []).length;
    const countSubject = (value: string) => (value.match(/\[Subject & Character Consistency\]/gi) || []).length;
    const countDialogue = (value: string) => (value.match(/\[Dialogue & Native Audio\]/gi) || []).length;

    let generatedText = (await generateWithModelFallback(
      promptInstructions,
      req.geminiApiKey,
      0.85,
      {},
      req.referenceImage,
    )).text || '';

    if (!generatedText) {
      throw new Error('Nenhum texto foi gerado pelo modelo.');
    }

    const isComplete =
      countScenes(generatedText) >= numScenes &&
      countDetailed(generatedText) >= numScenes &&
      countSubject(generatedText) >= numScenes &&
      countDialogue(generatedText) >= numScenes;

    if (!isComplete) {
      const retryPrompt = `${promptInstructions}

=======================================================================
CORRECAO OBRIGATORIA
=======================================================================
A resposta anterior veio incompleta ou com cenas faltando secao. Gere a historia COMPLETA novamente com:
- EXATAMENTE ${numScenes} cenas, numeradas de "PROMPT CENA 1" ate "PROMPT CENA ${numScenes}", SEM PULAR numeros e SEM cabeçalhos diferentes (nada de "GANCHO CHAMATIVO CENA 1": use "PROMPT CENA 1 (SEEDANCE 2.5)" igual as demais);
- TODAS as secoes de INSTRUCOES VISUAIS em CADA cena ([Subject & Character Consistency], [Environment & Scene Setting], [Background Override], [Action & First-Frame Blocking], [Optics & Camera Movement], [Dialogue & Native Audio], [Lighting & Atmosphere], [Audio & Ambience (SFX)], [Global Style & Physical Realism], [Negative Prompt]).`;

      const retry = await generateWithModelFallback(
        retryPrompt,
        req.geminiApiKey,
        0.85,
        {},
        req.referenceImage,
      );
      if (
        retry.text &&
        countScenes(retry.text) >= countScenes(generatedText) &&
        countDetailed(retry.text) >= countDetailed(generatedText) &&
        countSubject(retry.text) >= countSubject(generatedText) &&
        countDialogue(retry.text) >= countDialogue(generatedText)
      ) {
        generatedText = retry.text;
      }
    }

    // Normaliza cabeçalhos para um unico padrão e renumera as cenas em sequencia.
    let sceneOrder = 0;
    const normalizedText = generatedText
      .replace(/(PROMPT\s+)GANCHO\s+CHAMATIVO\s+(CENA\s+\d+)/gi, '$1$2')
      .replace(/(PROMPT\s+CENA\s+\d+)(?!\s*\(SEEDANCE)/gi, '$1 (SEEDANCE 2.5)')
      .replace(/(PROMPT\s+CENA\s+)\d+/gi, (_match, prefix) => `${prefix}${++sceneOrder}`);

    res.json({ text: normalizedText });
  } catch (error: any) {
    console.error('Error generating novelinhas script:', describeGeminiError(error).raw);
    const description = describeGeminiError(error);

    const clientMessage = description.accessDenied
      ? description.message
      : description.retryable
        ? 'O modelo de IA está com altíssima demanda temporária. Tentamos reconectar com modelos alternativos. Por favor, aguarde alguns instantes e tente novamente.'
        : description.code === 'GEMINI_ERROR' && !description.raw
          ? 'Falha ao gerar o roteiro cinematográfico. Tente novamente.'
          : description.message;

    res.status(description.accessDenied ? 502 : description.retryable ? 503 : 500).json({
      error: clientMessage,
      code: description.code,
    });
  }
};

const handleIdeas = async (req: any, res: any) => {
  try {
    const { theme = 'Dramas Emocionantes', country = 'Brasil', count = 5 } = req.body || {};

    const ideasLanguage =
      country === 'Estados Unidos' || country === 'Reino Unido'
        ? 'inglês (English)'
        : country === 'Espanha' || country === 'México'
          ? 'espanhol (Español)'
          : country === 'França'
            ? 'francês (Français)'
            : country === 'Itália'
              ? 'italiano (Italiano)'
              : country === 'Alemanha'
                ? 'alemão (Deutsch)'
                : 'português do Brasil';

    const ideasLanguageGuidance = `IDIOMA OBRIGATÓRIO DAS IDEIAS: escreva TODAS as ideias em ${ideasLanguage}. É proibido escrever as ideias em português quando o país escolhido for ${country} (exceto se o país for Brasil).`;

    const extraThemeGuidance =
      theme === 'Frutas'
        ? `IMPORTANTE PARA O TEMA FRUTAS: Todos os personagens DEVEM ser FRUTAS HUMANIZADAS / ANTROPOMÓRFICAS ADULTAS (ex: Morango Vitória a protagonista adulta com vestido rosa e sementes douradas, Bananão o playboy de terno, Uva Vitória a vilã invejosa de vestido de gala, Maçã Rica o herdeiro adulto, Cereza a sedutora, etc.). Crie dilemas novelescos de traição, ciúmes, vingança, romance proibido e superação no mundo das frutas em animação 3D.`
        : theme === 'Vida de Jesus'
          ? `IMPORTANTE PARA O TEMA VIDA DE JESUS: TODAS as ideias devem se passar NOS DIAS DE HOJE, no cotidiano humano do Brasil (periferia, comunidade, interior, família, trabalho, feira, ônibus, hospital público, dívida, briga de família, grupo do WhatsApp). O PERSONAGEM JESUS DEVE APARECER EM TODAS AS IDEIAS com a APARÊNCIA CLÁSSICA E RECONHECÍVEL de Jesus: cabelo longo castanho-escuro, barba cheia, olhar sereno, túnica longa clara com faixa na cintura e sandálias rústicas (NUNCA vestido como homem comum, de camiseta/calça/tênis). Ele cruza o caminho dos personagens e transforma a situação com amor, perdão, compaixão e sabedoria. É PROIBIDO cenário bíblico de época (deserto, templos, vilas antigas) e milagre literal/espetacular (multiplicar pães, andar sobre a água): os "milagres" são GESTOS HUMANOS REAIS do cotidiano (o emprego que aparece, o perdão que desarma a briga, a dívida resolvida por bondade, a família reconciliada).`
          : '';

    const antiClicheIdeasGuidance =
      theme === 'Gordos' || theme === 'Gordos Suados'
        ? `
IMPORTANTE - COTIDIANO BRASILEIRO REAL (obrigatorio para o tema de gordos):
- Toda ideia deve nascer de uma situacao REAL, reconhecivel e do dia a dia do povo brasileiro: periferia, interior, feira, fila do posto de saude, onibus lotado, igreja, boteco, salao, grupo da familia no WhatsApp, divida no cartao, bico, programa social, golpe na internet, rede social, briga por dinheiro.
- O contexto social/economico e o MOTOR da trama. O peso extremo e so a aparencia de todos os personagens.
IMPORTANTE - CENARIO PRECARIO E SUOR (obrigatorio para o tema GORDOS SUADOS):
- Em 'Gordos Suados', TODOS os personagens aparecem SUADOS (pele brilhando, gotas de suor, cabelo grudado na testa) e TODAS as cenas acontecem em locais brasileiros PRECARIOS, SUJOS E DESORDENADOS (cozinha de periferia com parede mofada, quarto apertado, lanchonete de rua a noite, barraca de feira, varanda de bloco popular).
- Humor honesto, critica leve e emocao verdadeira - NUNCA piada humilhante nem deboche, e NUNCA use a pobreza/precariedade como riso.
- Exemplos do TIPO de premissa (varie, nao repita): pai obeso e suado que perdeu o emprego e esconde da familia; mae que faz bico de tudo e e enganada pelo proprio filho; homem que finge morar bem nas redes sociais e e desmascarado AO VIVO; vizinho do golpe do Pix; tia que vende bolo no sinal; tio das piramides; mae que vende coxinha; fila do INSS; agiota do bairro; churrasco que vira briga de familia; a loteria que promete tudo.`
        : '';

    const prompt = `
Você é o principal criador e roteirista de novelinhas curtas ultra-virais para redes sociais (TikTok, Kwai, Reels, YouTube Shorts).
Gere exatamente ${count} ideias curtas, inéditas, dramáticas, viciantes e com ganchos emocionais fortes para o tema '${theme}' ambientado em '${country}'.
${extraThemeGuidance}${antiClicheIdeasGuidance}
${ideasLanguageGuidance}
REGRA ANTI-CLICHÊ (obrigatória): NUNCA use tramas batidas/genéricas (marido traindo com a empregada, madrasta malvada, herança disputada, "segredo do passado" vazio, vingança de ex, vilão genérico). Cada ideia parte de um PROBLEMA CONCRETO e específico, não de um conflito abstrato.
Cada ideia deve ter entre 1 e 2 frases de alto impacto:
- Apresentar personagens nítidos (com nomes e personalidades marcantes)
- Apresentar o dilema ou conflito inicial
- Apresentar uma reviravolta surpreendente ou lição de vida inesquecível

Retorne EXCLUSIVAMENTE um array JSON com ${count} strings, sem formatação markdown ou explicações adicionais:
["Ideia 1...", "Ideia 2...", "Ideia 3...", "Ideia 4...", "Ideia 5..."]`;

    const { text } = await generateWithModelFallback(prompt, req.geminiApiKey);

    let ideas: string[] = [];
    try {
      const cleaned = text
        .trim()
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        ideas = parsed.map((item) => String(item).trim()).filter((item) => item.length > 15);
      }
    } catch {
      const matches = Array.from(text.matchAll(/"([^"\n]{20,})"/g)).map((m) => m[1].trim());
      if (matches.length > 0) {
        ideas = matches;
      } else {
        ideas = text
          .split('\n')
          .map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter((line) => line.length > 20);
      }
    }

    if (ideas.length === 0) {
      ideas = [
        `Uma família grande que teve 10 filhos para receber mais Bolsa Família entra em colapso quando o benefício é cortado de surpresa.`,
        `Um homem pobre que mora numa casa caindo aos pedaços mantém as redes sociais cheias de vida de luxo até a farsa ser exposta ao vivo.`,
        `Uma mulher que faz bico de tudo descobre que o vizinho do "golpe do Pix" aplicou o golpe nela e no grupo da família.`,
      ];
    }

    res.json({ ideas: ideas.slice(0, 8) });
  } catch (error: any) {
    const description = describeGeminiError(error);
    console.error('Error generating ideas for novelinhas:', description.raw);

    res
      .status(description.accessDenied ? 502 : description.retryable ? 503 : 500)
      .json({ error: description.code === 'GEMINI_ERROR' && !description.raw ? 'Erro ao gerar novas ideias.' : description.message });
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

  const apiKeyCandidates = await getGeminiApiKeyCandidates(serviceSupabase, user.id);
  if (!apiKeyCandidates.length) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  req.geminiApiKey = apiKeyCandidates;
  req.geminiApiKeys = apiKeyCandidates;

  if (String(req.body?.action || '') === 'generate-ideas') {
    return handleIdeas(req, res);
  }

  return handleGenerate(req, res);
}
