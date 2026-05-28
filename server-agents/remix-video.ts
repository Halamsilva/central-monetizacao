import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const MAX_VIDEO_BYTES = 18 * 1024 * 1024;

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 4000) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const parseVideo = (video: unknown) => {
  const dataUrl = String(video || '');
  const matches = dataUrl.match(/^data:(video\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);

  if (!matches) return null;

  const data = matches[2];
  const bytes = Math.floor((data.length * 3) / 4);

  return {
    mimeType: matches[1],
    data,
    bytes,
  };
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

const buildPrompt = (extraContext: string) => `
Analise este video em detalhes, identificando personagens, cenas e elementos de audio.
Responda em Portugues do Brasil.

ESTRUTURA OBRIGATORIA:

# BIBLIA DE CONTINUIDADE DOS PERSONAGENS
Crie um perfil fixo para cada personagem identificado no video.
Para cada personagem, defina nome e uma "descricao curta fixa" consistente contendo idade aproximada, fisionomia, funcao na historia, vestimenta principal e estilo visual.
Use este formato:
- **Nome do Personagem**: descricao fisica, vestimentas, pele, cabelos, expressoes tipicas e funcao dramatica.

# CENAS GERADAS - CRONOGRAMA DETALHADO (INTERVALOS DE 8 SEGUNDOS)
Divida a analise em intervalos de EXATAMENTE 8 segundos: 0s-8s, 8s-16s, 16s-24s, etc.
Use exatamente a tag "---" entre os segmentos.
Para cada segmento, use o cabecalho:

### SEGMENTO: Cena [Numero] - [Tempo inicial]-[Tempo final]s

Dentro de cada segmento, escreva:

1. **Descricao Visual Hiper-Detalhada**:
Descreva texturas, micro-movimentos, expressoes faciais, camera, cenario, iluminacao, atmosfera, figurino e continuidade visual.

2. **Analise de Prompts por Blocos de Tempo (0-2s, 2-4s, 4-6s, 6-8s)**:
- **0-2s**: acao detalhada e falas exatas deste intervalo, se houver.
- **2-4s**: acao detalhada e falas exatas deste intervalo, se houver.
- **4-6s**: acao detalhada e falas exatas deste intervalo, se houver.
- **6-8s**: acao detalhada e falas exatas deste intervalo, se houver.

3. **Audio, Voz e Ambiente Sonoro**:
Descreva voz, ritmo, intencao, sons de ambiente, musica, pausas, respiracao, ruidos e efeitos sonoros percebidos ou recomendados para remix.

4. **Prompt IA Otimizado**:
Uma versao curta, condensada e visualmente rica para geradores de video como Veo, Sora, Runway, Kling ou Luma, com estilo, iluminacao, texturas, camera, audio e atmosfera.

REGRAS CRITICAS:
- Nunca gere falas soltas fora do bloco de tempo correspondente.
- Toda fala deve aparecer integrada no bloco exato em que acontece.
- Quando houver dialogo, use este formato:
  Nome do Personagem (descricao visual curta fixa): "fala do personagem"
- A descricao curta do personagem deve ser sempre igual em todas as cenas.
- Se nao houver dialogo, escreva "[Acao Silenciosa - Sem dialogos]" no bloco correspondente.
- Seja especifico o suficiente para alguem recriar ou remixar a cena.
- Nao invente dados pessoais reais de pessoas no video.

${extraContext ? `CONTEXTO ADICIONAL DO USUARIO: ${extraContext}` : ''}
`.trim();

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

  const video = parseVideo(req.body?.video);
  if (!video) {
    return res.status(400).json({ error: 'Envie um video valido.' });
  }

  if (video.bytes > MAX_VIDEO_BYTES) {
    return res.status(413).json({
      error: 'Este video ficou grande demais para analisar direto. Envie um trecho menor, com ate 18MB.',
    });
  }

  const extraContext = cleanText(req.body?.extraContext, 1400);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_VIDEO_MODEL || process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: video.data,
                mimeType: video.mimeType,
              },
            },
            { text: buildPrompt(extraContext) },
          ],
        },
      ],
    });

    if (!result.text) {
      return res.status(500).json({ error: 'A IA nao retornou uma analise.' });
    }

    return res.status(200).json({ analysis: result.text });
  } catch (error: any) {
    console.error('Remix video agent error:', error);
    const message =
      error.status === 429 || error.message?.includes('429')
        ? 'Limite de uso da IA atingido agora. Tente novamente mais tarde.'
        : error.message || 'Nao foi possivel analisar o video.';

    return res.status(error.status || 500).json({ error: message });
  }
}
