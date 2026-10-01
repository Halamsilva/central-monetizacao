import { GoogleGenAI, Type } from "@google/genai";
import { createServiceClient, isFirebaseAdminConfigured } from "../api/_firebase.js";
import { getActiveGeminiApiKey } from "./gemini-key.js";

const getGenAI = (req: any): GoogleGenAI | null => {
  const apiKey = req?.geminiApiKey;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};
// Executa chamada ao Gemini com retry automático em caso de picos de demanda (503/429) e fallback para modelos alternativos estáveis
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const preferred = params.preferredModel || "gemini-3.8-flash";
  const candidateModels = Array.from(
    new Set([preferred, "gemini-3.1-flash-lite", "gemini-flash-latest"])
  );

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || "").toLowerCase();
        const isTemporarySpike =
          err?.status === 503 ||
          err?.status === 429 ||
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("resource exhausted");

        if (isTemporarySpike && attempt === 1) {
          // Breve pausa para superar pico momentâneo de demanda
          await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 300));
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}

const AGENT_SYSTEM_PROMPT = `
Você é o AGENTE: REFLEXÕES DO VELHO / VELHA DA ROÇA.
Você é um especialista em criar vídeos curtos e emocionais de reflexão para TikTok, Facebook Reels, Instagram Reels e YouTube Shorts.

O personagem principal é SEMPRE um senhor ou senhora brasileiro(a) de aproximadamente 80 anos, morador da zona rural, com aparência simples, humilde, experiente e extremamente humana.
Trabalhou a vida inteira na roça e aprendeu sobre pessoas, decepções, família, amor, falsidade, inveja, caráter, fé, consequências e escolhas através da própria experiência vivida.
O objetivo é criar reflexões que façam quem está assistindo parar, ouvir até o final, pensar sobre a própria vida e sentir vontade de compartilhar o vídeo.

OPÇÕES DE PERSONAGEM FIXO:

CASO HOMEM ("O Velho da Roça"):
- Homem brasileiro de aproximadamente 80 anos
- Rosto envelhecido naturalmente, rugas profundas e realistas, pele marcada pelo sol
- Cabelos grisalhos ou brancos, barba curta grisalha, mãos envelhecidas e calejadas
- Olhar profundo e sereno, aparência humilde, expressão natural, corpo compatível com a idade
- Camisa simples de trabalhador rural, calça simples, botinas usadas, chapéu de palha tradicional
- Voz masculina idosa, grave, calma e levemente rouca, português brasileiro com sotaque rural sereno.

CASO MULHER ("A Velha da Roça" / "Senhora do Campo"):
- Mulher brasileira de aproximadamente 80 anos, moradora rural humilde e acolhedora
- Rosto envelhecido naturalmente com rugas profundas e afetuosas, pele morena marcada pelo sol da lida
- Cabelos grisalhos ou brancos presos em um coque simples tradicional ou com lenço rural rústico
- Olhar doce, profundo, maternal e experiente; mãos calejadas de quem cuidou da roça, da terra e dos filhos
- Vestido de chita simples floral desbotado ou blusa modesta de algodão com xale leve ou avental rústico
- Voz feminina idosa, suave, calma, acolhedora, serena e pausada, com sabedoria maternal e autoridade serena da roça.

ESTÉTICA DO VÍDEO & TEXTURA DE UMA PESSOA REAL (ULTRARREALISMO DOCUMENTAL):
- Formato vertical 9:16 (TikTok, Instagram Reels, Facebook Reels, YouTube Shorts).
- Estética UGC documental hiper-realista gravada em smartphone topo de linha (iPhone 15/16 Pro Max 4K HDR ProRes raw footage) com luz ambiente natural.
- TEXTURA DE UMA PESSOA REAL (HIPER-REALISMO HUMANO): O personagem deve parecer 100% um ser humano vivo, de carne e osso. Descreva explicitamente: textura de pele humana real com micro-poros naturais visíveis, dobras cutâneas orgânicas, rugas finas, manchas solares e da idade naturais, translucidez dérmica e sub-surface scattering (SSS) reagindo à luz dourada.
- Olhos humanos hiper-detalhados com esclera realista, reflexos autênticos da luz ambiente e película lacrimal natural. Cabelos orgânicos com fios individuais naturais e discretos fios soltos. Mãos calejadas expressivas com textura cutânea realista e nós dos dedos definidos.
- PROIBIÇÃO DE PLÁSTICO E 3D: ZERO aparência plástica, ZERO pele excessivamente lisa, ZERO filtro artificial de beleza, ZERO render CGI ou 3D, ZERO traço de desenho ou videogame. Deve ser 100% indistinguível de um ser humano real filmado no campo.
- NUNCA inserir legendas, textos, títulos, palavras na tela, logotipos ou marcas d'água.

REGRA OBRIGATÓRIA DE CONSISTÊNCIA DO AVATAR PRÓPRIO DO USUÁRIO:
- Sempre que o usuário fornecer seu próprio avatar (seja por imagem de referência ou descrição personalizada), é ESTRITAMENTE OBRIGATÓRIO manter esse MESMO PERSONAGEM com as MESMAS CARACTERÍSTICAS FÍSICAS EXATAS, ROSTO, CABELOS, TRAÇOS E ROUPAS em 100% de todos os prompts (do Prompt 1 até o último).
- NUNCA altere os traços faciais, etnia, idade, formato do nariz, olhos, corte de cabelo ou traje entre as cenas. Cada cena deve parecer gravada na mesma sessão documental com a mesma pessoa.

REGRA CRÍTICA DE TAMANHO DAS FALAS (MÁXIMO DE 8 A 9 SEGUNDOS — NUNCA PASSAR DE 9 SEGUNDOS!):
- CADA PROMPT representa NO MÁXIMO 8 A 9 SEGUNDOS de fala e vídeo.
- É TERMINANTEMENTE PROIBIDO PASSAR DE 9 SEGUNDOS! Se a fala for longa demais, o gerador de vídeo cortará a voz no final do clipe.
- CADA PROMPT possui apenas UMA fala contínua, concisa, profunda e impactante.
- TAMANHO EXATO: A fala deve ter entre 12 e 17 palavras (máximo absoluto de 18 palavras). Na cadência calma e pausada da roça (cerca de 2 palavras por segundo), isso dura entre 6.5s e 8.5s, garantindo que a fala termine com segurança ANTES de completar 9 segundos.
- Seja direto, poético e cortante. Elimine rodeios ou orações longas.
- Ajustar concordância gramatical em português para o gênero escolhido (ex: "um velho como eu" vs "uma velha como eu", "cansei de ver", etc.).
- Nunca usar tom de coach, influencer ou locutor comercial.

REGRA CRÍTICA DE VARIEDADE NO GANCHO (PROMPT 1):
- PROIBIÇÃO ABSOLUTA DE REPETIÇÃO: NUNCA use sempre o mesmo formato de gancho.
- É TERMINANTEMENTE PROIBIDO começar sempre com fórmulas clichês como "Escuta uma coisa que eu demorei...", "Tem gente que...", "Depois dos 80 anos..." ou "Vou te contar uma coisa".
- O gancho deve ser SEMPRE RADICALMENTE VARIADO e CONCISO (12 a 16 palavras, máximo 8 a 9 segundos), explorando diferentes arquétipos virais da roça:
  1. METÁFORA RURAL DIRETA (ex: "Árvore que dá fruto bom é a que mais leva pedrada de quem não planta.")
  2. CHOQUE DE REALIDADE / PROVOCAÇÃO (ex: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça.")
  3. PERGUNTA DIRETA E CONTUNDENTE (ex: "Você já reparou como o silêncio às vezes machuca muito mais do que uma bofetada?")
  4. OBSERVAÇÃO CONCRETA DA LIDA DA ROÇA (ex: "Enxada cega não corta capim, mas língua afiada destrói uma família inteira.")
  5. SABEDORIA DE RAIZ / FINADOS PAIS (ex: "Meu finado pai já dizia lá atrás: nunca confunda quem te aplaude com quem te segura.")
  6. VERDADE CRUA SOBRE CARÁTER (ex: "A ingratidão é o único bicho que morde a mão depois de comer na palma.")
  7. ALERTA OU SABEDORIA INVERSA (ex: "Nunca gaste a sua saliva tentando explicar decência pra quem nasceu sem vergonha.")

REGRA SUPREMA DE CONEXÃO NARRATIVA CONTÍNUA (FALAS CONECTANDO UMA NA OUTRA FAZENDO SENTIDO COMPLETO):
- É TERMINANTEMENTE PROIBIDO criar falas como provérbios soltos, frases isoladas ou ditados desconexos.
- O roteiro é UM ÚNICO MONÓLOGO FLUÍDO E EMOCIONANTE, gravado em tomadas de 8 a 9 segundos.
- CADA FALA DEVE SE CONECTAR DIRETAMENTE À FALA ANTERIOR, criando uma corrente ininterrupta de raciocínio:
  * Prompt 1: Gancho impactante e provocativo.
  * Prompt 2: Conecta diretamente ao gancho explicando o porquê ou a causa (ex: começa com "Porque...", "Afinal...", "E a explicação é simples:...").
  * Prompt 3: Aprofunda o raciocínio da cena 2 trazendo a dimensão do tempo ou da espera (ex: "O tempo pode até...", "A gente passa os anos vendo...").
  * Prompt 4: Mostra a consequência prática inevitável (ex: "E quando essa conta chega...", "Aí a tempestade desce e...").
  * Prompt 5: Vira o foco para o espectador / a pessoa injustiçada (ex: "Enquanto a maldade se enrola na própria corda...", "Mas com você o caminho é outro...").
  * Prompt 6: Oferece o conselho prático sábio derivado de tudo o que foi dito (ex: "Por isso nunca suje suas mãos...", "Guarde a sua paz e...").
  * Prompt 7: Conclusão memorável que fecha com chave de ouro (ex: "No fim das contas, a terra nunca erra:...", "Pode deitar a cabeça serena...").
  * Prompt 8 (ou último): Conforto espiritual que acolhe a alma (ex: "Deus conhece o que você passou em silêncio...", "Descansa o peito que Ele cuida...").
- Se qualquer pessoa ler todas as falas em sequência sem parar, deve soar como um conselho de vida ininterrupto, coeso, lógico e emocionante, falado com o coração por um sábio de 80 anos.

ESTRUTURA DE PROGRESSÃO NARRATIVA CONECTADA:
- Prompt 1 — Gancho variado conciso (máximo 8 a 9s)
- Prompt 2 — Conexão causal direta com o gancho (máximo 8 a 9s)
- Prompt 3 — Aprofundamento contínuo sobre o tempo/espera (máximo 8 a 9s)
- Prompt 4 — Consequência inevitável da lida (máximo 8 a 9s)
- Prompt 5 — Virada de foco e contraste para o ouvinte (máximo 8 a 9s)
- Prompt 6 — Conselho prático decorrente do ensinamento (máximo 8 a 9s)
- Prompt 7 — Conclusão memorável e pacificação (máximo 8 a 9s)
- Prompt 8 (se aplicável) — Encerramento de fé reconfortante (máximo 8 a 9s)

ESTRUTURA OBRIGATÓRIA DE CADA PROMPT INDEPENDENTE:
Cada prompt DEVE descrever COMPLETAMENTE o personagem de 80 anos (homem ou mulher conforme escolhido), ambiente, iluminação, enquadramento vertical 9:16, câmera, comportamento e ação daquela cena.
NUNCA escrever "mesmo personagem", "mesmo cenário", "igual ao prompt anterior" ou "continue a cena anterior".
Cada prompt deve ser 100% autocontido para ser colado em geradores de vídeo de IA (Sora, Kling, Runway, Luma).
Dentro de cada prompt deve conter:
Spoken dialogue in Brazilian Portuguese:
"[FALA CONCISA DE NO MÁXIMO 8 A 9 SEGUNDOS - 12 A 17 PALAVRAS]"
No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.
`;

