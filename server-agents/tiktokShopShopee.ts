import { GoogleGenAI, Type } from "@google/genai";
import { createServiceClient, isFirebaseAdminConfigured } from "../api/_firebase.js";
import { getActiveGeminiApiKey } from "./gemini-key.js";

const getAi = (apiKey: string) =>
  new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

// Helper function to retry Gemini API calls in case of temporary 503 (high demand) or 429 (rate limits)
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      
      // Determine if error is a retriable status/code or message
      const errorStr = typeof error === "string" ? error : JSON.stringify(error) || error?.message || "";
      const isUnavailable = error?.status === "UNAVAILABLE" || error?.code === 503 || error?.statusCode === 503 || errorStr.includes("503") || errorStr.includes("UNAVAILABLE") || errorStr.includes("high demand") || errorStr.includes("temporary") || errorStr.includes("overloaded");
      const isRateLimited = error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429 || error?.statusCode === 429 || errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
      
      const shouldRetry = (isUnavailable || isRateLimited) && attempt <= retries;
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Exponential backoff: delay * 2^(attempt-1) plus some randomized jitter (80% to 120%)
      const nextDelay = delay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4);
      console.warn(`[Gemini API] Call failed (Attempt ${attempt}/${retries + 1}). Retrying in ${Math.round(nextDelay)}ms... Reason: ${error?.status || "Unavailable/Rate Limited"}`);
      await new Promise((resolve) => setTimeout(resolve, nextDelay));
    }
  }
}

