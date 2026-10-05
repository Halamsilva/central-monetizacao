import { GoogleGenAI, Type } from '@google/genai';
import { getActiveGeminiApiKey } from './gemini-key.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const clean = (value: unknown, maxLength = 500) =>
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

const MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

const extractText = (response: any) => {
  if (!response) return '';
  if (typeof response.text === 'string') return response.text.trim();
  const parts = response.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part: any) => (typeof part?.text === 'string' ? part.text : '')).join('\n').trim();
  }
  return '';
};

const SYSTEM_INSTRUCTION = `Você é um diretor de documentários rurais e especialista em roteiros cinematográficos ultrarrealistas gravados por smartphone comum no Brasil.
Sua missão é desenvolver scripts detalhados de exatamente 4 cenas sequenciais conectadas sobre horticultura, com foco absoluto em consistência, verossimilhança e visual documental cru para redes sociais (TikTok, Instagram Reels, YouTube Shorts).

REGRAS DE CONSISTÊNCIA OBRIGATÓRIAS:
- O personagem e o cenário selecionados devem ser idênticos nas 4 cenas, sem mudar roupas, textura, ou detalhes de cenografia.
- As plantas cultivadas devem evoluir naturalmente da primeira cena até a colheita exuberante na quarta cena (da descoberta de fartura à colheita final).
- Os prompts visuais devem estar obrigatoriamente em INGLÊS para serem lidos por ferramentas de geração de vídeo.
- As falas (narration) em português brasileiro devem soar naturais, simples, humildes e sem jargões de publicidade, vendas ou influencer de rede social. Devem durar aproximadamente 8 segundos no ritmo de fala lento e comum.
- O Som Ambiente (ambientSound) em português brasileiro descreve os sussurros reais de vento, pássaros, ferramentas e vizinhança na cena.

Você DEVE incluir as seguintes diretrizes textuais em inglês dentro de CADA 'visualPrompt' gerado para garantir o realismo:
"Ultra realistic smartphone footage, real human skin, visible pores, natural skin texture, natural facial asymmetry, natural expression lines, natural eye texture, natural lips texture, natural neck texture, natural hand texture, visible veins on hands, natural fingernails, natural blinking, natural breathing, natural body movement, natural hair strands, natural flyaway hairs, no beauty filter, no skin retouching, no AI beauty effect, no AI glamour effect, no influencer look, no CGI look, no artificial face, no plastic skin, no avatar appearance, documentary realism, ordinary smartphone camera, natural outdoor lighting, realistic shadows, natural color science, authentic gardening environment, visible dirt, visible imperfections, real gardening tools, real soil texture, natural plant movement caused by wind."

AS QUATRO CENAS QUE DEVEM SER GERADAS:
- CENA 1 — A DESCOBERTA: O personagem revela sua surpresa maravilhada ao encontrar a planta incrivelmente abundante ou produtiva em sua horta improvisada.
- CENA 2 — O SEGREDO: O personagem se abaixa e aponta/manipula a terra úmida ou substrato caseiro, revelando o elemento crucial de nutrição vegetal simples que usou.
- CENA 3 — A PRODUÇÃO: O personagem mostra a fartura e como as plantas continuam a dar flores e frutos maduros de forma generosa no mesmo espaço simples.
- CENA 4 — A COLHEITA: O personagem colhe com as próprias mãos calejadas o fruto maduro com orgulho humilde, exibindo-o próximo à lente do celular com brilho molhado natural.

Por fim, gere um módulo de SEO contendo um Título cativante e de linguagem natural do campo, uma Descrição curta para redes sociais e 5 hashtags relevantes agrupadas. Não adicione cabeçalhos, títulos markdown ou tags separando esse bloco de SEO.`;

