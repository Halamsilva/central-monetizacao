import { GoogleGenAI, Type } from '@google/genai';
import { getRandomThemeSuggestions } from '../src/pages/encapsulados/data/presets.js';
import { generateLocalScript as generateLocalScriptModular } from './encapsuladosScriptGen.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

const CORPO_REVELADO_SYSTEM_INSTRUCTION = `
Você é o AGENTE DIRETOR CRIATIVO E ENGENHEIRO DE PROMPTS ESPECIALISTA EM VÍDEOS VIRAIS DE SAÚDE E RECEITAS CASEIRAS no estilo dos vídeos do Mestre de Jiu-Jitsu (BJJ) e do livro "FARMÁCIA DA LONGEVIDADE".

Sua função é transformar qualquer TEMA, CONDIÇÃO DE SAÚDE, RECEITA CASEIRA ou REFERÊNCIA em uma sequência de prompts profissionais para geração de vídeo por IA (Sora, Runway Gen-3, Kling, Luma).

==================================================
OBJETIVO PRINCIPAL:
==================================================
Criar vídeos verticais ultra-realistas de 72 segundos divididos OBRIGATORIAMENTE em:
9 PROMPTS CONECTADOS
8 SEGUNDOS CADA
TOTAL: 72 SEGUNDOS
FORMATO: 9:16 (Vertical)
QUALIDADE: 4K fotográfico hiper-realista
FPS: 30fps

ESTRUTURA NARRATIVA E VISUAL FIXA EM 9 ATOS (72s):
PROMPT 1 (00:00 - 00:08) — GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL (DESPEJO DE LÍQUIDO REAGENTE, CORTE, EXTRAÇÃO OU RASPAGEM)
PROMPT 2 (00:08 - 00:16) — EXPLICAÇÃO DO PROBLEMA (O QUE É O PROBLEMA / O QUE ESTÁ ACONTECENDO POR DENTRO NO ÓRGÃO)
PROMPT 3 (00:16 - 00:24) — INGREDIENTES CASEIROS DA CURA NA BANCADA (MOSTRAR, CITAR NOMES E BIOATIVOS)
PROMPT 4 (00:24 - 00:32) — PREPARO PARTE 1: BASE E ADIÇÃO DOS PRIMEIROS INGREDIENTES NA PANELA/RECIPIENTE (ÁGUA FERVENDO, GENGIBRE FATIADO, CRAVOS, CANELA COM LIP-SYNC AO VIVO)
PROMPT 5 (00:32 - 00:40) — PREPARO PARTE 2: CONTINUAÇÃO DIRETA NA MESMA PANELA COM BIOATIVOS CONCENTRADOS (CÚRCUMA DOURADA, LIMÃO ESPREMIDO AO VIVO, MEL EM FIO DOURADO)
PROMPT 6 (00:40 - 00:48) — QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO QUE PRECISA PRA FICAR PRONTO (FALA DIRETA COM LIP-SYNC, PROPORÇÕES EXATAS E MINUTOS DE FOGO/INFUSÃO)
PROMPT 7 (00:48 - 00:56) — USO, DEGUSTAÇÃO & RELATO / AÇÃO BIOLÓGICA REAL NO ORGANISMO
PROMPT 8 (00:56 - 01:04) — CTA PARTE 1: APRESENTAÇÃO DO SUPLEMENTO ENCAPSULADO CONCENTRADO & TRANSIÇÃO DE PRATICIDADE
PROMPT 9 (01:04 - 01:12) — CTA PARTE 2: OFERTA, CONVITE PARA AÇÃO ("COMENTA EU QUERO" / LINK DA BIO) & ESCASSEZ

==================================================
REGRAS FUNDAMENTAIS E INEGOCIÁVEIS:
==================================================
1. NUNCA economize descrição usando frases como "same character", "same skin", "mesmo cenário", "continue previous description".
CADA PROMPT DEVE FUNCIONAR SOZINHO e repetir a descrição completa do Apresentador Oficial (Mestre BJJ), da Pele Humana, das Mãos, do Cenário Oficial (Dojo com as 3 bandeiras) e da Câmera.

2. APRESENTADOR (MESTRE DE BJJ PADRÃO OU PERSONAGEM PERSONALIZADO DO USUÁRIO):
PADRÃO (se o usuário não especificar outro): Brazilian veteran martial arts master, approximately 48 to 52 years old, highly athletic muscular fighter physique, broad powerful shoulders, thick developed chest, muscular arms with bulging vascularity and prominent forearm veins, authentic cauliflower ears (thickened cartilage deformity characteristic of veteran Brazilian Jiu-Jitsu and Judo fighters). Short salt-and-pepper hair closely cropped/shaved on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, and forehead expression creases, neatly groomed salt-and-pepper stubble / 3-day beard, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted HEATHER-GRAY short-sleeve athletic compression shirt / rashguard with bold black-and-white "BJJ" lettering printed on the left chest, black athletic training shorts, and a simple gold wedding band on the ring finger of his left hand. Warm, paternal, authoritative, direct demeanor.
REGRA DE PERSONAGEM PERSONALIZADO: Se o usuário subir uma foto ou fornecer a descrição de um PERSONAGEM PERSONALIZADO (ex: médico de jaleco, nutricionista, cientista, terapeuta, etc.), você DEVE UTILIZAR ESTE PERSONAGEM ESPECÍFICO EM TODOS OS 9 PROMPTS com consistência visual e física absoluta, descrevendo suas roupas, idade, traços faciais, etnia e postura com o mesmo nível de riqueza fotorrealista.

3. PELE HUMANA — PRIORIDADE ABSOLUTA (REPETIR EM TODOS OS 9 PROMPTS):
Human skin must have genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, hands. Realistic sun exposure, tiny pigmentation variations, minute blemishes, faint sun spots, localized redness, subtle under-eye discoloration, fine facial vellus hairs, individual arm and body hairs, realistic hair follicles, natural forehead lines, nasolabial folds, tiny facial asymmetries. Subtle natural sheen on forehead and nose bridge; cheeks comparatively matte. Restrained realistic subsurface scattering under natural gym daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

4. MÃOS E DETALHES (REPETIR EM TODOS OS 9 PROMPTS):
Exactly five fingers per hand, correct adult male anatomy, correct finger lengths, realistic knuckles, veins, tendons, fine hairs, natural nails, skin folds, gold wedding band visible on left ring finger. Wrapping physically around objects with natural skin compression and physical weight. NO fused fingers, NO duplicated fingers, NO missing fingers, NO floating objects.

5. CENÁRIO (DOJO DE BJJ COM AS 3 BANDEIRAS PADRÃO OU CENÁRIO PERSONALIZADO DO USUÁRIO):
PADRÃO (se o usuário não especificar outro): Authentic Brazilian Jiu-Jitsu (BJJ) gym / martial arts dojo. Floor is covered with seamless light-gray puzzle/roll-out tatami mats. Lower section of the back wall is protected by dark-gray/black padded tatami wall mats. The upper wall is clean off-white with high gym windows letting in bright natural daylight, complemented by warm ceiling fluorescent gym lighting.
HANGING PROMINENTLY ON THE BACK WALL ARE THREE NATIONAL FLAGS SIDE BY SIDE IN EXACT ORDER:
1. Brazilian Flag (left, green and yellow with blue globe);
2. United States Flag (center, stars and stripes);
3. Israel Flag (right, white with blue stripes and Star of David).
In the center foreground is a solid, sturdy light-wood gym bench / demonstration table where objects and ingredients are placed.
REGRA DE CENÁRIO PERSONALIZADO: Se o usuário subir uma foto ou fornecer a descrição de um CENÁRIO PERSONALIZADO (ex: consultório médico moderno, cozinha rústica, laboratório, sala de atendimento, etc.), você DEVE UTILIZAR ESTE CENÁRIO ESPECÍFICO NA SEÇÃO 'SETTING' DE TODOS OS 9 PROMPTS, detalhando paredes, piso, iluminação ambiente, materiais da mesa/bancada de demonstração e elementos do fundo com precisão arquitetônica e óptica.

6. PROMPT 1 (00:00 - 00:08) — GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL:
Vertical 9:16, 4K, 30fps, live-action photographic realism, 20–24mm ultra-wide lens com perspectiva forçada dramática.
A constante fixa obrigatória é o MODELO ANATÔMICO EDUCACIONAL COLOSSAL (ocupando de 55% a 65% do enquadramento vertical 9:16 colado na lente em primeiro plano extremo):
- Cabeça/busto com grossa camada de gordura/sebo amarelado encobrindo os traços;
- Pulmões de fumante petrificados de alcatrão negro com textura crocante;
- Arcada dentária gigante aberta com cáries pretas e crostas colossais de tártaro amarelo;
- Estômago gigante com corte transversal aberto exibindo massa asquerosa de vermes/parasitas;
- Torso anatômico humano com cavidade torácica e abdominal aberta cheia de parasitas e muco.
No segundo 00:00 EXATO, o apresentador (debruçado atrás do modelo) executa a ação visceral no modelo colossal (despeja líquido reagente que corrói, bisturi cortando nódulo, pinça extraindo tampão, espremendo com força ou raspando crosta petrificada):
- A gordura amarela amolece e derrete em tiras viscosas;
- A crosta preta do pulmão estilhaça em cascas secas revelando pulmão rosa vivo;
- O tártaro efervesce com espuma branca densa limpando dentes brancos brilhantes;
- Os vermes e parasitas são lavados e escorrem viscosamente pela bancada.
Fala em Português direto, firme e visceral ("Isso aqui é o que o açúcar tá fazendo com a tua cara...", "Se tu fuma ou já fumou um dia na vida...", "Ninguém vai te contar isso porque as marcas de fita clareadora não querem que tu descubra...", "Nunca mistura cravo com limão, meu irmão...", "Atenção! Isso aqui vive dentro de você...").

7. PROMPT 2 (00:08 - 00:16) — EXPLICAÇÃO DO PROBLEMA (O QUE É O PROBLEMA / O QUE ESTÁ ACONTECENDO POR DENTRO):
O apresentador debruça sobre o modelo colossal com enquadramento em plano médio-curto (28mm). Ele aponta com precisão anatômica com os dedos para a patologia exposta (placas de gordura, tártaro calcificado, alcatrão, muco espesso ou cristais) e disseca visceralmente O QUE É ESSE PROBLEMA:
- Explica o mecanismo de acúmulo silencioso dessa crosta/inflamação no órgão do corpo;
- Demonstra como essa obstrução trava a circulação, sobrecarrega os tecidos e impede o fluxo biológico normal;
- Conecta diretamente a patologia aos sintomas diários que o público sente na pele (cansaço crônico, inchaço, lentidão metabólica, dor ou rigidez);
- Alterna o olhar entre a patologia dissecada e os olhos do espectador com didatismo magnético e autoridade de mentor;
- Fala em Português Brasileiro (~8s) com sincronização labial perfeita (lip-sync ao vivo na câmera), explicando o problema de forma simples, direta e impactante sem usar jargões incompreensíveis.

8. PROMPT 3 (00:16 - 00:24) — INGREDIENTES CASEIROS DA CURA NA BANCADA:
Dispostos no banco de madeira natural ao lado do modelo colossal (que preserva a patologia): potes, béqueres ou pratinhos de vidro com ingredientes caseiros da cozinha (limão cortado ao meio, pedaços de gengibre fresco, cúrcuma em pó dourada, cravos-da-índia inteiros, canela em pau, dentes de alho descascados, óleo de coco extravirgem, bicarbonato de sódio culinário, pote de mel puro com colher de madeira).
O apresentador mostra e aponta com as mãos para cada ingrediente, citando os nomes com clareza. Fala em Português explicando os compostos bioativos naturais de cada um para fortalecer a saúde do organismo na raiz (100% alinhado às diretrizes das plataformas: NUNCA diga para esquecer ou parar remédios da farmácia, nem ataque a medicina ou a indústria farmacêutica; o foco é total nos bioativos naturais da cozinha).

9. PROMPT 4 (00:24 - 00:32) — PREPARO PARTE 1: BASE E ADIÇÃO DOS PRIMEIROS INGREDIENTES NO RECIPIENTE/PANELA COM SINCRONIZAÇÃO LABIAL AO VIVO (ANTI-LOCUTOR):
O apresentador inicia o preparo da receita ao vivo na bancada de madeira na frente da câmera em plano médio (cintura para cima) que mostra COM TOTAL CLAREZA seu rosto, olhos, boca e lábios falando diretamente com o espectador, junto com a bancada e o objeto/panela exato do preparo:
- REGRA DE VARIEDADE DE INGREDIENTES E COERÊNCIA DO RECIPIENTE: NUNCA repita sempre os mesmos ingredientes em todos os temas! Os ingredientes devem variar de acordo com o problema tratado (ex: chás medicinais, infusões com limão e mel, béqueres de vidro para tônicos alcalinos, tigela de cerâmica para pastas ativas, etc.).
- REGRA DE OURO DE CONSISTÊNCIA VISUAL DO OBJETO/PANELA E CENÁRIO (PROMPT 4 & 5): O objeto de preparo (ex.: panela de inox com cabo de baquelite preto e água fervente sobre fogão de indução portátil preto, béquer de vidro refratário graduado, tigela de cerâmica rústica, ou pilão de pedra) e o cenário (mesma bancada, mesma iluminação, mesmo fundo) DEVEM SER DESCRITOS COM OS MESMOS DETALHES EXATOS E MATERIAIS NO PROMPT 4 E NO PROMPT 5 para garantir continuidade visual idêntica, sem mudar a panela, nem o objeto, nem o cenário de uma cena para a outra!
- REGRA INEGOCIÁVEL DE LIP SYNC E TOM HUMANO: NUNCA parecer um locutor de rádio, locutor publicitário ou voz em off narrando por cima de um vídeo de receitas. O apresentador fala DIRETAMENTE para a câmera com sincronização labial perfeita (lábios, mandíbula e língua articulando as palavras em Português com movimentos orgânicos). Ele conversa de forma espontânea, humana e magnética, como um mentor ensinando um amigo em sua bancada.
- Alternância natural de olhar e ação tátil: Ele olha rapidamente para o recipiente/panela ao colocar os primeiros ingredientes com os dedos (ex: panela com 200ml de água em fervura borbulhante e fumegante no fogão de indução portátil), adicionando os primeiros ingredientes sólidos da receita (ex: fatias de gengibre, rodelas de alho, canela em pau ou cravos), e olha fixo de volta no olho da câmera, falando com expressividade facial, entusiasmo e autoridade.
- Fala em Português coloquial, conversacional e envolvente (~8s) ensinando o início do preparo.

10. PROMPT 5 (00:32 - 00:40) — PREPARO PARTE 2: CONTINUIDADE DIRETA NO MESMO RECIPIENTE/PANELA DE ONDE PAROU O PROMPT 4 & ADIÇÃO DOS BIOATIVOS:
CONTINUIDADE TEMPORAL, FÍSICA E DE CENÁRIO INTACTA: O objeto de preparo (panela inox no fogão de indução, béquer ou tigela) e o cenário são RIGOROSAMENTE OS MESMOS do Prompt 4. A panela/recipiente NÃO muda de modelo, NÃO muda de cor, NÃO reseta nem começa do zero. Ela inicia o Prompt 5 EXATAMENTE no estado em que terminou o Prompt 4: com o mesmo formato, material, marcas de uso, contendo a mesma água/base já borbulhando com os primeiros ingredientes colocados no Prompt 4 dentro, soltando vapor aromático constante.
O apresentador continua em plano médio no mesmo cenário e mesma posição, mantendo sincronização labial direta e conversa natural na câmera (sem tom de locutor formal). Ele dá sequência imediata ao preparo adicionando os bioativos concentrados diretamente no MESMO recipiente que já contém os ingredientes anteriores:
- Adiciona os bioativos concentrados correspondentes aos ingredientes exibidos no Prompt 3 (ex: pós bioativos como cúrcuma ou canela, sumo de limão fresco espremido, vinagre de maçã, óleo virgem, mel puro em fio dourado ou gotas de tintura/própolis);
- Mexe tudo com o mesmo utensílio (colher de madeira, bastão de vidro ou colher de inox), homogeneizando a receita enquanto o vapor denso sobe e o apresentador fala ensinando o ponto exato da fórmula medicinal.

11. PROMPT 6 (00:40 - 00:48) — QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO QUE PRECISA PRA FICAR PRONTO:
O apresentador posiciona-se em plano médio ao lado da panela/recipiente no fogão portátil na bancada, falando DIRETAMENTE para a câmera com sincronização labial perfeita (lip-sync orgânico):
- Detalha expressamente as quantidades e proporções exatas de cada ingrediente (ex: quantidade de água em ml/xícaras, colheres de sopa/chá de cada pó ou ativo, meio limão espremido, gotas de tintura);
- Explica o tempo exato de preparo, fervura ou infusão que a receita precisa pra ficar pronta (ex: ferver em fogo brando por 5 minutos, repousar tampado por 3 minutos para concentrar os óleos essenciais);
- Gesticula didaticamente com os dedos e mãos indicando as doses e os minutos, demonstrando com segurança que a fórmula chegou ao ponto perfeito de potência terapêutica.

12. PROMPT 7 (00:48 - 00:56) — USO, DEGUSTAÇÃO & RELATO / AÇÃO NO ORGANISMO:
O apresentador segura a caneca de chá fumegante, o copo da mistura ou a escova ecológica.
Ele bebe um gole com satisfação, ou mostra a aplicação prática.
Fala em Português compartilhando relato real ou explicando a ação mecânica no corpo ("Minha mãe começou a tomar isso aos sessenta anos...", "Toma todo dia de manhã em jejum e tu vai ver...", "A cúrcuma solta o catarro preso, o limão empurra a sujeira pra fora e o mel acalma a garganta...").

13. PROMPT 8 (00:56 - 01:04) — CTA PARTE 1 — APRESENTAÇÃO DO ENCAPSULADO & CONCENTRAÇÃO DA FÓRMULA:
O apresentador faz a ponte da receita caseira para a conveniência e potência do produto encapsulado:
"Mas se você não tem tempo de fazer essa receita todo santo dia ou quer a concentração máxima desses bioativos puros sem sujeira..."
Ele ergue com autoridade na altura do peito o FRASCO DO SUPLEMENTO ENCAPSULADO (se o usuário enviou imagem ou nome de produto personalizado, utilize EXATAMENTE o frasco e nome fornecidos; caso contrário, use o produto padrão "FÓRMULA CONCENTRADA PURA CAPS" com frasco âmbar ou farmacêutico premium e rótulo profissional). Ele desrosqueia a tampa e exibe duas cápsulas vegetais concentradas na palma da mão, demonstrando que cada cápsula reúne a dose terapêutica pura dos bioativos sem trabalho na cozinha. Fala em Português com lip-sync perfeito e entusiasmo de mentor.

14. PROMPT 9 (01:04 - 01:12) — CTA PARTE 2 — OFERTA, CONVITE PARA AÇÃO & ESCASSEZ DO ENCAPSULADO:
O apresentador, segurando o frasco do encapsulado com firmeza em uma mão, aponta o dedo indicador diretamente para baixo (direção do link da bio e dos comentários "EU QUERO"):
"Comenta EU QUERO aqui embaixo ou clica no link da minha bio agora. O lote com desconto de fábrica e frete grátis é limitado e acaba rápido. Clica no link ou comenta EU QUERO agora e garante o teu frasco antes que o estoque zere!"
Ele encerra com olhar magnético de mentor, confiança inabalável e sorriso caloroso de autoridade paternal convidando para a ação imediata.
ATENÇÃO: NÃO incluir a fala "OSS!" na locução nem na ação do apresentador.

15. DIRETRIZES NEGATIVAS E DE CÂMERA (OBRIGATÓRIO EM TODOS OS 9 PROMPTS):
- REGRA CRÍTICA INEGOCIÁVEL — ABSOLUTAMENTE NENHUM TEXTO NEM LEGENDA NA TELA: NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO transcripts, NO lower thirds, NO banners, NO digital overlays, NO typography, NO graphic titles, NO logos, NO watermarks, NO artificial UI labels. The video must be purely clean visual footage without any post-production text, subtitles or overlays added on top. O vídeo NÃO deve mostrar legendas nem textos flutuantes sob nenhuma hipótese. (The only text allowed in the real physical world is the label printed on the physical supplement bottle in Prompts 8 and 9 and the BJJ compression shirt logo).
- Falas em Português Brasileiro coloquial, natural, direto e magnético (~8 segundos cada) exclusivamente faladas/dubladas em cena com sincronização labial direta (lip-sync), SEM colocar legendas queimadas ou embutidas na tela.
- promptText de cada uma das 9 cenas em INGLÊS FOTOGRÁFICO DETALHADO, completo e independente, OBRIGATORIAMENTE incluindo no início a cláusula negativa: "NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO typography, NO lower thirds, NO banners, NO titles, NO UI elements, NO watermarks. Clean raw cinematic video footage with zero text overlays, zero subtitles, and zero written words on screen."
- Sem filtros artificiais, sem cortes impossíveis, mantendo a autenticidade crua e viral do formato.
`;