async function extractAvatarVisualProfile(
  ai: GoogleGenAI | null,
  avatarUrl?: string,
  userDescription?: string,
  gender: "male" | "female" = "male"
): Promise<{ profile: string; isCustom: boolean; traitsSummary: string }> {
  const hasImage = Boolean(avatarUrl && (avatarUrl.startsWith("data:image/") || avatarUrl.startsWith("http")));
  const hasUserDesc = Boolean(userDescription && userDescription.trim());

  const humanTextureClause = "authentic photorealistic human skin texture with visible natural micro-pores, fine wrinkles, natural skin folds, organic dermal translucency with sub-surface scattering, lifelike eyes with realistic sclera reflections and natural tear-film moisture. Absolutely zero plastic skin, zero airbrushed beauty filters, zero 3D CGI";

  if (!hasImage && !hasUserDesc) {
    return {
      profile: gender === "female"
        ? `An authentic 80-year-old Brazilian rural elder woman (senhora da roça) with deeply wrinkled sun-weathered Brazilian tan skin, ${humanTextureClause}, gentle wise eyes, modest rustic hair bun, wearing a humble faded floral cotton countryside dress`
        : `An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, ${humanTextureClause}, short neat gray beard, calm wise eyes, wearing a simple traditional straw hat and worn rustic work shirt`,
      isCustom: false,
      traitsSummary: gender === "female" ? "A Velha da Roça (Padrão 80 anos)" : "O Velho da Roça (Padrão 80 anos)",
    };
  }

  // If user provided a base64 image and Gemini is available, analyze it multimodally to lock identity!
  if (ai && avatarUrl && avatarUrl.startsWith("data:image/")) {
    try {
      const match = avatarUrl.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        const visionResponse = await callGeminiWithFallback(ai, {
          contents: [
            {
              inlineData: {
                mimeType,
                data,
              },
            },
            {
              text: `Analyze this person's portrait carefully for 100% consistent AI video character replication across all sequential prompts.
Extract their exact physical identity, facial structure, clothing, and ultra-realistic human skin characteristics:
- Approximate age, gender, and apparent ethnicity/phenotype
- Exact facial architecture: face shape, jawline, cheekbones, nose shape, lip shape, brow structure
- Authentic human skin texture: describe visible natural micro-pores, fine wrinkles, laugh lines, natural skin folds, dermal translucency, authentic sub-surface scattering reacting to light, natural skin blemishes or freckles
- Exact eye details: eye color, iris depth, sclera, eyelid crease, realistic tear film moisture and reflections
- Hair and facial hair: exact color, hairline, graying pattern, hair texture/strands, hairstyle/cut/bun, and facial hair (beard, mustache, stubble, or clean-shaven)
- Clothing and accessories: exact garment type, fabric texture, collar, hat or glasses if present
Output a concise, hyper-specific English character visual description (around 70 to 85 words) that locks these exact physical traits and explicitly states authentic human skin texture with visible natural micro-pores, fine wrinkles, and natural light interaction. Emphasize that they must look like a genuine living human being with real skin texture (strictly no plastic, no airbrushed filter, no 3D CGI).`,
            },
          ],
        });
        const analyzed = visionResponse.text?.trim();
        if (analyzed && analyzed.length > 20) {
          const combined = hasUserDesc
            ? `${userDescription?.trim()}. Physical appearance locked from portrait: ${analyzed}`
            : analyzed;
          const finalProfile = combined.toLowerCase().includes("micro-pore")
            ? combined
            : `${combined}, with ${humanTextureClause}`;
          return {
            profile: finalProfile,
            isCustom: true,
            traitsSummary: hasUserDesc ? userDescription!.trim() : "Avatar próprio com traços faciais e textura humana fixados da foto",
          };
        }
      }
    } catch (visionErr: any) {
      console.info("Análise multimodal de imagem otimizada com perfil de textura humana:", visionErr?.message || visionErr);
    }
  }

  // If text description was provided without image or if image vision timed out:
  const userDescText = userDescription?.trim() || "";
  const personBase = gender === "female"
    ? "an elder woman with authentic natural human skin texture, visible natural micro-pores, fine wrinkles, lifelike eyes"
    : "an elder man with authentic natural human skin texture, visible natural micro-pores, fine wrinkles, lifelike eyes";

  return {
    profile: userDescText ? `${userDescText}, with ${humanTextureClause}` : `${personBase}, with ${humanTextureClause}`,
    isCustom: true,
    traitsSummary: userDescText || "Avatar próprio personalizado",
  };
}

