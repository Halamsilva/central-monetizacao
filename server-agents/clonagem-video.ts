import { GoogleGenAI } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const clean = (value: unknown, maxLength = 300) =>
  String(value || '').trim().slice(0, maxLength);

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

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

const LANGUAGE = {
  brasil: 'Portuguese (Brazil)',
  estados_unidos: 'English (United States)',
  mexico: 'Spanish (Mexico)',
} as const;

const buildPrompt = (targetLanguage: string) => `
Analise o VIDEO anexado com precisao cirurgica para que qualquer criador possa CLONAR e RECRIAR com 100% de fidelidade visual cada tomada, personagem, fala, movimento de camera, iluminacao e atuacao em geradores de video de IA (Kling 1.5, Runway Gen-3 Alpha, Sora, Luma Dream Machine, Hailuo/Minimax e Wan 2.1).
Responda INTEIRAMENTE no idioma: ${targetLanguage}.

================================================================================
REGRA SUPREMA DE IDIOMA (INVIOLAVEL - LEIA ANTES DE TUDO)
================================================================================
- O IDIOMA DE DESTINO E: ${targetLanguage}.
- TODAS as falas dos personagens DEVEM ser entregues TRADUZIDAS para ${targetLanguage}, MESMO que o audio original do video esteja em outro idioma (portugues, ingles, espanhol etc.).
- Para CADA fala voce DEVE fazer as DUAS coisas: (1) transcrever a fala ORIGINAL exata que ouve; e (2) fornecer a TRADUCAO NATURAL e coloquial dela em ${targetLanguage}. A traducao e OBRIGATORIA em 100% das falas, sem NENHUMA excecao.
- Nos prompts prontos para copiar (*Prompt Direto* e *Master Cloning Prompt*), a linha de dialogo DEVE conter a FALA JA TRADUZIDA em ${targetLanguage}, para que a IA de video gere o lip-sync FALANDO em ${targetLanguage}.
- Se o video NAO tiver fala alguma, marque claramente "[SEM DIALOGO]" e siga normalmente.
- NUNCA entregue a fala apenas no idioma original quando ele for diferente de ${targetLanguage}.

========================================================================
REGRA MAXIMA: ENTREGUE OS PROMPTS EM BLOCOS SEPARADOS POR TEMPO DE 8 SEGUNDOS
========================================================================
- Fatia os prompts em BLOCOS SEPARADOS DE EXATAMENTE 8 SEGUNDOS (0s-8s, 8s-16s, 16s-24s... ate o final do video).
- Para CADA intervalo de 8 segundos, gere um bloco independente com prompts prontos para copiar.
- NUNCA junte tudo em um unico prompt corrido.
- Separe os blocos com uma linha contendo exatamente "---".

========================================================================
METODOLOGIA FORENSE DE CLONAGEM E ATRIBUICAO DE FALAS
========================================================================
1. IDENTIFICACAO BIOMETRICA DOS PERSONAGENS ([P1], [P2], [P3]...):
   - Rotule cada personagem com TAG exclusiva e registre ancoras imutaveis: formato do cranio/queixo, mandibula, macas do rosto; olhos (cor da iris, formato, palpebras, sobrancelhas); nariz e labios; pele (tom, subtom, poros, marcas, brilho de suor); cabelo (curvatura, corte, mechas soltas); figurino (material, cor, caimento, costuras); acessorios; perfil vocal e cadencia.
   - Descricao Curta Fixa Imutavel: "[P1] Nome (idade, etnia, funcao, traco fisico marcante, roupa exata com cor e tecido)" — repetir IDENTICA em todas as cenas e prompts.

2. ENGENHARIA CINEMATOGRAFICA E OPTICA:
   - Plano/enquadramento, movimento de camera (dolly-in a 0.15m/s, handheld 24fps, tripé), lente (Cine Prime 85mm T1.5, f/1.8, bokeh), iluminacao fotometrica (key, fill ratio 3:1, rim 5600K, temperatura de cor), composicao em 3 camadas.

3. ANALISE SEGUNDO A SEGUNDO COM FACS E ATRIBUICAO DE FALA:
   - Indique quem e o FALANTE ATIVO que articula a boca e pronuncia as palavras.
   - Indique o OUVINTE SILENCIOSO, com labios e boca estritamente fechados, reagindo so com olhar e postura.

========================================================================
ESTRUTURA DA RESPOSTA EM ${targetLanguage}
========================================================================
# BIBLIA FORENSE DE CONTINUIDADE E CLONAGEM
Ficha completa de cada personagem ([P1], [P2]...) conforme os itens do topico 1.

# CRONOGRAMA EM BLOCOS DE 8 SEGUNDOS
Para cada bloco: use o cabecalho "### BLOCO 8s: [inicio]-[fim]s (Cena N)" e traga:
1. Direcao de camera, optica e iluminacao do bloco.
2. Progressao segundo a segundo (0-2s, 2-4s, 4-6s, 6-8s) com FACS e atribuicao de fala:
   [QUEM VAI FALAR: Nome [P1] -> DIRECIONADO A: Nome [P2] | TOM VOCAL: ... | ARTICULACAO LABIAL & FACS: ...]
   Nome [P1] (descricao curta fixa): acao fisica e labios articulando.
   FALA ORIGINAL (transcricao exata do audio, no idioma original): "texto exato ouvido"
   FALA TRADUZIDA (${targetLanguage}): "a mesma fala traduzida de forma natural para ${targetLanguage}"  <- OBRIGATORIA EM TODAS AS FALAS
   [PERSONAGEM NAO-FALANTE / OUVINTE SILENCIOSO: Nome [P2]]
   Nome [P2] (descricao curta fixa): [SEM FALA / BOCA E LABIOS FECHADOS] reagindo so silenciosamente.
3. Dois prompts de clonagem:
   *Prompt Direto (no idioma de destino ${targetLanguage}):* um bloco continuo com [Enquadramento e Optica], [Composicao Espacial e Personagens], [Acao Fisica Continua e Micro-Expressoes FACS], [DIALOGO & SINCRONIA LABIAL EXPLICITA], [Iluminacao Fotométrica e Atmosfera], [Parametros Tecnicos de Renderizacao]. A secao [DIALOGO & SINCRONIA LABIAL EXPLICITA] DEVE conter a FALA TRADUZIDA em ${targetLanguage} (nunca a original).
   *Master Cloning Prompt (rotulos tecnicos em ingles):* o mesmo em ingles tecnico no formato [Camera & Framing], [Spatial Blocking & Identified Subjects], [Continuous Physical Motion & FACS], [EXPLICIT LIP-SYNC & SPEECH], [Photometric Lighting & Atmosphere], [Technical AI Engine Flags]. ATENCAO: apenas os ROTULOS sao em ingles; o CONTEUDO da secao [EXPLICIT LIP-SYNC & SPEECH] DEVE conter a FALA TRADUZIDA em ${targetLanguage}.

========================================================================
REGRAS CRITICAS (ANTI-ALUCINACAO)
========================================================================
- NUNCA atribua a fala a personagem errado, nem invente falas. Observ e a boca/labios e o audio.
- Quem NAO fala fica explicitamente com "[SEM FALA / BOCA E LABIOS FECHADOS]".
- Traduza TODAS as falas para o idioma de destino (${targetLanguage}); a traducao e obrigatoria em cada fala, e o prompt pronto para copiar deve conter a fala ja traduzida.
- Parametros tecnicos anti-distorcao: 8k photorealistic, poros hiper-detalhados com subsurface scattering, fisica realista de tecidos, motion blur 24fps, zero morphing, zero distorcao de membros.
- Se nao houver dialogo no bloco, descreva a acao silenciosa e marque "[Acao Silenciosa - Sem dialogos falados]".
- Entregue direto o resultado final, pronto para copiar. Nao explique que voce e uma IA.
`.trim();

