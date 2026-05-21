import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type AgentAction = 'analyze' | 'generate';

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const cleanText = (value: unknown, maxLength = 1400) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);

const cleanStringList = (value: unknown, maxItems = 9) =>
  Array.isArray(value)
    ? value.map((item) => cleanText(item, 80)).filter(Boolean).slice(0, maxItems)
    : [];

const parseImage = (image: unknown) => {
  const dataUrl = String(image || '');
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);

  if (!matches) return null;

  return {
    mimeType: matches[1],
    data: matches[2],
  };
};

const triggerManual: Record<string, string> = {
  Curiosidade:
    'Gatilho curiosidade: abra com descoberta, pergunta forte ou segredo que a pessoa quer entender ate o fim.',
  Urgencia:
    'Gatilho urgencia: mostre que o tempo esta acabando e que a pessoa precisa agir agora.',
  Escassez:
    'Gatilho escassez: destaque poucas unidades, estoque acabando ou promocao limitada.',
  Autoridade:
    'Gatilho autoridade: fale como quem entende de garimpo, preco e oportunidade de compra.',
  'Prova Social':
    'Gatilho prova social: mencione que muita gente esta comprando, perguntando ou recomendando.',
  Reciprocidade:
    'Gatilho reciprocidade: posicione a dica como um favor util para quem esta assistindo.',
  Afeicao:
    'Gatilho afeicao: use tom de cumplicidade, conversa proxima e natural.',
  Exclusividade:
    'Gatilho exclusividade: destaque que pouca gente conhece aquele preco, fornecedor ou achado.',
  Beneficio:
    'Gatilho beneficio: foque no ganho real da pessoa: economia, conforto, status, praticidade ou revenda.',
};

const buildSystemInstruction = (triggers: string[], gender: string) => {
  const triggersInfo = triggers.length
    ? `Use estes gatilhos como centro dos scripts:\n${triggers
        .map((trigger) => triggerManual[trigger] || trigger)
        .join('\n')}`
    : 'Use gatilhos padrao: curiosidade, descoberta, oportunidade, economia e urgencia.';

  const genderInfo =
    gender === 'homem'
      ? 'Persona: o locutor e um homem. Use fala brasileira popular, natural e confiante.'
      : 'Persona: a locutora e uma mulher. Use fala brasileira popular, natural e proxima, com termos como amiga, menina ou minha filha quando fizer sentido.';

  return `
Voce e um especialista em copy de vendas para TikTok Shop.
Crie scripts humanizados para videos curtos no estilo achado secreto, com alta conversao e fala natural.

${genderInfo}

Estrutura obrigatoria de cada script:
1. Abrir com descoberta, curiosidade ou oportunidade.
2. Mostrar o produto de forma simples.
3. Destacar a principal vantagem: preco, kit, conforto, praticidade, revenda ou solucao.
4. Adicionar comentario humano espontaneo.
5. Chamada natural para o carrinho laranja.
6. Fechar com urgencia ou escassez.

Regras:
- Texto com cara de pessoa real falando, sem parecer anuncio formal.
- Nao use topicos, aspas, emojis ou marcadores.
- Nao use girias pesadas.
- Pode usar regionalismos leves.
- Cada script deve estar pronto para copiar e gravar.
- Gere exatamente 5 scripts diferentes.
- Se houver imagem, use detalhes visuais do produto para deixar o texto mais especifico.
- ${triggersInfo}

Responda somente em JSON valido no schema solicitado.
`.trim();
};

const buildGeneratePrompt = (body: any) => {
  const product = cleanText(body?.product, 160);
  const triggers = cleanStringList(body?.triggers);

  return `
Produto informado: ${product || 'identifique pela imagem'}
Gatilhos selecionados: ${triggers.length ? triggers.join(', ') : 'padrao'}

Crie 5 scripts de venda para TikTok Shop. O foco e vender de forma natural, persuasiva e humana.
Se o produto permitir, mencione tambem oportunidade de revenda.
Sempre inclua chamada para o carrinho laranja de forma natural.
`.trim();
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

const quotaMessage =
  'Limite de uso da IA atingido agora. Tente novamente mais tarde ou confira a chave Gemini configurada no servidor.';

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

  const action = cleanText(req.body?.action, 20) as AgentAction;
  const image = parseImage(req.body?.image);
  const ai = new GoogleGenAI({ apiKey });

  if (action === 'analyze') {
    if (!image) {
      return res.status(400).json({ error: 'A imagem do produto e obrigatoria.' });
    }

    try {
      const result = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: image },
            {
              text:
                'Identifique o nome deste produto de forma curta e direta, com no maximo 5 palavras. Retorne apenas JSON.',
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
            },
            required: ['productName'],
          },
        },
      });

      if (!result.text) {
        return res.status(500).json({ error: 'Empty Gemini response' });
      }

      return res.status(200).json(JSON.parse(result.text));
    } catch (error: any) {
      console.error('TikTok persuasive analyze error:', error);
      const message = error.status === 429 || error.message?.includes('429') ? quotaMessage : 'Erro ao analisar a imagem.';
      return res.status(error.status || 500).json({ error: message });
    }
  }

  if (action !== 'generate') {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const product = cleanText(req.body?.product, 160);

  if (!product && !image) {
    return res.status(400).json({ error: 'Informe o produto ou envie uma imagem.' });
  }

  const triggers = cleanStringList(req.body?.triggers);
  const gender = cleanText(req.body?.gender, 20) === 'homem' ? 'homem' : 'mulher';
  const contents: any = image
    ? {
        parts: [
          { inlineData: image },
          { text: buildGeneratePrompt(req.body) },
        ],
      }
    : buildGeneratePrompt(req.body);

  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: buildSystemInstruction(triggers, gender),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scripts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista com 5 scripts de venda',
            },
          },
          required: ['scripts'],
        },
      },
    });

    if (!result.text) {
      return res.status(500).json({ error: 'Empty Gemini response' });
    }

    return res.status(200).json(JSON.parse(result.text));
  } catch (error: any) {
    console.error('TikTok persuasive generate error:', error);
    const message = error.status === 429 || error.message?.includes('429')
      ? quotaMessage
      : error.message || 'Erro ao gerar os scripts.';
    return res.status(error.status || 500).json({ error: message });
  }
}