const characterDescription = (characterType: string) => {
  if (characterType === 'homem-rural') {
    return 'Homem rural de aproximadamente cinquenta anos, de pele morena naturalmente bronzeada e envelhecida pelo sol brasileiro, poros extremamente visíveis, pequenas rugas de expressão ao redor dos olhos, barba curta e grisalha um pouco irregular, cabelo curto e grisalho. Usa uma camiseta de algodão simples, levemente desbotada e bermuda de trabalho comum. Humilde, calmo e acolhedor.';
  }
  if (characterType === 'senhora-balcao') {
    return 'Senhora de aproximadamente sessenta e cinco anos, pele clara com marcas naturais de quem lida com plantas e sol, óculos de grau simples apoiados no nariz, cabelo preso em um coque com fios brancos e rebeldes soltos. Veste um avental de tecido florido com pequenos bolsos úteis sobre uma blusa de algodão simples. Tem um sorriso terno, voz serena e movimentos calmos.';
  }
  if (characterType === 'jovem-urbano') {
    return 'Jovem de cerca de trinta anos, pele negra com brilho natural de suor leve do trabalho físico, cabelo crespo curto, barba rala bem aparada. Usa uma regata escura comum e um par de luvas de pano simples de jardinagem penduradas na bermuda. Expressão muito entusiasmada, porém real e pé no chão, de quem faz horta experimental no teto ou sacada.';
  }
  return characterType || 'Homem de meia-idade comum e simples, trabalhador brasileiro autêntico, roupas de trabalho gastas, pele texturizada e suja com terra de horta real.';
};