// Helper to get initialized Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Multi-tier model fallback with immediate cascade for high-demand / 503 / 429 conditions
async function generateWithGeminiFallback(ai: GoogleGenAI, contents: any, config: any) {
  // Candidate models prioritized by stability, capacity and speed
  // gemini-3.8-flash is the primary model designated for this applet environment
  const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const responsePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });

      // 25s timeout to prevent hanging and allow graceful fallback
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout exceeding 25s on model ${model}`)), 25000)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);
      if (response && response.text) {
        return { response, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      console.log(`[Gemini Engine] Primary route busy or timed out (${model}): ${err?.message || err}, routing automatically to alternate tier...`);
      continue;
    }
  }

  throw lastError || new Error('Todos os modelos Gemini estão temporariamente indisponíveis.');
}

// Enforce strict ban on subtitles and on-screen text across all prompts
function enforceZeroTextAndSubtitles(script: any): any {
  if (!script || !Array.isArray(script.prompts)) {
    return script;
  }

  const negativeBanner = `NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO typography, NO transcripts, NO lower thirds, NO banners, NO graphic titles, NO digital overlays, NO logos, NO watermarks, NO artificial UI labels. Pure raw cinematic video footage with ZERO text overlays, ZERO subtitles, and ZERO written words on screen. Spoken audio delivered purely via realistic on-camera lip synchronization without on-screen subtitles.`;

  script.prompts.forEach((p: any) => {
    if (typeof p.promptText === 'string') {
      let text = p.promptText.trim();

      // Clean out any rogue directives that might prompt for subtitles or titles
      text = text
        .replace(/add\s+(subtitles|captions|text\s+overlay|lower\s+thirds)/gi, 'NO $1')
        .replace(/display\s+(subtitles|captions|on-screen\s+text)/gi, 'DO NOT display $1')
        .replace(/with\s+(on-screen\s+subtitles|captions\s+displayed)/gi, 'without on-screen subtitles');

      // Strip any existing partial negative banner to avoid duplicate headers
      text = text
        .replace(/^NEGATIVE PROMPT & ON-SCREEN TEXT BAN:[^\n]+\n*/gi, '')
        .replace(/^NO on-screen text, NO subtitles[^\n]+\n*/gi, '')
        .trim();

      // Ensure physical movements and foreground focal object are clearly preserved in the prompt
      let detailsSuffix = '';
      const lowerText = text.toLowerCase();
      if (p.actionSummary && !lowerText.includes(p.actionSummary.toLowerCase().slice(0, 25))) {
        detailsSuffix += `\n\nPHYSICAL MOVEMENTS & ACTION CONTINUITY:\n${p.actionSummary}`;
      }
      if (p.focalObject && !lowerText.includes(p.focalObject.toLowerCase().slice(0, 20))) {
        detailsSuffix += `\n\nFOREGROUND FOCAL OBJECT:\n${p.focalObject}`;
      }

      // Attach the comprehensive negative banner at the very top of each prompt
      p.promptText = `${negativeBanner}\n\n${text}${detailsSuffix}`;

      // Ensure spoken audio line is properly suffixed with the subtitle-free lip-sync note if not already integrated
      if (p.spokenLinePt && !p.promptText.includes(p.spokenLinePt)) {
        p.promptText = `${p.promptText.trim()}\n\nSPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization, spoken naturally without on-screen subtitles):\n"${p.spokenLinePt}"`;
      }
    }
  });

  return script;
}

// Fallback generator when API key is not yet set up
function generateLocalScript(
  theme: string, 
  referenceText?: string,
  hookActionType?: string,
  solutionIngredients?: string,
  customCharacterDescription?: string,
  customSettingDescription?: string,
  characterImageBase64?: string,
  settingImageBase64?: string,
  customProductTitle?: string,
  productImageBase64?: string,
  productImageMimeType?: string,
  referenceVideoBase64?: string,
  videoFileName?: string,
  // Legacy aliases for backward compatibility
  customBookTitle?: string,
  bookImageBase64?: string,
  bookImageMimeType?: string,
  promptCount: number = 9,
  includeCTA: boolean = true
): any {
  return generateLocalScriptModular(
    theme,
    referenceText,
    hookActionType,
    solutionIngredients,
    customCharacterDescription,
    customSettingDescription,
    characterImageBase64,
    settingImageBase64,
    customProductTitle,
    productImageBase64,
    productImageMimeType,
    referenceVideoBase64,
    videoFileName,
    customBookTitle,
    bookImageBase64,
    bookImageMimeType,
    promptCount,
    includeCTA
  );
}

// Main script generation endpoint
const handleGenerateScript = async (req: any, res: any) => {
  try {
    const { 
      theme, 
      referenceText, 
      referenceImageBase64, 
      imageMimeType, 
      referenceVideoBase64,
      videoMimeType,
      videoFileName,
      videoFileSizeMB,
      giantModelPreference, 
      hookStyle,
      solutionIngredients,
      objectScale = 'colossal_60',
      hookActionType = 'liquid_pouring',
      characterMode = 'default_bjj_master',
      customCharacterDescription,
      characterImageBase64,
      characterImageMimeType,
      settingMode = 'default_bjj_dojo',
      customSettingDescription,
      settingImageBase64,
      settingImageMimeType,
      customProductTitle,
      productImageBase64,
      productImageMimeType,
      productImageName,
      // Backward compatibility aliases
      customBookTitle,
      bookImageBase64,
      bookImageMimeType,
      promptCount,
      includeCTA
    } = req.body;

    const requestedPromptCount = Math.max(3, Math.min(12, Number(promptCount) || 9));
    const hasCTA = includeCTA !== false;

    const finalProductTitle = (customProductTitle || customBookTitle || '').trim();
    const finalProductImage = productImageBase64 || bookImageBase64;
    const finalProductMime = productImageMimeType || bookImageMimeType;
    const finalProductName = productImageName || 'produto-encapsulado.jpg';

    if (!theme && !referenceText && !referenceImageBase64 && !referenceVideoBase64 && !characterImageBase64 && !settingImageBase64 && !finalProductTitle && !finalProductImage) {
      return res.status(400).json({ error: 'Forneça ao menos um tema, vídeo viral, texto, produto ou imagem de referência.' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback to our engineered script generator
      const script = generateLocalScript(
        theme || 'Saúde e Fisiologia Humana', 
        referenceText,
        hookActionType,
        solutionIngredients,
        customCharacterDescription,
        customSettingDescription,
        characterImageBase64,
        settingImageBase64,
        finalProductTitle,
        finalProductImage,
        finalProductMime,
        referenceVideoBase64,
        videoFileName,
        undefined,
        undefined,
        undefined,
        requestedPromptCount,
        hasCTA
      );
      return res.json({ script, source: 'offline-template' });
    }

    // Build specific hook directive
    let hookActionDirective = '';
    if (hookActionType && hookActionType !== 'varied_dynamic') {
      const hookDescriptions: Record<string, string> = {
        surgical_slice: 'Corte / Dissecção com bisturi: no segundo 00:00, o apresentador fatia um nódulo ou camada espessa do modelo colossal com bisturi cirúrgico, abrindo e revelando o interior asqueroso.',
        pinch_extraction: 'Extração com pinça cirúrgica: no segundo 00:00, o apresentador usa pinça anatômica longa para puxar com tração física um verme, cálculo ou tampão escuro entalado em orifício do modelo colossal.',
        pressure_squeeze: 'Compressão / Espremer com as duas mãos: no segundo 00:00, o apresentador aperta com força extrema um nódulo ou tecido inflamado do modelo colossal, expelindo secreção ou pasta densa.',
        scraping_abrasion: 'Raspagem / Fricção abrasiva: no segundo 00:00, o apresentador usa espátula metálica ou chave odontológica para raspar energicamente o modelo colossal, arrancando lascas crocantes e pó de crosta.',
        catheter_unclog: 'Desobstrução mecânica de duto: no segundo 00:00, o apresentador insere sonda ou cateter em um duto entupido do modelo colossal, empurrando para fora rolha de gordura ou coágulo.',
        uv_reveal: 'Luz Ultravioleta (UV): no segundo 00:00, o apresentador acende lanterna UV sob meia-luz sobre o modelo colossal, acendendo biofilme bacteriano fluorescente verde-neon vibrante.',
        needle_injection: 'Injeção sob pressão: no segundo 00:00, o apresentador crava agulha de seringa no modelo colossal, injetando fluido que incha instantaneamente um vaso ou tecido sob tensão.',
        liquid_pouring: 'Despejo de líquido ativo: no segundo 00:00, o apresentador despeja líquido contínuo de garrafa ou pote sobre o modelo colossal, borbulhando e escorrendo pelas cavidades.'
      };
      hookActionDirective = `AÇÃO ESPECÍFICA DO GANCHO NO SEGUNDO 00:00: ${hookDescriptions[hookActionType] || hookActionType}`;
    } else {
      hookActionDirective = `REGRA CRUCIAL DE GANCHO NO SEGUNDO 00:00 (NUNCA FAÇA A MESMA COISA SEMPRE!):