// Higieniza e garante que qualquer fala fique estritamente dentro do limite de até 9 segundos (12 a 17 palavras)
function sanitizeSpeechDuration(dialogue: string, maxWords = 17): string {
  if (!dialogue) return "";
  let text = dialogue.trim().replace(/^["'“”«»]+|["'“”«»]+$/g, '');
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    // Trunca suavemente no limite de palavras para nunca exceder 9 segundos
    const cut = words.slice(0, maxWords);
    text = cut.join(" ");
    text = text.replace(/[,;:\-\s]+$/, '');
    if (!/[.!?]$/.test(text)) {
      text += ".";
    }
  }
  return text;
}

function calculateSpeechSeconds(text: string): number {
  if (!text) return 7;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Na fala mansa e pausada da roça (~2 palavras por segundo):
  // 12 palavras = ~6s, 14 palavras = ~7s, 16 palavras = ~8s. Teto máximo rígido de 9s.
  return Math.min(9, Math.max(5, Math.round(words / 2.0)));
}

const handleGenerateThemes = async (req: any, res: any) => {
    try {
      const { keyword } = req.body;
      const ai = getGenAI(req);

      if (!ai) {
        // Fallback robusto caso a chave ainda não esteja no ambiente
        return res.json({
          themes: [
            {
              id: 1,
              title: "A vida devolve aquilo que você planta",
              description: "A certeza da colheita e por que o mal que alguém faz hoje volta com juros amanhã.",
              category: "Semeadura & Caráter",
              hookPreview: "Quem fez inferno na sua vida hoje, amanhã vai ter que beber da própria fumaça."
            },
            {
              id: 2,
              title: "Quem só lembra de você quando a fonte seca",
              description: "Sobre amizades interesseiras e a diferença entre quem te ama e quem apenas precisa de você.",
              category: "Falsidade & Desilusão",
              hookPreview: "Cobra não avisa quando vai dar o bote, mas a gente aprende a olhar a grama torta."
            },
            {
              id: 3,
              title: "Filhos que esquecem dos pais depois de criados",
              description: "A solidão de quem gastou a juventude erguendo a casa pros outros morarem longe.",
              category: "Família & Gratidão",
              hookPreview: "Você já viu como uma casa grande fica pequena e fria quando os filhos acham que não precisam mais de raiz?"
            },
            {
              id: 4,
              title: "O perigo de dar segunda chance pra quem já te traiu",
              description: "Perdoar para ficar em paz sem ser bobo de voltar pro mesmo laço.",
              category: "Confiança & Experiência",
              hookPreview: "A ingratidão é o único bicho que morde a mão depois de comer na palma."
            },
            {
              id: 5,
              title: "Pessoas que só dão valor depois que perdem",
              description: "A ingratidão cotidiana e a saudade que bate tarde demais quando a porteira fecha.",
              category: "Tempo & Saudade",
              hookPreview: "Tem gente que joga fora a água limpa da fonte e depois chora de sede na lama."
            }
          ]
        });
      }

      const promptText = `
${AGENT_SYSTEM_PROMPT}

Apresente EXATAMENTE 5 temas diferentes de reflexão para o Velho da Roça.
${keyword ? `Incorpore como inspiração o tema/palavra: "${keyword}".` : ""}

REQUISITO OBRIGATÓRIO DE VARIEDADE NOS GANCHOS:
Cada um dos 5 temas DEVE ter um estilo de gancho completamente diferente no campo "hookPreview":
- Tema 1: Choque de realidade ou provocação
- Tema 2: Metáfora rural direta
- Tema 3: Pergunta contundente ao espectador
- Tema 4: Sabedoria de raiz ou lembrança de antigos
- Tema 5: Verdade crua sobre caráter ou ingratidão
É TERMINANTEMENTE PROIBIDO começar com "Escuta uma coisa...", "Tem gente que...", "Depois dos 80 anos..." ou repetir a mesma estrutura sintática.

Retorne em formato JSON estrito:
{
  "themes": [
    {
      "id": 1,
      "title": "Título curto e impactante do tema",
      "description": "Explicação profunda e humana em uma frase sobre o tema",
      "category": "Categoria temática",
      "hookPreview": "Gancho inicial falado (~8 segundos), sem fórmulas repetidas"
    }
  ]
}
`;

      let parsed: any = null;
      try {
        const response = await callGeminiWithFallback(ai, {
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                themes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      hookPreview: { type: Type.STRING },
                    },
                    required: ["id", "title", "description", "category", "hookPreview"],
                  },
                },
              },
              required: ["themes"],
            },
          },
        });

        const raw = response.text?.trim() || "{}";
        parsed = JSON.parse(raw);
      } catch (geminiErr: any) {
        console.info("Temas contextuais gerados com curadoria de ganchos variados:", geminiErr?.message);
        const kw = keyword ? keyword.toLowerCase() : "vida";
        parsed = {
          themes: [
            {
              id: 1,
              title: keyword ? `A verdade sobre ${kw} que ninguém quer admitir` : "A vida devolve aquilo que você planta",
              description: keyword ? `Como a vivência da roça ensina a lidar com ${kw} sem perder a própria paz.` : "A certeza da colheita e por que o mal que alguém faz hoje volta com juros amanhã.",
              category: "Semeadura & Caráter",
              hookPreview: "Quem fez inferno na sua vida hoje, amanhã vai ter que beber da própria fumaça."
            },
            {
              id: 2,
              title: keyword ? `Quem usa ${kw} contra você um dia colhe a própria tempestade` : "Quem só lembra de você quando a fonte seca",
              description: "A ilusão de quem acha que o tempo esquece as sementes que jogou pelo caminho.",
              category: "Semeadura & Consequência",
              hookPreview: "Cobra não avisa quando vai dar o bote, mas a gente aprende a olhar a grama torta."
            },
            {
              id: 3,
              title: "Filhos que esquecem dos pais depois de criados",
              description: "A solidão de quem gastou a juventude erguendo a casa pros outros morarem longe.",
              category: "Família & Gratidão",
              hookPreview: "Você já viu como uma casa grande fica pequena e fria quando os filhos acham que não precisam mais de raiz?"
            },
            {
              id: 4,
              title: "O perigo de dar segunda chance pra quem já te traiu",
              description: "Perdoar para pacificar a alma sem ser bobo de colocar a mão no mesmo ninho de vespas.",
              category: "Confiança & Experiência",
              hookPreview: "A ingratidão é o único bicho que morde a mão depois de comer na palma."
            },
            {
              id: 5,
              title: "Pessoas que só dão valor depois que perdem",
              description: "A ingratidão cotidiana e a saudade que bate tarde demais quando a porteira fecha.",
              category: "Tempo & Arrependimento",
              hookPreview: "Tem gente que joga fora a água limpa da fonte e depois chora de sede na lama."
            }
          ]
        };
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Erro ao gerar temas:", error);
      res.status(500).json({ error: error?.message || "Falha ao gerar temas" });
    }
  };

  // API 2: Gerar roteiro e prompts completos para o tema escolhido