const handleGeneratePrompts = async (req: any, res: any) => {
  const ai = req.geminiApiKey ? getAi(String(req.geminiApiKey)) : null;
  try {
    const { platform, productName, productDescription, mainBenefit, productImage, avatarImage, videoStyle = "presenter", voiceGender = "female" } = req.body;

    // Strict validation of mandatory platform selection
    if (!platform || (platform !== "shopee" && platform !== "tiktok_shop")) {
      return res.status(400).json({
        error: "Antes de criar qualquer roteiro, você deve obrigatoriamente informar se deseja os prompts para TikTok Shop ou Shopee.",
      });
    }

    if (!productName || !productDescription) {
      return res.status(400).json({
        error: "Por favor, informe pelo menos o nome do produto e uma breve descrição.",
      });
    }

    if (!ai) {
      return res.status(500).json({
        error: "API Key do Gemini não está configurada. Defina GEMINI_API_KEY no painel de Secrets.",
      });
    }

    // Strict CTA sentence generation based on the selected platform
    const ctaRequirement =
      platform === "shopee"
        ? "Clica no link aqui nos comentários e compre o seu antes que acabe."
        : "Deixei o carrinho laranja aqui no cantinho da tela então corre e compre o seu antes que acabe.";

    // Choose visual styling description based on style selection
    const isPov = videoStyle === "pov";
    const isMale = voiceGender === "male";

    const rule2Text = isPov
      ? "2. O ESTILO DEVE SER POV (PONTO DE VISTA / PRIMEIRA PESSOA). O rosto ou o corpo do criador NUNCA deve aparecer na cena. Descreva no \"promptVisual\" apenas as mãos humanas reais em primeira pessoa de um adulto de 30 a 40 anos segurando, testando, abrindo, apontando ou manipulando o produto no cotidiano."
      : isMale
        ? "2. Não faça olhos esbugalhados. Descreva no \"promptVisual\" que o homem/apresentador (obrigatoriamente um homem adulto maduro de 30 a 45 anos, nunca jovem ou adolescente) possui olhar natural, relaxado e amigável, olhando de frente para a câmera e segurando o produto no ambiente."
        : "2. Não faça olhos esbugalhados. Descreva no \"promptVisual\" que a mulher/apresentadora (obrigatoriamente uma mulher adulta madura de 30 a 40 anos, nunca mulher jovem ou garota de 18-22 anos) possui olhar natural, relaxado e amigável, olhando de frente para a câmera e segurando o produto no ambiente.";

    const genderRuleText = isMale
      ? "GÊNERO DA VOZ DO NARRADOR: O narrador é um HOMEM brasileiro. Portanto, escreva a fala do roteiro inteiramente com flexão de gênero gramatical exclusivamente MASCULINA em português (ex: use 'atrasado', 'chocado', 'cansado', 'obrigado', 'sozinho' nas falas). Se o estilo for Apresentador Tradicional, o apresentador deve ser obrigatoriamente um homem adulto brasileiro maduro (entre 30 a 45 anos). NUNCA descreva homens jovens, garotos ou crianças."
      : "GÊNERO DA VOZ DO NARRADOR: A narradora é uma MULHER brasileira. Portanto, escreva a fala do roteiro inteiramente com flexão de gênero gramatical exclusivamente FEMININA em português (ex: use 'atrasada', 'chocada', 'cansada', 'obrigada', 'sozinha' nas falas). Se o estilo for Apresentador Tradicional, a apresentadora deve ser obrigatoriamente uma mulher adulta brasileira madura (entre 30 a 40 anos), nunca uma jovem garota ou adolescente. NUNCA descreva mulheres jovens, garotas, adolescentes ou crianças.";

    const realismBlockText = isPov
      ? "Mãos reais de uma pessoa adulta na faixa de 30 anos filmadas em primeira pessoa (POV) por smartphone comum. Pele humana adulta extremamente realista das mãos e dedos, poros visíveis, textura natural e madura da pele das mãos, pequenas marcas naturais, unhas e articulações humanas realistas sem retoques infantis ou de pele artificialmente plástica de jovem. O rosto ou corpo do apresentador NÃO aparece na cena de jeito nenhum. Zoom focado de perto no produto sendo segurando, aberto, ligado ou manipulado pelas mãos de adulto em um ambiente doméstico real. Sem filtro de beleza, sem retoque digital, sem suavização de pele, sem aparência plástica ou artificial de 3D/CGI. Movimentos manuais naturais e fluidos. Iluminação realista, caseira e natural."
      : isMale
        ? "Homem adulto e maduro (de 30 a 45 anos) real filmado por smartphone comum. Pele humana madura extremamente realista, poros visíveis, textura natural de pele masculina adulta, pequenas marcas de expressão discretas ao redor dos olhos e testa. Assimetria facial natural de homem adulto maduro, pelos faciais discretos, textura realista das mãos. Sem filtro de beleza, sem retoque digital, sem suavização de pele, sem aparência plástica, sem efeito de inteligência artificial de filtros jovens, sem aparência de avatar artificial ou de rapaz adolescente. Microexpressões naturais de adulto, movimentos corporais reais, piscadas naturais, respiração natural. Iluminação realista e caseira."
        : "Mulher adulta e madura (de 30 a 40 anos) real filmada por smartphone comum. Pele humana madura extremamente realista, poros visíveis, textura natural de pele feminina adulta, pequenas marcas de expressão discretas ao redor dos olhos e testa. Assimetria facial natural de mulher adulta madura, textura realista das mãos de adulta. Sem filtro de beleza, sem retoque digital, sem suavização de pele, sem aparência plástica, sem efeito de inteligência artificial de filtros de jovem/adolescente, sem aparência de avatar artificial. Microexpressões naturais de adulta, de modo sensato e amigável, movimentos corporais reais, piscadas naturais, respiração natural. Iluminação realista e caseira.";

    const systemInstruction = `Você é um especialista em criação de vídeos UGC (User Generated Content) virais para TikTok Shop e Shopee. Sua função é criar vídeos UGC extremamente naturais, persuasivos e virais para produtos físicos.
Você trabalha gerando scripts detalhados em 4 cenas sequenciais que contam uma única história de forma natural, realista e espontânea.

REGRAS CRÍTICAS QUE DEVE SEGUIR À RISCA:
1. Deve criar exatamente 4 prompts completos (número 1 a 4).
${rule2Text}
3. ${genderRuleText}
4. Cada prompt representa uma cena de aproximadamente 8 segundos.
5. As 4 cenas devem se conectar naturalmente como uma única história espontânea (descoberta espontânea do criador).
6. O vídeo NÃO pode parecer anúncio comercial de TV. Deve parecer uma fofoca, um desabafo ou uma recomendação espontânea feita pelo criador em casa.
7. Utilizar de forma invisível gatilhos de curiosidade, identificação, descoberta, prova social, exclusividade, transformação, desejo e urgência.
8. O produto deve aparecer de forma orgânica.
9. A fala deve soar extremamente coloquial, como conversa de WhatsApp ou gravação de stories rápido para amigos (ex: "Gente, ${isMale ? "chocado" : "chocada"}", "Olha isso", "Do nada", "Sério").
10. Não usar jargões comerciais de vendedor (como "Adquira já", "Melhor do mercado", "Garantia", etc.).
11. NUNCA utilize emojis ou listas de tópicos dentro das falas ou descrições. O formato final deve ser fluido e natural.
12. O campo "promptVisual" deve ser detalhado e incorporar INTEGRALMENTE o BLOCO OBRIGATÓRIO DE REALISMO em todas as 4 cenas.
13. O campo "promptVisual" deve seguir à risca o GUIA DE MOVIMENTOS E FÍSICA ESTÁVEL abaixo para garantir que ferramentas de geração de vídeo por IA (Sora, Runway, Luma Dream Machine, Kling, Pika, etc.) ou atores reais produzam os takes perfeitamente, sem anomalias visuais/glitches (membros extras, objetos flutuando ou mudando de formato).
14. REQUISITO CRÍTICO DE DURAÇÃO (MÁXIMO 8 SEGUNDOS POR FALA): A fala ("fala") de cada uma das 4 cenas nunca deve passar de 8 segundos se falada de forma pausada e natural. Por isso, restrinja rigorosamente as falas de cada cena a no máximo 20 a 25 palavras (aproximadamente 120 a 150 caracteres). Seja extremamente conciso, direto e natural. Garanta que a fala final da cena 4 (que deve conter e terminar exatamente com a frase da CTA obrigatória) também obedeça a este limite estrito.
15. REQUISITO ABSOLUTO DE IDADE SEMPRE ADULTO (VETO A JOVENS E CRIANÇAS): É expressamente proibido que a mulher, homem ou criador descrito no promptVisual seja um bebê, criança, adolescente, jovem ou jovem adulto (como meninas ou garotas na faixa dos 18-22 anos). O personagem deve ser sempre descrito como uma pessoa adulta madura (mulher de 30-40 anos ou homem de 30-45 anos) com feições naturais e maduras. Nunca utilize palavras como "jovem", "menina", "garota", "novinha", "teen", "criança", "boy" ou "girl" na descrição visual. Use termos formais e estáveis de adulto maduro.

GUIA DE MOVIMENTOS E FÍSICA ESTÁVEL (Aplica-se a todas as descrições em "promptVisual"):
- Movimento de Câmera Estabilizado: Descreva movimentos de câmera extremamente lentos, fluidos e constantes. Use exclusivamente termos como "slow zoom-in (aproximação muito lenta)", "câmera estática em tripé focalizada de perto", "lento deslizamento lateral (slow pan)", "câmera parada gravando em macro close-up". Nunca use movimentos rápidos, tremidos, ou cortes abruptos de imagem dentro de uma mesma cena.
- Interação Mecânica e Anatômica Precisa: Detalhe as ações manuais com clareza matemática para evitar dedos duplicados ou mãos borradas. Descreva passos graduais: "mão humana realista de cinco dedos bem definidos segura o produto firmemente", "o dedo indicador direito pressiona de forma lenta e realista o botão físico redondo", "duas mãos seguram o produto de forma estável na altura do peito de forma contínua", "os dedos da mão direita giram progressivamente a tampa rosqueável".
- Ancoragem Física de Alta Coesão: Descreva o produto sempre apoiado em uma base do mundo real para evitar que ele flutue misteriosamente ou pareça deformado: "o produto está apoiado de forma estável sobre uma mesa rústica de madeira texturizada", "produto posicionado em cima de uma bancada de banheiro perfeitamente seca", "pote repousando estaticamente sobre uma bancada sólida de mármore branco".
- Coerência Temporal de Ação Única: Descreva apenas uma atividade cinética simples e contínua em cada cena de 8s (ex: apenas 'girando suavemente o frasco para mostrar os ingredientes' ou apenas 'derramando lentamente duas gotas do produto nas costas da mão'). Não misture ações múltiplas ou transições que causem confusão no modelo de vídeo.

IMAGENS DISPONIBILIZADAS PELO USUÁRIO (Preste extrema atenção às imagens anexas na chamada multimodal):
- Se houver uma imagem do PRODUTO anexada: estude a imagem com precisão (sua cor, textura, detalhes de design, material, formato, marca, bico, tampas ou botões) e descreva o produto de maneira consistente com essa aparência visual no "promptVisual" em todas as cenas para que caiba no contexto do mundo real de forma idêntica!
${isPov 
  ? "- Se houver uma imagem do AVATAR/APRESENTADOR anexada: use essa imagem como base apenas para a cor da pele e características das MÃOS (tom de pele, acessórios como anéis ou relógios) que aparecem manipulando o produto, pois o rosto não deve aparecer!"
  : "- Se houver uma imagem do AVATAR/APRESENTADOR anexada: estude a fisionomia do criador (gênero, tom de pele, feição, cabelo, barba, óculos, estilo de roupas ou acessórios adicionais) e use essas características exatas do criador/apresentador na descrição física dentro do \"promptVisual\" de cada cena para manter a coesão absoluta do personagem! Garanta que ele continue com aspecto de pessoa adulta."
}

BLOCO OBRIGATÓRIO DE REALISMO (Incorpore fielmente e de forma adaptada a cada cena no "promptVisual"):
"${realismBlockText}"

ESTRUTURA DAS CENAS:
- CENA 1: Curiosidade extrema. Abertura muito forte para reter público. Faz o espectador querer assistir até o fim. Não revela o produto por inteiro de imediato. A fala gera identificação direta. (8s)
- CENA 2: Mostrar o produto em uso de forma banal e cotidiana. Demonstra o benefício principal de forma espontânea e natural como se descobrisse agora. (8s)
- CENA 3: Mostra detalhe chamativo que aumenta o desejo. Prova social sutil incorporada (ex: "Minha prima viu e já quis pegar para ela"). (8s)
- CENA 4: CTA obrigatória com urgência. A fala final desta cena 4 deve terminar EXACTAMENTE com a CTA da plataforma: "${ctaRequirement}". (8s)`;

    let promptText = `Crie o roteiro UGC de 4 cenas para o seguinte produto:
Nome do Produto: ${productName}
Estilo do Vídeo: ${isPov ? "POV (Ponto de Vista - Somente mãos do criador e o produto, o rosto não aparece)" : "Apresentador Tradicional (Mostra o rosto do criador)"}
Voz do Narrador: ${isMale ? "Homem (Voz Masculina brasileira)" : "Mulher (Voz Feminina brasileira)"}
Descrição detalhada: ${productDescription}
Benefício principal a focar: ${mainBenefit || "Praticidade e transformação rápida"}
Plataforma de destino: ${platform === "shopee" ? "Shopee" : "TikTok Shop"}

INFORMAÇÕES DE MULTIMÍDIA FORNECIDAS:`;

    if (productImage && productImage.data) {
      promptText += `\n- DETALHES VISUAIS DO PRODUTO: Uma foto real do produto físico foi enviada nesta chamada multimodal. Analise minuciosamente suas cores exatas, formato tridimensional, marcas, material (plástico, metal, vidro), tampas, bicos, botões ou relevos, e de forma obrigatória incorpore esses detalhes físicos exatos em cada "promptVisual" de todas as cenas para que o produto pareça realista e correspondente com a realidade.`;
    } else {
      promptText += `\n- Nenhuma imagem de produto foi fornecida. Use a sua criatividade realista para descrevê-lo baseando-se no nome e descrição de forma natural.`;
    }

    if (avatarImage && avatarImage.data) {
      promptText += isPov
        ? `\n- DETALHES DO CRIADOR (POV): Uma foto real do criador foi enviada. Use apenas para o tom de pele e visual das mãos que manipulam o produto.`
        : `\n- DETALHES FISIOLÓGICOS E ESTILO DO APRESENTADOR: Uma foto real do apresentador foi enviada nesta chamada multimodal. Analise com precisão a anatomia facial, gênero, tom de pele, cor e estilo do cabelo, barba, uso de óculos, roupas, joias, acessórios ou marcas de expressão, e use essas exatas características do criador físico em cada parte descritiva de "promptVisual" de todas as cenas para manter a coesão absoluta e inabalável do personagem em todo o vídeo.`;
    } else {
      promptText += `\n- Nenhuma imagem de apresentador foi fornecida.`;
    }

    promptText += `\n\nLembre-se de retornar exatamente as 4 cenas no formato estruturado JSON. Assegure que a cena 4 termine exatamente com a fala obrigatória: "${ctaRequirement}". Sem emojis e sem listas em nenhuma fala.`;

    // Package contents for the GoogleGenAI request
    const contentParts: any[] = [];
    
    // Append product image if available
    if (productImage && productImage.data && productImage.mimeType) {
      contentParts.push({
        inlineData: {
          data: productImage.data,
          mimeType: productImage.mimeType,
        },
      });
    }

    // Append avatar image if available
    if (avatarImage && avatarImage.data && avatarImage.mimeType) {
      contentParts.push({
        inlineData: {
          data: avatarImage.data,
          mimeType: avatarImage.mimeType,
        },
      });
    }

    // Append text prompt last
    contentParts.push({
      text: promptText,
    });

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts: contentParts },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Lista ordenada de exatamente 4 cenas de roteiro UGC",
            items: {
              type: Type.OBJECT,
              properties: {
                numero: {
                  type: Type.INTEGER,
                  description: "Número da cena (1, 2, 3 ou 4)",
                },
                titulo: {
                  type: Type.STRING,
                  description: "Título da cena",
                },
                objetivoPsicologico: {
                  type: Type.STRING,
                  description: "Objetivo Psicológico e gatilhos mentais aplicados",
                },
                promptVisual: {
                  type: Type.STRING,
                  description: "Prompt visual detalhado contendo a cena física adaptada e incluindo de forma adaptada o bloco de realismo humano.",
                },
                fala: {
                  type: Type.STRING,
                  description: "O texto falado de forma coloquial e natural, sem emojis ou listas.",
                },
                somAmbiente: {
                  type: Type.STRING,
                  description: "Efeitos sonoros ou sonoridade natural ao fundo (ex: som sutil de plástico, vento na janela, barulho de embalagem)",
                },
              },
              required: ["numero", "titulo", "objetivoPsicologico", "promptVisual", "fala", "somAmbiente"],
            },
          },
        },
      })
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta vazia gerada pelo modelo.");
    }

    const cleanJson = JSON.parse(responseText.trim());
    res.json({
      success: true,
      platform,
      ctaUsed: ctaRequirement,
      scenes: cleanJson,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/generate-prompts:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro desconhecido ao gerar roteiro.",
    });
  }
};