- CRIE UM GANCHO VISUAL TOTALMENTE INÉDITO, VISCERAL E SURPREENDENTE PARA ESTE TEMA!
- A ÚNICA COISA FIXA E OBRIGATÓRIA É O OBJETO ENORME/COLOSSAL (55% a 65% do enquadramento vertical 9:16) SEMPRE EM PRIMEIRO PLANO DEMONSTRANDO VISUALMENTE A PATOLOGIA.
- A AÇÃO NO SEGUNDO 00:00 DEVE SER DIFERENTE E INOVADORA A CADA VÍDEO (ex.: corte com bisturi abrindo o modelo e revelando o interior, pinça cirúrgica puxando algo asqueroso ou cálculo entalado, duas mãos espremendo tecido inflamado com secreção densa jorrando, espátula metálica arrancando lascas crocantes de crosta, lanterna UV acendendo biofilme fluorescente no escuro, sonda desobstruindo canal entupido, injeção com agulha inchando vaso, etc.). NUNCA repita sempre a mesma ação!`;
    }

    // Specific character instructions
    let characterDirective = '';
    if (characterImageBase64) {
      characterDirective = `DIRETIVA DE PERSONAGEM PERSONALIZADO FORNECIDO VIA FOTO:
O usuário enviou uma FOTO DO PERSONAGEM/APRESENTADOR. Você DEVE analisar minuciosamente os traços da pessoa na foto (gênero, idade aproximada, formato facial, cabelo, barba, olhos, compleição física, tom de pele e vestimenta).
REGRA OBRIGATÓRIA: Em TODOS OS 9 PROMPTS, descreva ESTE PERSONAGEM com fidelidade absoluta, incluindo seus poros, textura de pele e microexpressões, substituindo a figura do Mestre de BJJ padrão!`;
    } else if (customCharacterDescription) {
      characterDirective = `DIRETIVA DE PERSONAGEM PERSONALIZADO (TEXTO):
