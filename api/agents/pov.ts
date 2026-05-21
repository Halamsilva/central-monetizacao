import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type VoiceGender = 'Masculina' | 'Feminina';
type VideoStyle = 'Atendente' | 'POV';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 1200) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const clampScenes = (value: unknown) => {
  const scenes = Number(value);
  if (!Number.isFinite(scenes)) return 5;
  return Math.min(10, Math.max(1, Math.round(scenes)));
};

const systemInstruction = `
Voce e um especialista em prompts para videos de vendas de alta conversao.
Crie prompts ultra-realistas para TikTok Shop, Reels e anuncios curtos no estilo varejo real, lifestyle e producao brasileira movimentada.

Regras visuais obrigatorias:
- O produto deve ser 100% fiel a imagem enviada: mesma cor, formato, escala, textura, logotipo e estrutura.
- Nao adicione acessorios, cabos, perifericos ou itens que nao existem na imagem.
- Todos os prompts visuais devem citar: "Using the provided image as the absolute reference for the product, without changing scale, proportions, original structure, color, logo or materials".
- Estilo: reality advertising, ultra-realistic, cinematic portrait, 8k RAW, realistic human skin, natural pores, skin texture, fabric weave, real lighting, handheld smooth movement.
- Negative prompt obrigatorio em cada visualPrompt: no phone frame, no smartphone mockup, no mobile screen, no app interface, no UI overlay, no text overlay, no buttons, no icons, no shopping cart icon.

Regras de vendas:
- Use linguagem brasileira natural, direta e comercial, sem parecer robo.
- Cada fala deve durar aproximadamente 8 segundos quando falada naturalmente.
- O ultimo prompt deve incluir CTA: "ficou interessado em comprar? entao clica no carrinho laranja aqui no cantinho da tela e compre o seu antes que acabe".
- Responda somente em JSON valido no schema solicitado.
`.trim();

const buildPrompt = (body: any) => {
  const numScenes = clampScenes(body?.numScenes);
  const productName = cleanText(body?.customProductName, 120);
  const salesCopy = cleanText(body?.salesCopy, 1500);
  const scenario = cleanText(body?.scenario, 240) || 'Loja de varejo brasileira movimentada';
  const videoStyle = (body?.videoStyle === 'POV' ? 'POV' : 'Atendente') as VideoStyle;
  const voiceGender = (body?.voiceGender === 'Masculina' ? 'Masculina' : 'Feminina') as VoiceGender;
  const avatarGender = cleanText(body?.avatarGender, 80) || 'Mulher';
  const avatarClothing = cleanText(body?.avatarClothing, 180);
  const avatarCharacteristics = cleanText(body?.avatarCharacteristics, 220);
  const charactersClothing = cleanText(body?.charactersClothing, 220);
  const includeHook = Boolean(body?.includeHook);
  const hookAction = cleanText(body?.hookAction, 260);
  const hookSpeech = cleanText(body?.hookSpeech, 260);

  return `
Gere prompts para video de venda usando a imagem do produto enviada.

Produto informado: ${productName || 'identifique pela imagem'}
Copy/beneficios do produto: ${salesCopy || 'crie uma copy persuasiva baseada no produto'}
Cenario: ${scenario}
Estilo do video: ${videoStyle}
Quantidade de cenas: ${numScenes}
Voz preferida: ${voiceGender}
Figurino geral: ${charactersClothing || 'roupas naturais de pessoas reais no contexto do cenario'}

${videoStyle === 'POV'
    ? 'No estilo POV, o atendente nao aparece. Mostre somente maos humanas reais interagindo com o produto e use narracao em off.'
    : `No estilo Atendente, mostre uma pessoa comum apresentando o produto. Avatar: ${avatarGender}. Roupas: ${avatarClothing || 'roupa casual limpa e realista'}. Caracteristicas: ${avatarCharacteristics || 'pessoa brasileira comum, simpatica e natural'}.`
  }

${includeHook
    ? `Inclua um prompt de gancho como primeira cena. Acao do gancho: ${hookAction || 'mostrar o produto de forma surpreendente'}. Fala do gancho: ${hookSpeech || 'voce precisa ver isso antes que acabe'}.`
    : ''
  }

Estrutura:
1. Comece com movimento/cena inicial forte.
2. Mostre qualidade e detalhes do produto.
3. Mostre demanda, uso real ou beneficio claro.
4. Crie progressao de desejo e urgencia.
5. Termine com CTA de compra.

Para cada prompt retorne:
- id numerico.
- title curto.
- scene com resumo da cena.
- visualPrompt completo, pronto para colar em gerador de video.
- speech com fala natural.
- psychologicalTrigger.
- voiceGender.
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

  const base64Image = cleanText(req.body?.base64Image, 8_000_000);
  const mimeType = cleanText(req.body?.mimeType, 80);

  if (!base64Image || !mimeType.startsWith('image/')) {
    return res.status(400).json({ error: 'Product image is required' });
  }

  try {
    const parts: any[] = [
      { text: buildPrompt(req.body) },
      { inlineData: { data: base64Image, mimeType } },
    ];

    if (req.body?.avatarImage?.data && req.body?.videoStyle !== 'POV') {
      parts.push({
        inlineData: {
          data: cleanText(req.body.avatarImage.data, 8_000_000),
          mimeType: cleanText(req.body.avatarImage.mimeType, 80),
        },
      });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            productAnalysis: { type: Type.STRING },
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  scene: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  speech: { type: Type.STRING },
                  psychologicalTrigger: { type: Type.STRING },
                  voiceGender: { type: Type.STRING, enum: ['Masculina', 'Feminina'] },
                },
                required: [
                  'id',
                  'title',
                  'scene',
                  'visualPrompt',
                  'speech',
                  'psychologicalTrigger',
                  'voiceGender',
                ],
              },
            },
          },
          required: ['productName', 'productAnalysis', 'prompts'],
        },
      },
    });

    if (!result.text) {
      return res.status(500).json({ error: 'Empty Gemini response' });
    }

    return res.status(200).json(JSON.parse(result.text));
  } catch (error: any) {
    console.error('POV agent error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate prompts' });
  }
}