const settingDescription = (settingType: string) => {
  if (settingType === 'quintal-simples') {
    return 'Quintal simples de fundos de casa de periferia brasileira ou interior. Possui parede de blocos de cimento aparentes (tijolo cinza), chão de terra batida úmida, pedaços de mangueira velha enrolados no canto, caixas plásticas de feira e baldes de construção reutilizados como vasos de plantio. Algumas ferramentas de jardim desgastadas pelo tempo ao fundo.';
  }
  if (settingType === 'horta') {
    return 'Horta orgânica de quintal ou horta comunitária abundante e muito verde. Possui canteiros elevados horizontais estruturados com madeira de demolição rústica ou troncos, com solo fofo e preto extremamente úmido e rico em adubo orgânico. Fileiras organizadas de alfaces viçosas crescendo, pés pequenos de tomate apoiados em estacas de bambu, temperos variados e uma cerca simples de ripas de bambu entrelaçadas ao fundo sob iluminação solar natural suave e difusa.';
  }
  if (settingType === 'roca') {
    return 'Cenário de roça tradicional no interior do Brasil, campo aberto de lavoura familiar. Solo de terra roxa fértil e úmida, grandes fileiras de mandioca, milho alto ou feijão plantados diretamente na terra. Chão plano de terra batida e poeira rústica de roça, cercas simples de arame farpado com estacas de madeira rústica e um horizonte limpo com céu azul claro sob sol radiante de fim de tarde.';
  }
  if (settingType === 'apartamento-sacada') {
    return 'Sacada estreita de um apartamento simples com parede com pintura áspera desgastada. Vasos improvisados com garrafas PET de dois litros recortadas e baldes de plástico coloridos pendurados por fios de arame simples, formando uma horta vertical de aproveitamento máximo de espaço. É possível ver ao fundo fiação elétrica de rua e telhados vizinhos sob a luz solar natural.';
  }
  if (settingType === 'laje-cobertura') {
    return 'Laje simples ou cobertura com piso rústico de cimento queimado gasto e paredes de reboco sem pintura ao fundo. O plantio é feito em caixas de madeira de feira forradas com plástico preto e baldes grandes de tinta limpos cheios de terra preta molhada. Caixas de isopor antigas servem como berçário de mudas ao fundo sob sol forte direto do início da tarde.';
  }
  return settingType || 'Horta doméstica com vasos simples improvisados de plástico no quintal sob iluminação natural.';
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

  const theme = clean(req.body?.theme, 300);
  const characterType = clean(req.body?.characterType, 80);
  const settingType = clean(req.body?.settingType, 80);
  const avatarImage = typeof req.body?.avatarImage === 'string' ? req.body.avatarImage : '';

  if (!theme) {
    return res.status(400).json({ error: 'O tema e obrigatorio.' });
  }

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  let contentsPayload: any[] = [];

  if (avatarImage) {
    let mimeType = 'image/jpeg';
    let base64Data = avatarImage;
    if (avatarImage.startsWith('data:')) {
      const parts = avatarImage.split(';base64,');
      mimeType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1] || '';
    }
    contentsPayload.push({ inlineData: { mimeType, data: base64Data } });
  }

  const instructionsPrompt = `Crie o roteiro detalhado para o seguinte tema: "${theme}". 
${avatarImage ? "Como entrada (input), foi enviada uma imagem do rosto/avatar do personagem. Analise minuciosamente a aparência física, idade aproximada, etnia, expressões faciais, pele, formato do rosto, cabelo e vestuário desta foto de avatar da pessoa. Use-a como a descrição física definitiva e exclusiva de consistência para o personagem ('characterProfile') e aplique esses traços físicos em todos os prompts visuais em inglês nos campos 'visualPrompt' de cada cena de forma 100% idêntica." : `Personagem consistido: ${characterDescription(characterType)}`}
Cenário de fundo consistido: ${settingDescription(settingType)}

Gere exatamente 4 cenas conectadas (A Descoberta, O Segredo, A Produção, A Colheita) respeitando os termos técnicos em inglês e a voz simples e real no áudio brasileiro de aproximadamente 8 segundos. No final, gere o campo 'seo' limpo sem cabeçalhos ou destaques markdown.`;

  contentsPayload.push({ text: instructionsPrompt });

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  let lastError: any = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contentsPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.85,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING, description: 'O tema de cultivo' },
              characterProfile: { type: Type.STRING, description: 'Perfil descritivo e estável do personagem principal em português' },
              scenographyDescription: { type: Type.STRING, description: 'Configuração cênico-espacial estável do local em português' },
              scenes: {
                type: Type.ARRAY,
                description: 'Lista de exatamente 4 cenas coerentes e cronológicas',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Título padrão da cena (ex: CENA 1 — A DESCOBERTA)' },
                    visualPrompt: { type: Type.STRING, description: 'Prompt cinematográfico detalhado em inglês contendo os termos do padrão visual obrigatório' },
                    narration: { type: Type.STRING, description: 'A fala coloquial em português, de aproximadamente 8 segundos' },
                    ambientSound: { type: Type.STRING, description: 'Som ambiente rústico e natural em português' },
                  },
                  required: ['title', 'visualPrompt', 'narration', 'ambientSound'],
                },
              },
              seo: { type: Type.STRING, description: "Texto corrido de SEO contendo Título, Descrição do vídeo e exatamente 5 hashtags separadas por espaço. IMPORTANTE: Não utilize NENHUMA marcação markdown ou títulos para separar as informações." },
            },
            required: ['theme', 'characterProfile', 'scenographyDescription', 'scenes', 'seo'],
          },
        },
      });

      const resultText = extractText(response);
      if (!resultText) {
        lastError = new Error('O modelo Gemini retornou uma resposta vazia.');
        continue;
      }

      const parsedData = JSON.parse(resultText);
      return res.status(200).json(parsedData);
    } catch (error: any) {
      lastError = error;
      console.error(`[plantacoes] modelo ${model} falhou:`, String(error?.message || error).slice(0, 400));

      const message = String(error?.message || '');
      if (message.includes('PERMISSION_DENIED') || message.includes('API key not valid')) break;
    }
  }

  console.error('Erro na geracao do script de plantacoes:', lastError);
  const message = String(lastError?.message || '');
  let friendly = 'Nao consegui gerar o roteiro agora. Tente novamente.';

  if (message.includes('PERMISSION_DENIED') || message.includes('API key not valid')) {
    friendly = 'Sua chave do Google AI Studio foi recusada. Confira a chave em Configuracoes.';
  } else if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
    friendly = 'Limite de uso da IA atingido agora. Tente novamente em alguns minutos.';
  } else if (message.includes('UNAVAILABLE') || message.includes('503') || message.includes('high demand')) {
    friendly = 'A IA esta com alta demanda agora. Tente novamente em instantes.';
  } else if (message) {
    friendly = message.slice(0, 400);
  }

  return res.status(500).json({ error: friendly, detail: message.slice(0, 600) });
}