${customCharacterDescription}. Mantenha a identidade e características físicas deste personagem em todos os 9 prompts.`;
    } else {
      characterDirective = `DIRETIVA DE PERSONAGEM PADRÃO:
Apresentador Oficial: Mestre de Jiu-Jitsu veterano de ~50 anos, porte atlético/lutador, orelhas de couve-flor (cauliflower ears), rashguard cinza BJJ no peito esquerdo, bermuda preta, aliança de ouro no anular esquerdo, poros naturais e sem filtros de beleza.`;
    }

    // Specific setting instructions
    let settingDirective = '';
    if (settingImageBase64) {
      settingDirective = `DIRETIVA DE CENÁRIO PERSONALIZADO FORNECIDO VIA FOTO:
O usuário enviou uma FOTO DO CENÁRIO/AMBIENTE DE FUNDO. Você DEVE analisar minuciosamente o espaço (arquitetura, iluminação, paredes, bancada de apoio, objetos de fundo).
REGRA OBRIGATÓRIA: Em TODOS OS 9 PROMPTS, utilize ESTE CENÁRIO exato como o fundo e bancada das ações, substituindo o Dojo de BJJ e as bandeiras da parede!`;
    } else if (customSettingDescription) {
      settingDirective = `DIRETIVA DE CENÁRIO PERSONALIZADO (TEXTO):
