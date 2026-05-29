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
    'Gatilho curiosidade: abra com descoberta, pergunta forte ou segredo que a pessoa quer entender até o fim.',
  Urgência:
    'Gatilho urgência: mostre que o tempo está acabando e que a pessoa precisa agir agora.',
  Urgencia:
    'Gatilho urgência: mostre que o tempo está acabando e que a pessoa precisa agir agora.',
  Escassez:
    'Gatilho escassez: destaque poucas unidades, estoque acabando ou promoção limitada.',
  Autoridade:
    'Gatilho autoridade: fale como quem entende de garimpo, preço e oportunidade de compra.',
  'Prova Social':
    'Gatilho prova social: mencione que muita gente está comprando, perguntando ou recomendando.',
  Reciprocidade:
    'Gatilho reciprocidade: posicione a dica como um favor útil para quem está assistindo.',
  Afeição:
    'Gatilho afeição: use tom de cumplicidade, conversa próxima e natural.',
  Afeicao:
    'Gatilho afeição: use tom de cumplicidade, conversa próxima e natural.',
  Exclusividade:
    'Gatilho exclusividade: destaque que pouca gente conhece aquele preço, fornecedor ou achado.',
  Benefício:
    'Gatilho benefício: foque no ganho real da pessoa: economia, conforto, status, praticidade ou revenda.',
  Beneficio:
    'Gatilho benefício: foque no ganho real da pessoa: economia, conforto, status, praticidade ou revenda.',
};

const getLengthInfo = (videoLength: string) => {
  const lengths: Record<string, string> = {
    '15s': 'Duracao: 15 segundos. Texto ultra rapido, direto, com no maximo 35 a 45 palavras.',
    '25s': 'Duracao: 25 segundos. Texto dinamico, com no maximo 60 a 75 palavras.',
    '35s': 'Duracao: 35 segundos. Texto envolvente, com no maximo 85 a 105 palavras.',
    '45s': 'Duracao: 45 segundos. Texto equilibrado, com no maximo 110 a 135 palavras.',
    '60s': 'Duracao: 60 segundos. Texto completo, com no maximo 150 a 180 palavras.',
    '90s': 'Duracao: 90 segundos. Texto mais completo, com no maximo 220 a 270 palavras.',
  };

  return lengths[videoLength] || lengths['35s'];
};

const getHookStyleInfo = (hookStyle: string) => {
  const styles: Record<string, string> = {
    espontaneo: 'Gancho principal: tom amigavel e espontaneo, como recomendacao de amiga ou achado secreto.',
    curiosidade: 'Gancho principal: abrir com misterio, surpresa e curiosidade forte sobre o produto.',
    segredo: 'Gancho principal: apresentar como segredo de lojistas, fornecedor escondido ou oportunidade pouco conhecida.',
    dor_solucao: 'Gancho principal: comecar pela dor do publico e apresentar o produto como solucao.',
    provocativo: 'Gancho principal: abrir com alerta, provocacao leve ou erro que a pessoa precisa parar de cometer.',
    prova_social: 'Gancho principal: usar prova social, pessoas perguntando ou amigas querendo saber onde comprou.',
  };

  return styles[hookStyle] || styles.espontaneo;
};

const buildSystemInstruction = (triggers: string[], gender: string, videoLength: string, hookStyle: string) => {
  const triggersInfo = triggers.length
    ? `Use estes gatilhos como centro dos scripts:\n${triggers
        .map((trigger) => triggerManual[trigger] || trigger)
        .join('\n')}`
    : 'Use gatilhos padrão: curiosidade, descoberta, oportunidade, economia e urgência.';

  const genderInfo =
    gender === 'homem'
      ? 'Persona: o locutor é um homem. Use fala brasileira popular, natural e confiante.'
      : 'Persona: a locutora é uma mulher. Use fala brasileira popular, natural e próxima, com termos como amiga, menina ou minha filha quando fizer sentido.';

  return `
Você é um especialista em copy de vendas para TikTok Shop.
Crie scripts humanizados para vídeos curtos no estilo achado secreto, com alta conversão e fala natural.

${genderInfo}
${getLengthInfo(videoLength)}
${getHookStyleInfo(hookStyle)}

Regras adicionais:
- Escreva 100% em portugues brasileiro natural e coloquial.
- Evite termos em ingles como copy, script, CTA, hook, pitch, trend e marketing.
- Para cada roteiro, gere tambem exatamente 3 ganchos alternativos curtos, de uma linha, especificos para o produto e diferentes do gancho principal.

Estrutura obrigatoria de cada script:
1. Abrir com descoberta, curiosidade ou oportunidade.
2. Mostrar o produto de forma simples.
3. Destacar a principal vantagem: preço, kit, conforto, praticidade, revenda ou solução.
4. Adicionar comentário humano espontâneo.
5. Chamada natural para o carrinho laranja.
6. Fechar com urgência ou escassez.

Regras:
- Texto com cara de pessoa real falando, sem parecer anúncio formal.
- Não use tópicos, aspas, emojis ou marcadores.
- Não use gírias pesadas.
- Pode usar regionalismos leves.
- Cada script deve estar pronto para copiar e gravar.
- Gere exatamente 5 scripts diferentes.
- Se houver imagem, use detalhes visuais do produto para deixar o texto mais específico.
- ${triggersInfo}

Responda somente em JSON válido no schema solicitado.
`.trim();
};

const buildGeneratePrompt = (body: any) => {
  const product = cleanText(body?.product, 160);
  const triggers = cleanStringList(body?.triggers);
  const videoLength = cleanText(body?.videoLength, 20) || '35s';
  const hookStyle = cleanText(body?.hookStyle, 40) || 'espontaneo';

  return `
Produto informado: ${product || 'identifique pela imagem'}
Gatilhos selecionados: ${triggers.length ? triggers.join(', ') : 'padrão'}

Crie 5 scripts de venda para TikTok Shop. O foco é vender de forma natural, persuasiva e humana.
Se o produto permitir, mencione também oportunidade de revenda.
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
      return res.status(400).json({ error: 'A imagem do produto é obrigatória.' });
    }

    try {
      const result = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: image },
            {
              text:
                'Identifique o nome deste produto de forma curta e direta, com no máximo 5 palavras. Retorne apenas JSON.',
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
  const videoLength = cleanText(req.body?.videoLength, 20) || '35s';
  const hookStyle = cleanText(req.body?.hookStyle, 40) || 'espontaneo';
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
        systemInstruction: buildSystemInstruction(triggers, gender, videoLength, hookStyle),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scripts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: {
                    type: Type.STRING,
                    description: 'Roteiro completo de venda, pronto para copiar e gravar.',
                  },
                  hooks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exatamente 3 ganchos alternativos curtos para o roteiro.',
                  },
                },
                required: ['text', 'hooks'],
              },
              description: 'Lista com 5 roteiros de venda e seus ganchos alternativos',
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