const MODELS = ['gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

const extractText = (response: any) => {
  if (!response) return '';
  if (typeof response.text === 'string') return response.text.trim();
  const parts = response.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part: any) => (typeof part?.text === 'string' ? part.text : '')).join('\n').trim();
  }
  return '';
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

  const fileUri = clean(req.body?.fileUri, 500);
  const videoBase64 = typeof req.body?.videoBase64 === 'string' ? req.body.videoBase64 : '';
  const mimeType = clean(req.body?.mimeType, 80) || 'video/mp4';
  const languageKey = clean(req.body?.language, 40) || 'brasil';
  const targetLanguage = LANGUAGE[languageKey as keyof typeof LANGUAGE] || LANGUAGE.brasil;

  const mediaPart: any = fileUri
    ? { fileData: { fileUri, mimeType } }
    : videoBase64
      ? { inlineData: { data: videoBase64, mimeType } }
      : null;

  if (!mediaPart) {
    return res.status(400).json({ error: 'Nenhum video foi recebido.' });
  }

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  const prompt = buildPrompt(targetLanguage);
  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [mediaPart, { text: prompt }] }],
        config: { temperature: 0.25 },
      });

      const text = extractText(response);
      if (text) {
        return res.status(200).json({ ok: true, result: text, modelUsed: model });
      }
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || error || '');
      if (message.includes('PERMISSION_DENIED') || message.includes('API key not valid')) {
        break;
      }
    }
  }

  console.error('Clonagem video error:', lastError);
  const message = String(lastError?.message || '');
  let friendly = 'Nao consegui analisar o video agora. Tente novamente.';
  if (message.includes('PERMISSION_DENIED') || message.includes('API key not valid')) {
    friendly = 'Sua chave do Google AI Studio foi recusada. Confira a chave em Configuracoes.';
  } else if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
    friendly = 'Limite de IA atingido agora. Tente novamente em alguns minutos.';
  } else if (message.includes('not found') || message.includes('NOT_FOUND')) {
    friendly = 'O video expirou antes da analise. Envie novamente.';
  }

  return res.status(500).json({ error: friendly });
}