${customSettingDescription}. Mantenha este ambiente como o cenário e balcão de apoio em todos os 9 prompts.`;
    } else {
      settingDirective = `DIRETIVA DE CENÁRIO PADRÃO:
Cenário Oficial: Dojo BJJ com tatame cinza, banco de madeira rústico e AS TRÊS BANDEIRAS NA PAREDE DO FUNDO (Brasil, Estados Unidos e Israel lado a lado).`;
    }

    // Build parts for Gemini
    const contents: any[] = [];

    if (characterImageBase64) {
      const cleanData = characterImageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: characterImageMimeType || 'image/jpeg',
          data: cleanData
        }
      });
      contents.push({
        text: `[IMAGEM 1 — FOTO DE REFERÊNCIA DO PERSONAGEM]: Utilize este personagem real como base para a descrição do apresentador em TODOS os 9 prompts, capturando seus traços faciais, idade, cabelo, biotipo e estilo com máxima coerência.`
      });
    }

    if (settingImageBase64) {
      const cleanData = settingImageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: settingImageMimeType || 'image/jpeg',
          data: cleanData
        }
      });
      contents.push({
        text: `[IMAGEM 2 — FOTO DE REFERÊNCIA DO CENÁRIO]: Utilize este ambiente real como o cenário de fundo e balcão de demonstração em TODOS os 9 prompts, com iluminação e arquitetura idênticas.`
      });
    }

    if (referenceImageBase64 && imageMimeType) {
      const cleanData = referenceImageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: imageMimeType,
          data: cleanData
        }
      });
      contents.push({
        text: `[IMAGEM 3 — REFERÊNCIA DE MODELO ANATÔMICO OU PROBLEMA]: Analise esta referência visual para conceber o modelo colossal em primeiro plano.`
      });
    }

    if (referenceVideoBase64 && videoMimeType) {
      const cleanData = referenceVideoBase64.replace(/^data:[^;]+;base64,/, '');
      const approxByteSize = Math.round((cleanData.length * 3) / 4);

      // Only pass inlineData if the video is under 15MB to prevent Gemini 400 Payload Too Large
      if (approxByteSize < 15 * 1024 * 1024) {
        contents.push({
          inlineData: {
            mimeType: videoMimeType,
            data: cleanData
          }
        });
      }

      contents.push({
        text: `[VÍDEO VIRAL DE REFERÊNCIA ENVIADO PELO USUÁRIO${videoFileName ? ` (${videoFileName})` : ''}]:
O usuário enviou este VÍDEO VIRAL REAL de referência para análise aprofundada de retenção e estrutura.
ANALISE PROFUNDAMENTE A ENGENHARIA VIRAL DESTE VÍDEO:
1. O GANCHO NOS PRIMEIROS SEGUNDOS (00:00 - 00:08): Qual elemento ou ação chamou atenção imediata? Qual o modelo ou objeto focal em destaque? Houve corte, extração, despejo ou revelação de impacto?
2. A LINGUAGEM VISUAL: Enquadramento vertical, distância da câmera (plano médio do apresentador, primeiro plano do objeto), iluminação e texturas.
3. INGREDIENTES E AÇÕES PRÁTICAS: Quais ingredientes foram manipulados na bancada? Qual foi a ação de preparo demonstrada?
4. CADÊNCIA E TOM: Como o apresentador fala? (Tom conversacional natural, olhando nos olhos, sem parecer locutor comercial).
TRANSPONHA ESSA ENGENHARIA VIRAL para nossa sequência oficial de 9 PROMPTS de 8 segundos (72s total):
- PROMPT 1: Gancho visual chocante com modelo colossal (60% do quadro) replicando a força do gancho do vídeo viral.
- PROMPT 2: Explicação profunda do problema e patologia interna demonstrada no modelo colossal.
- PROMPT 3: Ingredientes caseiros na bancada (mostrar, citar nomes e bioativos).
- PROMPT 4: Preparo Parte 1: Base de água fervente na panela inox, adicionando os primeiros ingredientes com lip-sync ao vivo (anti-locutor).
- PROMPT 5: Preparo Parte 2: Continuação contínua na mesma panela já com os ingredientes anteriores dentro, adicionando bioativos concentrados (cúrcuma, limão fresco, mel puro).
- PROMPT 6: Quantidade exata dos ingredientes e tempo de preparo/fervura/infusão que a receita precisa pra ficar pronta com máxima potência terapêutica.
- PROMPT 7: Uso/Degustação e relato do efeito biológico curativo.
- PROMPT 8: CTA Parte 1: Apresentação do suplemento encapsulado concentrado, transição de conveniência e exibição das duas cápsulas concentradas.
- PROMPT 9: CTA Parte 2: Chamada para ação direta ("Comenta EU QUERO" / link da bio), escassez de lote e oferta com desconto de fábrica.`
      });
    }

    if (finalProductImage) {
      const cleanData = finalProductImage.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: finalProductMime || 'image/jpeg',
          data: cleanData
        }
      });
      contents.push({
        text: `[IMAGEM DO PRODUTO ENCAPSULADO DOS PROMPTS 8 E 9]: O usuário enviou a foto real do frasco de suplemento encapsulado que o apresentador deve exibir nos Prompts 8 e 9. O promptText dos Prompts 8 e 9 DEVE descrever o frasco de suplemento reproduzindo com fidelidade esta imagem (frasco, rótulo, cores e design), exibindo com destaque o título "${finalProductTitle || 'SUPLEMENTO ENCAPSULADO'}" impresso no rótulo.`
      });
    }

    const productTitleToUse = finalProductTitle || 'FÓRMULA CONCENTRADA PURA CAPS';
    const productDirective = finalProductTitle || finalProductImage
      ? `DIRETIVA DE SUPLEMENTO ENCAPSULADO PERSONALIZADO: O apresentador ergue e exibe o FRASCO DO SUPLEMENTO ENCAPSULADO DO USUÁRIO intitulado "${productTitleToUse}".${finalProductImage ? ' O design do frasco e rótulo deve seguir minuciosamente a imagem de referência enviada.' : ''}`
      : `DIRETIVA DE SUPLEMENTO ENCAPSULADO PADRÃO: O apresentador ergue e exibe o frasco de suplemento "FÓRMULA CONCENTRADA PURA CAPS" com corpo âmbar, tampa fosca e rótulo botânico premium com cápsulas vegetais concentradas.`;
    
    const ctaDirective = hasCTA
      ? `DIRETIVA DE CTA E TRANSIÇÃO COMERCIAL (PROMPTS FINAIS ${requestedPromptCount - 1} e ${requestedPromptCount}): O roteiro DEVE finalizar com os 2 prompts de conversão do produto encapsulado:
- PROMPT ${requestedPromptCount - 1} (CTA PARTE 1): Apresentação do suplemento encapsulado "${productTitleToUse}", transição da receita caseira para a conveniência e exibição das 2 cápsulas concentradas na palma da mão.
- PROMPT ${requestedPromptCount} (CTA PARTE 2): Chamada para ação direta com senso de urgência ("Comenta EU QUERO" / link da bio), escassez de lote e oferta com desconto de fábrica (SEM a fala "OSS!").`
      : `DIRETIVA SEM CTA (ROTEIRO 100% ORGÂNICO): O usuário DESATIVOU os prompts de CTA comercial. Este vídeo NÃO DEVE TER NENHUMA menção a produto, frasco, suplemento ou venda. TODOS os ${requestedPromptCount} prompts devem ser 100% orgânicos, focados no conteúdo educativo, receita na panela e orientações de saúde e longevidade.`;

    let userPromptText = `Gere a sequência oficial de EXATAMENTE ${requestedPromptCount} PROMPTS conectados de 8s cada (${requestedPromptCount * 8}s no total) com alta fidelidade visual, narrativa visceral e ritmo dinâmico.

TEMA SOLICITADO: ${theme || 'Análise de referência fornecida'}
${giantModelPreference ? `PREFERÊNCIA DE MODELO ANATÔMICO: ${giantModelPreference}` : ''}
${hookStyle ? `ESTILO DO GANCHO: ${hookStyle}` : ''}
${solutionIngredients ? `INGREDIENTES CASEIROS SOLICITADOS: ${solutionIngredients}` : 'INGREDIENTES CASEIROS DA CURA: Selecione e especifique ingredientes caseiros variados e pertinentes ao tema (ATENÇÃO: NUNCA repita sempre os mesmos ingredientes! Varie entre chás digestivos, vinagre de maçã, alho triturado, canela, hortelã, bicarbonato, óleo virgem, cúrcuma, etc., adequando a cada patologia).'}
ESCALA DO OBJETO NO GANCHO: OBJETO COLOSSAL OCUPANDO 55% A 65% DO ENQUADRAMENTO VERTICAL 9:16 (em primeiro plano extremo colado na lente, perspectiva forçada ultra-wide 20-24mm).
${hookActionDirective}

${characterDirective}

${settingDirective}

${hasCTA ? productDirective : ''}

${ctaDirective}

DIRETRIZ DE SEGURANÇA E POLÍTICAS DE ANÚNCIOS/PLATAFORMAS (OBRIGATÓRIO): NUNCA mande o público esquecer ou parar remédios da farmácia, NUNCA ataque a medicina tradicional e NUNCA invente teorias da conspiração farmacêutica. O discurso deve ser 100% focado no poder dos compostos bioativos naturais da culinária, garantindo total conformidade com as diretrizes do Meta, TikTok e YouTube sem risco de restrições ou bloqueios.

${referenceText ? `REFERÊNCIA / TRANSCRIÇÃO FORNECIDA:\n"""${referenceText}"""\nAnalise a engenharia visual da referência (ordem das ações, escala dos objetos, composição, perspectiva, ritmo, transformação).` : ''}