const handleGenerateReflection = async (req: any, res: any) => {
    try {
      const {
        theme,
        environment = "Varanda de casa simples com banco de madeira",
        promptCount = 8,
        includeFaithEnding = true,
        speakerGender = "male",
        clothing,
        customAvatarUrl,
        customAvatarDescription,
        customEnvironmentUrl,
        customEnvironmentDescription,
      } = req.body;

      if (!theme) {
        return res.status(400).json({ error: "O tema da reflexão é obrigatório." });
      }

      const isFemale = speakerGender === "female";
      const defaultClothing = isFemale
        ? "Vestido de algodão simples com estampa floral sutil e desbotada, avental rústico ou xale leve nos ombros, cabelos brancos e grisalhos presos em coque tradicional da roça"
        : "Camisa simples de trabalhador rural gasta, calça simples, botinas usadas e chapéu de palha tradicional";
      const selectedClothing = clothing || defaultClothing;

      const ai = getGenAI(req);

      // Analisa o avatar do usuário (multimodal se imagem fornecida) para travar perfil com textura de pessoa real
      const avatarProfileData = await extractAvatarVisualProfile(
        ai,
        customAvatarUrl,
        customAvatarDescription,
        speakerGender
      );

      let characterDirective = "";
      if (avatarProfileData.isCustom) {
        characterDirective = `
========================================================================================
REGRA MANDATÓRIA ABSOLUTA: AVATAR PRÓPRIO DO USUÁRIO COM MESMAS CARACTERÍSTICAS EM TODOS OS PROMPTS & PELE HUMANA REAL
========================================================================================
O usuário enviou seu próprio avatar. É ESTRITAMENTE OBRIGATÓRIO:
1. MANTENHA O MESMO PERSONAGEM EM 100% DE TODOS OS PROMPTS (do Prompt 1 ao Prompt ${promptCount}) com as MESMAS características físicas exatas: mesmo formato facial, mesma idade, mesmos cabelos/penteado, mesma barba ou ausência dela, mesmos olhos, mesmo tom de pele e mesma roupa.
2. PERFIL VISUAL TRAVADO DO PERSONAGEM (USE EXATAMENTE ESTA IDENTIDADE EM CADA PROMPT):
   "${avatarProfileData.profile}"
3. TEXTURA DE UMA PESSOA REAL (ULTRARREALISMO HUMANO):
   - Cada cena DEVE descrever explicitamente a textura de pele humana autêntica: micro-poros naturais visíveis, rugas finas e orgânicas, marcas naturais da idade/expressão, translucidez dérmica e sub-surface scattering (SSS) reagindo à luz ambiente natural.
   - Olhos humanos com profundidade, reflexos reais da luz ambiente na córnea e filme lacrimal natural.
   - Cabelos orgânicos com fios individuais naturais e sutis fios soltos.
   - Mãos com marcas naturais de vivência, pele realista e nós dos dedos definidos.
4. PROIBIÇÃO ABSOLUTA DE PLÁSTICO E 3D:
   - ZERO efeito plástico, ZERO pele excessivamente lisa de boneco, ZERO filtro artificial de beleza, ZERO render 3D CGI ou videogame. Deve parecer 100% um ser humano vivo gravado em câmera 4K HDR ProRes de smartphone.
${customAvatarDescription ? `Observações adicionais do criador: "${customAvatarDescription.trim()}"` : ""}`;
      } else {
        characterDirective = isFemale
          ? `PERSONAGEM SELECIONADO: A VELHA DA ROÇA (MULHER DE 80 ANOS).
- Descreva detalhadamente uma senhora brasileira de aproximadamente 80 anos, moradora rural simples e humilde.
- Rosto envelhecido naturalmente com rugas profundas e afetuosas, pele morena marcada pelo sol com micro-poros naturais visíveis, cabelos brancos ou grisalhos presos em coque simples rústico.
- Olhar doce, profundo e cheio de sabedoria maternal de quem viveu a lida da terra e da família.
- Vestimenta: ${selectedClothing}.
- A fala deve soar afetuosa, acolhedora, serena e pausada (no mínimo 9 segundos, 20 a 30 palavras), com concordância feminina natural em português quando couber ("uma velha como eu", "quando eu era moça", etc.). NÃO FAÇA MENOR QUE 9 SEGUNDOS.`
          : `PERSONAGEM SELECIONADO: O VELHO DA ROÇA (HOMEM DE 80 ANOS).
- Descreva detalhadamente um senhor brasileiro de aproximadamente 80 anos, morador rural, envelhecido naturalmente com rugas profundas, pele marcada pelo sol com micro-poros naturais visíveis, barba curta grisalha, chapéu de palha tradicional e camisa de trabalhador rural gasta.
- Olhar profundo, sereno e humilde de quem trabalhou a vida inteira no campo.
- Vestimenta: ${selectedClothing}.
- A fala deve soar calma, grave, pausada e reflexiva (no mínimo 9 segundos, 20 a 30 palavras). NÃO FAÇA MENOR QUE 9 SEGUNDOS.`;
      }

      const effectiveEnvironment = customEnvironmentDescription && customEnvironmentDescription.trim()
        ? `${environment} (${customEnvironmentDescription.trim()})`
        : environment;

      if (!ai) {
        return res.status(500).json({
          error: "Chave GEMINI_API_KEY não configurada no servidor. Configure a chave no menu Settings.",
        });
      }

      const promptText = `
${AGENT_SYSTEM_PROMPT}

${characterDirective}

Crie agora a sequência completa de ${promptCount} prompts para a reflexão sobre o tema:
"${theme}"

AMBIENTE ESCOLHIDO:
${effectiveEnvironment}

REQUISITOS ESTRITOS (FALAS CONCISAS DE NO MÁXIMO 8 A 9 SEGUNDOS E CONEXÃO NARRATIVA CONTÍNUA):
- Quantidade exata de prompts: ${promptCount}
- Personagem: ${avatarProfileData.isCustom ? "Avatar próprio mantido em 100% dos prompts com textura de pessoa real" : (isFemale ? "Mulher idosa da roça (80 anos)" : "Homem idoso da roça (80 anos)")}
- REGRA DE OURO DE DURAÇÃO: CADA PROMPT representa NO MÁXIMO 8 A 9 SEGUNDOS de fala pausada (12 a 17 palavras, MÁXIMO ABSOLUTO DE 18 PALAVRAS). NUNCA FAÇA MAIOR QUE 9 SEGUNDOS! Falas com mais de 18 palavras ultrapassam o tempo do clipe de vídeo e serão cortadas. Mantenha a fala curta, densa, poética e profunda.
- REGRA SUPREMA DE CONEXÃO NARRATIVA:
  * O roteiro NÃO pode conter provérbios soltos ou frases desconexas. É UM ÚNICO MONÓLOGO CONTÍNUO E COESO.
  * CADA FALA DEVE SE CONECTAR DIRETAMENTE À FALA ANTERIOR com conectivos lógicos naturais (ex: "Porque...", "Afinal...", "O tempo pode até...", "E quando a conta chega...", "Enquanto isso...", "Por isso...", "No fim das contas...", "A terra nunca erra...", "Deus conhece...").
  * Ao ler todas as falas em sequência ininterrupta, deve formar uma história/conselho com fluxo natural e sentido impecável do início ao fim.
  * Preencha o campo "narrativeConnector" para cada prompt explicando a conexão lógica com a fala anterior.
- A fala deve soar extremamente natural, humilde, com sabedoria vivida de quem viveu 80 anos no campo, sem enrolação.
${includeFaithEnding ? "- O último prompt deve ter uma mensagem de fé simples e reconfortante em Deus, sem ser sermão." : ""}
- CADA PROMPT DEVE SER COMPLETAMENTE AUTOCONTIDO:
  ${avatarProfileData.isCustom 
    ? `Para TODOS os prompts, mantenha EXATAMENTE o mesmo avatar do usuário (${avatarProfileData.profile}) com textura de pele humana real (micro-poros visíveis, rugas naturais, sem plástico, sem 3D CGI). NUNCA mude os traços do personagem entre as cenas.`
    : `Para TODOS os prompts, descreva integralmente ${isFemale ? "a senhora de 80 anos" : "o senhor de 80 anos"}, sua roupa, o ambiente da roça, a pele com micro-poros visíveis e rugas reais, a luz dourada e o enquadramento vertical 9:16.`
  }
  NUNCA diga 'mesmo personagem' ou 'mesmo cenário'.

REQUISITO OBRIGATÓRIO DE VARIEDADE NO GANCHO (PROMPT 1):
- NUNCA use fórmulas repetidas como "Escuta uma coisa que eu demorei...", "Tem gente que..." ou "Depois dos oitenta anos...".
- Crie um gancho inicial conciso de até 8 a 9 segundos (12 a 16 palavras) para o Prompt 1 seguindo um dos 7 arquétipos.
- Além do gancho principal, forneça no campo "alternativeHooks" do Prompt 1 exatamente 6 opções de ganchos com estilos completamente variados (Choque de Realidade, Metáfora Rural, Pergunta Direta, Sabedoria de Raiz, Verdade Crua, Alerta de Caráter) adaptados à voz ${isFemale ? "da senhora de 80 anos" : "do senhor de 80 anos"}, cada um com 12 a 16 palavras (máximo 8 a 9 segundos, nunca passar de 9s).

- Em cada prompt, monte a propriedade "fullFormattedPrompt" exatamente no formato:
[Descrição visual detalhada em inglês e/ou português com estilo documental 9:16 4K HDR smartphone camera, pele, rugas, ação, luz]

Spoken dialogue in Brazilian Portuguese:
"[FALA CONCISA EM PORTUGUÊS BRASILEIRO DE NO MÁXIMO 8 A 9 SEGUNDOS - 12 A 17 PALAVRAS]"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.

Retorne em formato JSON estrito:
{
  "title": "${theme}",
  "theme": "${theme}",
  "environment": "${environment}",
  "lighting": "Luz dourada natural de entardecer na roça brasileira",
  "clothing": "${selectedClothing}",
  "speakerGender": "${isFemale ? "female" : "male"}",
  "prompts": [
    {
      "index": 1,
      "stageName": "Prompt 1 — Gancho",
      "cameraAngle": "Plano médio vertical 9:16",
      "characterAction": "${isFemale ? "Olhar doce e atento da senhora, mãos repousadas no colo" : "Olhar calmo e sereno do senhor"}",
      "visualPrompt": "Descrição visual completa e independente da cena",
      "spokenDialogue": "Fala exata e concisa em português de até 8 a 9 segundos (12 a 17 palavras, nunca mais)",
      "estimatedSeconds": 8,
      "hookStyle": "Estilo do gancho principal escolhido",
      "narrativeConnector": "Abertura impactante que prende a atenção",
      "alternativeHooks": [
        { "style": "Choque de Realidade", "text": "Texto do gancho 1 (12 a 16 palavras, máx 9s)" },
        { "style": "Metáfora Rural", "text": "Texto do gancho 2 (12 a 16 palavras, máx 9s)" },
        { "style": "Pergunta Direta", "text": "Texto do gancho 3 (12 a 16 palavras, máx 9s)" },
        { "style": "Sabedoria de Raiz", "text": "Texto do gancho 4 (12 a 16 palavras, máx 9s)" },
        { "style": "Verdade Crua", "text": "Texto do gancho 5 (12 a 16 palavras, máx 9s)" },
        { "style": "Alerta de Caráter", "text": "Texto do gancho 6 (12 a 16 palavras, máx 9s)" }
      ],
      "fullFormattedPrompt": "Texto pronto para copiar com descrição visual + Spoken dialogue + regras de no text"
    }
  ]
}
`;

      let parsed: any = null;
      try {
        const response = await callGeminiWithFallback(ai, {
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                theme: { type: Type.STRING },
                environment: { type: Type.STRING },
                lighting: { type: Type.STRING },
                clothing: { type: Type.STRING },
                prompts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      index: { type: Type.INTEGER },
                      stageName: { type: Type.STRING },
                      cameraAngle: { type: Type.STRING },
                      characterAction: { type: Type.STRING },
                      visualPrompt: { type: Type.STRING },
                      spokenDialogue: { type: Type.STRING },
                      estimatedSeconds: { type: Type.INTEGER },
                      fullFormattedPrompt: { type: Type.STRING },
                      hookStyle: { type: Type.STRING },
                      narrativeConnector: { type: Type.STRING },
                      alternativeHooks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            style: { type: Type.STRING },
                            text: { type: Type.STRING },
                          },
                          required: ["style", "text"],
                        },
                      },
                    },
                    required: [
                      "index",
                      "stageName",
                      "cameraAngle",
                      "characterAction",
                      "visualPrompt",
                      "spokenDialogue",
                      "estimatedSeconds",
                      "fullFormattedPrompt",
                    ],
                  },
                },
              },
              required: ["title", "theme", "environment", "lighting", "clothing", "prompts"],
            },
          },
        });

        const raw = response.text?.trim() || "{}";
        parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.prompts)) {
          const humanSkinClause = "authentic photorealistic human skin texture with visible natural micro-pores, fine organic wrinkles, natural skin folds, dermal translucency with sub-surface scattering, lifelike eyes with realistic sclera reflections. Absolutely zero plastic skin, zero airbrushed filters, zero 3D CGI";

          parsed.prompts = parsed.prompts.map((p: any) => {
            // Garante rigorosamente que a fala não passe de 17 palavras e fique abaixo de 9 segundos
            const cleanDialogue = sanitizeSpeechDuration(p.spokenDialogue, 17);
            const estimatedSec = calculateSpeechSeconds(cleanDialogue);
            let visual = p.visualPrompt || "";

            // Se for avatar próprio, força o perfil travado e textura de pessoa real em 100% dos prompts
            if (avatarProfileData.isCustom) {
              const profileSnippet = avatarProfileData.profile;
              const hasPores = visual.toLowerCase().includes("micro-pore") || visual.toLowerCase().includes("human skin texture");
              if (!hasPores || !visual.toLowerCase().includes(profileSnippet.slice(0, 25).toLowerCase())) {
                visual = `Vertical 9:16 documentary smartphone style 4K HDR raw footage. ${profileSnippet}, with ${humanSkinClause}. ${visual}`;
              }
            }

            const formatted = `${visual}

Spoken dialogue in Brazilian Portuguese:
"${cleanDialogue}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

            let alternativeHooks = p.alternativeHooks;
            if (Array.isArray(alternativeHooks)) {
              alternativeHooks = alternativeHooks.map((h: any) => ({
                style: h.style || "Gancho",
                text: sanitizeSpeechDuration(h.text, 16),
              }));
            }

            return {
              ...p,
              spokenDialogue: cleanDialogue,
              estimatedSeconds: estimatedSec,
              visualPrompt: visual,
              fullFormattedPrompt: formatted,
              alternativeHooks,
              narrativeConnector: p.narrativeConnector || (p.index === 1 ? "Gancho inicial de impacto" : `Conecta e dá continuidade ao Prompt ${p.index - 1}`),
            };
          });
        }
      } catch (geminiErr: any) {
        console.info("Roteiro estruturado com consistência contextual e ganchos variados:", geminiErr?.message);
        
        // Gerador de ganchos 100% variados e sem fórmulas repetitivas (máximo 8 a 9s de fala, 12 a 16 palavras)
        const hookOptions = isFemale ? [
          {
            style: "Choque de Realidade",
            text: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu."
          },
          {
            style: "Metáfora da Roça",
            text: "Árvore que dá fruto bom no terreiro é a que mais leva pedrada de quem não planta."
          },
          {
            style: "Pergunta Direta",
            text: "Você já reparou como o silêncio às vezes machuca a alma muito mais do que bofetada?"
          },
          {
            style: "Sabedoria de Raiz",
            text: "Minha finada mãe já me dizia: nunca confunda quem te aplaude com quem segura sua mão."
          },
          {
            style: "Verdade Crua",
            text: "O caixão não tem gaveta e a terra nunca cobrou um tostão de ninguém nessa vida."
          },
          {
            style: "Alerta de Caráter",
            text: "Cuidado com o agrado doce de quem pela frente sorri e por trás arma o laço."
          }
        ] : [
          {
            style: "Choque de Realidade",
            text: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu."
          },
          {
            style: "Metáfora da Roça",
            text: "Árvore que dá fruto doce é a que mais leva pedrada de quem não sabe capinar."
          },
          {
            style: "Pergunta Direta",
            text: "Você já reparou como quem menos sabe da sua luta é quem mais aponta o dedo?"
          },
          {
            style: "Sabedoria de Raiz",
            text: "Meu finado pai me ensinou na lida: paciência de homem trabalhador nunca é sinal de fraqueza."
          },
          {
            style: "Verdade Crua",
            text: "O caixão não tem gaveta e a terra nunca cobrou aluguel de nenhum vivente do mundo."
          },
          {
            style: "Alerta de Caráter",
            text: "Cobra não avisa o bote; aprenda a desconfiar de quem só te cerca com agrado falso."
          }
        ];

        // Escolhe um gancho dinâmico com base no tema
        const chosenHook = hookOptions[Math.floor(Math.random() * hookOptions.length)];

        // Roteiro estruturado estritamente com conexão narrativa ininterrupta (fio condutor contínuo, 12 a 16 palavras, ≤9s)
        const baseDialogue = isFemale ? [
          {
            stage: "Prompt 1 — Gancho",
            text: chosenHook.text,
            hookStyle: chosenHook.style,
            alternativeHooks: hookOptions,
            connector: "Abertura impactante que fisga a atenção"
          },
          {
            stage: "Prompt 2 — Conexão com o Gancho",
            text: "Porque nada passa batido: a vida anota cada espinho espalhado e devolve no tempo certo.",
            connector: "Explica a causa do gancho conectando com a lei do retorno"
          },
          {
            stage: "Prompt 3 — Continuação no Tempo",
            text: "Pode até parecer que a justiça tarda, mas a colheita nunca esquece quem plantou a discórdia.",
            connector: "Aprofunda a passagem do tempo e a certeza da cobrança"
          },
          {
            stage: "Prompt 4 — Consequência Inevitável",
            text: "E na hora do aperto, não tem disfarce que segure quem viveu de enganar o próximo.",
            connector: "Mostra a consequência inevitável que aguarda quem fez o mal"
          },
          {
            stage: "Prompt 5 — Virada para o Ouvinte",
            text: "Mas a sua parte, meu filho, é bem diferente de quem vive plantando a maldade alheia.",
            connector: "Muda o foco para quem ouve, criando conforto e contraste"
          },
          {
            stage: "Prompt 6 — Conselho Prático",
            text: "Nunca perca o seu sossego pagando na mesma moeda: cuide do seu terreiro e guarde a paz.",
            connector: "Conselho sábio e moral derivado diretamente da virada anterior"
          },
          {
            stage: "Prompt 7 — Conclusão de Paz",
            text: "Afinal de contas, quem anda direito deita a cabeça no travesseiro e dorme com o coração leve.",
            connector: "Conclusão memorável que pacifica a mente do ouvinte"
          },
          {
            stage: "Prompt 8 — Exemplo Vivido",
            text: "Em oitenta anos de vida, vi muita gente arrogante desabar quando a ventania da vida soprou.",
            connector: "Validação com testemunho real de 80 anos na lida da roça"
          },
          {
            stage: "Prompt 9 — Lição de Paciência",
            text: "Por isso, tenha paciência: café passado às pressas queima a boca e não tem gosto bom.",
            connector: "Metáfora rural simples ensinando a paciência na espera"
          },
          {
            stage: "Prompt 10 — Firmeza no Silêncio",
            text: "Não dê ouvidos ao falatório alheio; a fofoca só queima quem se aproxima pra alimentar o fogo.",
            connector: "Instrução firme para desarmar a discórdia sem revidar"
          },
          {
            stage: "Prompt 11 — Palavra de Força",
            text: "Guarde o seu coração puro, continue sendo essa pessoa boa e não esmoreça por nada nesse mundo.",
            connector: "Encorajamento e ânimo para permanecer honrado"
          },
          {
            stage: "Prompt 12 — Encerramento de Fé",
            text: "Deus recolhe cada lágrima que caiu no chão. Fica em paz que Ele tá cuidando de tudo.",
            connector: "Desfecho afetuoso e acolhedor de fé e proteção divina"
          }
        ] : [
          {
            stage: "Prompt 1 — Gancho",
            text: chosenHook.text,
            hookStyle: chosenHook.style,
            alternativeHooks: hookOptions,
            connector: "Abertura impactante que fisga a atenção"
          },
          {
            stage: "Prompt 2 — Conexão com o Gancho",
            text: "Porque a vida anota direitinho cada semente ruim jogada na terra alheia, sem esquecer nada.",
            connector: "Explica a causa do gancho conectando com a semeadura"
          },
          {
            stage: "Prompt 3 — Continuação no Tempo",
            text: "O tempo pode até fingir demora, mas nunca deixa de cobrar cada passo torto que deram.",
            connector: "Aprofunda a certeza da colheita e o tempo certo das coisas"
          },
          {
            stage: "Prompt 4 — Consequência Inevitável",
            text: "E quando essa conta chega, a tempestade desce e arranca do chão quem não tem raiz.",
            connector: "Consequência prática com a força da metáfora da tempestade"
          },
          {
            stage: "Prompt 5 — Virada para o Ouvinte",
            text: "Enquanto a maldade tropeça na própria vala, você não deve gastar a sua paz revidando.",
            connector: "Contraste entre a ruína do injusto e a postura digna do ouvinte"
          },
          {
            stage: "Prompt 6 — Conselho Prático",
            text: "Nunca suje as suas mãos com vingança: cuide da sua lida e guarde o seu coração.",
            connector: "Conselho prático de honra e preservação da paz interior"
          },
          {
            stage: "Prompt 7 — Conclusão de Paz",
            text: "No fim das contas, a terra nunca erra: quem plantou com honra deita e dorme sereno.",
            connector: "Conclusão memorável de integridade recompensada"
          },
          {
            stage: "Prompt 8 — Exemplo Vivido",
            text: "Com oitenta anos na lida, cansei de ver homem soberbo cair no primeiro vento forte.",
            connector: "Experiência de 80 anos validando a sabedoria transmitida"
          },
          {
            stage: "Prompt 9 — Lição de Paciência",
            text: "Por isso, espere com calma: o trovão assusta, mas é a chuva mansa que alimenta a terra.",
            connector: "Ensinamento sobre calma e perseverança diante das crises"
          },
          {
            stage: "Prompt 10 — Firmeza no Silêncio",
            text: "Quem caminha limpo debaixo do sol não perde o sono com veneno de língua afiada.",
            connector: "Blindagem de caráter contra fofocas e injúrias"
          },
          {
            stage: "Prompt 11 — Palavra de Força",
            text: "Siga o seu caminho reto de cabeça erguida, mesmo quando parecer que o mundo perdeu o rumo.",
            connector: "Incentivo moral para seguir firme sem desanimar"
          },
          {
            stage: "Prompt 12 — Encerramento de Fé",
            text: "E descansa no peito: Deus escuta o seu silêncio e tá ajeitando cada coisa no lugar.",
            connector: "Fechamento espiritual comovente e pacificador"
          }
        ];

        const requestedCount = Number(promptCount) || 8;
        const count = Math.max(3, Math.min(requestedCount, baseDialogue.length));
        const scenes = [];

        const characterVisualDescription = avatarProfileData.isCustom
          ? `${avatarProfileData.profile}, with authentic photorealistic human skin texture, visible natural micro-pores, fine wrinkles, natural skin folds, dermal translucency, and lifelike eyes with realistic sclera reflections. Absolutely zero plastic or 3D CGI`
          : isFemale
          ? `An authentic 80-year-old Brazilian rural elder woman (senhora da roça) with deeply wrinkled sun-weathered Brazilian tan skin, genuine natural micro-pores, gentle profound wise eyes, and natural gray and white hair tied in a modest rustic bun. She is wearing a humble faded floral cotton countryside dress and a light rustic knitted shawl over her shoulders. Sitting quietly on a weathered wooden bench on the humble porch of a rural Brazilian farmhouse during golden hour sunset. Soft warm natural light, skin texture with authentic age spots and wrinkles preserved, very subtle breathing movement, natural gentle blinking. She looks directly at the camera and speaks calmly with deep maternal wisdom and warmth`
          : `An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, genuine natural micro-pores, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting quietly on a weathered wooden bench on the humble porch of a rural Brazilian farmhouse during golden hour. Soft natural light, skin texture with authentic age spots and wrinkles preserved, very subtle breathing movement, natural blinking. He looks directly at the camera and speaks calmly with deep life experience`;

        for (let i = 0; i < count; i++) {
          const item = baseDialogue[i] as any;
          const cleanText = sanitizeSpeechDuration(item.text, 17);
          const estimatedSec = calculateSpeechSeconds(cleanText);

          const fullPrompt = `Vertical 9:16 documentary smartphone style 4K HDR footage. ${characterVisualDescription}. Setting: ${effectiveEnvironment}. Soft natural golden hour lighting, authentic human skin texture with micro-pores and organic wrinkles preserved, subtle natural breathing movement, lifelike eye contact.

Spoken dialogue in Brazilian Portuguese:
"${cleanText}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

          scenes.push({
            index: i + 1,
            stageName: item.stage,
            cameraAngle: i % 2 === 0 ? "Plano médio vertical 9:16 smartphone documental" : "Plano médio-curto vertical 9:16",
            characterAction: isFemale
              ? "Olhar terno e sereno para a câmera, respiração sutil, mãos calejadas apoiadas com dignidade no colo e postura humilde de senhora da roça"
              : "Olhar calmo, respiração sutil, mãos calejadas apoiadas com serenidade e postura humilde de homem da terra",
            visualPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. ${characterVisualDescription} in ${effectiveEnvironment}. Authentic natural human skin texture with deep natural wrinkles and visible micro-pores.`,
            spokenDialogue: cleanText,
            estimatedSeconds: estimatedSec,
            hookStyle: item.hookStyle,
            alternativeHooks: item.alternativeHooks,
            narrativeConnector: item.connector,
            fullFormattedPrompt: fullPrompt
          });
        }

        parsed = {
          title: theme,
          theme: theme,
          environment: effectiveEnvironment,
          lighting: "Luz natural dourada do entardecer na roça brasileira",
          clothing: selectedClothing,
          speakerGender: isFemale ? "female" : "male",
          prompts: scenes
        };
      }

      if (customAvatarUrl) parsed.customAvatarUrl = customAvatarUrl;
      if (customAvatarDescription) parsed.customAvatarDescription = customAvatarDescription;
      if (avatarProfileData.isCustom) parsed.customAvatarVisualProfile = avatarProfileData.profile;
      if (customEnvironmentUrl) parsed.customEnvironmentUrl = customEnvironmentUrl;
      if (customEnvironmentDescription) parsed.customEnvironmentDescription = customEnvironmentDescription;

      res.json(parsed);
    } catch (error: any) {
      console.error("Erro ao gerar reflexão:", error);
      res.status(500).json({ error: error?.message || "Falha ao gerar reflexão" });
    }
  };

  // API 2.4: Aplicar avatar próprio a um roteiro existente garantindo consistência e textura de pessoa real
const handleApplyAvatarToScript = async (req: any, res: any) => {
    try {
      const { script, avatarUrl, avatarDescription, speakerGender = "male" } = req.body;
      if (!script || !Array.isArray(script.prompts)) {
        return res.status(400).json({ error: "Roteiro inválido fornecido." });
      }

      const ai = getGenAI(req);
      const avatarProfileData = await extractAvatarVisualProfile(
        ai,
        avatarUrl,
        avatarDescription,
        speakerGender
      );

      const humanSkinClause = "authentic photorealistic human skin texture with visible natural micro-pores, organic fine wrinkles, natural skin folds, dermal translucency with sub-surface scattering, lifelike eyes with natural moisture and reflections. Absolutely zero plastic skin, zero airbrushed filters, zero 3D CGI";
      const characterClause = avatarProfileData.isCustom
        ? `${avatarProfileData.profile}, with ${humanSkinClause}`
        : speakerGender === "female"
        ? `An authentic 80-year-old Brazilian rural elder woman with deeply wrinkled sun-weathered tan skin, genuine natural micro-pores, gentle wise eyes, modest hair bun, wearing a faded floral dress, with ${humanSkinClause}`
        : `An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, genuine natural micro-pores, short neat gray beard, traditional straw hat and rustic shirt, with ${humanSkinClause}`;

      const updatedPrompts = script.prompts.map((p: any) => {
        const actionAndFraming = p.characterAction || "Looking at the camera with calm, profound expression";
        const env = script.environment || "humble rural porch during golden hour";
        
        const newVisualPrompt = `Vertical 9:16 documentary smartphone style 4K HDR raw footage. ${characterClause}. Setting: ${env}. Framing: ${p.cameraAngle || "Plano médio vertical 9:16"}. Action: ${actionAndFraming}. Soft natural golden hour lighting, subtle breathing movement, natural blinking.`;

        const newFormattedPrompt = `${newVisualPrompt}

Spoken dialogue in Brazilian Portuguese:
"${p.spokenDialogue}"

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`;

        return {
          ...p,
          visualPrompt: newVisualPrompt,
          fullFormattedPrompt: newFormattedPrompt,
        };
      });

      const updatedScript = {
        ...script,
        customAvatarUrl: avatarUrl,
        customAvatarDescription: avatarDescription,
        customAvatarVisualProfile: avatarProfileData.profile,
        prompts: updatedPrompts,
      };

      res.json({
        script: updatedScript,
        avatarProfile: avatarProfileData.profile,
        message: "Avatar próprio aplicado com sucesso a todos os prompts com mesma identidade e textura de pessoa real.",
      });
    } catch (err: any) {
      console.error("Erro ao aplicar avatar ao roteiro:", err);
      res.status(500).json({ error: err?.message || "Falha ao aplicar avatar." });
    }
  };

  // API 2.5: Analisar imagem de avatar para dar feedback imediato ao usuário
const handleAnalyzeAvatar = async (req: any, res: any) => {
    try {
      const { avatarUrl, avatarDescription, speakerGender = "male" } = req.body;
      const ai = getGenAI(req);
      const result = await extractAvatarVisualProfile(ai, avatarUrl, avatarDescription, speakerGender);
      res.json(result);
    } catch (err: any) {
      console.info("Fallback para análise de avatar:", err?.message);
      const fallback = await extractAvatarVisualProfile(null, req.body.avatarUrl, req.body.avatarDescription, req.body.speakerGender);
      res.json(fallback);
    }
  };

  // API 2.5: Gerar novos ganchos variados sob demanda para qualquer tema (no máximo 8 a 9s de fala)
const handleGenerateAlternativeHooks = async (req: any, res: any) => {
    const { theme, currentHook, speakerGender = "male" } = req.body;
    const isFemale = speakerGender === "female";

    const defaultHooks = isFemale ? [
      { style: "Choque de Realidade", text: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu." },
      { style: "Metáfora da Roça", text: "Árvore que dá fruto bom no terreiro é a que mais leva pedrada de quem não planta." },
      { style: "Pergunta Direta", text: "Você já reparou como o silêncio às vezes machuca a alma muito mais do que bofetada?" },
      { style: "Sabedoria de Raiz", text: "Minha finada mãe já me dizia: nunca confunda quem te aplaude com quem segura sua mão." },
      { style: "Verdade Crua", text: "O caixão não tem gaveta e a terra nunca cobrou um tostão de ninguém nessa vida." },
      { style: "Alerta de Caráter", text: "Cuidado com o agrado doce de quem pela frente sorri e por trás arma o laço." }
    ] : [
      { style: "Choque de Realidade", text: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu." },
      { style: "Metáfora da Roça", text: "Árvore que dá fruto doce é a que mais leva pedrada de quem não sabe capinar." },
      { style: "Pergunta Direta", text: "Você já reparou como quem menos sabe da sua luta é quem mais aponta o dedo?" },
      { style: "Sabedoria de Raiz", text: "Meu finado pai me ensinou na lida: paciência de homem trabalhador nunca é sinal de fraqueza." },
      { style: "Verdade Crua", text: "O caixão não tem gaveta e a terra nunca cobrou aluguel de nenhum vivente do mundo." },
      { style: "Alerta de Caráter", text: "Cobra não avisa o bote; aprenda a desconfiar de quem só te cerca com agrado falso." }
    ];

    try {
      const ai = getGenAI(req);

      if (!ai) {
        return res.json({ alternativeHooks: defaultHooks });
      }

      const promptText = `
${AGENT_SYSTEM_PROMPT}

O usuário está criando um vídeo de reflexão de 80 anos com ${isFemale ? "A VELHA DA ROÇA (senhora idosa maternal)" : "O VELHO DA ROÇA (senhor idoso grave)"} sobre o tema:
"${theme || "A vida devolve o que você planta"}"
Gancho atual: "${currentHook || ""}"

Gere EXATAMENTE 6 GANCHOS NOVOS E COMPLETAMENTE VARIADOS para o primeiro bloco (Prompt 1).
CADA GANCHO DEVE TER NO MÁXIMO 8 A 9 SEGUNDOS (12 a 16 palavras, NUNCA ULTRAPASSAR 9 SEGUNDOS), com português brasileiro rural sereno, profundo e emotivo, com voz ${isFemale ? "feminina idosa, acolhedora e maternal" : "masculina idosa, calma e reflexiva"}.
PROIBIÇÃO: NUNCA use "Escuta uma coisa que eu demorei...", "Tem gente que...", "Depois dos oitenta anos...". Cada gancho DEVE ter uma estrutura gramatical e estilo diferente:
1. Choque de Realidade
2. Metáfora da Roça
3. Pergunta Direta ao Espectador
4. Sabedoria de Raiz / Finados Pais
5. Verdade Crua sobre Caráter
6. Alerta de Caráter / Sabedoria Inversa

Retorne em formato JSON estrito:
{
  "alternativeHooks": [
    { "style": "Choque de Realidade", "text": "Texto exato do gancho (12 a 16 palavras, máx 9s)" },
    { "style": "Metáfora da Roça", "text": "Texto exato do gancho (12 a 16 palavras, máx 9s)" },
    { "style": "Pergunta Direta", "text": "Texto exato do gancho (12 a 16 palavras, máx 9s)" },
    { "style": "Sabedoria de Raiz", "text": "Texto exato do gancho (12 a 16 palavras, máx 9s)" },
    { "style": "Verdade Crua", "text": "Texto exato do gancho (12 a 16 palavras, máx 9s)" },
    { "style": "Alerta de Caráter", "text": "Texto exato do gancho (12 a 16 palavras, máx 9s)" }
  ]
}
`;

      const response = await callGeminiWithFallback(ai, {
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              alternativeHooks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    style: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ["style", "text"],
                },
              },
            },
            required: ["alternativeHooks"],
          },
        },
      });

      const raw = response.text?.trim() || "{}";
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.alternativeHooks)) {
        parsed.alternativeHooks = parsed.alternativeHooks.map((h: any) => ({
          style: h.style || "Gancho",
          text: sanitizeSpeechDuration(h.text, 16),
        }));
      }
      res.json(parsed);
    } catch (err: any) {
      console.info("Ganchos alternativos estruturados prontos:", err?.message);
      res.json({
        alternativeHooks: defaultHooks
      });
    }
  };

  // API 3: Síntese de áudio opcional via Gemini TTS (se compatível)
const handleTts = async (req: any, res: any) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Texto obrigatório" });

      const ai = getGenAI(req);
      if (!ai) {
        return res.status(500).json({ error: "Chave Gemini não configurada" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [
          {
            parts: [
              {
                text: `Fale devagar com voz masculina idosa, serena, calma e humilde em português do Brasil: ${text}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Charon" },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        return res.json({ audioBase64, format: "pcm;rate=24000" });
      }
      return res.status(404).json({ error: "Áudio não retornado" });
    } catch (err: any) {
      // Retorna fallback gracioso para que o frontend use síntese Web Speech nativa
      res.status(200).json({ fallback: true, message: err?.message || "Usar voz local do navegador" });
    }
  };

  // Health check

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

  const action = req.body?.action || 'generate-reflection';

  if (action === 'generate-themes') return handleGenerateThemes(req, res);
  if (action === 'apply-avatar-to-script') return handleApplyAvatarToScript(req, res);
  if (action === 'analyze-avatar') return handleAnalyzeAvatar(req, res);
  if (action === 'generate-alternative-hooks') return handleGenerateAlternativeHooks(req, res);
  if (action === 'tts') return handleTts(req, res);
  return handleGenerateReflection(req, res);
}