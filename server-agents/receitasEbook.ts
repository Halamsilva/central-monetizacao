import { GoogleGenAI, Type } from '@google/genai';
import { getRandomThemeSuggestions } from '../src/pages/receitasEbook/data/presets.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

const CORPO_REVELADO_SYSTEM_INSTRUCTION = `
Você é o AGENTE DIRETOR CRIATIVO E ENGENHEIRO DE PROMPTS ESPECIALISTA EM VÍDEOS VIRAIS DE SAÚDE E RECEITAS CASEIRAS no estilo dos vídeos do Mestre de Jiu-Jitsu (BJJ) e do livro "FARMÁCIA DA LONGEVIDADE".

Sua função é transformar qualquer TEMA, CONDIÇÃO DE SAÚDE, RECEITA CASEIRA ou REFERÊNCIA em uma sequência de prompts profissionais para geração de vídeo por IA (Sora, Runway Gen-3, Kling, Luma).

==================================================
OBJETIVO PRINCIPAL & ESTRUTURA MODULAR:
==================================================
Criar vídeos verticais ultra-realistas com a QUANTIDADE DE PROMPTS ESPECIFICADA PELO USUÁRIO (de 3 a 8 prompts, padrão 8):
- CADA PROMPT TEM EXATAMENTE 8 SEGUNDOS
- DURAÇÃO TOTAL = QUANTIDADE DE PROMPTS × 8 SEGUNDOS (ex: 8 prompts = 64s, 7 prompts = 56s, 6 prompts = 48s, 5 prompts = 40s, 4 prompts = 32s, 3 prompts = 24s)
- FORMATO: 9:16 (Vertical)
- QUALIDADE: 4K fotográfico hiper-realista
- FPS: 30fps

ESTRUTURA NARRATIVA E DIRETRIZ DE CTA:
1. Se a opção de CTA estiver ATIVADA (padrão): o ÚLTIMO prompt da sequência deve ser a apresentação do LIVRO FÍSICO ("FARMÁCIA DA LONGEVIDADE" ou livro personalizado) com CTA direto nos comentários (SEM a fala "OSS!").
2. Se a opção de CTA estiver DESATIVADA: o vídeo é 100% ORGÂNICO! O último prompt NÃO deve exibir livro, NÃO deve ter oferta comercial, e deve focar no relato de alívio, uso regular e vitalidade natural do organismo.

ATOS VISUAIS E NARRATIVOS DA METODOLOGIA:
- GANCHO VISUAL (00:00 - 00:08): Modelo educacional COLOSSAL (55% a 65% do quadro 9:16) com ação visceral no segundo 00:00 (corte, extração, raspagem, compressão ou despejo).
- EXPLICAÇÃO DO PROBLEMA: Apresentador debruça sobre o modelo colossal apontando para a patologia interna dissecada e explicando a causa raiz e sintomas diários.
- INGREDIENTES CASEIROS: Apresentação na bancada dos ingredientes simples da cozinha com bioativos naturais (sem atacar a medicina).
- PREPARO AO VIVO NA PANELA: Preparo ao vivo na bancada em panela inox com água fervente e lip-sync conversacional direto na câmera (anti-locutor).
- QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO: Detalhamento direto na câmera das proporções exatas e minutos de fervura/infusão para a receita ficar pronta.
- USO, DEGUSTAÇÃO & RELATO: Consumo da receita, degustação ao vivo e relato do efeito biológico curativo.
- CTA COM LIVRO FÍSICO (quando CTA ativado): Exibição do livro com as duas mãos e convite para comentar "EU QUERO".
- FECHAMENTO ORGÂNICO (quando CTA desativado): Relato estendido de vitalidade, dosagem contínua e encerramento caloroso sem apelo de venda.

==================================================
REGRAS FUNDAMENTAIS E INEGOCIÁVEIS:
==================================================
1. NUNCA economize descrição usando frases como "same character", "same skin", "mesmo cenário", "continue previous description".
CADA PROMPT DEVE FUNCIONAR SOZINHO e repetir a descrição completa do Apresentador Oficial (Mestre BJJ), da Pele Humana, das Mãos, do Cenário Oficial (Dojo com as 3 bandeiras) e da Câmera.

2. APRESENTADOR (MESTRE DE BJJ PADRÃO OU PERSONAGEM PERSONALIZADO DO USUÁRIO):
PADRÃO (se o usuário não especificar outro): Brazilian veteran martial arts master, approximately 48 to 52 years old, highly athletic muscular fighter physique, broad powerful shoulders, thick developed chest, muscular arms with bulging vascularity and prominent forearm veins, authentic cauliflower ears (thickened cartilage deformity characteristic of veteran Brazilian Jiu-Jitsu and Judo fighters). Short salt-and-pepper hair closely cropped/shaved on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, and forehead expression creases, neatly groomed salt-and-pepper stubble / 3-day beard, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted HEATHER-GRAY short-sleeve athletic compression shirt / rashguard with bold black-and-white "BJJ" lettering printed on the left chest, black athletic training shorts, and a simple gold wedding band on the ring finger of his left hand. Warm, paternal, authoritative, direct demeanor.
REGRA DE PERSONAGEM PERSONALIZADO: Se o usuário subir uma foto ou fornecer a descrição de um PERSONAGEM PERSONALIZADO (ex: médico de jaleco, nutricionista, cientista, terapeuta, etc.), você DEVE UTILIZAR ESTE PERSONAGEM ESPECÍFICO EM TODOS OS 8 PROMPTS com consistência visual e física absoluta, descrevendo suas roupas, idade, traços faciais, etnia e postura com o mesmo nível de riqueza fotorrealista.

3. PELE HUMANA — PRIORIDADE ABSOLUTA (REPETIR EM TODOS OS 8 PROMPTS):
Human skin must have genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, hands. Realistic sun exposure, tiny pigmentation variations, minute blemishes, faint sun spots, localized redness, subtle under-eye discoloration, fine facial vellus hairs, individual arm and body hairs, realistic hair follicles, natural forehead lines, nasolabial folds, tiny facial asymmetries. Subtle natural sheen on forehead and nose bridge; cheeks comparatively matte. Restrained realistic subsurface scattering under natural gym daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

4. MÃOS E DETALHES (REPETIR EM TODOS OS 8 PROMPTS):
Exactly five fingers per hand, correct adult male anatomy, correct finger lengths, realistic knuckles, veins, tendons, fine hairs, natural nails, skin folds, gold wedding band visible on left ring finger. Wrapping physically around objects with natural skin compression and physical weight. NO fused fingers, NO duplicated fingers, NO missing fingers, NO floating objects.

5. CENÁRIO (DOJO DE BJJ COM AS 3 BANDEIRAS PADRÃO OU CENÁRIO PERSONALIZADO DO USUÁRIO):
PADRÃO (se o usuário não especificar outro): Authentic Brazilian Jiu-Jitsu (BJJ) gym / martial arts dojo. Floor is covered with seamless light-gray puzzle/roll-out tatami mats. Lower section of the back wall is protected by dark-gray/black padded tatami wall mats. The upper wall is clean off-white with high gym windows letting in bright natural daylight, complemented by warm ceiling fluorescent gym lighting.
HANGING PROMINENTLY ON THE BACK WALL ARE THREE NATIONAL FLAGS SIDE BY SIDE IN EXACT ORDER:
1. Brazilian Flag (left, green and yellow with blue globe);
2. United States Flag (center, stars and stripes);
3. Israel Flag (right, white with blue stripes and Star of David).
In the center foreground is a solid, sturdy light-wood gym bench / demonstration table where objects and ingredients are placed.
REGRA DE CENÁRIO PERSONALIZADO: Se o usuário subir uma foto ou fornecer a descrição de um CENÁRIO PERSONALIZADO (ex: consultório médico moderno, cozinha rústica, laboratório, sala de atendimento, etc.), você DEVE UTILIZAR ESTE CENÁRIO ESPECÍFICO NA SEÇÃO 'SETTING' DE TODOS OS 8 PROMPTS, detalhando paredes, piso, iluminação ambiente, materiais da mesa/bancada de demonstração e elementos do fundo com precisão arquitetônica e óptica.

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

13. PROMPT 8 (00:56 - 01:04) — CTA COM LIVRO FÍSICO ("FARMÁCIA DA LONGEVIDADE" OU LIVRO PERSONALIZADO DO USUÁRIO):
O apresentador ergue com as duas mãos e exibe orgulhoso para a câmera o livro físico (se o usuário enviou imagem ou nome de livro personalizado, utilize EXATAMENTE o título e design da capa fornecidos pelo usuário; caso contrário, use o livro padrão "FARMÁCIA DA LONGEVIDADE - 200 RECEITAS CASEIRAS" com capa verde-oliva e dourada impresso com fotos de limão, mel, gengibre e ervas).
Ele aponta para o livro e entrega o CTA direto com convicção e autoridade:
"Se tu gostou, já segue meu perfil aqui embaixo. E se tu quiser as minhas receitas secretas de família, comenta EU QUERO aqui embaixo que te mando no teu privado... Me segue antes senão a plataforma não deixa... Garante o teu!"
ATENÇÃO: NÃO incluir a fala "OSS!" na locução nem na ação do apresentador.

14. DIRETRIZES NEGATIVAS E DE CÂMERA (OBRIGATÓRIO EM TODOS OS 8 PROMPTS):
- REGRA CRÍTICA INEGOCIÁVEL — ABSOLUTAMENTE NENHUM TEXTO NEM LEGENDA NA TELA: NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO transcripts, NO lower thirds, NO banners, NO digital overlays, NO typography, NO graphic titles, NO logos, NO watermarks, NO artificial UI labels. The video must be purely clean visual footage without any post-production text, subtitles or overlays added on top. O vídeo NÃO deve mostrar legendas nem textos flutuantes sob nenhuma hipótese. (The only text allowed in the real physical world is the title printed on the physical hardcover book in Prompt 8 and the BJJ compression shirt logo).
- Falas em Português Brasileiro coloquial, natural, direto e magnético (~8 segundos cada) exclusivamente faladas/dubladas em cena com sincronização labial direta (lip-sync), SEM colocar legendas queimadas ou embutidas na tela.
- promptText de cada uma das 8 cenas em INGLÊS FOTOGRÁFICO DETALHADO, completo e independente, OBRIGATORIAMENTE incluindo no início a cláusula negativa: "NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO typography, NO lower thirds, NO banners, NO titles, NO UI elements, NO watermarks. Clean raw cinematic video footage with zero text overlays, zero subtitles, and zero written words on screen."
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
  // Candidate models prioritized by stability, capacity and speed:
  // gemini-3.1-flash-lite is the fastest (~1.1s) and avoids 503 high-demand queues and quota bottlenecks.
  // gemini-flash-latest and gemini-3.1-pro-preview provide robust backup tiers.
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return { response, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      // Smooth internal cascade without dumping raw error JSON to stdout
      console.log(`[Gemini Engine] Primary route busy (${model}), routing automatically to alternate tier...`);
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

// Helper to format time ranges in MM:SS - MM:SS format for 8-second increments
function formatTimeRange(index: number): string {
  const startSec = index * 8;
  const endSec = (index + 1) * 8;
  const pad = (n: number) => String(n).padStart(2, '0');
  const startMin = Math.floor(startSec / 60);
  const startRem = startSec % 60;
  const endMin = Math.floor(endSec / 60);
  const endRem = endSec % 60;
  return `${pad(startMin)}:${pad(startRem)} - ${pad(endMin)}:${pad(endRem)}`;
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
  customBookTitle?: string,
  bookImageBase64?: string,
  bookImageMimeType?: string,
  referenceVideoBase64?: string,
  videoFileName?: string,
  promptCount: number = 8,
  includeCTA: boolean = true
): any {
  const targetCount = Math.max(2, Math.min(10, Number(promptCount) || 8));
  const hasCTA = Boolean(includeCTA);
  const cleanTheme = theme.trim() || 'Desintoxicação Celular e Saúde Metabólica';
  const focalModel = `Modelo anatômico educacional COLOSSAL de "${cleanTheme}" (escala gigante 5x, ocupando 60% do enquadramento vertical 9:16)`;
  
  // Clean footage directive (ABSOLUTELY NO ON-SCREEN TEXT, NO SUBTITLES, NO CAPTIONS)
  const noTextDirective = `NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO typography, NO transcripts, NO lower thirds, NO banners, NO graphic titles, NO digital overlays, NO logos, NO watermarks, NO artificial UI labels. Pure raw cinematic video footage with ZERO text overlays, ZERO subtitles, and ZERO written words on screen. Spoken audio delivered purely via realistic on-camera lip synchronization without on-screen subtitles.`;

  // Dynamic Presenter description based on custom character inputs
  const presenterDesc = customCharacterDescription
    ? `Presenter behind demonstration bench: ${customCharacterDescription}. Natural biological skin with visible pores, authentic expression lines, realistic muscle and hand anatomy, maintained with 100% continuous visual identity across all frames.`
    : (characterImageBase64
        ? `Presenter behind demonstration bench: Accurately replicates the uploaded character reference image (facial structure, age, hair, physique, skin tone, and clothing style) with genuine biological human skin pores, authentic expression lines, and realistic anatomy across all frames.`
        : `Positioned immediately behind the wooden bench, leaning forward into the camera lens with an intense, magnetic, urgent facial expression: Brazilian veteran martial arts master, approximately 50 years old, highly athletic muscular fighter physique, broad powerful shoulders, thick developed chest, muscular arms with bulging vascularity and prominent forearm veins, authentic cauliflower ears (thickened cartilage deformity characteristic of veteran Brazilian Jiu-Jitsu and Judo fighters). Short salt-and-pepper hair closely cropped on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, neatly groomed salt-and-pepper stubble, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted HEATHER-GRAY short-sleeve athletic compression shirt / rashguard with bold black-and-white "BJJ" lettering printed on the left chest, black athletic training shorts, and a simple gold wedding band on his left ring finger.`);

  // Dynamic Setting description based on custom setting inputs
  const settingDesc = customSettingDescription
    ? `SETTING: ${customSettingDescription}. Solid demonstration bench / table in the foreground holding the educational model and ingredients. Consistent architectural background details, continuous ambient lighting, and subtle smartphone camera micro-movement.`
    : (settingImageBase64
        ? `SETTING: Accurately replicates the uploaded scenario reference image with continuous background architecture, wall textures, ambient lighting, and solid foreground demonstration bench / table across all scenes.`
        : `SETTING: Authentic Brazilian Jiu-Jitsu (BJJ) martial arts dojo gym. Floor is covered with seamless light-gray puzzle/roll-out tatami mats. Lower section of back wall is lined with black/dark-gray protective tatami wall pads. Upper wall is off-white with high windows letting in bright natural daylight, plus warm ceiling gym lighting.