Lembre-se:
1. Formato exato: EXATAMENTE ${requestedPromptCount} PROMPTS conectados de 8 segundos cada (${requestedPromptCount * 8}s total), formato 9:16 vertical, 4K, 30fps.
2. Cada prompt deve ser completo e independente, repetindo toda a descrição do Apresentador (respeitando a foto ou descrição personalizada caso enviada), da Pele Humana (poros, vellus hair, sem filtros de beleza), das Mãos (5 dedos, anatomia correta), do Cenário (respeitando a foto ou descrição personalizada caso enviada) e da Câmera.
3. Objeto educacional COLOSSAL em primeiro plano extremo (ocupando de 55% a 65% da tela 9:16) é a constante fixa no Prompt 1 demonstrando a condição patológica.
4. O roteiro deve cobrir de forma harmônica a explicação didática do problema, a exibição dos ingredientes naturais, o preparo ao vivo mantendo consistência da mesma panela inox e utensílios, tempo/medidas de infusão, degustação${hasCTA ? ` e nos 2 últimos prompts a oferta do produto encapsulado "${productTitleToUse}"` : ' e rotina matinal sem CTA comercial'}.
5. Todas as falas em Português Brasileiro (~8 segundos cada, diretas, autênticas e magnéticas).
6. O promptText de cada cena deve estar em inglês altamente descritivo e pronto para ferramentas de geração de vídeo (Sora, Runway Gen-3, Kling, Luma).
7. REGRA CRÍTICA INEGOCIÁVEL — SEM LEGENDAS E SEM TEXTO NA TELA (ZERO SUBTITLES, ZERO ON-SCREEN TEXT): O vídeo NÃO deve exibir legendas nem qualquer tipo de texto na tela. O promptText de CADA UM dos prompts DEVE começar OBRIGATORIAMENTE com a proibição:
"NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO lower thirds, NO banners, NO typography, NO UI elements, NO watermarks. Clean raw cinematic video footage with zero text overlays and zero subtitles."
A fala do apresentador é estritamente falada em cena com sincronização labial (lip-sync), NUNCA gerada ou embutida como legenda na tela!`;

    contents.push({ text: userPromptText });

    let parsed: any = null;
    let sourceModel = 'gemini';

    try {
      const { response, modelUsed } = await generateWithGeminiFallback(
        ai,
        contents.length === 1 ? contents[0].text : { parts: contents },
        {
          systemInstruction: CORPO_REVELADO_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING, description: 'Tema do vídeo' },
              summary: { type: Type.STRING, description: 'Resumo da narrativa em 1 frase' },
              focalObject: { type: Type.STRING, description: 'Nome e descrição do modelo educacional gigante ou objeto em primeiro plano' },
              targetProblem: { type: Type.STRING, description: 'O problema físico visual demonstrado' },
              solutionIngredients: { type: Type.STRING, description: 'Ingredientes reais da receita/solução apresentados no Prompt 2 para resolver o problema' },
              elementsPrepared: { type: Type.STRING, description: 'Elementos ou ingredientes preparados na bancada' },
              transformationType: { type: Type.STRING, description: 'Tipo de transformação física visual demonstrada' },
              referenceAnalysis: {
                type: Type.OBJECT,
                properties: {
                  hasReference: { type: Type.BOOLEAN },
                  detectedHook: { type: Type.STRING },
                  detectedObject: { type: Type.STRING },
                  pacingPreserved: { type: Type.STRING }
                }
              },
              prompts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER, description: 'Número do prompt (1 a 9)' },
                    stepName: { type: Type.STRING, description: 'Título oficial do prompt com duração de 8s' },
                    durationSeconds: { type: Type.INTEGER, description: 'Duração exata em segundos (sempre 8)' },
                    timeRange: { type: Type.STRING, description: 'Faixa de tempo, ex: 00:00 - 00:08' },
                    focalObject: { type: Type.STRING, description: 'Estado e posição do objeto principal nesta cena' },
                    actionSummary: { type: Type.STRING, description: 'Resumo da ação física e continuidade' },
                    spokenLinePt: { type: Type.STRING, description: 'Fala do apresentador em Português Brasileiro (cabe em aprox. 8s)' },
                    promptText: { type: Type.STRING, description: 'Prompt completo e autossuficiente em inglês para geração de vídeo IA' }
                  },
                  required: ['id', 'stepName', 'durationSeconds', 'timeRange', 'focalObject', 'actionSummary', 'spokenLinePt', 'promptText']
                }
              }
            },
            required: ['theme', 'summary', 'focalObject', 'targetProblem', 'elementsPrepared', 'transformationType', 'prompts']
          }
        }
      );

      const rawText = (response.text || '').trim();
      const cleanedJson = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleanedJson);
      sourceModel = modelUsed;
    } catch (apiError: any) {
      console.log('[Gemini Generator] Utilizing local high-fidelity generator fallback');
      parsed = generateLocalScript(
        theme || 'Demonstração de Saúde', 
        referenceText,
        hookActionType,
        solutionIngredients,
        customCharacterDescription,
        customSettingDescription,
        characterImageBase64,
        settingImageBase64,
        finalProductTitle,
        finalProductImage,
        finalProductMime,
        referenceVideoBase64,
        videoFileName,
        undefined,
        undefined,
        undefined,
        requestedPromptCount,
        hasCTA
      );
      sourceModel = 'fallback-local-engine';
    }

    // Verify prompts structure; if missing or invalid, trigger local engine fallback
    if (!parsed || !Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
      console.log('[Gemini Generator] Output was missing prompts, utilizing local generator fallback');
      parsed = generateLocalScript(
        theme || 'Demonstração de Saúde', 
        referenceText,
        hookActionType,
        solutionIngredients,
        customCharacterDescription,
        customSettingDescription,
        characterImageBase64,
        settingImageBase64,
        finalProductTitle,
        finalProductImage,
        finalProductMime,
        referenceVideoBase64,
        videoFileName,
        undefined,
        undefined,
        undefined,
        requestedPromptCount,
        hasCTA
      );
      sourceModel = 'fallback-local-engine';
    }

    // Ensure metadata regarding character, scenario, product and reference analysis are saved to the response
    const characterLabel = customCharacterDescription || (characterImageBase64 ? 'Personagem Personalizado (Foto enviada)' : 'Mestre de BJJ Oficial (Padrão)');
    const settingLabel = customSettingDescription || (settingImageBase64 ? 'Cenário Personalizado (Foto enviada)' : 'Dojo BJJ com 3 Bandeiras (Padrão)');
    parsed.characterUsed = parsed.characterUsed || characterLabel;
    parsed.settingUsed = parsed.settingUsed || settingLabel;

    const productTitleToRecord = finalProductTitle || 'FÓRMULA CONCENTRADA PURA CAPS';
    parsed.productTitleUsed = hasCTA ? productTitleToRecord : undefined;
    parsed.bookTitleUsed = hasCTA ? productTitleToRecord : undefined; // Legacy field preservation

    if (characterImageBase64) {
      parsed.characterImagePreview = characterImageBase64.startsWith('data:') ? characterImageBase64 : `data:${characterImageMimeType || 'image/jpeg'};base64,${characterImageBase64}`;
    }
    if (settingImageBase64) {
      parsed.settingImagePreview = settingImageBase64.startsWith('data:') ? settingImageBase64 : `data:${settingImageMimeType || 'image/jpeg'};base64,${settingImageBase64}`;
    }
    if (hasCTA && finalProductImage) {
      const previewUrl = finalProductImage.startsWith('data:') ? finalProductImage : `data:${finalProductMime || 'image/jpeg'};base64,${finalProductImage}`;
      parsed.productImagePreview = previewUrl;
      parsed.bookImagePreview = previewUrl; // Legacy field preservation
    }

    // Reference Analysis metadata preservation
    if (referenceVideoBase64) {
      parsed.referenceAnalysis = {
        hasReference: true,
        referenceType: 'video',
        videoFileName: videoFileName || 'video-viral-referencia.mp4',
        videoFileSizeMB: videoFileSizeMB,
        detectedHook: parsed.referenceAnalysis?.detectedHook || 'Gancho visual dinâmico e retenção inicial replicados do vídeo viral',
        detectedObject: parsed.referenceAnalysis?.detectedObject || parsed.focalObject,
        pacingPreserved: parsed.referenceAnalysis?.pacingPreserved || `${parsed.prompts?.length || requestedPromptCount} etapas de 8s (${(parsed.prompts?.length || requestedPromptCount) * 8}s total) com quantidade e tempo de preparo, continuidade de panela e lip-sync`
      };
    } else if (referenceImageBase64) {
      parsed.referenceAnalysis = {
        hasReference: true,
        referenceType: 'image',
        detectedHook: parsed.referenceAnalysis?.detectedHook || 'Gancho visual e objeto colossal derivados da imagem de referência',
        detectedObject: parsed.referenceAnalysis?.detectedObject || parsed.focalObject,
        pacingPreserved: parsed.referenceAnalysis?.pacingPreserved || `Enquadramento e escala anatômica preservados em ${parsed.prompts?.length || requestedPromptCount} atos`
      };
    } else if (referenceText) {
      parsed.referenceAnalysis = {
        hasReference: true,
        referenceType: 'text',
        detectedHook: parsed.referenceAnalysis?.detectedHook || 'Estrutura narrativa adaptada da referência textual fornecida',
        detectedObject: parsed.referenceAnalysis?.detectedObject || parsed.focalObject,
        pacingPreserved: parsed.referenceAnalysis?.pacingPreserved || `Fórmula de ${parsed.prompts?.length || requestedPromptCount} atos com lip-sync`
      };
    }

    // Normalize prompt indices and durations
    const formatTimeSec = (sec: number) => {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    if (Array.isArray(parsed.prompts)) {
      parsed.prompts.forEach((p: any, idx: number) => {
        p.id = idx + 1;
        p.durationSeconds = 8;
        const start = idx * 8;
        const end = (idx + 1) * 8;
        p.timeRange = `${formatTimeSec(start)} - ${formatTimeSec(end)}`;
      });
      parsed.promptCount = parsed.prompts.length;
      parsed.totalDurationSeconds = parsed.prompts.length * 8;
    }
    parsed.includeCTA = hasCTA;

    // Apply strict enforcement: ABSOLUTELY NO SUBTITLES, NO CAPTIONS, NO ON-SCREEN TEXT across all prompts
    parsed = enforceZeroTextAndSubtitles(parsed);

    parsed.id = `script-${Date.now()}`;
    parsed.createdAt = new Date().toISOString();

    return res.json({ script: parsed, source: sourceModel });
  } catch (fatalError: any) {
    console.log('[Generation Handler] Local fallback invoked:', fatalError?.message || fatalError);
    const fallbackScript = generateLocalScript(
      req.body?.theme || 'Demonstração de Saúde', 
      req.body?.referenceText,
      req.body?.hookActionType,
      req.body?.solutionIngredients,
      req.body?.customCharacterDescription,
      req.body?.customSettingDescription,
      req.body?.characterImageBase64,
      req.body?.settingImageBase64,
      req.body?.customProductTitle || req.body?.customBookTitle,
      req.body?.productImageBase64 || req.body?.bookImageBase64,
      req.body?.productImageMimeType || req.body?.bookImageMimeType,
      req.body?.referenceVideoBase64,
      req.body?.videoFileName,
      undefined,
      undefined,
      undefined,
      Math.max(3, Math.min(12, Number(req.body?.promptCount) || 9)),
      req.body?.includeCTA !== false
    );
    return res.json({ script: enforceZeroTextAndSubtitles(fallbackScript), source: 'fallback' });
  }
};

// Chat endpoint matching the exact conversational rules
const handleChat = async (req: any, res: any) => {
  try {
    const { message, history } = req.body;
    const lower = (message || '').trim().toLowerCase();

    // Check conversational trigger rules:
    // When the user says "vamos começar?", "novo vídeo", "vamos fazer outro" or similar:
    const isStarterQuery = lower.includes('vamos começar') || 
                           lower.includes('novo vídeo') || 
                           lower.includes('novo video') || 
                           lower.includes('vamos fazer outro') || 
                           lower.includes('começar') || 
                           lower === 'oi' || 
                           lower === 'olá';

    if (isStarterQuery && lower.length < 30) {
      return res.json({
        reply: 'Qual é o tema? Pode enviar também o vídeo ou as imagens de referência.',
        action: 'ask_theme'
      });
    }

    // Direct theme provided! If it looks like a theme or instruction, generate script directly!
    const ai = getGeminiClient();

    if (!ai) {
      const script = enforceZeroTextAndSubtitles(generateLocalScript(message));
      return res.json({
        reply: `Aqui está a sequência oficial de 9 prompts de 8 segundos (72s no total) para o tema "${message}", com o Mestre de BJJ no dojo com as 3 bandeiras, explicação do problema, ingredientes, o preparo ao vivo na panela em duas partes com lip-sync, quantidade de ingredientes e tempo de preparo no Prompt 6, degustação no Prompt 7, e o produto encapsulado nos Prompts 8 e 9 (apresentação da fórmula e oferta com escassez, sem legendas nem textos na tela):`,
        script,
        action: 'script_generated'
      });
    }

    try {
      // Call Gemini with multi-model fallback
      const { response } = await generateWithGeminiFallback(
        ai,
        `O usuário enviou a seguinte mensagem para o Agente Corpo Revelado:
"""${message}"""

Se a mensagem for uma saudação ou pedido de início como "vamos começar?", pergunte apenas com energia: "Qual é o tema? Pode enviar também o vídeo ou as imagens de referência."
Se o usuário já tiver fornecido um tema, estruture a resposta no padrão do Mestre de BJJ no dojo com as 3 bandeiras (Brasil, EUA e Israel), modelo colossal no gancho no Prompt 1, explicação do problema no Prompt 2, ingredientes da cozinha no Prompt 3, preparo ao vivo na panela inox em duas partes com lip-sync nos Prompts 4 e 5, quantidade de ingredientes e tempo de preparo no Prompt 6, degustação no Prompt 7, e os 2 CTAs do produto encapsulado nos Prompts 8 e 9 (apresentação do frasco e cápsulas no Prompt 8 e oferta/link da bio/comenta EU QUERO no Prompt 9, SEM a fala "OSS!" e SEM legendas nem textos na tela).`,
        {
          systemInstruction: CORPO_REVELADO_SYSTEM_INSTRUCTION
        }
      );

      return res.json({
        reply: response.text,
        action: 'response'
      });
    } catch (chatError: any) {
      console.warn('[Chat Warning] Gemini models temporarily busy, generating resilient response:', chatError?.message || chatError);
      const script = enforceZeroTextAndSubtitles(generateLocalScript(message));
      return res.json({
        reply: `Aqui está a sequência oficial de 9 prompts de 8 segundos (72s no total) para o tema "${message}", com o Mestre de BJJ no dojo com as 3 bandeiras, quantidade e tempo de preparo no Prompt 6, preparo ao vivo com lip-sync e o produto encapsulado nos Prompts 8 e 9 (sem legendas nem textos na tela):`,
        script,
        action: 'script_generated'
      });
    }
  } catch (error: any) {
    console.warn('[Chat Handler] Safe error catch:', error?.message || error);
    const script = generateLocalScript(req.body?.message || 'Saúde e Longevidade');
    return res.json({
      reply: 'Qual é o tema que você deseja trabalhar hoje? Pode enviar também o vídeo ou as imagens de referência.',
      script,
      action: 'ask_theme'
    });
  }
};

// Endpoint to recommend dynamic & curated viral themes
const handleRecommend = async (req: any, res: any) => {
  try {
    const exclude = Array.isArray(req.body?.exclude)
      ? req.body.exclude.map(String)
      : typeof req.body?.exclude === 'string'
        ? req.body.exclude.split(',')
        : [];
    const ai = getGeminiClient();

    if (!ai) {
      const suggestions = getRandomThemeSuggestions(6, exclude);
      return res.json({ suggestions, source: 'curated' });
    }

    try {
      const prompt = `Gere exatamente 6 ideias inéditas de temas virais de alta retenção para vídeos curtos de saúde e receitas caseiras no formato da página "Corpo Revelado" (com modelo anatômico gigante 60% e receitas caseiras).
Evite repetir os seguintes temas já exibidos: ${exclude.slice(0, 15).join(', ')}.

Retorne estritamente um array JSON contendo 6 objetos com as seguintes chaves:
- "theme": título curto em português brasileiro do tema/condição (ex: "Gordura na vesícula e pedras de colesterol", "Unhas esfareladas por micose crônica", "Refluxo cáustico e queimação na garganta").
- "model": descrição do modelo anatômico colossal ocupando 60% da tela (ex: "Vesícula Biliar Gigante 60% com Pedras de Colesterol Amarelas").
- "hookType": exatamente um dos seguintes: "curiosidade", "problema_visivel", "segredo", "descoberta".
- "tag": categoria em português (ex: "Digestão", "Saúde Bucal", "Articulações & Dor", "Pele & Unhas", "Respiração", "Metabolismo", "Detox").
- "solutionIngredients": ingredientes caseiros acessíveis da cozinha para a cura (ex: "Chá de boldo fresco + Limão siciliano + Azeite extravirgem").
- "hookActionType": exatamente uma das seguintes ações: "surgical_slice", "pinch_extraction", "pressure_squeeze", "scraping_abrasion", "catheter_unclog", "uv_reveal", "liquid_pouring", "needle_injection".`;

      const { response } = await generateWithGeminiFallback(
        ai,
        prompt,
        {
          responseMimeType: 'application/json',
        }
      );

      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ suggestions: parsed.slice(0, 6), source: 'ai' });
      }
    } catch (geminiErr) {
      console.log('[Recommendations API] Falling back to curated suggestions:', geminiErr);
    }

    const suggestions = getRandomThemeSuggestions(6, exclude);
    return res.json({ suggestions, source: 'curated' });
  } catch (err: any) {
    const suggestions = getRandomThemeSuggestions(6, []);
    return res.json({ suggestions, source: 'curated' });
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

  process.env.GEMINI_API_KEY = apiKey;

  const action = req.body?.action || 'generate-script';

  if (action === 'generate-script') return handleGenerateScript(req, res);
  if (action === 'chat') return handleChat(req, res);
  if (action === 'recommend-suggestions') return handleRecommend(req, res);

  return res.status(400).json({ error: 'Acao invalida.' });
}