// API endpoint to analyze a product image via Vision multimodal API
const handleAnalyzeProduct = async (req: any, res: any) => {
  const ai = req.geminiApiKey ? getAi(String(req.geminiApiKey)) : null;
  try {
    const { productImage } = req.body;

    if (!productImage || !productImage.data || !productImage.mimeType) {
      return res.status(400).json({
        error: "Por favor, envie primeiro uma imagem válida do produto físico para analisar.",
      });
    }

    if (!ai) {
      return res.status(500).json({
        error: "API Key do Gemini não está configurada. Defina GEMINI_API_KEY no painel de Secrets.",
      });
    }

    const systemInstructionAnalyze = `Você é um analista especialista em e-commerce, dropshipping e marketplaces como Shopee ou TikTok Shop.
Sua função é identificar com exatidão o produto físico contido na imagem multimodal.
Retorne um objeto JSON contendo:
- productName: O nome comercial persuasivo e real do produto.
- productDescription: Uma descrição detalhada (2 ou 3 linhas) explicando como funciona, suas principais características visíveis e utilidade diária.
- mainBenefit: O benefício chave ou dor transformadora que ele resolve de forma extremamente vendável e focado em praticidade.

ATENÇÃO: Não use jargões chatos ou formais demais, use português coloquial e atraente.`;

    const contentParts: any[] = [
      {
        inlineData: {
          data: productImage.data,
          mimeType: productImage.mimeType,
        },
      },
      {
        text: "Analise esta foto de produto físico de e-commerce e preencha os dados estruturados do produto no formato JSON solicitado.",
      },
    ];

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts: contentParts },
        config: {
          systemInstruction: systemInstructionAnalyze,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: {
                type: Type.STRING,
                description: "Nome comercial atraente para o produto encontrado na foto.",
              },
              productDescription: {
                type: Type.STRING,
                description: "Descrição intuitiva de como o produto funciona de verdade.",
              },
              mainBenefit: {
                type: Type.STRING,
                description: "O maior apelo ou dor resolvida por ele de forma simples.",
              },
            },
            required: ["productName", "productDescription", "mainBenefit"],
          },
        },
      })
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Não foi possível obter descrição para esse produto.");
    }

    const cleanJson = JSON.parse(responseText.trim());
    res.json({
      success: true,
      productName: cleanJson.productName,
      productDescription: cleanJson.productDescription,
      mainBenefit: cleanJson.mainBenefit,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/analyze-product:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro desconhecido ao analisar imagem do produto.",
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

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  req.geminiApiKey = apiKey;

  const action = req.body?.action || 'generate-prompts';

  if (action === 'analyze-product') return handleAnalyzeProduct(req, res);
  return handleGeneratePrompts(req, res);
}