HANGING PROMINENTLY ON THE BACK WALL ARE THREE NATIONAL FLAGS SIDE BY SIDE IN EXACT ORDER:
1. Brazilian Flag (left, green and yellow with blue globe);
2. United States Flag (center, stars and stripes);
3. Israel Flag (right, white with blue stripes and Star of David).
Solid light-wood gym bench in foreground. Subtle handheld smartphone micro-movement.`);
  
  // Library of diverse, non-repetitive visceral hook actions
  const variedHooks = [
    {
      type: 'liquid_reaction_pour',
      summary: 'Apresentador despeja líquido ativo de bule ou copo sobre o modelo colossal no segundo 00:00, provocando derretimento ou estilhaçamento imediato da camada patológica.',
      spoken: `Isso aqui é o que essa sujeira tá fazendo por dentro, e ninguém no mercado vai te contar a verdade.`,
      handsAction: `His right hand holds a clear glass vessel tilted steadily over the colossal model, pouring a continuous streaming cascade of amber reacting liquid directly onto the affected zone at second 00:00 with realistic fluid dispersion. Visible forearm vascularity and gold wedding band on left ring finger.`,
      actionScene: `The video opens already in peak active motion at second 00:00. A streaming liquid pours onto the colossal model; as it strikes, the dense yellow crust softens, fractures, and runs downward in viscous rivulets over the wooden bench. The presenter leans forward with piercing authority, locking intense eye contact with the camera lens.`
    },
    {
      type: 'surgical_slice',
      summary: 'Apresentador usa bisturi cirúrgico para fatiar um nódulo espesso no modelo colossal, abrindo e revelando o interior asqueroso.',
      spoken: `Quase ninguém tem coragem de te mostrar isso por dentro. Olha bem o que está acumulado aqui.`,
      handsAction: `His right hand holds a precision surgical scalpel with stainless steel blade, slicing cleanly through an elevated, inflamed nodule on the colossal model at 00:00, parting the dense outer layer to reveal a thick, yellowish-brown visceral interior. Visible muscle tension and vein definition in forearm, gold wedding band on left ring finger.`,
      actionScene: `The video opens already in active motion at second 00:00. The scalpel glides through the dense synthetic tissue of the colossal model; as the cut separates, thick viscous texture oozes slightly under the gym lights. The presenter leans in with piercing intensity, eyes locked on the lens, delivering the opening hook with urgency.`
    },
    {
      type: 'pinch_extraction',
      summary: 'Apresentador usa pinça anatômica longa para puxar com tração física um tampão escuro ou parasita entalado em orifício do modelo colossal.',
      spoken: `Se você sente cansaço ou peso no corpo, olha o que fica entalado e ninguém te fala.`,
      handsAction: `His right hand grips long stainless steel surgical forceps, firmly clamping onto a dark, hardened calcified obstruction lodged inside a deep canal of the colossal model, pulling backward with realistic physical resistance and tension, gold wedding band on left hand.`,
      actionScene: `The video opens in clímax at second 00:00 with direct tactile traction. The forceps pull the dense dark filament out from the colossal model's canal, stretching and snapping free with authentic resistance. The presenter leans in toward the lens with intense focus, delivering the hook with conviction.`
    },
    {
      type: 'pressure_squeeze',
      summary: 'Apresentador usa as duas mãos para apertar com força extrema uma área inflamada do modelo colossal, expelindo secreção espessa.',
      spoken: `Muita gente convive com isso achando normal, mas quando você aperta a causa real, olha o que sai.`,
      handsAction: `Both hands wrap firmly around an enlarged, congested section of the colossal model. His muscular fingers press deep into the silicone material with authentic skin compression and muscular effort, gold wedding band on left ring finger, exerting bilateral pressure.`,
      actionScene: `The video opens at second 00:00 in peak physical compression. As both hands squeeze firmly, a dense, viscous paste erupts from the central fissure of the colossal model, glistening under directional lights. The presenter's eyes lock onto the camera lens with grave urgency.`
    },
    {
      type: 'scraping_abrasion',
      summary: 'Apresentador raspa com espátula metálica uma crosta petrificada no modelo colossal, soltando lascas secas e pó na bancada.',
      spoken: `Essa crosta petrifica aos poucos e você nem percebe. Escuta e repara a espessura disso aqui.`,
      handsAction: `His right hand firmly grips an ergonomic steel spatula scraper, blade positioned at a 45-degree angle against the hardened crust of the colossal model, scraping downward with deliberate force, peeling off brittle chunks, gold wedding band on left hand.`,
      actionScene: `The video opens at second 00:00 with crisp scraping action. The steel edge digs into the petrified yellow-brown crust on the colossal model, shearing off dry brittle shards that tumble down onto the wooden bench with tactile sound and vibration. Presenter maintains intense eye contact with the viewer.`
    }
  ];

  // Select hook based on actionType or pick dynamically
  let selectedHook = variedHooks[0];
  if (hookActionType && hookActionType !== 'varied_dynamic') {
    const found = variedHooks.find(h => h.type === hookActionType);
    if (found) {
      selectedHook = found;
    }
  } else {
    const themeHash = cleanTheme.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    selectedHook = variedHooks[themeHash % variedHooks.length];
  }

  const ingredientsText = solutionIngredients || 'Limão fresco + Gengibre fatiado + Cúrcuma pura + Cravos-da-índia + Mel puro';
  
  const characterLabel = customCharacterDescription || (characterImageBase64 ? 'Personagem Personalizado (Foto enviada)' : 'Mestre de BJJ Oficial (Padrão)');
  const settingLabel = customSettingDescription || (settingImageBase64 ? 'Cenário Personalizado (Foto enviada)' : 'Dojo BJJ com 3 Bandeiras (Padrão)');

  // Master Prompt Building Blocks
  const stepHook = {
    baseTitle: 'GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL',
    focalObject: focalModel,
    actionSummary: selectedHook.summary,
    cameraFraming: 'Plano Macro Fechado Vertical 9:16 com lente ultra-wide 20mm e perspectiva forçada dramática. A câmera fica colada na bancada; o modelo colossal ocupa de 55% a 65% do enquadramento inferior, com o apresentador debruçado imediatamente atrás.',
    visualSceneDescription: `No segundo 00:00 exato, o vídeo já começa com ação física direta: a mão direita aplica a ferramenta/líquido no modelo anatômico colossal que ocupa 60% da tela, gerando desprendimento visceral imediato. O apresentador debruçado olha firme para a lente com urgência magnética. Mão esquerda apoiada na bancada de madeira do dojo. Fundo: tatame cinza e as 3 bandeiras nítidas.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Abertura no Clímax Visceral (00:00)',
        action: 'Vídeo abre já no segundo zero com ação física no modelo colossal (60% do quadro). Líquido reagente atinge a crosta ou bisturi/raspador retira o material patológico sem introdução lenta.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Reação Tátil & Expressão Facial',
        action: 'Close na textura da sujeira se soltando e escorrendo pela bancada. O apresentador debruça-se para frente, encarando a lente da câmera com gravidade e intensidade.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Conexão Magnética & Gancho',
        action: 'O apresentador conclui a primeira fala com sincronização labial precisa, apontando para a sujeira e engatando a continuidade direta para a cena dos ingredientes.'
      }
    ],
    spokenLinePt: selectedHook.spoken,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, macro close-up with 20mm lens. The colossal educational model occupies 60% of the entire lower frame directly against the lens.
- The presenter is physically leaning forward over the bench immediately behind the model, making intense eye contact with the viewer.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• 00:00 - 00:03: Immediate visceral opening at second zero. The presenter's muscular right hand applies the reactive fluid/surgical scraper directly to the crust of the colossal model, causing instant physical detachment and fluid sizzle.
• 00:03 - 00:06: The camera captures the detailed texture of the dislodged residue flowing onto the wooden bench. The presenter leans in closer with gravity and urgent magnetic focus.
• 00:06 - 00:08: Precise Brazilian Portuguese lip synchronization delivering the hook line, pointing down toward the detached residue to create an irresistible transition to the healing ingredients.

Extreme close-up foreground featuring a COLOSSAL educational anatomical demonstration model representing ${cleanTheme}, occupying 60% of the entire vertical 9:16 frame directly against the camera lens. The giant model rests on a solid demonstration bench/counter, exhibiting hyper-detailed, visceral physical textures, deep cavities, rough discolored surface deposits, and anatomical cross-sections in rich physical detail.

${presenterDesc}

HUMAN SKIN PRIORITY: Genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression lines, nasolabial folds, natural skin texture, vellus facial hairs, arm hairs, arm veins slightly engorged. Subtle natural sheen on forehead and nose bridge; cheeks comparatively matte. Restrained realistic subsurface scattering under natural daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. ${selectedHook.handsAction}

ACTION: ${selectedHook.actionScene}

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${selectedHook.spoken}"

${settingDesc}`
  };

  const stepProblem = {
    baseTitle: 'EXPLICAÇÃO DO PROBLEMA (O QUE É O PROBLEMA)',
    focalObject: `Apresentador debruçado sobre o modelo colossal apontando com precisão anatômica para a patologia interna exposta (${focalModel})`,
    actionSummary: `Apresentador debruça sobre o modelo colossal, aponta com precisão anatômica com os dedos para a patologia exposta e disseca o que é esse problema na raiz, como ele se forma em silêncio acumulando toxinas e obstruindo o fluxo biológico, e como gera os sintomas diários que o público sente na pele, alternando olhar entre a lesão e a câmera com sincronização labial perfeita.`,
    cameraFraming: 'Plano Médio-Curto 9:16 com lente 28mm e profundidade de campo óptica natural. Foco nítido na patologia do modelo colossal e nas mãos e rosto expressivo do apresentador.',
    visualSceneDescription: `O modelo colossal permanece colado em primeiro plano ocupando 55-60% do enquadramento, exibindo a patologia interna dissecada. O apresentador aponta o indicador para o acúmulo patológico, explicando com autoridade de mentor o que é essa condição, como ela trava a circulação celular e por que o corpo sofre com cansaço e inchaço diário.`,
    visualTimeline: [
      {
        time: '00:08 - 00:11',
        title: 'Identificação Anatômica da Patologia',
        action: 'Apresentador aponta o dedo indicador diretamente para o ponto mais crítico da patologia no modelo colossal, detalhando visualmente as camadas acumuladas.'
      },
      {
        time: '00:11 - 00:14',
        title: 'Explicação do Mecanismo do Problema',
        action: 'Disseca como essa crosta e toxinas bloqueiam o fluxo celular e a circulação, explicando a causa raiz silenciosa.'
      },
      {
        time: '00:14 - 00:16',
        title: 'Conexão com os Sintomas Diários',
        action: 'Olha com firmeza e gravidade no olho da câmera, alertando como essa inflamação gera o cansaço, inchaço ou dores que a pessoa sente no dia a dia.'
      }
    ],
    spokenLinePt: 'O problema real é essa camada aqui: ela se acumula em silêncio, sufoca as células e trava o teu metabolismo sem você nem perceber.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium close-up shot at chest level with 28mm lens.
- Sharp optical focus capturing the detailed internal pathology of the colossal educational model in the foreground and the presenter's engaging, articulate face and pointing hand.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The presenter leans in over the colossal anatomical model representing ${cleanTheme}, his muscular right index finger pointing with surgical precision directly into the exposed pathological buildup, highlighting the dense layers of plaque, calcification, or trapped toxins.
• He gestures along the cross-section, visually tracing the blocked passages and demonstrating how this stagnant obstruction chokes off natural circulation and cellular nourishment.
• He raises his gaze from the model straight into the camera lens with intense pedagogical authority and authentic concern, delivering the concluding explanation with organic lip synchronization.

PHYSICAL CONTINUITY: The colossal educational anatomical model remains directly in the foreground on the solid wooden demonstration bench, with 100% of the simulated residue and pathology intact from Prompt 1 in the exact same position, scale, and color.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Natural skin texture, individual arm and body hairs, realistic hair follicles, natural forehead lines, nasolabial folds. Matte cheeks, subtle natural T-zone sheen. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Right hand points with authoritative precision toward the anatomical defect; left hand rests firmly on the demonstration bench.

ACTION: Presenter speaks directly about what the underlying medical/biological issue is, detailing the hidden mechanism of the problem with genuine paternal urgency, magnetic conviction, and zero academic pretension.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O problema real é essa camada aqui: ela se acumula em silêncio, sufoca as células e trava o teu metabolismo sem você nem perceber."

${settingDesc}`
  };

  const stepIngredients = {
    baseTitle: 'INGREDIENTES CASEIROS DA CURA NA BANCADA',
    focalObject: `${focalModel} ao lado dos ingredientes caseiros da cura no banco/bancada`,
    actionSummary: `Apresentador mostra e fala expressamente quais são os ingredientes caseiros que ajudam a tratar o problema (${ingredientsText}), apontando para cada um na bancada e explicando a ação dos bioativos naturais.`,
    cameraFraming: 'Plano Médio 9:16 com lente 28mm e profundidade de campo óptica natural. Foco balanceado entre os recipientes de vidro com ingredientes na bancada de madeira e o apresentador em plano americano.',
    visualSceneDescription: `O modelo colossal permanece na bancada preservando a patologia exata da cena anterior. Ao lado dele, o apresentador gesticula e aponta para cada um dos ingredientes caseiros da cura organizados em recipientes transparentes, erguendo o limão e o gengibre para demonstrar sua pureza.`,
    visualTimeline: [
      {
        time: '00:16 - 00:19',
        title: 'Exibição dos Ingredientes Caseiros',
        action: 'Apresentador aponta e ergue na bancada os potes de vidro com os bioativos caseiros (limão cortado, gengibre fresco e cúrcuma em pó), mostrando a pureza dos elementos.'
      },
      {
        time: '00:19 - 00:22',
        title: 'Explicação dos Bioativos Ativos',
        action: 'Fala na câmera citando os ingredientes que atacam a raiz do problema, mantendo o modelo colossal visível ao lado para garantir continuidade visual 100% coerente.'
      },
      {
        time: '00:22 - 00:24',
        title: 'Preparação para a Panela',
        action: 'Gesto de convite com a mão em direção ao fogão de indução e à panela de inox, criando a expectativa imediata para o preparo ao vivo.'
      }
    ],
    spokenLinePt: 'O segredo para agir na raiz do problema e fortalecer a saúde do seu corpo está nesses bioativos naturais que você já tem na sua cozinha.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium shot at chest level with 28mm lens.
- Balanced composition showing both the presenter in waist-up framing and the wooden bench with neat glass bowls of natural kitchen ingredients.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Seamless continuation. The presenter gestures toward the neat glass dishes on the bench, picking up the juicy lemon half with visible pulp droplets.
• His fingers tap the side of the golden turmeric bowl and point toward the fresh ginger rhizomes while speaking directly to the camera with warm pedagogical conviction.
• He glances smoothly toward the induction cooktop on the side, inviting the viewer into the active cooking phase without skipping a beat.

PHYSICAL CONTINUITY: The colossal educational anatomical model remains in the foreground on the solid bench/counter, with 100% of the simulated residue and pathology intact from the previous scene in the exact same position, scale, and color.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the bench in front of the presenter are simple, accessible kitchen healing ingredients:
1. Fresh juicy yellow lemon cut in half, exposing glistening pulp droplets.
2. Sliced fresh ginger root rhizomes and whole cinnamon sticks resting beside a small ceramic dish.
3. A small clear glass jar with intense golden turmeric powder and fragrant whole dried cloves (cravos-da-índia).
4. A jar of raw unrefined honey with wooden honey dipper.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Natural skin texture, individual arm and body hairs, realistic hair follicles, natural forehead lines, nasolabial folds. Matte cheeks, subtle natural T-zone sheen. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Hands actively point to and hold up the kitchen ingredients: lifting the lemon half and gesturing toward the ginger, displaying authentic weight and grip.

ACTION: Presenter showcases and speaks about the homemade ingredients on the bench, highlighting their natural bioactive properties and explaining with conviction and clear cadence which simple home nutrients support the body's natural defense. Direct eye contact with the camera, speaking with authority, warmth, and confidence.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O segredo para agir na raiz do problema e fortalecer a saúde do seu corpo está nesses bioativos naturais que você já tem na sua cozinha."

${settingDesc}`
  };

  const stepCook1 = {
    baseTitle: 'PREPARO PARTE 1: BASE E ADIÇÃO DOS PRIMEIROS INGREDIENTES (LIP-SYNC AO VIVO)',
    focalObject: `Apresentador em plano médio conversando com o espectador na câmera com sincronização labial realista enquanto coloca fatias de gengibre e cravos na panela de inox com água fervente sobre fogão de indução`,
    actionSummary: 'Apresentador em plano médio conversa diretamente com o espectador na câmera com sincronização labial perfeita (sem tom de locutor em off): coloca 200ml de água pra ferver na panela inox, adiciona fatias grossas de gengibre fresco e cravos-da-índia um a um, alternando olhar para a panela e conexão olho no olho com a câmera.',
    cameraFraming: 'Plano Médio (cintura para cima) na altura do peito, lente 28mm. Enquadramento captura tanto a boca e o rosto do apresentador falando diretamente com o espectador quanto a panela inox borbulhando na bancada de madeira.',
    visualSceneDescription: `O apresentador conversa naturalmente na câmera (lip-sync orgânico, sem narração em off). Na bancada, a panela inox no fogão de indução borbulha com 200ml de água fervente. Com a mão direita, ele solta fatias grossas de gengibre que espirram gotas d'água; com a mão esquerda, salpica cravos-da-índia, alternando olhares entre a fervura e o olho da câmera.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Início do Preparo na Panela Inox',
        action: 'Apresentador em plano médio fala diretamente para a câmera (lip-sync orgânico) enquanto solta as fatias de gengibre fresco na panela de inox com 200ml de água fervente.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Adição dos Cravos & Vapor Aromático',
        action: 'Salpica os cravos-da-índia inteiros que flutuam na água borbulhante. Vapor aromático sobe enquanto ele olha no olho do espectador como um mentor experiente.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Transição Contínua para Bioativos',
        action: 'Encerra a fala orientando a soltar os óleos essenciais, mantendo a panela fervendo para a fusão contínua no segundo seguinte.'
      }
    ],
    spokenLinePt: 'Olha aqui: coloca duzentos ml de água pra ferver, joga o gengibre fatiado e o cravo pra soltar todo esse óleo essencial.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level, medium shot capturing both the presenter's expressive speaking face, mouth, and upper body and the wooden demonstration bench with the saucepan.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing at chest level. 
- The camera frames the presenter speaking warmly to the audience while his hands operate above the steaming stainless steel saucepan on the wooden demonstration counter.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Live on-camera dialogue with precise lip-sync. Muscular right hand drops thick cut slices of fresh ginger rhizome into 200ml of actively rolling, boiling water in the saucepan, splashing micro-droplets.
• Left hand sprinkles whole aromatic cloves (cravos-da-índia) into the boiling liquid; aromatic steam plumes visibly curl up past his face.
• He holds direct eye contact with the camera, speaking with perfect lip synchronization as the water begins turning a pale golden amber.

PHYSICAL CONTINUITY: The colossal educational anatomical model remains visible in the background on the bench. The kitchen ingredients from the previous scene are neatly arranged on the bench.

ON-CAMERA SPOKEN DIALOGUE WITH PRECISE LIP-SYNC (ANTI-NARRATOR):
The presenter speaks DIRECTLY into the camera lens with organic, conversational, authentic energy—this is genuine on-screen speech, NOT a detached radio announcer, promotional pitch, or disconnected voiceover track. His expressive face, mouth, and lips are clearly visible in the medium shot.

MAKING THE HOMEMADE REMEDY - PART 1 (BASE & FIRST SOLID INGREDIENTS):
On the wooden bench sits a compact black induction cooktop with a clean, polished stainless steel saucepan filled with 200ml of water actively boiling with rolling bubbles and rising steam.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins flexing with physical cooking effort, natural muscle contours, authentic skin compression against raw ginger and cookware. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Muscular forearm tension, realistic wrist flexion as fingers grip and drop the ginger slices and cloves one by one.

ACTION: Natural, fluid cadence. Alternates naturally between looking at the boiling pot as ingredients strike the surface and locking eyes with the camera while speaking with perfect on-camera lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Olha aqui: coloca duzentos ml de água pra ferver, joga o gengibre fatiado e o cravo pra soltar todo esse óleo essencial."

${settingDesc}`
  };

  const stepCook2 = {
    baseTitle: 'PREPARO PARTE 2: CONTINUAÇÃO NA PANELA COM BIOATIVOS',
    focalObject: `Panela de inox na bancada fervendo com as fatias de gengibre e cravos já dentro, enquanto o apresentador continua a receita adicionando a cúrcuma, espremendo o limão fresco e despejando o mel em fio contínuo`,
    actionSummary: 'Continuação exata: a panela inox já está com a água fervendo com as fatias de gengibre e cravos dentro. O apresentador continua a receita ao vivo, falando com lip-sync na câmera, adicionando colher de cúrcuma na água fervente com gengibre e cravo, espremendo meio limão fresco e despejando mel puro em fio, mexendo tudo com colher de madeira.',
    cameraFraming: 'Plano Médio de Continuidade Direta, lente 28mm. Câmera estável na altura do peito registrando a adição dos bioativos coloridos (cúrcuma dourada e limão) na fervura da panela e a sincronização labial contínua do apresentador.',
    visualSceneDescription: `Continuação direta: a panela inox já está fervendo com as fatias de gengibre e cravos dentro. O apresentador adiciona uma colher cheia de cúrcuma dourada pura que tinge a água, espreme meio limão fresco com firmeza e despeja mel puro em fio contínuo, mexendo com colher de madeira enquanto o vapor sobe.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Adição da Cúrcuma Dourada & Limão',
        action: 'Continuação imediata: a panela já ferve com o gengibre e os cravos. Ele joga a colher de cúrcuma que tinge o líquido em amarelo ouro e espreme o limão fresco com gotas caindo na fervura.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Mel Puro em Fio & Colher de Madeira',
        action: 'Despeja mel puro em fio contínuo dourado e mexe energeticamente com a colher de pau em movimentos circulares, homogeneizando o tônico medicinal.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Finalização do Preparo com Lip-Sync',
        action: 'Ergue levemente a colher mostrando o tônico espesso e brilhante, concluindo a fala com sorriso de satisfação e segurança.'
      }
    ],
    spokenLinePt: 'Agora que o gengibre e o cravo já tão fervendo aí dentro, joga a cúrcuma, espreme o limão e fecha com o mel puro. Mexe bem!',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level, medium shot capturing both the presenter's face speaking with lip sync and the bubbling saucepan on the bench.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, unbroken medium shot continuation.
- Stable camera capturing both active bubbling in the stainless steel saucepan and presenter's expressive facial delivery.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The pot is already boiling with ginger and cloves from the previous cut. A spoonful of vibrant golden turmeric powder is dumped into the boiling water, instantly clouding the broth into a rich yellow hue, followed by a firm squeeze of fresh lemon juice with visible dripping droplets.
• Thick raw golden honey pours in a glistening continuous ribbon into the center, and a wooden spoon vigorously stirs the mixture in circular strokes.
• The presenter lifts the wooden spoon slightly, showing the rich golden consistency of the finished tonic, locking eyes with the camera with a satisfied smile.

DIRECT TEMPORAL & PHYSICAL CONTINUATION (INGREDIENTS IN THE PAN):
Unbroken visual continuity. Inside the stainless steel saucepan on the black induction cooktop, the 200ml of water is actively bubbling with the thick ginger slices and whole dried cloves visibly submerged, rolling, and swirling inside the boiling liquid from the previous scene.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins flexing with physical cooking effort, natural muscle contours, authentic skin compression against citrus and spoon. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Muscular forearm tension, realistic wrist flexion while squeezing lemon pulp and stirring the pot with the wooden spoon.

ACTION: Fast-paced, tactile, highly satisfying homemade preparation continuing seamlessly. Real fragrant steam rises from the rich golden liquid. Presenter alternates between stirring the ingredients inside the pot and looking up at the camera with an authentic, confident smile while speaking with perfect lip sync.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Agora que o gengibre e o cravo já tão fervendo aí dentro, joga a cúrcuma, espreme o limão e fecha com o mel puro. Mexe bem!"

${settingDesc}`
  };

  const stepPortions = {
    baseTitle: 'QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO',
    focalObject: `Panela inox com a receita borbulhando em fogo brando no fogão portátil na bancada e ingredientes medidos`,
    actionSummary: 'Apresentador fala diretamente para a câmera com lip-sync ao vivo detalhando as quantidades exatas de cada ingrediente e o tempo necessário de fervura/infusão para a receita ficar pronta com potência máxima.',
    cameraFraming: 'Plano Médio Frontal com lente 28mm. O apresentador gesticula didaticamente com as mãos ao lado da panela no fogão portátil, indicando proporções e minutos com clareza.',
    visualSceneDescription: `O apresentador fala diretamente para a câmera com sincronização labial perfeita. Ele gesticula com as mãos e dedos ao lado da panela fumegante no fogão portátil, detalhando as medidas exatas da receita (300ml de água, 1 colher cheia de cúrcuma, meio limão espremido e 1 colher de mel puro) e estipulando 5 minutos de fervura branda para a fórmula ficar pronta.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Detalhamento das Medidas Exatas',
        action: 'Apresentador fala diretamente para a câmera com sincronização labial, gesticulando com os dedos para indicar a quantidade precisa de cada ingrediente na bancada.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Instrução do Tempo de Fogo e Infusão',
        action: 'Aponta para a panela fumegante no fogão e indica com os dedos o tempo exato de 5 a 7 minutos em fogo brando para apurar os bioativos.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Finalização do Ponto Ideal',
        action: 'Confirma com um aceno confiante e sorriso de mentor que a receita atingiu o ponto exato de potência terapêutica, pronta para consumo.'
      }
    ],
    spokenLinePt: 'Anota aí a quantidade: trezentos ml de água, uma colher de cúrcuma, meio limão e uma de mel. Deixa cinco minutos fervendo em fogo baixo e tá pronto.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at waist-up medium framing.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing showing presenter beside the stainless steel saucepan on the portable induction burner, speaking directly to camera.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The presenter gestures expressively with open hands and counting fingers, explaining directly into the camera lens the exact measured amounts of each ingredient (300ml water, 1 tablespoon pure turmeric, half fresh lemon, 1 tablespoon raw honey).
• He points with his right hand toward the gently simmering saucepan, displaying five raised fingers on his left hand to reinforce the exact 5-minute simmer and steep time needed for full bioactive extraction.
• He nods with authentic authority and warm charismatic reassurance, confirming the remedy has reached peak therapeutic potency and is ready to pour.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression creases, nasolabial folds, natural skin texture, vellus facial hairs, arm veins bulging with realistic vascularity. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Expressive counting gestures, gold wedding band visible on left ring finger.

ACTION: Presenter delivers narration with direct, engaging conversational lip-sync, maintaining magnetic eye contact with the viewer while gesturing clearly to explain precise portions and timing.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Anota aí a quantidade: trezentos ml de água, uma colher de cúrcuma, meio limão e uma de mel. Deixa cinco minutos fervendo em fogo baixo e tá pronto."

${settingDesc}`
  };

  const stepTasting = {
    baseTitle: 'USO, DEGUSTAÇÃO & RELATO DE CURA',
    focalObject: `Apresentador segurando caneca de vidro com chá dourado fumegante e bule/panela ao lado na bancada`,
    actionSummary: 'Apresentador segura caneca de chá fumegante, bebe um gole com satisfação e compartilha a forma correta de tomar e o alívio profundo gerado no organismo.',
    cameraFraming: 'Plano Médio-Curto com foco suave no fundo. O apresentador segura a caneca de vidro na altura do peito com vapor visível subindo em direção à lente.',
    visualSceneDescription: `O apresentador segura com as duas mãos a caneca de vidro com o tônico dourado fumegante. Ele leva à boca, dá um gole refrescante com movimento nítido de deglutição na garganta, sorri com alívio e bem-estar, e gesticula ensinando os horários de consumo com convicção paternal.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Degustação & Primeiro Gole',
        action: 'Apresentador segura a caneca de vidro com o chá dourado fumegante, leva aos lábios e bebe um gole com sensação visível de alívio e vitalidade.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Instrução de Consumo Diário',
        action: 'Explica com expressividade que deve ser tomado de manhã em jejum e antes de dormir, gesticulando com a mão aberta com autoridade amigável.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Relato da Transformação Biológica',
        action: 'Compartilha o relato da mãe e a limpeza visível do organismo, preparando o fechamento com o livro na cena seguinte.'
      }
    ],
    spokenLinePt: 'Toma isso de manhã e outro antes de dormir. Minha mãe começou a tomar e o corpo dela limpou de um jeito que todo mundo reparou.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with warm natural daylight.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium close-up shot focused on the presenter holding a clear glass mug of steaming golden tea.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The presenter brings the steaming glass mug of golden tonic to his lips, taking a deliberate, invigorating sip with a visible swallow movement in his throat.
• He lowers the mug to chest height, smiling with genuine relief and vitality, gesturing outward with his left hand as he instructs the audience on morning and evening dosage.
• Personal emotional connection: delivering the line about his mother with authentic tenderness and deep paternal conviction.

PHYSICAL CONTINUITY: The colossal educational model occupies the side of the frame on the bench, showing dramatic clean transformation. On the bench sits the saucepan of golden tonic alongside a clear glass teapot, next to the ingredients.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead lines, natural skin texture, vellus hairs, realistic arm hair, authentic light interaction with skin irregularities. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Both hands hold the glass mug with natural skin compression against the glass handle.

ACTION: Presenter delivers narration with direct, heartfelt conviction, looking into the camera lens with charismatic confidence.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Toma isso de manhã e outro antes de dormir. Minha mãe começou a tomar e o corpo dela limpou de um jeito que todo mundo reparou."

${settingDesc}`
  };

  const stepCTA = {
    baseTitle: customBookTitle ? `CTA COM LIVRO "${customBookTitle.toUpperCase()}"` : 'CTA COM LIVRO FARMÁCIA DA LONGEVIDADE',
    focalObject: customBookTitle 
      ? `Livro físico impresso "${customBookTitle}" em destaque nas mãos do apresentador`
      : `Livro físico impresso "FARMÁCIA DA LONGEVIDADE - 200 RECEITAS CASEIRAS" em destaque nas mãos do apresentador`,
    actionSummary: customBookTitle
      ? `Apresentador ergue e exibe com orgulho o livro físico "${customBookTitle}", aponta para baixo convidando a comentar EU QUERO, finalizando com autoridade e convicção`
      : 'Apresentador ergue e exibe o livro físico "FARMÁCIA DA LONGEVIDADE", aponta para baixo convidando a comentar EU QUERO, finalizando com autoridade e convicção',
    cameraFraming: 'Plano Médio Frontal com lente 28mm. O livro físico é erguido na altura do peito ocupando posição central de destaque no enquadramento, com iluminação limpa destacando o título em relevo.',
    visualSceneDescription: `O apresentador segura com as duas mãos o livro físico impresso "${customBookTitle || 'FARMÁCIA DA LONGEVIDADE'}", exibindo a capa com nitidez para a câmera. Com o dedo indicador direito, ele aponta para baixo na direção dos comentários enquanto profere o CTA "Comenta EU QUERO aqui embaixo", encerrando com convicção e autoridade.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Exibição Frontal do Livro Físico',
        action: 'Apresentador ergue com as duas mãos o livro físico com capa nítida e título visível em primeiro plano, demonstrando peso e autenticidade.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Chamada para Ação (CTA "Comenta EU QUERO")',
        action: 'Com a mão esquerda segurando o livro, aponta com firmeza o dedo indicador direito para a parte inferior da tela, convocando a comentar EU QUERO.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Fechamento com Autoridade',
        action: 'Sorriso carismático e olhar firme de autoridade convidando para garantir o exemplar, encerrando a sequência perfeitamente.'
      }
    ],
    spokenLinePt: 'Comenta EU QUERO aqui embaixo que te mando no privado com mais de duzentas receitas secretas de família. Garante o teu!',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing holding the physical book prominently at chest height in the upper-center of the screen.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Presenter lifts the physical printed book with both hands right into the center of the frame, showing its tangible weight, thick pages, and embossed cover title.
• Holding the book firmly in his left hand, his right index finger points directly and decisively down toward the comment area below, commanding viewers to comment "EU QUERO".
• Warm, authoritative closing smile and direct magnetic eye contact as the recording closes with undeniable confidence.

HOLDING THE VIRAL BOOK & DIRECT CALL TO ACTION:
In the center of the frame, the presenter proudly holds up with both muscular hands a substantial printed physical hardcover book ${bookImageBase64 ? 'faithfully matching the uploaded custom book cover reference in design, palette, artwork and styling' : 'with an olive-green and gold cover'}. Clearly legible in crisp, embossed serif gold lettering printed on the front cover is the title:
"${(customBookTitle || 'FARMÁCIA DA LONGEVIDADE').toUpperCase()}"
${customBookTitle ? '' : `with the subtitle:
"200 RECEITAS CASEIRAS"
below which is a tasteful printed photographic composition showing fresh lemons, ginger rhizomes, a jar of honey, and herbal tea in a glass cup.`}

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Tiny pigmentation variations, minute blemishes, faint sun spots, localized redness, subtle under-eye discoloration, fine facial vellus hairs, individual body hairs, realistic hair follicles, natural forehead lines, nasolabial folds, tiny facial asymmetries. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Left hand holds the physical book firmly toward the lens; right hand points with index finger downward toward the comment section, concluding with a firm, welcoming gesture.

ACTION: Presenter holds the book prominently, speaks with energetic warmth, points directly down into the camera inviting viewers to comment, delivering the closing line with magnetic conviction and genuine paternal authority.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Comenta EU QUERO aqui embaixo que te mando no privado com mais de duzentas receitas secretas de família. Garante o teu!"

${settingDesc}`
  };

  const stepOrganicClose = {
    baseTitle: 'RELATO DE CURA, ORIENTAÇÕES DE CONSUMO & PRESERVAÇÃO',
    focalObject: `Apresentador na bancada de madeira ao lado do modelo anatômico limpo e caneca da receita caseira`,
    actionSummary: 'Apresentador compartilha a frequência ideal de consumo, explica a proteção contínua que os bioativos trazem para o organismo e encerra com carisma e autoridade paternal.',
    cameraFraming: 'Plano Médio Frontal com lente 28mm e iluminação natural limpa.',
    visualSceneDescription: `O apresentador gesticula de forma acolhedora e confiante, orientando o espectador sobre a rotina de consumo recomendada (2 a 3 vezes por semana ou pela manhã em jejum). Ele apoia a mão na bancada com segurança e fecha o vídeo com um sorriso fraterno de mentor sem apelo de venda.`,
    visualTimeline: [
      {
        time: '00:00 - 00:03',
        title: 'Orientação de Frequência e Dosagem',
        action: 'Apresentador gesticula com a mão indicando a frequência ideal na rotina semanal para manter o efeito desintoxicante ativo.'
      },
      {
        time: '00:03 - 00:06',
        title: 'Ação Biológica a Longo Prazo',
        action: 'Explica como a combinação desses bioativos impede o retorno do acúmulo patológico, blindando o órgão contra inflamações.'
      },
      {
        time: '00:06 - 00:08',
        title: 'Encerramento com Autoridade & Conexão',
        action: 'Sorriso caloroso e olhar fixo na câmera com autoridade amigável, encerrando o vídeo de forma 100% orgânica sem apelo de venda.'
      }
    ],
    spokenLinePt: 'Mantém essa receita duas ou três vezes na semana. O teu organismo vai limpando naturalmente e você vai sentir a diferença na tua energia. Cuida do teu corpo!',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing focused on the presenter beside the clean demonstration bench.

WHAT HAPPENS VISUALLY (ORGANIC CLOSING TIMELINE):
• Presenter gestures with open, communicative hands, explaining with authentic paternal warmth how natural bioactive compounds keep cellular channels functioning at peak vitality.
• He gestures toward the transformed clean model on the bench and places his hand reassuringly near his chest, reinforcing daily wellness and natural health.
• Direct magnetic eye contact into the lens, nodding with confident mentorship and charismatic warmth as the scene naturally concludes without any commercial book pitch.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression creases, nasolabial folds, natural skin texture, vellus facial hairs, arm veins bulging with realistic vascularity. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Expressive open-palm gestures, gold wedding band visible on left ring finger.

ACTION: Presenter delivers closing guidance with direct, engaging conversational lip-sync, maintaining magnetic eye contact with the viewer while gesturing warmly to explain routine maintenance.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mantém essa receita duas ou três vezes na semana. O teu organismo vai limpando naturalmente e você vai sentir a diferença na tua energia. Cuida do teu corpo!"

${settingDesc}`
  };

  // Modular Selection based on targetCount and hasCTA
  let chosenSteps: any[] = [];
  if (hasCTA) {
    const slotsBeforeCTA = targetCount - 1;
    if (slotsBeforeCTA >= 7) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepCook2, stepPortions, stepTasting, stepCTA];
    } else if (slotsBeforeCTA === 6) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepPortions, stepTasting, stepCTA];
    } else if (slotsBeforeCTA === 5) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepPortions, stepTasting, stepCTA];
    } else if (slotsBeforeCTA === 4) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepTasting, stepCTA];
    } else if (slotsBeforeCTA === 3) {
      chosenSteps = [stepHook, stepIngredients, stepTasting, stepCTA];
    } else if (slotsBeforeCTA === 2) {
      chosenSteps = [stepHook, stepIngredients, stepCTA];
    } else {
      chosenSteps = [stepHook, stepCTA];
    }
  } else {
    // 100% Organic, NO stepCTA
    if (targetCount >= 8) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepCook2, stepPortions, stepTasting, stepOrganicClose];
    } else if (targetCount === 7) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepCook2, stepPortions, stepTasting];
    } else if (targetCount === 6) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepPortions, stepTasting];
    } else if (targetCount === 5) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepPortions, stepTasting];
    } else if (targetCount === 4) {
      chosenSteps = [stepHook, stepProblem, stepIngredients, stepTasting];
    } else if (targetCount === 3) {
      chosenSteps = [stepHook, stepIngredients, stepTasting];
    } else {
      chosenSteps = [stepHook, stepIngredients];
    }
  }

  // Ensure chosenSteps has exactly targetCount elements
  chosenSteps = chosenSteps.slice(0, targetCount);

  // Map chosen steps to finalized CorpoReveladoPrompt array with exact sequential IDs and dynamic time ranges
  const finalPrompts = chosenSteps.map((step, idx) => {
    const promptId = idx + 1;
    const timeRange = formatTimeRange(idx);
    return {
      id: promptId,
      stepName: `PROMPT ${promptId} — ${step.baseTitle} — 8s`,
      durationSeconds: 8,
      timeRange,
      focalObject: step.focalObject,
      actionSummary: step.actionSummary,
      cameraFraming: step.cameraFraming,
      visualSceneDescription: step.visualSceneDescription,
      visualTimeline: step.visualTimeline,
      spokenLinePt: step.spokenLinePt,
      promptText: step.promptText
    };
  });

  return {
    id: `script-${Date.now()}`,
    theme: cleanTheme,
    promptCount: targetCount,
    includeCTA: hasCTA,
    totalDurationSeconds: targetCount * 8,
    summary: `Demonstração visual de alto impacto de ${cleanTheme} utilizando modelo educacional COLOSSAL (60% do quadro) em ${targetCount} etapas de 8s (${targetCount * 8}s total) com gancho inovador: ${selectedHook.summary}`,
    focalObject: focalModel,
    targetProblem: `Camada densa e visceral simulando acúmulo patológico e impurezas associadas a ${cleanTheme}`,
    solutionIngredients: ingredientsText,
    elementsPrepared: `Ingredientes caseiros simples em potes de vidro no banco de madeira de dojo e panela/recipiente de preparo`,
    transformationType: hasCTA 
      ? `Preparo ao vivo do remédio caseiro no banco de madeira, seguido de consumo/degustação e CTA com o livro ${customBookTitle || 'Farmácia da Longevidade'}`
      : `Preparo ao vivo do remédio caseiro no banco de madeira, seguido de consumo/degustação e relato prático de melhora sem venda`,
    characterUsed: characterLabel,
    settingUsed: settingLabel,
    bookTitleUsed: hasCTA ? (customBookTitle || 'Farmácia da Longevidade') : undefined,
    characterImagePreview: characterImageBase64 ? (characterImageBase64.startsWith('data:') ? characterImageBase64 : `data:image/jpeg;base64,${characterImageBase64}`) : undefined,
    settingImagePreview: settingImageBase64 ? (settingImageBase64.startsWith('data:') ? settingImageBase64 : `data:image/jpeg;base64,${settingImageBase64}`) : undefined,
    bookImagePreview: (hasCTA && bookImageBase64) ? (bookImageBase64.startsWith('data:') ? bookImageBase64 : `data:image/jpeg;base64,${bookImageBase64}`) : undefined,
    createdAt: new Date().toISOString(),
    referenceAnalysis: referenceVideoBase64 ? {
      hasReference: true,
      referenceType: 'video',
      videoFileName: videoFileName || 'video-viral-referencia.mp4',
      detectedHook: `Gancho dinâmico e retenção inicial transpostos do vídeo viral (${videoFileName || 'referência'}): ${selectedHook.summary}`,
      detectedObject: focalModel,
      pacingPreserved: `${targetCount} etapas de 8s (${targetCount * 8}s total) com lip-sync em cena e continuidade`
    } : (referenceText ? {
      hasReference: true,
      referenceType: 'text',
      detectedHook: `Gancho exclusivo com modelo colossal (60% do quadro): ${selectedHook.summary}`,
      detectedObject: focalModel,
      pacingPreserved: `${targetCount} etapas de 8s (${targetCount * 8}s no total)`
    } : undefined),
    prompts: finalPrompts
  };
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
      customBookTitle,
      bookImageBase64,
      bookImageMimeType,
      promptCount,
      includeCTA,
      includePrompt5
    } = req.body;

    const targetPromptCount = Math.max(2, Math.min(10, Number(promptCount) || 8));
    const targetIncludeCTA = includeCTA !== undefined ? Boolean(includeCTA) : (includePrompt5 !== undefined ? Boolean(includePrompt5) : true);

    if (!theme && !referenceText && !referenceImageBase64 && !referenceVideoBase64 && !characterImageBase64 && !settingImageBase64 && !customBookTitle && !bookImageBase64) {
      return res.status(400).json({ error: 'Forneça ao menos um tema, vídeo viral, texto, livro ou imagem de referência.' });
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
        customBookTitle,
        bookImageBase64,
        bookImageMimeType,
        referenceVideoBase64,
        videoFileName,
        targetPromptCount,
        targetIncludeCTA
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
REGRA OBRIGATÓRIA: Em TODOS OS 7 PROMPTS, descreva ESTE PERSONAGEM com fidelidade absoluta, incluindo seus poros, textura de pele e microexpressões, substituindo a figura do Mestre de BJJ padrão!`;
    } else if (customCharacterDescription) {
      characterDirective = `DIRETIVA DE PERSONAGEM PERSONALIZADO (TEXTO):
${customCharacterDescription}. Mantenha a identidade e características físicas deste personagem em todos os 7 prompts.`;
    } else {
      characterDirective = `DIRETIVA DE PERSONAGEM PADRÃO:
Apresentador Oficial: Mestre de Jiu-Jitsu veterano de ~50 anos, porte atlético/lutador, orelhas de couve-flor (cauliflower ears), rashguard cinza BJJ no peito esquerdo, bermuda preta, aliança de ouro no anular esquerdo, poros naturais e sem filtros de beleza.`;
    }

    // Specific setting instructions
    let settingDirective = '';
    if (settingImageBase64) {
      settingDirective = `DIRETIVA DE CENÁRIO PERSONALIZADO FORNECIDO VIA FOTO:
O usuário enviou uma FOTO DO CENÁRIO/AMBIENTE DE FUNDO. Você DEVE analisar minuciosamente o espaço (arquitetura, iluminação, paredes, bancada de apoio, objetos de fundo).
REGRA OBRIGATÓRIA: Em TODOS OS 7 PROMPTS, utilize ESTE CENÁRIO exato como o fundo e bancada das ações, substituindo o Dojo de BJJ e as bandeiras da parede!`;
    } else if (customSettingDescription) {
      settingDirective = `DIRETIVA DE CENÁRIO PERSONALIZADO (TEXTO):
${customSettingDescription}. Mantenha este ambiente como o cenário e balcão de apoio em todos os 7 prompts.`;
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
        text: `[IMAGEM 1 — FOTO DE REFERÊNCIA DO PERSONAGEM]: Utilize este personagem real como base para a descrição do apresentador em TODOS os 7 prompts, capturando seus traços faciais, idade, cabelo, biotipo e estilo com máxima coerência.`
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
        text: `[IMAGEM 2 — FOTO DE REFERÊNCIA DO CENÁRIO]: Utilize este ambiente real como o cenário de fundo e balcão de demonstração em TODOS os 7 prompts, com iluminação e arquitetura idênticas.`
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
      contents.push({
        inlineData: {
          mimeType: videoMimeType,
          data: cleanData
        }
      });
      contents.push({
        text: `[VÍDEO VIRAL DE REFERÊNCIA ENVIADO PELO USUÁRIO${videoFileName ? ` (${videoFileName})` : ''}]:
O usuário enviou este VÍDEO VIRAL REAL de referência para análise aprofundada de retenção e estrutura.
ANALISE PROFUNDAMENTE A ENGENHARIA VIRAL DESTE VÍDEO:
1. O GANCHO NOS PRIMEIROS SEGUNDOS (00:00 - 00:08): Qual elemento ou ação chamou atenção imediata? Qual o modelo ou objeto focal em destaque? Houve corte, extração, despejo ou revelação de impacto?
2. A LINGUAGEM VISUAL: Enquadramento vertical, distância da câmera (plano médio do apresentador, primeiro plano do objeto), iluminação e texturas.
3. INGREDIENTES E AÇÕES PRÁTICAS: Quais ingredientes foram manipulados na bancada? Qual foi a ação de preparo demonstrada?
4. CADÊNCIA E TOM: Como o apresentador fala? (Tom conversacional natural, olhando nos olhos, sem parecer locutor comercial).
TRANSPONHA ESSA ENGENHARIA VIRAL para nossa sequência oficial de 8 PROMPTS de 8 segundos (64s total):
- PROMPT 1: Gancho visual chocante com modelo colossal (60% do quadro) replicando a força do gancho do vídeo viral.
- PROMPT 2: Explicação profunda do problema e patologia interna demonstrada no modelo colossal.
- PROMPT 3: Ingredientes caseiros na bancada (mostrar, citar nomes e bioativos).
- PROMPT 4: Preparo Parte 1: Base de água fervente na panela inox, adicionando os primeiros ingredientes com lip-sync ao vivo (anti-locutor).
- PROMPT 5: Preparo Parte 2: Continuação contínua na mesma panela já com os ingredientes anteriores dentro, adicionando bioativos concentrados (cúrcuma, limão fresco, mel puro).
- PROMPT 6: Quantidade exata dos ingredientes e tempo de preparo/fervura/infusão que a receita precisa pra ficar pronta com máxima potência terapêutica.
- PROMPT 7: Uso/Degustação e relato do efeito biológico curativo.
- PROMPT 8: Fechamento com o livro físico "FARMÁCIA DA LONGEVIDADE" (ou livro personalizado) segurado com as duas mãos.`
      });
    }

    if (bookImageBase64) {
      const cleanData = bookImageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: bookImageMimeType || 'image/jpeg',
          data: cleanData
        }
      });
      contents.push({
        text: `[IMAGEM DO LIVRO DO PROMPT 8]: O usuário enviou a CAPA EXATA do livro físico que o apresentador deve segurar no Prompt 8. O promptText do Prompt 8 DEVE descrever o livro físico reproduzindo com fidelidade esta capa (design, cores, arte e diagramação), exibindo com destaque o título "${customBookTitle || 'LIVRO'}" impresso na frente.`
      });
    }

    const bookTitleToUse = customBookTitle ? customBookTitle.trim() : 'FARMÁCIA DA LONGEVIDADE - 200 RECEITAS CASEIRAS';
    const bookDirective = targetIncludeCTA
      ? (customBookTitle || bookImageBase64
          ? `DIRETIVA DE LIVRO PERSONALIZADO (ÚLTIMO PROMPT - PROMPT ${targetPromptCount}): O apresentador ergue e exibe com as duas mãos para a câmera o LIVRO FÍSICO DO USUÁRIO intitulado "${bookTitleToUse}".${bookImageBase64 ? ' O design da capa deve seguir minuciosamente a imagem de referência do livro enviada.' : ''}`
          : `DIRETIVA DE LIVRO PADRÃO (ÚLTIMO PROMPT - PROMPT ${targetPromptCount}): O apresentador ergue e exibe o livro físico "FARMÁCIA DA LONGEVIDADE - 200 RECEITAS CASEIRAS" com capa verde-oliva e dourada.`)
      : `DIRETIVA SEM LIVRO E SEM CTA COMERCIAL (VÍDEO 100% ORGÂNICO): O usuário escolheu NÃO incluir CTA nem livro. NÃO mencione livros físicos, NÃO prometa material por direct, NÃO mande comentar 'EU QUERO'. O último prompt (${targetPromptCount}) encerra com a degustação da receita, sensação imediata de alívio e bem-estar, e uma conclusão inspiradora sobre a saúde recuperada.`;
    
    let userPromptText = `Gere a sequência de EXATAMENTE ${targetPromptCount} PROMPTS conectados de 8s cada (${targetPromptCount * 8}s no total) com alta fidelidade visual e narrativa visceral.

TEMA SOLICITADO: ${theme || 'Análise de referência fornecida'}
QUANTIDADE EXATA DE PROMPTS A GERAR: ${targetPromptCount} prompts (duração total: ${targetPromptCount * 8} segundos)
INCLUIR CTA/LIVRO NO FINAL: ${targetIncludeCTA ? `SIM (o prompt ${targetPromptCount} deve ser o CTA do livro)` : 'NÃO (vídeo 100% orgânico educacional, sem livro e sem venda)'}
${giantModelPreference ? `PREFERÊNCIA DE MODELO ANATÔMICO: ${giantModelPreference}` : ''}
${hookStyle ? `ESTILO DO GANCHO: ${hookStyle}` : ''}
${solutionIngredients ? `INGREDIENTES CASEIROS SOLICITADOS: ${solutionIngredients}` : 'INGREDIENTES CASEIROS DA CURA: Selecione e especifique ingredientes caseiros variados e pertinentes ao tema (ATENÇÃO: NUNCA repita sempre os mesmos ingredientes! Varie entre chás digestivos, vinagre de maçã, alho triturado, canela, hortelã, bicarbonato, óleo virgem, cúrcuma, etc., adequando a cada patologia).'}
ESCALA DO OBJETO NO GANCHO: OBJETO COLOSSAL OCUPANDO 55% A 65% DO ENQUADRAMENTO VERTICAL 9:16 (em primeiro plano extremo colado na lente, perspectiva forçada ultra-wide 20-24mm).
${hookActionDirective}

${characterDirective}

${settingDirective}

${bookDirective}

ESTRUTURA DAS ETAPAS PARA OS ${targetPromptCount} PROMPTS:
- PROMPT 1 (00:00 - 00:08): GANCHO COM OBJETO COLOSSAL. Apresentador executa a ação cirúrgica/visceral no modelo gigante em primeiro plano.
- PROMPT 2 (00:08 - 00:16): EXPLICAÇÃO DO PROBLEMA (O QUE É O PROBLEMA). O apresentador aponta para a parte afetada no modelo, explicando o acúmulo patológico e sintomas.
${targetPromptCount >= 3 ? '- PROMPT 3 (00:16 - 00:24): INGREDIENTES CASEIROS DA CURA. O apresentador dispõe na bancada os ingredientes caseiros simples, citando expressamente cada um e seus bioativos.\n' : ''}
${targetPromptCount >= 4 ? '- PROMPT 4 (00:24 - 00:32): PREPARO AO VIVO / INÍCIO DA RECEITA. O apresentador inicia o preparo em plano médio, falando diretamente para a câmera (lip-sync natural).\n' : ''}
${targetPromptCount >= 5 ? '- PROMPT 5 (00:32 - 00:40): CONTINUIDADE DO PREPARO NA PANELA / INFUSÃO. Continua diretamente na mesma panela sem mudar formato ou utensílios.\n' : ''}
${targetPromptCount >= 6 ? '- PROMPT 6 (00:40 - 00:48): QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO QUE PRECISA PRA FICAR PRONTO. Apresentador detalha as medidas exatas (colheres, ml, copos) e o tempo de fervura/infusão em fogo brando para extrair o máximo de bioativos.\n' : ''}
${targetPromptCount >= 7 ? '- PROMPT 7 (00:48 - 00:56): USO, DEGUSTAÇÃO & RELATO DE CURA / ALÍVIO. O apresentador degusta, compartilha como tomar e o alívio imediato no organismo.\n' : ''}
${targetIncludeCTA ? `- PROMPT FINAL (PROMPT ${targetPromptCount}): CTA COM LIVRO FÍSICO "${bookTitleToUse}". Apresentador ergue o livro e diz "Comenta EU QUERO aqui embaixo que te mando no privado... Garante o teu!" (SEM a fala "OSS!").` : `- PROMPT FINAL (PROMPT ${targetPromptCount}): DEGUSTAÇÃO E CONCLUSÃO ORGÂNICA. Degustação com sensação de alívio, vitalidade e encerramento inspirador (100% orgânico, sem livro).`}

DIRETRIZ DE SEGURANÇA E POLÍTICAS DE ANÚNCIOS/PLATAFORMAS (OBRIGATÓRIO): NUNCA mande o público esquecer ou parar remédios da farmácia, NUNCA ataque a medicina tradicional e NUNCA invente teorias da conspiração farmacêutica. O discurso deve ser 100% focado no poder dos compostos bioativos naturais da culinária, garantindo total conformidade com as diretrizes do Meta, TikTok e YouTube sem risco de restrições ou bloqueios.

${referenceText ? `REFERÊNCIA / TRANSCRIÇÃO FORNECIDA:\n"""${referenceText}"""\nAnalise a engenharia visual da referência (ordem das ações, escala dos objetos, composição, perspectiva, ritmo, transformação).` : ''}

Lembre-se:
1. Formato exato: EXATAMENTE ${targetPromptCount} PROMPTS conectados de 8 segundos cada (total ${targetPromptCount * 8}s), formato 9:16 vertical, 4K, 30fps.
2. Cada prompt deve ser completo e independente, repetindo toda a descrição do Apresentador, da Pele Humana, das Mãos, do Cenário e da Câmera.
3. Objeto educacional COLOSSAL em primeiro plano extremo (ocupando de 55% a 65% da tela 9:16) no Prompt 1.
4. Todas as falas em Português Brasileiro (~8 segundos cada, diretas, autênticas e magnéticas).
5. O promptText de cada cena deve estar em inglês altamente descritivo e pronto para ferramentas de geração de vídeo (Sora, Runway Gen-3, Kling, Luma).
6. REGRA CRÍTICA INEGOCIÁVEL — SEM LEGENDAS E SEM TEXTO NA TELA (ZERO SUBTITLES, ZERO ON-SCREEN TEXT): O vídeo NÃO deve exibir legendas nem qualquer tipo de texto na tela. O promptText de CADA UM dos prompts DEVE começar OBRIGATORIAMENTE com a proibição:
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
                    id: { type: Type.INTEGER, description: `Número do prompt (1 a ${targetPromptCount})` },
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
        customBookTitle,
        bookImageBase64,
        bookImageMimeType,
        referenceVideoBase64,
        videoFileName,
        targetPromptCount,
        targetIncludeCTA
      );
      sourceModel = 'fallback-local-engine';
    }

    // Ensure prompt count and CTA metadata are normalized on parsed object
    parsed.promptCount = targetPromptCount;
    parsed.includeCTA = targetIncludeCTA;
    parsed.totalDurationSeconds = targetPromptCount * 8;

    if (!Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
      const fallback = generateLocalScript(
        theme || 'Demonstração de Saúde', 
        referenceText,
        hookActionType,
        solutionIngredients,
        customCharacterDescription,
        customSettingDescription,
        characterImageBase64,
        settingImageBase64,
        customBookTitle,
        bookImageBase64,
        bookImageMimeType,
        referenceVideoBase64,
        videoFileName,
        targetPromptCount,
        targetIncludeCTA
      );
      parsed.prompts = fallback.prompts;
    } else {
      if (parsed.prompts.length > targetPromptCount) {
        parsed.prompts = parsed.prompts.slice(0, targetPromptCount);
      } else if (parsed.prompts.length < targetPromptCount) {
        const fallback = generateLocalScript(
          theme || 'Demonstração de Saúde', 
          referenceText,
          hookActionType,
          solutionIngredients,
          customCharacterDescription,
          customSettingDescription,
          characterImageBase64,
          settingImageBase64,
          customBookTitle,
          bookImageBase64,
          bookImageMimeType,
          referenceVideoBase64,
          videoFileName,
          targetPromptCount,
          targetIncludeCTA
        );
        while (parsed.prompts.length < targetPromptCount) {
          const idx = parsed.prompts.length;
          parsed.prompts.push(fallback.prompts[idx] || fallback.prompts[fallback.prompts.length - 1]);
        }
      }

      // Re-index IDs and time ranges to ensure perfect 8-second increments
      parsed.prompts = parsed.prompts.map((p: any, idx: number) => {
        const startSec = idx * 8;
        const endSec = (idx + 1) * 8;
        const pad = (n: number) => String(n).padStart(2, '0');
        const startMin = Math.floor(startSec / 60);
        const startRemSec = startSec % 60;
        const endMin = Math.floor(endSec / 60);
        const endRemSec = endSec % 60;
        const timeRange = `${pad(startMin)}:${pad(startRemSec)} - ${pad(endMin)}:${pad(endRemSec)}`;
        return {
          ...p,
          id: idx + 1,
          durationSeconds: 8,
          timeRange: timeRange
        };
      });
    }

    // Ensure metadata regarding character, scenario, book and reference analysis are saved to the response
    const characterLabel = customCharacterDescription || (characterImageBase64 ? 'Personagem Personalizado (Foto enviada)' : 'Mestre de BJJ Oficial (Padrão)');
    const settingLabel = customSettingDescription || (settingImageBase64 ? 'Cenário Personalizado (Foto enviada)' : 'Dojo BJJ com 3 Bandeiras (Padrão)');
    parsed.characterUsed = parsed.characterUsed || characterLabel;
    parsed.settingUsed = parsed.settingUsed || settingLabel;

    if (customBookTitle || bookImageBase64) {
      parsed.bookTitleUsed = customBookTitle || 'Livro Personalizado (Capa enviada)';
    }

    if (characterImageBase64) {
      parsed.characterImagePreview = characterImageBase64.startsWith('data:') ? characterImageBase64 : `data:${characterImageMimeType || 'image/jpeg'};base64,${characterImageBase64}`;
    }
    if (settingImageBase64) {
      parsed.settingImagePreview = settingImageBase64.startsWith('data:') ? settingImageBase64 : `data:${settingImageMimeType || 'image/jpeg'};base64,${settingImageBase64}`;
    }
    if (bookImageBase64) {
      parsed.bookImagePreview = bookImageBase64.startsWith('data:') ? bookImageBase64 : `data:${bookImageMimeType || 'image/jpeg'};base64,${bookImageBase64}`;
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
        pacingPreserved: parsed.referenceAnalysis?.pacingPreserved || `${targetPromptCount} etapas de 8s (${targetPromptCount * 8}s total) com continuidade de panela e lip-sync`
      };
    } else if (referenceImageBase64) {
      parsed.referenceAnalysis = {
        hasReference: true,
        referenceType: 'image',
        detectedHook: parsed.referenceAnalysis?.detectedHook || 'Gancho visual e objeto colossal derivados da imagem de referência',
        detectedObject: parsed.referenceAnalysis?.detectedObject || parsed.focalObject,
        pacingPreserved: parsed.referenceAnalysis?.pacingPreserved || 'Enquadramento e escala anatômica preservados'
      };
    } else if (referenceText) {
      parsed.referenceAnalysis = {
        hasReference: true,
        referenceType: 'text',
        detectedHook: parsed.referenceAnalysis?.detectedHook || 'Estrutura narrativa adaptada da referência textual fornecida',
        detectedObject: parsed.referenceAnalysis?.detectedObject || parsed.focalObject,
        pacingPreserved: parsed.referenceAnalysis?.pacingPreserved || `Fórmula de ${targetPromptCount} atos com lip-sync`
      };
    }

    // Apply strict enforcement: ABSOLUTELY NO SUBTITLES, NO CAPTIONS, NO ON-SCREEN TEXT across all prompts
    parsed = enforceZeroTextAndSubtitles(parsed);

    parsed.id = `script-${Date.now()}`;
    parsed.createdAt = new Date().toISOString();

    return res.json({ script: parsed, source: sourceModel });
  } catch (fatalError: any) {
    console.log('[Generation Handler] Local fallback invoked');
    const fallbackPromptCount = Math.max(2, Math.min(10, Number(req.body?.promptCount) || 8));
    const fallbackIncludeCTA = req.body?.includeCTA !== undefined ? Boolean(req.body?.includeCTA) : (req.body?.includePrompt5 !== undefined ? Boolean(req.body?.includePrompt5) : true);
    const fallbackScript = generateLocalScript(
      req.body?.theme || 'Demonstração de Saúde', 
      req.body?.referenceText,
      req.body?.hookActionType,
      req.body?.solutionIngredients,
      req.body?.customCharacterDescription,
      req.body?.customSettingDescription,
      req.body?.characterImageBase64,
      req.body?.settingImageBase64,
      req.body?.customBookTitle,
      req.body?.bookImageBase64,
      req.body?.bookImageMimeType,
      req.body?.referenceVideoBase64,
      req.body?.videoFileName,
      fallbackPromptCount,
      fallbackIncludeCTA
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
        reply: `Aqui está a sequência oficial de 6 prompts de 8 segundos (48s no total) para o tema "${message}", com o Mestre de BJJ no dojo com as 3 bandeiras, o preparo ao vivo na panela em duas partes com lip-sync e o livro Farmácia da Longevidade (sem legendas nem textos na tela):`,
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
Se o usuário já tiver fornecido um tema, estruture a resposta no padrão do Mestre de BJJ no dojo com as 3 bandeiras (Brasil, EUA e Israel), modelo colossal no gancho com despejo no segundo 00:00, ingredientes da cozinha no Prompt 2, preparo ao vivo na panela inox em duas partes com lip-sync nos Prompts 3 e 4, degustação no Prompt 5 e livro no Prompt 6 (SEM a fala "OSS!" e SEM legendas nem textos na tela).`,
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
        reply: `Aqui está a sequência oficial de 6 prompts de 8 segundos (48s no total) para o tema "${message}", com o Mestre de BJJ no dojo com as 3 bandeiras, preparo ao vivo com lip-sync e o livro Farmácia da Longevidade (sem legendas nem textos na tela):`,
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
