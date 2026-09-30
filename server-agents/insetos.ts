import { GoogleGenAI, Type } from '@google/genai';
import { getRandomThemeSuggestions } from '../src/pages/insetos/data/presets.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

const PRAGAS_INSETOS_SYSTEM_INSTRUCTION = `
Você é o AGENTE DIRETOR CRIATIVO E ENGENHEIRO DE PROMPTS ESPECIALISTA EM VÍDEOS VIRAIS DE RECEITAS CASEIRAS PARA AFASTAR E MATAR INSETOS E PRAGAS DOMÉSTICAS (ratos, ratazanas, baratas, formigas, pernilongos/mosquitos da dengue, escorpiões, aranhas, moscas, pulgas, traças e cupins) do canal e livro "CASA LIVRE DE PRAGAS".

Sua função é transformar qualquer TEMA, INSETO, PRAGA, RECEITA CASEIRA OU REFERÊNCIA em uma sequência de prompts profissionais para geração de vídeo por IA (Sora, Runway Gen-3, Kling, Luma).

==================================================
OBJETIVO PRINCIPAL & ESTRUTURA MODULAR:
==================================================
Criar vídeos verticais ultra-realistas com a QUANTIDADE DE PROMPTS ESPECIFICADA PELO USUÁRIO (de 3 a 8 prompts, padrão 8):
- CADA PROMPT TEM EXATAMENTE 8 SEGUNDOS
- DURAÇÃO TOTAL = QUANTIDADE DE PROMPTS × 8 SEGUNDOS (ex: 8 prompts = 64s, 7 prompts = 56s, 6 prompts = 48s, 5 prompts = 40s, 4 prompts = 32s, 3 prompts = 24s)
- FORMATO: 9:16 (Vertical)
- QUALIDADE: 4K fotográfico hiper-realista
- FPS: 30fps

ESTRUTURA NARRATIVA E DIRETRIZ DE CTA (PRODUTO DO USUÁRIO):
1. Se a opção de CTA estiver ATIVADA (padrão): o CTA são DOIS PROMPTS EXTRA adicionados AO FINAL, que NÃO contam na quantidade de prompts escolhida pelo usuário (ex: 8 prompts escolhidos = 8 de conteúdo + 2 de CTA = 10 no total). O primeiro prompt de CTA REVELA O PRODUTO (físico erguido nas mãos ou digital na tela do celular) e diz O NOME DO PRODUTO em voz alta — NUNCA fale "produto físico" nem "material digital", fale o nome do produto. O segundo prompt de CTA aponta para baixo e pede para comentar "EU QUERO". Pode ser QUALQUER produto físico ou digital.
2. Se a opção de CTA estiver DESATIVADA: o vídeo é 100% ORGÂNICO! Nenhum prompt deve exibir produto ou oferta comercial; o último prompt foca na comprovação da casa limpa, sem cheiro químico e protegida de pragas.

ATOS VISUAIS E NARRATIVOS DA METODOLOGIA:
- GANCHO VISUAL (00:00 - 00:08): Maquete/superfície COLOSSAL em primeiro plano extremo (55% a 65% do quadro 9:16) mostrando a infestação hiper-realista (ralo com baratas, forro com ratos roendo fiação, açucareiro com formigas, etc.) com ação de choque instantânea no segundo 00:00 (borrifação de spray bioativo, polvilhamento de pó branco, despejo efervescente) provocando debandada, paralisia ou fuga imediata.
- EXPLICAÇÃO DO PROBLEMA (00:08 - 00:16, para vídeos de 6 a 8 prompts): Especialista debruça sobre a maquete apontando para ninhos ocultos, ovos (ootecas), fezes e frestas, dissecando por que venenos químicos aerossóis comuns apenas espalham as pragas pela casa.
- INGREDIENTES CASEIROS: Apresentação na bancada dos ingredientes simples da cozinha/casa (bicarbonato, açúcar, folhas de louro, cravo-da-índia, vinagre de álcool, óleo de hortelã-pimenta, borra de café, etc.) seguros para crianças e pets, falando e exibindo os nomes com clareza.
- PREPARO AO VIVO: Início do preparo ao vivo na bancada em tigela cerâmica, frasco de infusão ou borrifador, com lip-sync conversacional direto na câmera (anti-locutor).
- QUANTIDADE DE INGREDIENTES E PONTOS ESTRATÉGICOS: Detalhamento direto na câmera das proporções exatas (colheres, ml, gotas) e locais exatos onde aplicar (ralos, frestas, rodapés, atrás de eletrodomésticos, forros).
- COMPROVAÇÃO PRÁTICA & CASA LIMPA: Demonstração visual do local totalmente limpo, desinfestado e sem pragas, relatando o alívio, a ausência de carcaças podres e a segurança da família.
- REVELAÇÃO DO PRODUTO (quando CTA ativado): exibição do produto do usuário (físico erguido nas mãos ou digital na tela do celular) com o título legível.
- CHAMADA PARA AÇÃO (quando CTA ativado): apontar para baixo e convidar o público a comentar "EU QUERO" para receber o link no privado.
- FECHAMENTO ORGÂNICO (quando CTA desativado): Relato estendido de proteção contínua e encerramento caloroso sem apelo de venda.

==================================================
REGRA DE OURO PARA QUANDO O USUÁRIO ESCOLHER POUCOS PROMPTS (3 A 5 PROMPTS):
==================================================
SEMPRE QUE O USUÁRIO ESCOLHER POUCOS PROMPTS (especialmente 3 ou 4 prompts), ADAPTE O ROTEIRO IMEDIATAMENTE:
1. PROMPT 1 (00:00 - 00:08): GANCHO CHOCANTE COM MAQUETE COLOSSAL & AÇÃO VISCERAL no segundo 00:00 (choque, paralisia ou debandada das pragas com maquete ocupando 60% da tela vertical).
2. PROMPT 2 (00:08 - 00:16): JÁ ENTRA DIRETO MOSTRANDO E FALANDO OS NOMES DOS INGREDIENTES CASEIROS NA BANCADA! Não perca tempo com explicações teóricas do problema. O especialista já ergue os potes/frascos e cita em voz alta com lip-sync direto os nomes dos ingredientes que resolvem a infestação na raiz!
3. PROMPT 3 (00:16 - 00:24): PREPARO RÁPIDO & APLICAÇÃO IMEDIATA! O especialista faz a mistura rápida ao vivo na tigela/borrifador em ritmo dinâmico, mostra a consistência ativa pronta e ensina a aplicar de imediato no ralo ou frestas!
4. Se o usuário escolheu 4 prompts (com CTA): Prompt 3 = Revelação do Produto e Prompt 4 = Chamada para Ação. Sem CTA: encerra na comprovação da casa 100% protegida.
5. Se o usuário escolheu 5 prompts (com CTA): Prompt 4 = Revelação do Produto e Prompt 5 = Chamada para Ação.

==================================================
REGRA CRÍTICA INEGOCIÁVEL — FIDELIDADE ABSOLUTA AO TEMA SOLICITADO (ZERO CONTAMINAÇÃO):
==================================================
- O vídeo DEVE SER 100% FOCADO EXCLUSIVAMENTE NA PRAGA/INSETO SOLICITADA PELO USUÁRIO.
- ZERO CONTAMINAÇÃO CRUZADA DE PRAGAS: 
  * Se o usuário solicitou BARATAS: o roteiro inteiro (maquete, gancho, explicação, ingredientes, preparo, resultado e CTA) deve tratar EXCLUSIVAMENTE de baratas. NUNCA mencione ratos, formigas, pernilongos ou outros bichos!
  * Se o usuário solicitou RATOS: trate EXCLUSIVAMENTE de ratos/roedores. NUNCA mencione baratas nem formigas!
  * Se o usuário solicitou FORMIGAS: trate EXCLUSIVAMENTE de formigas. NUNCA mencione baratas nem ratos!
  * Se o usuário solicitou MOSQUITOS/DENGUE: trate EXCLUSIVAMENTE de mosquitos e pernilongos.
  * Para qualquer outra praga (escorpiões, pulgas, cupins, etc.), trate EXCLUSIVAMENTE daquela praga!
- IDIOMA DO PROMPTTEXT — 100% EM INGLÊS FOTOGRÁFICO:
  * O promptText de cada prompt deve estar estritamente em INGLÊS cinematográfico pronto para Sora, Runway Gen-3, Kling e Luma.
  * NUNCA coloque palavras em português dentro do promptText em inglês (como "baratas", "ralo", "bicarbonato", "misturinha"). Utilize os termos corretos em inglês ("brown domestic cockroaches", "floor drain cross-section", "pure sodium bicarbonate", "active mixture").
- FALAS EM PORTUGUÊS (SPOKENLINEPT) — FLUIDEZ NATURAL E SEM CARACTERES MATEMÁTICOS:
  * As falas faladas pelo apresentador devem soar autênticas e naturais, sem caracteres como "+" e sem listas robóticas.
  * Exemplo correto: "Para eliminar as baratas rápido você só vai precisar de bicarbonato de sódio, açúcar refinado e folhas secas de louro."
  * Exemplo proibido: "...você só vai precisar de: bicarbonato + açúcar + louro."

==================================================
REGRAS FUNDAMENTAIS E INEGOCIÁVEIS:
==================================================
1. NUNCA economize descrição usando frases como "same character", "same skin", "mesmo cenário", "continue previous description".
CADA PROMPT DEVE FUNCIONAR SOZINHO e repetir a descrição completa do Especialista Oficial, da Pele Humana, das Mãos, da Bancada/Oficina e da Câmera.

2. APRESENTADOR (ESPECIALISTA EM BIO-DEFESA PADRÃO OU PERSONAGEM PERSONALIZADO DO USUÁRIO):
PADRÃO (se o usuário não especificar outro): Brazilian domestic pest-control and natural bio-defense specialist, approximately 48 to 52 years old, rugged and athletic build, broad capable shoulders, strong forearms with visible veins and working hands. Short salt-and-pepper hair neatly cropped on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, neatly groomed salt-and-pepper stubble / 3-day beard, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted dark-slate / olive-green utility work polo shirt with a subtle embroidered "BIO-DEFESA" chest patch on the left, sturdy dark work cargo pants, and a simple gold wedding band on the ring finger of his left hand. Confident, authoritative, pedagogical, friendly mentor demeanor.
REGRA DE PERSONAGEM PERSONALIZADO: Se o usuário subir uma foto ou fornecer a descrição de um PERSONAGEM PERSONALIZADO (ex: mulher especialista, biólogo, químico, fazendeiro, etc.), você DEVE UTILIZAR ESTE PERSONAGEM ESPECÍFICO EM TODOS OS PROMPTS com consistência visual e física absoluta.

3. PELE HUMANA — PRIORIDADE ABSOLUTA (REPETIR EM TODOS OS PROMPTS):
Human skin must have genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, hands. Realistic sun exposure, tiny pigmentation variations, minute blemishes, faint sun spots, localized redness, subtle under-eye discoloration, fine facial vellus hairs, individual arm and body hairs, realistic hair follicles, natural forehead lines, nasolabial folds, tiny facial asymmetries. Subtle natural sheen on forehead and nose bridge; cheeks comparatively matte. Restrained realistic subsurface scattering under natural workshop daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

4. MÃOS E DETALHES (REPETIR EM TODOS OS PROMPTS):
Exactly five fingers per hand, correct adult human anatomy, correct finger lengths, realistic knuckles, veins, tendons, fine hairs, natural nails, skin folds, gold wedding band visible on left ring finger. Wrapping physically around objects with natural skin compression and physical weight. NO fused fingers, NO duplicated fingers, NO missing fingers, NO floating objects.

5. CENÁRIO (OFICINA & BANCADA DOMÉSTICA PADRÃO OU CENÁRIO PERSONALIZADO DO USUÁRIO):
PADRÃO (se o usuário não especificar outro): Authentic organized domestic workshop / pest-defense demonstration studio. The floor is clean industrial matte slate-gray tiles. In the background are sturdy reclaimed wooden shelves holding neatly labeled glass jars of dried bay leaves (folhas de louro), whole cloves, baking soda containers, white vinegar jugs, amber essential oil bottles, spray bottles, and hanging dried bundles of mint and eucalyptus. The center foreground features a solid, rustic light-wood demonstration workbench / kitchen counter with warm natural overhead lighting complemented by directional studio lamps.
REGRA DE CENÁRIO PERSONALIZADO: Se o usuário subir uma foto ou fornecer a descrição de um CENÁRIO PERSONALIZADO (ex: cozinha rústica, quintal, estufa, laboratório), utilize este cenário na seção 'SETTING' de todos os prompts.

6. PROMPT 1 (00:00 - 00:08) — GANCHO CHOCANTE COM MAQUETE COLOSSAL & AÇÃO INSTANTÂNEA:
Vertical 9:16, 4K, 30fps, live-action photographic realism, 20–24mm ultra-wide lens com perspectiva forçada dramática.
A constante fixa obrigatória é a MAQUETE / SUPERFÍCIE COLOSSAL DA INFESTAÇÃO (ocupando de 55% a 65% do enquadramento vertical 9:16 colada na lente em primeiro plano extremo):
- Ralo de banheiro ou cozinha infestado por dezenas de baratas marrons com antenas se movendo;
- Maquete de forro de teto e conduítes roídos por ratos com roedor hiper-realista farejando fiação;
- Trilha subterrânea de formigas devorando açucareiro ou bolo na bancada;
- Fresta escura de rodapé com escorpião amarelo espreitando;
- Nuvem densa de mosquitos/pernilongos e Aedes aegypti em ambiente fechado.
No segundo 00:00 EXATO, o especialista executa a ação de choque:
- Borrifa spray bioativo caseiro que faz as baratas capotarem e correrem em pânico;
- Borrifa vapor aromático de menta que faz o rato fugir em disparada da toca;
- Polvilha barreira de pó que paralisa a trilha de formigas na hora;
- Despeja líquido efervescente no ralo borbulhando espuma ativa que limpa o ninho.
Fala em Português direto, firme e visceral ("Quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês...", "Nunca usa veneno de matar rato na parede, olha o que acontece quando borrifa isso aqui...", "Essa misturinha faz qualquer barata de esgoto sumir em minutos...").

7. PROMPT 2 (00:08 - 00:16) — EXPLICAÇÃO DO PROBLEMA (ONDE ELAS SE ESCONDEM E POR QUE O VENENO FALHA):
O especialista debruça sobre a maquete colossal com enquadramento em plano médio-curto (28mm). Ele aponta com precisão para o ninho exposto, ovos (ootecas), frestas e galerias secretas:
- Explica o comportamento biológico da praga e por que veneno comum apenas espalha os insetos pela casa sem eliminar o ninho;
- Mostra a proliferação rápida e os riscos de contaminação e doenças;
- Fala em Português Brasileiro (~8s) com sincronização labial perfeita (lip-sync ao vivo na câmera).

8. PROMPT 3 (00:16 - 00:24) — INGREDIENTES CASEIROS DA RECEITA NA BANCADA:
Dispostos na bancada de madeira ao lado da maquete: potes ou béqueres de vidro com os ingredientes caseiros (bicarbonato de sódio, açúcar, folhas de louro secas, cravos-da-índia, vinagre de álcool branco, óleo essencial de hortelã-pimenta, borra de café, sabão neutro, canela em pó, etc.).
O especialista mostra e aponta para cada ingrediente, citando os nomes com clareza e explicando como a química natural ataca a praga sem risco para a família e animais domésticos.

9. PROMPT 4 (00:24 - 00:32) — PREPARO PARTE 1: BASE E ADIÇÃO DOS PRIMEIROS ELEMENTOS (LIP-SYNC AO VIVO):
O especialista inicia o preparo ao vivo na bancada em plano médio (cintura para cima) que mostra COM TOTAL CLAREZA seu rosto, olhos, boca e lábios falando diretamente com o espectador, junto com o recipiente de preparo (tigela cerâmica, frasco dosador, borrifador ou panela):
- NUNCA parecer locutor de rádio ou voz em off. Fala direta na câmera com movimentos labiais perfeitos em Português;
- Adiciona os primeiros ingredientes (ex: açúcar com bicarbonato, ou vinagre com cravos);
- Alterna olhares entre o recipiente e a lente da câmera com energia de mentor.

10. PROMPT 5 (00:32 - 00:40) — PREPARO PARTE 2: CONTINUIDADE DIRETA NO MESMO RECIPIENTE & POTENCIALIZAÇÃO:
CONTINUIDADE TEMPORAL E FÍSICA INTACTA: O recipiente de preparo (tigela, borrifador ou frasco) e o cenário são RIGOROSAMENTE OS MESMOS do Prompt 4.
O especialista dá sequência imediata ao preparo adicionando os bioativos aromáticos concentrados (ex: folhas de louro trituradas, gotas de óleo de hortelã-pimenta, borra de café fresca), misturando até obter a fórmula ativa perfeita.

11. PROMPT 6 (00:40 - 00:48) — QUANTIDADE DE INGREDIENTES E PONTOS ESTRATÉGICOS DE APLICAÇÃO:
O especialista posiciona-se ao lado da fórmula pronta na bancada, falando DIRETAMENTE para a câmera com lip-sync orgânico:
- Detalha as doses exatas de cada ingrediente (colheres de sopa, ml, gotas);
- Ensina os pontos estratégicos onde aplicar: ralos de banheiro, frestas de rodapés, forros de teto, atrás da geladeira e fogão, soleiras de portas;
- Gesticula didaticamente indicando com os dedos as proporções.

12. PROMPT 7 (00:48 - 00:56) — COMPROVAÇÃO PRÁTICA: CASA 100% LIVRE DE PRAGAS:
O especialista mostra o local/maquete agora totalmente limpo, sem nenhuma praga viva, sem cheiro forte e sem venenos perigosos.
Relata a eficácia duradoura da fórmula caseira e a paz de ter a casa protegida com custo quase zero.

13. PROMPT 8 (00:56 - 01:04) — CTA COM LIVRO FÍSICO ("CASA LIVRE DE PRAGAS" OU LIVRO PERSONALIZADO DO USUÁRIO):
O especialista ergue com as duas mãos e exibe com orgulho para a câmera o livro físico "CASA LIVRE DE PRAGAS - 100 RECEITAS CASEIRAS INFALÍVEIS" (capa verde-esmeralda e dourada com título em relevo, ou livro personalizado do usuário).
Aponta para a parte inferior e entrega o CTA direto com convicção:
"Se você quer blindar sua casa contra qualquer bicho, comenta EU QUERO aqui embaixo que te mando no privado... Garante o teu!"

14. DIRETRIZES NEGATIVAS E DE CÂMERA (OBRIGATÓRIO EM TODOS OS PROMPTS):
- REGRA CRÍTICA INEGOCIÁVEL — ABSOLUTAMENTE NENHUM TEXTO NEM LEGENDA NA TELA: NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO transcripts, NO lower thirds, NO banners, NO digital overlays, NO typography, NO graphic titles, NO logos, NO watermarks, NO artificial UI labels. Pure raw cinematic video footage with zero text overlays, zero subtitles, and zero written words on screen.
- Falas em Português Brasileiro coloquial, natural, direto e magnético (~8 segundos cada) exclusivamente faladas/dubladas em cena com sincronização labial direta (lip-sync).
- promptText de cada uma das cenas em INGLÊS FOTOGRÁFICO DETALHADO, completo e independente, OBRIGATORIAMENTE incluindo no início a cláusula negativa: "NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO typography, NO lower thirds, NO banners, NO titles, NO UI elements, NO watermarks. Clean raw cinematic video footage with zero text overlays, zero subtitles, and zero written words on screen."
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

      // Strip any duplicate negative banners at start
      while (text.startsWith('NEGATIVE PROMPT & ON-SCREEN TEXT BAN:')) {
        const nextDoubleNewline = text.indexOf('\n\n');
        if (nextDoubleNewline !== -1) {
          text = text.slice(nextDoubleNewline + 2).trim();
        } else {
          break;
        }
      }

      // Remove any previously appended Portuguese metadata blocks from promptText
      text = text
        .replace(/\n*PHYSICAL MOVEMENTS & ACTION CONTINUITY:[\s\S]*?(?=\n\n[A-Z0-9_ -]+:|$)/gi, '')
        .replace(/\n*FOREGROUND FOCAL OBJECT:[\s\S]*?(?=\n\n[A-Z0-9_ -]+:|$)/gi, '')
        .trim();

      // Ensure single negativeBanner at the very top
      p.promptText = `${negativeBanner}\n\n${text}`;

      // Ensure spoken audio line is cleanly included once
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

interface PestProfile {
  key: string;
  namePt: string;
  nameEn: string;
  habitatPt: string;
  habitatEn: string;
  modelDescPt: string;
  modelDescEn: string;
  modelEnglishSubject: string;
  defaultIngredientsPt: string;
  defaultIngredientsEn: string;
  hookSpokenPt: string;
  problemSpokenPt: string;
  cook1SpokenPt: string;
  cook2SpokenPt: string;
  portionsSpokenPt: string;
  resultSpokenPt: string;
  ctaSpokenPt: string;
  organicCloseSpokenPt: string;
}

function formatIngredientsForSpeech(rawIngredients: string): string {
  if (!rawIngredients) return '';
  const parts = rawIngredients
    .split(/\s*[\+,;]\s*|\s+e\s+/i)
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return rawIngredients;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function detectPestProfile(theme: string, customIngredients?: string): PestProfile {
  const lower = (theme || '').toLowerCase().trim();

  // 1. Ratos e Roedores
  if (lower.includes('rato') || lower.includes('ratazana') || lower.includes('camundongo') || lower.includes('roedor')) {
    return {
      key: 'ratos',
      namePt: 'ratos e roedores',
      nameEn: 'rats and rodents',
      habitatPt: 'forro de teto, conduítes e frestas de despensas',
      habitatEn: 'ceiling attic, chewed electrical wires, and dark pantry cavities',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de forro de teto e conduítes com ratos roendo fios elétricos (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of an attic ceiling and chewed electrical conduits infested with hyper-realistic gray and black rodents, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'an attic ceiling cutaway and chewed electrical conduits infested with hyper-realistic rodents',
      defaultIngredientsPt: 'óleo essencial de hortelã-pimenta, cravos-da-índia e vinagre de álcool branco',
      defaultIngredientsEn: 'pure peppermint essential oil, whole aromatic cloves, and distilled white vinegar',
      hookSpokenPt: 'O olfato dos ratos não suporta isso aqui! Olha a velocidade com que eles dão meia-volta e fogem do forro na hora!',
      problemSpokenPt: 'Veneno chumbinho é perigoso para pets e deixa o rato apodrecendo dentro da parede. O segredo é atacar o olfato sensível do roedor com choque aromático.',
      cook1SpokenPt: 'Primeiro mistura o vinagre de álcool com os cravos-da-índia. O cravo libera eugenol concentrado que irrita as vias nasais dos ratos.',
      cook2SpokenPt: 'Agora pinga vinte gotas do óleo de hortelã-pimenta pura. Essa essência cria um bloqueio sensorial que expulsa qualquer rato na mesma noite.',
      portionsSpokenPt: 'Anota a medida: duzentos ml de vinagre, um punhado de cravos e vinte gotas de hortelã. Borrifa no forro e espalha algodões embebidos nas passagens.',
      resultSpokenPt: 'Em vinte e quatro horas os ratos somem do forro e nunca mais voltam. Sua casa fica livre de roedores sem carcaças e com segurança total pra família.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para expulsar ratos de vez e blindar sua casa estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Reaplica no forro uma vez ao mês. Sua casa fica permanentemente blindada contra ratos e com aroma fresco sem venenos perigosos. Cuida do seu lar!'
    };
  }

  // 2. Formigas
  if (lower.includes('formiga') || lower.includes('açucar') || lower.includes('açúcar') || lower.includes('formigueiro')) {
    return {
      key: 'formigas',
      namePt: 'formigas',
      nameEn: 'black carpenter ants',
      habitatPt: 'bancadas da pia, açucareiros e frestas de rodapés',
      habitatEn: 'kitchen counters, sugar jars, and baseboard crevices',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de bancada e açucareiro com trilha viva de formigas (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of a kitchen countertop and sugar jar teeming with hyper-detailed black ants along a scent trail, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'a kitchen countertop and sugar jar cross-section teeming with black ants',
      defaultIngredientsPt: 'canela em pó pura, borra de café seca e detergente líquido neutro',
      defaultIngredientsEn: 'pure cinnamon powder, dried rich coffee grounds, and mild liquid dish soap',
      hookSpokenPt: 'Se você tem formigas invadindo a pia ou o açucareiro, olha como esse pó caseiro corta a trilha inteira no mesmo segundo!',
      problemSpokenPt: 'Passar pano na pia só espalha a trilha de feromônios das formigas. O segredo é neutralizar o rastro olfativo que atrai o formigueiro inteiro.',
      cook1SpokenPt: 'Mistura uma colher de canela em pó com uma de borra de café seca. Esses dois pós desorientam a comunicação das formigas na raiz.',
      cook2SpokenPt: 'Pingue algumas gotas de detergente neutro para fixar a barreira e impedir que qualquer formiga consiga cruzar o caminho.',
      portionsSpokenPt: 'Aplica uma linha fina nos cantos da bancada e frestas de azulejo. Em poucos minutos elas abandonam a cozinha por completo.',
      resultSpokenPt: 'Em vinte e quatro horas nenhuma formiga volta a subir na sua pia. Sua cozinha fica limpa, protegida e sem veneno químico perto da comida.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para eliminar formigas de vez estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Renova a barreira nos cantos a cada duas semanas. Sua cozinha fica permanentemente limpa e sem formigas. Cuida do seu lar!'
    };
  }

  // 3. Pernilongos e Mosquitos da Dengue
  if (lower.includes('pernilongo') || lower.includes('mosquito') || lower.includes('dengue') || lower.includes('aedes') || lower.includes('muriçoca')) {
    return {
      key: 'mosquitos',
      namePt: 'pernilongos e mosquitos da dengue',
      nameEn: 'mosquitoes and dengue vectors',
      habitatPt: 'quartos, cortinas e ralos de quintal',
      habitatEn: 'bedroom corners, curtains, and humid drain areas',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de quarto em meia-luz com enxame hiper-realista de mosquitos da dengue e pernilongos (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of a bedroom corner with a hyper-detailed realistic swarm of mosquitoes and Aedes aegypti, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'a dimly-lit bedroom corner with a realistic hovering swarm of mosquitoes',
      defaultIngredientsPt: 'limão fresco fatiado, cravos-da-índia, álcool 70% e óleo essencial de eucalipto',
      defaultIngredientsEn: 'fresh lemon halves studded with aromatic cloves, alcohol, and eucalyptus oil',
      hookSpokenPt: 'Os mosquitos da dengue e pernilongos fogem desse cheiro em segundos! Olha como o quarto fica limpo na hora!',
      problemSpokenPt: 'Venenos elétricos de tomada soltam toxinas que você e seus filhos respiram a noite inteira. O segredo é repelir pelo ar com ativos naturais.',
      cook1SpokenPt: 'Corta o limão ao meio e espeta os cravos-da-índia na polpa. A acidez do limão potencializa a evaporação dos óleos repelentes do cravo.',
      cook2SpokenPt: 'Para fazer o spray borrifador, mistura cem ml de álcool com trinta gotas de óleo de eucalipto ou citronela em um frasco borrifador.',
      portionsSpokenPt: 'Coloca as metades de limão com cravo nos cantos do quarto e borrifa o spray nas cortinas e janelas ao entardecer.',
      resultSpokenPt: 'Em poucos minutos todos os pernilongos e mosquitos desaparecem. Sua família dorme a noite toda sem zumbido e protegida da dengue.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para blindar sua casa contra mosquitos e pernilongos estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Troque o limão com cravo a cada semana. Sua casa vai continuar cheirosa e totalmente protegida de mosquitos. Cuida do seu lar!'
    };
  }

  // 4. Escorpiões e Aranhas
  if (lower.includes('escorpi') || lower.includes('aranha')) {
    return {
      key: 'escorpioes',
      namePt: 'escorpiões e aranhas',
      nameEn: 'scorpions and venomous spiders',
      habitatPt: 'ralos de banheiro, soleiras de porta e frestas de rodapés',
      habitatEn: 'bathroom floor drains, door thresholds, and baseboard gaps',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de ralo de banheiro e soleira com escorpião amarelo espreitando na fresta (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of a bathroom floor drain and door threshold with a realistic yellow scorpion emerging from the dark pipe, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'a bathroom floor drain cross-section and threshold with a yellow scorpion',
      defaultIngredientsPt: 'essência pura de lavanda concentrada, vinagre de álcool branco e óleo de melaleuca',
      defaultIngredientsEn: 'concentrated pure lavender essence, distilled white vinegar, and tea tree oil',
      hookSpokenPt: 'O segredo para impedir que escorpiões subam pelo ralo do banheiro está nessa barreira aqui. Olha o efeito imediato!',
      problemSpokenPt: 'Venenos aerossóis não matam escorpiões porque eles fecham os estigmas respiratórios. O segredo é fechar os ralos com barreira repelente olfativa.',
      cook1SpokenPt: 'Mistura cem ml de vinagre de álcool com trinta gotas de essência pura de lavanda. O aroma de lavanda causa repulsa imediata em escorpiões.',
      cook2SpokenPt: 'Adicione dez gotas de óleo de melaleuca, que cria uma película residual aderente que dura semanas dentro da tubulação.',
      portionsSpokenPt: 'Despeja cinquenta ml no ralo do banheiro antes de dormir e borrifa uma linha fina em todas as soleiras de portas e rodapés.',
      resultSpokenPt: 'A barreira fecha completamente a passagem dos ralos. Sua casa fica segura contra picadas venenosas e protegida para crianças e animais.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para afastar escorpiões e bichos peçonhentos estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Reaplica nos ralos uma vez a cada dez dias. Sua casa fica permanentemente blindada contra escorpiões. Cuida do seu lar!'
    };
  }

  // 5. Moscas e Mosquitinhos
  if (lower.includes('mosca') || lower.includes('mosquitinho') || lower.includes('varejeira')) {
    return {
      key: 'moscas',
      namePt: 'moscas e mosquitinhos',
      nameEn: 'flies and fruit gnats',
      habitatPt: 'fruteiras, lixeiras e ralos de pia',
      habitatEn: 'fruit bowls, trash bins, and sink drains',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de ralo sifonado e fruteira com moscas e larvas (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of a kitchen sink trap and fruit bowl with realistic flies and gnats, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'a kitchen sink drain trap and fruit bowl infested with realistic gnats and flies',
      defaultIngredientsPt: 'vinagre de maçã morno, detergente líquido neutro e açúcar mascavo',
      defaultIngredientsEn: 'warm apple cider vinegar, mild dish soap, and unrefined brown sugar',
      hookSpokenPt: 'Se você não aguenta mais moscas e mosquitinhos na cozinha, essa armadilha natural acaba com todas em poucas horas!',
      problemSpokenPt: 'Moscas e mosquitinhos depositam ovos na gordura do ralo da pia e se multiplicam em horas. O segredo é atrair e neutralizar a fonte.',
      cook1SpokenPt: 'Aquece meio copo de vinagre de maçã com uma colher de açúcar. O vapor ácido atrai as moscas irresistivelmente.',
      cook2SpokenPt: 'Pingue três gotas de detergente neutro para quebrar a tensão superficial da água e fazer qualquer mosca afundar na hora.',
      portionsSpokenPt: 'Coloca em potinhos rasos perto da fruteira e despeje água fervente com vinagre no ralo para eliminar as larvas.',
      resultSpokenPt: 'Em poucas horas todas as moscas são capturadas e eliminadas. Sua cozinha volta a ficar limpa, cheirosa e sem contaminação.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para acabar com moscas e pragas estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Mantenha um potinho preventivo perto da fruteira. Sua cozinha vai continuar protegida e sem insetos. Cuida do seu lar!'
    };
  }

  // 6. Pulgas e Carrapatos
  if (lower.includes('pulga') || lower.includes('carrapato')) {
    return {
      key: 'pulgas',
      namePt: 'pulgas e carrapatos',
      nameEn: 'fleas and ticks',
      habitatPt: 'carpetes, frestas de estofados e caminhas de pets',
      habitatEn: 'carpets, sofa seams, and pet bedding',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de fibras de carpete e estofado com pulgas e ovos microscópicos (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of carpet fibers and upholstery seams teeming with realistic fleas and microscopic eggs, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'carpet fibers and upholstery seams teeming with realistic fleas and eggs',
      defaultIngredientsPt: 'sal fino de cozinha, bicarbonato de sódio e chá forte de alecrim fresco',
      defaultIngredientsEn: 'fine culinary salt, pure baking soda, and strong fresh rosemary infusion',
      hookSpokenPt: 'Nunca use veneno tóxico no tapete onde seu pet dorme! Olha como esse pó desidrata pulgas e ovos em minutos!',
      problemSpokenPt: 'Venenos químicos podem intoxicar cães e gatos e não quebram o casulo dos ovos. O segredo é desidratar o ninho inteiro naturalmente.',
      cook1SpokenPt: 'Mistura meio quilo de sal fino com meio quilo de bicarbonato de sódio. Esses minerais ressecam os ovos e as larvas de pulga instantaneamente.',
      cook2SpokenPt: 'Para os sofás e camas, faça uma infusão de alecrim fresco com água para borrifar e deixar um aroma repelente natural.',
      portionsSpokenPt: 'Polvilhe o pó nos tapetes e frestas do piso, deixe agir por algumas horas e depois aspire tudo retirando ovos e carcaças.',
      resultSpokenPt: 'Em vinte e quatro horas todos os ovos e pulgas são desidratados naturalmente. Seu pet fica livre de coceiras e a casa segura.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para eliminar pulgas e proteger seus animais estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Reaplica o pó preventivo uma vez por mês nos tapetes. Sua casa fica permanentemente blindada contra pulgas. Cuida do seu lar!'
    };
  }

  // 7. Cupins e Traças
  if (lower.includes('cupim') || lower.includes('traça') || lower.includes('madeira')) {
    return {
      key: 'cupins',
      namePt: 'cupins e traças',
      nameEn: 'termites and silverfish',
      habitatPt: 'móveis de madeira, gavetas de roupas e forros',
      habitatEn: 'wooden furniture, wardrobe drawers, and timber beams',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de gaveta de madeira e galerias de cupim com casulos de traça (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of wooden furniture and subterranean termite tunnels, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'wooden furniture cross-section and subterranean termite tunnels',
      defaultIngredientsPt: 'pimenta-do-reino em grãos, cravos-da-índia e óleo puro de cedro ou nim',
      defaultIngredientsEn: 'whole black peppercorns, dried aromatic cloves, and pure cedarwood oil',
      hookSpokenPt: 'Se você viu pózinho de cupim no móvel ou traças nas roupas, olha como essa infusão penetra e salva a madeira na raiz!',
      problemSpokenPt: 'Venenos comuns não penetram nos túneis profundos que os cupins cavam. O segredo é aplicar óleo bioativo que sufoca a colônia internamente.',
      cook1SpokenPt: 'Mistura óleo vegetal leve com essência pura de cedro e grãos triturados de cravo e pimenta. Essa fórmula penetra fundo nas fibras da madeira.',
      cook2SpokenPt: 'Mexa bem até obter uma solução fluida e escura que penetra nos furos sem manchar e sem soltar vapores tóxicos.',
      portionsSpokenPt: 'Injeta a solução direto nos buraquinhos de cupim com uma seringa e espalhe sachês de cravo dentro das gavetas.',
      resultSpokenPt: 'A colônia inteira de cupins é eliminada e os móveis ficam protegidos para sempre sem cheiro forte.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras contra cupins e traças de madeira estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Renove os sachês de cravo nas gavetas a cada três meses. Seus móveis e roupas permanecem 100% protegidos. Cuida do seu lar!'
    };
  }

  // 8. Lesmas e Caracóis
  if (lower.includes('lesma') || lower.includes('caracol') || lower.includes('horta') || lower.includes('jardim')) {
    return {
      key: 'lesmas',
      namePt: 'lesmas e caracóis',
      nameEn: 'slugs and garden snails',
      habitatPt: 'canteiros de hortaliças, vasos de plantas e folhas úmidas',
      habitatEn: 'moist garden vegetable beds, potted plants, and damp soil',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de canteiro de horta úmido com lesmas gigantes devorando folhas (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of a moist garden bed with realistic slugs devouring leafy plants, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'a moist garden vegetable bed cross-section teeming with realistic slugs',
      defaultIngredientsPt: 'cinzas de madeira, cascas de ovos secas trituradas e cerveja',
      defaultIngredientsEn: 'wood ashes, finely crushed dried eggshells, and beer bait',
      hookSpokenPt: 'Se você tem lesmas e caracóis devorando sua horta à noite, olha como essa barreira mineral corta o avanço delas na hora!',
      problemSpokenPt: 'Veneno de lesmicida é altamente tóxico para cães e contamina as verduras. O segredo é criar uma barreira física abrasiva que desidrata as lesmas.',
      cook1SpokenPt: 'Triture as cascas de ovos secas até formar pontas afiadas e misture com cinzas de madeira peneiradas.',
      cook2SpokenPt: 'Essa combinação corta o rastro viscoso e impede completamente que qualquer lesma suba nas plantas.',
      portionsSpokenPt: 'Polvilhe uma faixa de cinco centímetros ao redor de cada canteiro e renove após chuvas fortes.',
      resultSpokenPt: 'Sua horta e plantas ficam 100% salvas de ataques noturnos, saudáveis e livres de qualquer veneno tóxico.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para proteger sua horta e jardim estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Renove as cinzas nos canteiros quinzenalmente para manter a proteção ativa. Cuida do seu lar!'
    };
  }

  // 9. Percevejos de Cama e Ácaros
  if (lower.includes('percevejo') || lower.includes('bed bug') || lower.includes('colch') || lower.includes('ácaro')) {
    return {
      key: 'percevejos',
      namePt: 'percevejos de cama e ácaros',
      nameEn: 'bed bugs and mattress mites',
      habitatPt: 'costuras de colchão, estrados de cama e frestas de cabeceiras',
      habitatEn: 'mattress seams, bed frames, and headboard crevices',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de costura de colchão com colônia hiper-realista de percevejos (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of mattress fabric seams teeming with hyper-detailed bed bugs and tiny clusters, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'a mattress fabric seam and bed frame cross-section with bed bugs',
      defaultIngredientsPt: 'álcool isopropílico 70%, óleo essencial de cravo e bicarbonato de sódio',
      defaultIngredientsEn: '70% alcohol solution, clove essential oil, and pure baking soda powder',
      hookSpokenPt: 'Se você acorda com picadas vermelhas no corpo, olha como esse spray caseiro penetra no colchão e elimina percevejos no mesmo segundo!',
      problemSpokenPt: 'Venenos comuns não penetram nas dobras densas do tecido onde eles colocam ovos. O segredo é sufocar o ninho com choque térmico e eugenol.',
      cook1SpokenPt: 'Mistura duzentos ml de álcool com trinta gotas de óleo essencial puro de cravo em um borrifador.',
      cook2SpokenPt: 'Agite energicamente para que os óleos repelentes se dissolvam de forma homogênea no álcool penetrante.',
      portionsSpokenPt: 'Borrifa nas costuras do colchão, estrados e rodapés, deixando ventilar bem antes de colocar lençóis limpos.',
      resultSpokenPt: 'Em poucas horas o colchão fica completamente limpo, livre de picadas e seguro para toda a família dormir em paz.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras para acabar com percevejos e pragas de quarto estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Reaplica mensalmente nas frestas da cama para manter seu quarto blindado. Cuida do seu lar!'
    };
  }

  // 10. Lacraias e Centopeias
  if (lower.includes('lacraia') || lower.includes('centopeia') || lower.includes('centopéia')) {
    return {
      key: 'lacraias',
      namePt: 'lacraias e centopeias',
      nameEn: 'centipedes and scolopendras',
      habitatPt: 'ralos de esgoto, caixas de gordura e frestas de pisos úmidos',
      habitatEn: 'sewer pipes, drain traps, and damp subterranean masonry crevices',
      modelDescPt: 'Maquete educacional COLOSSAL em corte de cano de esgoto com lacraia gigante saindo do ralo (60% do quadro vertical 9:16)',
      modelDescEn: 'Colossal cutaway educational demonstration model of an underground sewer pipe with a large venomous centipede emerging, occupying 60% of vertical 9:16 frame',
      modelEnglishSubject: 'an underground sewer pipe and drain trap with a large venomous centipede',
      defaultIngredientsPt: 'sal grosso marinho, bicarbonato de sódio e vinagre de álcool concentrado',
      defaultIngredientsEn: 'coarse sea salt, sodium bicarbonate, and concentrated white vinegar',
      hookSpokenPt: 'O perigo de lacraia venenosa subindo pelo ralo acaba com esse choque efervescente aqui. Olha a reação instantânea!',
      problemSpokenPt: 'Lacraias se alimentam de outros insetos na tubulação úmida e sua picada causa dor extrema. O segredo é eliminar os esconderijos subterrâneos.',
      cook1SpokenPt: 'Despeje meio copo de bicarbonato misturado com sal grosso direto dentro do ralo do banheiro.',
      cook2SpokenPt: 'Em seguida adicione um copo de vinagre de álcool bem quente, provocando efervescência densa dentro do cano.',
      portionsSpokenPt: 'Tampe o ralo por vinte minutos para que a pressão dos vapores atinja toda a extensão do sifão.',
      resultSpokenPt: 'O encanamento fica desinfestado, sem matéria orgânica e blindado contra a subida de lacraias e centopeias.',
      ctaSpokenPt: 'Essa e mais de cem receitas caseiras contra bichos perigosos estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
      organicCloseSpokenPt: 'Faça essa limpeza efervescente nos ralos quinzenalmente. Sua casa permanece 100% protegida. Cuida do seu lar!'
    };
  }

  // 11. Qualquer outra praga personalizada que NÃO seja baratas
  if (theme && theme.trim().length > 0 && !lower.includes('barata')) {
    const customName = theme.trim();
    return {
      key: 'custom',
      namePt: customName,
      nameEn: `targeted pests (${customName})`,
      habitatPt: 'frestas escuras, cantos úmidos e esconderijos da casa',
      habitatEn: 'dark crevices, humid entry points, and domestic nesting zones',
      modelDescPt: `Maquete educacional COLOSSAL em corte de frestas e ninhos com foco em ${customName} (60% do quadro vertical 9:16)`,
      modelDescEn: `Colossal cutaway educational demonstration model of an infested domestic surface teeming with hyper-realistic ${customName}, occupying 60% of vertical 9:16 frame`,
      modelEnglishSubject: `an infested domestic crevice and cavity cross-section showing targeted household pests`,
      defaultIngredientsPt: customIngredients || 'bicarbonato de sódio culinário, vinagre de álcool branco e essência bioativa pura',
      defaultIngredientsEn: 'pure baking soda powder, distilled white vinegar, and concentrated botanical defense oil',
      hookSpokenPt: `Se você sofre com ${customName} na sua casa, olha o efeito imediato desse preparo natural quando atinge o esconderijo!`,
      problemSpokenPt: `Venenos comuns apenas espalham as pragas para outros cômodos. O segredo é neutralizar o ninho com princípios bioativos naturais seguros para sua família.`,
      cook1SpokenPt: `Primeiro combina os ingredientes base em medidas iguais para criar a fórmula bioativa contra ${customName}.`,
      cook2SpokenPt: `Agora adiciona o ativador concentrado que potencializa a barreira e garante ação residual prolongada.`,
      portionsSpokenPt: `Anota as medidas e aplica nos pontos estratégicos onde elas se escondem e transitam.`,
      resultSpokenPt: `Em vinte e quatro horas o ambiente fica totalmente limpo e livre de ${customName}, seguro para sua família.`,
      ctaSpokenPt: `Essa e mais de cem receitas caseiras para blindar sua casa contra pragas estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!`,
      organicCloseSpokenPt: `Reaplica preventivamente a cada quinze dias para manter sua casa blindada. Cuida do seu lar!`
    };
  }

  // 12. Padrão Absoluto: Baratas (foco 100% em baratas sem nenhuma contaminação)
  return {
    key: 'baratas',
    namePt: 'baratas',
    nameEn: 'brown domestic cockroaches (periplaneta americana)',
    habitatPt: 'ralos de esgoto, encanamentos e frestas de armários',
    habitatEn: 'bathroom sewer drains, dark pipe crevices, and behind kitchen cabinets',
    modelDescPt: 'Maquete educacional COLOSSAL em corte de ralo de esgoto e tubulação com ninho hiper-realista de baratas marrons com ootecas (60% do quadro vertical 9:16)',
    modelDescEn: 'Colossal cutaway educational demonstration model of an infested floor drain and concrete sewer pipe cross-section, teeming with hyper-detailed brown domestic cockroaches and dark egg capsules (ootheca), occupying 60% of vertical 9:16 frame',
    modelEnglishSubject: 'an infested bathroom floor drain and sewer pipe cross-section teeming with brown cockroaches and egg capsules',
    defaultIngredientsPt: 'bicarbonato de sódio culinário, açúcar refinado e folhas secas de louro trituradas',
    defaultIngredientsEn: 'pure culinary baking soda powder, refined white sugar, and finely crushed dried bay leaves',
    hookSpokenPt: 'Se você tem baratas invadindo o ralo ou a cozinha, quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês. Olha o que acontece quando borrifa isso aqui!',
    problemSpokenPt: 'O veneno aerosol comum só faz as baratas correrem para trás dos móveis. O segredo é atingir o ninho e a digestão delas sem contaminar sua família.',
    cook1SpokenPt: 'Primeiro você mistura o açúcar com o bicarbonato na mesma medida. O açúcar atrai as baratas pelo olfato e o bicarbonato reage no estômago delas.',
    cook2SpokenPt: 'Agora tritura o louro bem fino e joga junto. O louro solta um óleo natural que atrai as baratas e desorienta o ninho todo.',
    portionsSpokenPt: 'Anota a proporção: duas colheres de sopa de bicarbonato, duas de açúcar e três folhas de louro. Coloca em tampinhas atrás da geladeira e perto dos ralos.',
    resultSpokenPt: 'Em vinte e quatro horas o ninho inteiro de baratas desaparece. Sua casa fica livre de baratas sem cheiro forte e sem risco pros seus filhos e cachorros.',
    ctaSpokenPt: 'Essa e mais de cem receitas caseiras para eliminar baratas de vez e proteger sua casa estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
    organicCloseSpokenPt: 'Reaplica nos ralos uma vez a cada quinze dias. Sua casa vai continuar blindada contra baratas, cheirosa e sem nenhuma química tóxica. Cuida do seu lar!'
  };
}

// Fallback local generator for pests and insect recipes
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
  includeCTA: boolean = true,
  productType?: string,
  giantModelPreference?: string
): any {
  const targetCount = Math.max(2, Math.min(10, Number(promptCount) || 8));
  const hasCTA = Boolean(includeCTA);
  const cleanTheme = theme.trim() || 'Exterminar Baratas de Esgoto e Cozinha com Bicarbonato e Louro';
  const pest = detectPestProfile(cleanTheme, solutionIngredients);
  const rawProductType = String(productType || 'fisico').toLowerCase();
  const isDigitalProduct = ['digital', 'ebook', 'e-book', 'curso', 'infoproduto', 'app', 'software', 'online'].some((k) => rawProductType.includes(k));
  const productKindPt = isDigitalProduct ? 'material digital' : 'produto físico';
  const productTitle = (customBookTitle && customBookTitle.trim()) || 'CASA LIVRE DE PRAGAS - 100 RECEITAS CASEIRAS INFALÍVEIS';
  const maqueteOverride = (giantModelPreference && giantModelPreference.trim()) || '';
  const focalModel = maqueteOverride || pest.modelDescPt;
  const ingredientsText = solutionIngredients || pest.defaultIngredientsPt;
  
  const noTextDirective = `NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO typography, NO transcripts, NO lower thirds, NO banners, NO graphic titles, NO digital overlays, NO logos, NO watermarks, NO artificial UI labels. Pure raw cinematic video footage with ZERO text overlays, ZERO subtitles, and ZERO written words on screen. Spoken audio delivered purely via realistic on-camera lip synchronization without on-screen subtitles.`;

  const presenterDesc = customCharacterDescription
    ? `Presenter behind demonstration bench: ${customCharacterDescription}. Natural biological skin with visible pores, authentic expression lines, realistic working hand anatomy, maintained with 100% continuous visual identity across all frames.`
    : (characterImageBase64
        ? `Presenter behind demonstration bench: Accurately replicates the uploaded character reference image with genuine biological human skin pores, authentic expression lines, and realistic working hand anatomy across all frames.`
        : `Positioned immediately behind the rustic wooden workbench, leaning forward into the camera lens with an intense, magnetic, authoritative facial expression: Brazilian domestic pest-control and natural bio-defense specialist, approximately 50 years old, rugged athletic build, broad capable shoulders, strong forearms with visible veins and working hands. Short salt-and-pepper hair neatly cropped on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, neatly groomed salt-and-pepper stubble, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted dark-slate / olive-green utility work polo shirt with an embroidered "BIO-DEFESA" chest patch on the left, sturdy dark work cargo pants, and a simple gold wedding band on his left ring finger.`);

  const settingDesc = customSettingDescription
    ? `SETTING: ${customSettingDescription}. Solid demonstration bench in the foreground holding the pest demonstration model and natural ingredients. Consistent architectural background details and continuous ambient lighting.`
    : (settingImageBase64
        ? `SETTING: Accurately replicates the uploaded scenario reference image with continuous background architecture, wall textures, ambient lighting, and solid foreground demonstration bench across all scenes.`
        : `SETTING: Authentic organized domestic workshop / pest-defense demonstration studio. Matte slate-gray tile floor. Background wooden shelves holding labeled glass jars of dried bay leaves, whole cloves, baking soda containers, white vinegar jugs, amber essential oil dropper bottles, spray bottles, and hanging dried bundles of mint and eucalyptus. Solid light-wood workbench in foreground.`);

  const variedHooks = [
    {
      type: 'spray_mist',
      summary: `Especialista dispara névoa pressurizada de spray bioativo caseiro no segundo 00:00 direto sobre a maquete de ${pest.namePt}, fazendo-as debandar em pânico ou capotar de costas.`,
      spoken: `Se você tem ${pest.namePt} invadindo sua casa, quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês. Olha o que acontece quando borrifa isso aqui!`,
      handsAction: `His right hand firmly grips an ergonomic trigger spray bottle, pumping a forceful continuous mist directly onto the cluster of ${pest.nameEn} at second 00:00. Visible forearm vascularity and gold wedding band on left ring finger.`,
      actionScene: `The video opens already in explosive physical action at second 00:00. The fine bioactive spray mist strikes the ${pest.nameEn} in the cutaway crevice; as the mist contacts them, they frantically scatter, lose footing, and curl up in instant paralysis. The presenter leans forward with piercing authority, locking intense eye contact with the camera lens.`
    },
    {
      type: 'powder_dusting',
      summary: `Especialista polvilha com os dedos ou colher uma camada de bio-pó branco ativo no segundo 00:00, bloqueando a trilha e desidratando o exoesqueleto de ${pest.namePt}.`,
      spoken: `Se você tem ${pest.namePt} invadindo sua casa, olha como esse pó caseiro corta o avanço delas na hora!`,
      handsAction: `His right hand shakes a fine dusting of active white mineral powder from a small wooden scoop directly along the ${pest.nameEn}'s pathway at second 00:00, vein definition in forearm, gold wedding band on left hand.`,
      actionScene: `The video opens at second 00:00 with crisp tactile dusting. The white active powder settles over the damp crevice; the ${pest.nameEn} halt, scatter in confusion, and cannot cross the barrier. Presenter leans in toward the lens delivering the hook with conviction.`
    },
    {
      type: 'drain_flush',
      summary: `Especialista despeja solução efervescente borbulhante de um béquer direto no ralo infestado no segundo 00:00, eliminando ninhos subterrâneos de ${pest.namePt} com espuma densa.`,
      spoken: `O segredo para acabar com as ${pest.namePt} que sobem pelo encanamento está nesse despejo aqui. Olha a espuma subindo!`,
      handsAction: `His right hand tilts a heavy glass beaker, pouring an effervescent foaming amber liquid directly down the cutaway drain at second 00:00, visible forearm tension, gold wedding band on left ring finger.`,
      actionScene: `The video opens in dynamic effervescence at second 00:00. The bubbling active solution surges through the pipe, washing away grime, dislodging ${pest.nameEn} and coating the drain walls in protective active residue. Presenter maintains intense eye contact with the viewer.`
    },
    {
      type: 'bait_placement',
      summary: `Especialista posiciona com pinça ou colher bolinhas de isca atrativa bioativa no segundo 00:00, mostrando ${pest.namePt} devorando e levando o efeito mortal para o ninho.`,
      spoken: `Nunca espalhe veneno químico perto da comida. Olha o que essas bolinhas caseiras fazem com o ninho de ${pest.namePt}!`,
      handsAction: `Both hands position small brown-and-white bioactive bait spheres into strategic choke-points using a spoon, gold wedding band visible on left hand.`,
      actionScene: `The video opens at second 00:00 with direct bait placement. The ${pest.nameEn} instantly abandon their hiding spots and swarm the bait ball, devouring the active mixture that will neutralize the entire hidden colony. Presenter leans into the lens with urgent authority.`
    },
    {
      type: 'aromatic_barrier',
      summary: `Especialista esfrega ou borrifa óleo volátil no segundo 00:00, criando barreira invisível que faz ${pest.namePt} recuarem em desespero sensorial.`,
      spoken: pest.hookSpokenPt,
      handsAction: `His right hand sprays a volatile essential oil mist while left hand holds a soaked cotton ball, gold wedding band on left hand.`,
      actionScene: `The video opens at second 00:00 with sensory repulsion. As the aromatic vapor wafts into the chamber, the ${pest.nameEn} twitch in extreme distress, turn around, and scramble away in rapid retreat. Presenter delivers the hook with confident smile.`
    }
  ];

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

  const characterLabel = customCharacterDescription || (characterImageBase64 ? 'Personagem Personalizado (Foto enviada)' : 'Especialista em Bio-Defesa Oficial (Padrão)');
  const settingLabel = customSettingDescription || (settingImageBase64 ? 'Cenário Personalizado (Foto enviada)' : 'Oficina & Bancada Doméstica (Padrão)');

  const stepHook = {
    baseTitle: 'GANCHO CHOCANTE COM MAQUETE COLOSSAL & AÇÃO VISCERAL',
    focalObject: focalModel,
    actionSummary: selectedHook.summary,
    cameraFraming: 'Plano Macro Fechado Vertical 9:16 com lente ultra-wide 20mm e perspectiva forçada dramática. A maquete colossal ocupa de 55% a 65% do enquadramento inferior, com o especialista debruçado imediatamente atrás.',
    visualSceneDescription: `No segundo 00:00 exato, o vídeo já começa com ação física direta: a mão direita aplica a fórmula na maquete de fresta/ralo que ocupa 60% da tela, gerando debandada ou paralisia imediata das pragas. O especialista debruçado olha firme para a lente com urgência magnética.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Ação de Choque Imediata (00:00)', action: 'Vídeo abre já no segundo zero com ação física na maquete colossal (60% do quadro). Spray bioativo ou pó atinge a infestação sem introdução lenta.' },
      { time: '00:03 - 00:06', title: 'Reação das Pragas & Expressão Facial', action: `Close na reação de ${pest.namePt} debandando e caindo paralisadas. O especialista debruça-se para frente encarando a lente com gravidade.` },
      { time: '00:06 - 00:08', title: 'Conexão Magnética & Gancho', action: 'Conclui a primeira fala com sincronização labial precisa, apontando para a infestação neutralizada e engatando para os ingredientes.' }
    ],
    spokenLinePt: selectedHook.spoken,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, macro close-up with 20mm lens. The colossal demonstration model occupies 60% of the entire lower frame directly against the lens.
- The presenter is physically leaning forward over the bench immediately behind the model, making intense eye contact with the viewer.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• 00:00 - 00:03: Immediate visceral opening at second zero. The presenter's muscular right hand applies the reactive spray/powder directly into the infested crevice of the colossal model, causing instant physical scattering and paralysis of ${pest.nameEn}.
• 00:03 - 00:06: The camera captures the detailed texture of the neutralized ${pest.nameEn}. The presenter leans in closer with gravity and urgent magnetic focus.
• 00:06 - 00:08: Precise Brazilian Portuguese lip synchronization delivering the hook line, pointing down toward the crevice to create an irresistible transition to the homemade solution ingredients.

Extreme close-up foreground featuring a COLOSSAL educational demonstration model representing ${pest.modelEnglishSubject}, with hyper-realistic ${pest.nameEn} occupying 60% of the entire vertical 9:16 frame directly against the camera lens.

${presenterDesc}

HUMAN SKIN PRIORITY: Genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression lines, nasolabial folds, natural skin texture, vellus facial hairs, arm hairs. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. ${selectedHook.handsAction}

ACTION: ${selectedHook.actionScene}

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${selectedHook.spoken}"

${settingDesc}`
  };

  const stepProblem = {
    baseTitle: `EXPLICAÇÃO DO PROBLEMA (ONDE ELAS SE ESCONDEM E POR QUE O VENENO FALHA)`,
    focalObject: `Especialista debruçado sobre a maquete colossal apontando com precisão para os ninhos ocultos de ${pest.namePt} (${focalModel})`,
    actionSummary: `Especialista debruça sobre a maquete colossal, aponta com precisão para as frestas profundas e ovos expostos, explicando como venenos comuns apenas espalham ${pest.namePt} pela casa sem atingir a colônia oculta, alternando olhar com a câmera com lip-sync perfeito.`,
    cameraFraming: 'Plano Médio-Curto 9:16 com lente 28mm e profundidade de campo óptica natural. Foco nítido na maquete de infestação e no rosto expressivo do especialista.',
    visualSceneDescription: `A maquete colossal permanece em primeiro plano ocupando 55-60% do enquadramento. O especialista aponta o indicador para o ninho de ${pest.namePt}, explicando com autoridade de mentor por que venenos em spray falham e como os bioativos caseiros resolvem a causa raiz.`,
    visualTimeline: [
      { time: '00:08 - 00:11', title: 'Identificação do Ninho Oculto', action: `Especialista aponta o dedo indicador diretamente para as frestas profundas e ninhos de ${pest.namePt} na maquete colossal.` },
      { time: '00:11 - 00:14', title: 'Explicação da Falha dos Venenos Comuns', action: 'Disseca como venenos de mercado só atingem a superfície e fazem a colônia se espalhar para outros cômodos.' },
      { time: '00:14 - 00:16', title: 'Alerta sobre Saúde da Família', action: 'Olha com firmeza no olho da câmera, alertando sobre a contaminação e bactérias trazidas pelas pragas.' }
    ],
    spokenLinePt: pest.problemSpokenPt,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium close-up shot at chest level with 28mm lens.
- Sharp optical focus capturing the detailed cutaway crevices of the colossal model in the foreground and the presenter's engaging, articulate face and pointing hand.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The presenter leans in over the colossal model representing ${pest.modelEnglishSubject}, his index finger pointing with surgical precision directly into the exposed hidden breeding chamber of ${pest.nameEn}.
• He gestures along the cross-section, demonstrating how standard sprays never reach the subterranean nesting colonies.
• He raises his gaze from the model straight into the camera lens with intense pedagogical authority and authentic concern, delivering the concluding explanation with organic lip synchronization.

PHYSICAL CONTINUITY: The colossal demonstration model remains directly in the foreground on the solid wooden workbench, with 100% of the simulated crevices intact from Prompt 1 in the exact same position and scale.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Natural skin texture, individual arm hairs, natural forehead lines, nasolabial folds. Matte cheeks, subtle natural T-zone sheen. NO beauty filter, NO skin smoothing, NO wax skin, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Right hand points with authoritative precision toward the pest nest; left hand rests firmly on the workbench.

ACTION: Presenter speaks directly about the pest's nesting mechanics and why conventional toxic sprays fail, delivering speech with paternal urgency and magnetic conviction.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${pest.problemSpokenPt}"

${settingDesc}`
  };

  const stepIngredients = {
    baseTitle: 'INGREDIENTES CASEIROS DA RECEITA NA BANCADA',
    focalObject: `${focalModel} ao lado dos ingredientes caseiros da receita na bancada de madeira`,
    actionSummary: `Especialista mostra e cita na bancada quais são os ingredientes caseiros simples que exterminam ou repelem ${pest.namePt} (${formatIngredientsForSpeech(ingredientsText)}), apontando para cada um e destacando sua ação biológica não tóxica.`,
    cameraFraming: 'Plano Médio 9:16 com lente 28mm e profundidade de campo óptica natural. Foco balanceado entre os potes de vidro com ingredientes na bancada e o apresentador.',
    visualSceneDescription: `A maquete colossal permanece na bancada. Ao lado dela, o especialista gesticula e aponta para cada um dos ingredientes caseiros organizados em recipientes transparentes (${formatIngredientsForSpeech(ingredientsText)}), erguendo os potes para demonstrar sua acessibilidade.`,
    visualTimeline: [
      { time: '00:16 - 00:19', title: 'Exibição dos Ingredientes Caseiros', action: 'Especialista aponta e ergue na bancada os potes de vidro com os ingredientes caseiros da receita.' },
      { time: '00:19 - 00:22', title: 'Explicação da Ação Biológica', action: `Fala na câmera citando os ingredientes que atacam o olfato ou a digestão de ${pest.namePt} sem risco para crianças e pets.` },
      { time: '00:22 - 00:24', title: 'Preparação para Mistura Ativa', action: 'Gesto de convite com a mão em direção à tigela/frasco de mistura, preparando para o preparo ao vivo.' }
    ],
    spokenLinePt: `Você só vai precisar desses ingredientes simples da sua cozinha para criar uma fórmula fatal contra ${pest.namePt} e segura pra sua família: ${formatIngredientsForSpeech(ingredientsText)}.`,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium shot at chest level with 28mm lens.
- Balanced composition showing both the presenter in waist-up framing and the wooden bench with neat glass bowls of natural kitchen ingredients.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Seamless continuation. The presenter gestures toward the neat glass dishes on the bench, picking up and displaying the homemade ingredients.
• His fingers tap the side of the natural ingredient containers while speaking directly to the camera with warm pedagogical conviction.
• He glances smoothly toward the mixing bowl and spray bottle on the side, inviting the viewer into the active preparation phase without skipping a beat.

PHYSICAL CONTINUITY: The colossal demonstration model remains in the foreground on the solid workbench.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the workbench in front of the presenter are simple, accessible kitchen pest-defense ingredients: ${pest.defaultIngredientsEn}.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins visible, natural skin texture, vellus facial hairs. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Hands actively point to and hold up the kitchen ingredients.

ACTION: Presenter showcases and speaks about the homemade ingredients on the bench, highlighting their natural repellent or lethal properties against ${pest.nameEn} with authority, warmth, and confidence.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Você só vai precisar desses ingredientes simples da sua cozinha para criar uma fórmula fatal contra ${pest.namePt} e segura pra sua família: ${formatIngredientsForSpeech(ingredientsText)}."

${settingDesc}`
  };

  const stepIngredientsFewPrompts = {
    baseTitle: 'JÁ MOSTRANDO E FALANDO OS NOMES DOS INGREDIENTES CASEIROS NA BANCADA',
    focalObject: `${focalModel} ao lado dos potes de vidro com os ingredientes caseiros na bancada de madeira`,
    actionSummary: `Sem perder tempo com explicações longas, o especialista entra direto no segundo 00:08 mostrando na bancada e falando com lip-sync claro os nomes exatos de cada ingrediente (${formatIngredientsForSpeech(ingredientsText)}), apontando para cada um e preparando a mistura imediata contra ${pest.namePt}.`,
    cameraFraming: 'Plano Médio 9:16 com lente 28mm e profundidade de campo óptica natural. Foco balanceado entre os potes de vidro com ingredientes na bancada e o apresentador.',
    visualSceneDescription: `O vídeo corta direto no segundo 00:08 para o especialista em plano médio na bancada de madeira. Ele aponta e ergue na frente da câmera os potes com os ingredientes caseiros (${formatIngredientsForSpeech(ingredientsText)}), falando com sincronização labial direta e entonação ágil os nomes exatos de cada um.`,
    visualTimeline: [
      { time: '00:08 - 00:11', title: 'Exibição Direta dos Ingredientes', action: 'Especialista aponta e ergue na bancada os potes de vidro com os ingredientes da receita, falando diretamente na câmera.' },
      { time: '00:11 - 00:14', title: 'Citação dos Nomes com Lip-Sync', action: `Cita com clareza os nomes exatos dos ingredientes que compõem a fórmula contra ${pest.namePt}.` },
      { time: '00:14 - 00:16', title: 'Chamada para o Preparo Rápido', action: 'Gesto rápido puxando a tigela/frasco de mistura para o centro, preparando o preparo imediato no próximo segundo.' }
    ],
    spokenLinePt: solutionIngredients 
      ? `Para acabar com as ${pest.namePt} rápido você só vai precisar de: ${formatIngredientsForSpeech(solutionIngredients)}. São ingredientes simples da sua casa!`
      : `Para acabar com as ${pest.namePt} rápido você só vai precisar desses ingredientes simples da sua cozinha: ${formatIngredientsForSpeech(pest.defaultIngredientsPt)}.`,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${noTextDirective}

DIRECT FAST PACING (NO WASTED TIME): The scene transitions immediately to the ingredients on the workbench with zero delay.

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium shot at chest level with 28mm lens.
- Balanced composition showing both the presenter in waist-up framing and the wooden bench with neat glass bowls of natural kitchen ingredients.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Seamless, dynamic continuation. The presenter immediately gestures toward the neat glass dishes on the bench, picking up and displaying each kitchen ingredient.
• He speaks with crisp, articulate lip-sync in Brazilian Portuguese, clearly stating the names of the homemade elements that will eliminate ${pest.nameEn}.
• With a confident, energetic motion, he pulls the mixing container to the center of the workbench, seamlessly setting up the rapid preparation step.

PHYSICAL CONTINUITY: The colossal demonstration model remains in the foreground on the solid workbench.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the workbench in front of the presenter are simple, accessible kitchen pest-defense ingredients: ${pest.defaultIngredientsEn}.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins visible, natural skin texture, vellus facial hairs. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Hands actively point to and hold up the kitchen ingredients.

ACTION: Presenter immediately introduces and names each accessible kitchen ingredient on the bench with dynamic energy and perfect on-camera lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${solutionIngredients ? `Para acabar com as ${pest.namePt} rápido você só vai precisar de: ${formatIngredientsForSpeech(solutionIngredients)}. São ingredientes simples da sua casa!` : `Para acabar com as ${pest.namePt} rápido você só vai precisar desses ingredientes simples da sua cozinha: ${formatIngredientsForSpeech(pest.defaultIngredientsPt)}.`}"

${settingDesc}`
  };

  const stepQuickCook = {
    baseTitle: 'PREPARO RÁPIDO & APLICAÇÃO IMEDIATA',
    focalObject: `Tigela cerâmica ou frasco borrifador na bancada onde o especialista mistura rapidamente os ingredientes e exibe a fórmula ativa contra ${pest.namePt}`,
    actionSummary: `Especialista executa o preparo rápido da receita contra ${pest.namePt} ao vivo na bancada: mistura rapidamente os ingredientes na tigela ou frasco, mostra a consistência ativa pronta e ensina a aplicar de imediato com lip-sync ágil.`,
    cameraFraming: 'Plano Médio 9:16 com lente 28mm. Foco na bancada e no especialista operando os ingredientes com agilidade e lip-sync dinâmico.',
    visualSceneDescription: `O especialista executa o preparo rápido ao vivo na bancada de madeira: adiciona os ingredientes no recipiente, mistura em ritmo dinâmico, ergue mostrando a fórmula ativa pronta e indica com os dedos a aplicação imediata contra ${pest.namePt}.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Mistura Rápida dos Ingredientes', action: 'Especialista despeja rapidamente as medidas no recipiente e mexe com ritmo ágil na frente da câmera.' },
      { time: '00:03 - 00:06', title: 'Homogeneização & Consistência Ativa', action: 'Mostra a consistência homogênea pronta da fórmula e fala diretamente na câmera com lip-sync perfeito.' },
      { time: '00:06 - 00:08', title: 'Aplicação Imediata & Resultado', action: `Ensina a aplicar direto no local estratégico e confirma que as ${pest.namePt} somem em minutos.` }
    ],
    spokenLinePt: `Mistura tudo bem rápido até homogeneizar. Aplica direto nos pontos estratégicos e as ${pest.namePt} somem em minutos!`,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing showing the presenter actively mixing the homemade formula on the wooden demonstration workbench.

WHAT HAPPENS VISUALLY (FAST PREPARATION ACTION TIMELINE):
• 00:00 - 00:03: Rapid, dynamic live preparation. The presenter's muscular hands quickly combine the kitchen ingredients in the mixing container and blend vigorously.
• 00:03 - 00:06: He lifts the mixture slightly to show the homogeneous active consistency, speaking directly into the lens with sharp pedagogical clarity and organic lip-sync.
• 00:06 - 00:08: He gestures toward strategic application spots (${pest.habitatEn}), concluding with an assuring nod that the remedy neutralizes ${pest.nameEn} in minutes.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins flexing with quick mixing effort, natural skin texture, vellus facial hairs. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Fast, confident, dexterous hand movements mixing the ingredients.

ACTION: Fast-paced, tactile, highly dynamic preparation. Presenter delivers dialogue with snappy, engaging lip-sync and direct eye contact.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mistura tudo bem rápido até homogeneizar. Aplica direto nos pontos estratégicos e as ${pest.namePt} somem em minutos!"

${settingDesc}`
  };

  const stepCook1 = {
    baseTitle: 'PREPARO PARTE 1: BASE DA MISTURA COM LIP-SYNC AO VIVO',
    focalObject: `Especialista em plano médio conversando na câmera com lip-sync orgânico enquanto adiciona e mistura os primeiros ingredientes na bancada contra ${pest.namePt}`,
    actionSummary: `Especialista em plano médio conversa diretamente com o espectador na câmera com sincronização labial perfeita: coloca os primeiros ingredientes da receita contra ${pest.namePt} na bancada e começa a misturar, alternando olhares entre o recipiente e a câmera.`,
    cameraFraming: 'Plano Médio (cintura para cima) na altura do peito, lente 28mm. Enquadramento captura tanto a boca e o rosto do especialista falando diretamente quanto o recipiente na bancada de madeira.',
    visualSceneDescription: `O especialista conversa naturalmente na câmera (lip-sync orgânico, sem narração em off). Na bancada, o recipiente recebe as primeiras medidas dos ingredientes contra ${pest.namePt}. Ele mistura com movimentos firmes enquanto olha firme no olho da câmera.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Início do Preparo na Bancada', action: 'Especialista em plano médio fala diretamente para a câmera (lip-sync orgânico) enquanto adiciona os primeiros ingredientes.' },
      { time: '00:03 - 00:06', title: 'Homogeneização Inicial', action: `Mexe enquanto explica como a base atrai ou afeta ${pest.namePt} sem que elas desconfiem.` },
      { time: '00:06 - 00:08', title: 'Transição Contínua para Ativação', action: 'Encerra a fala orientando a consistência ideal, mantendo o recipiente na mesma posição para o próximo passo.' }
    ],
    spokenLinePt: pest.cook1SpokenPt,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level, medium shot capturing both the presenter's expressive speaking face, mouth, and upper body and the wooden demonstration bench with the mixing vessel.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing at chest level. 
- The camera frames the presenter speaking warmly to the audience while his hands operate above the rustic mixing container on the wooden demonstration counter.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Live on-camera dialogue with precise lip-sync. Muscular hands combine the initial measured parts of the homemade pest remedy against ${pest.nameEn}.
• He stirs with steady rhythmic motion; the ingredients blend smoothly into a uniform mix.
• He holds direct eye contact with the camera, speaking with perfect lip synchronization as the base comes together.

OBJECT CONTINUITY IN PREPARATION: In the center foreground rests the rustic mixing vessel. THIS EXACT SAME VESSEL MUST REMAIN IN PROMPT 5.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins flexing with physical mixing effort. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds.

ACTION: Natural, fluid cadence. Alternates naturally between looking at the mixing vessel and locking eyes with the camera while speaking with perfect on-camera lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${pest.cook1SpokenPt}"

${settingDesc}`
  };

  const stepCook2 = {
    baseTitle: 'PREPARO PARTE 2: CONTINUAÇÃO NA MESMA TIGELA & POTENCIALIZAÇÃO',
    focalObject: `Idêntico recipiente de preparo de Prompt 4 recebendo os bioativos concentrados para finalizar a fórmula contra ${pest.namePt}`,
    actionSummary: `Continuação exata: o recipiente já está com a mistura base do Prompt 4. O especialista continua a receita ao vivo, falando com lip-sync na câmera, adicionando os bioativos aromáticos ativos contra ${pest.namePt} e mexendo até homogeneizar.`,
    cameraFraming: 'Plano Médio de Continuidade Direta, lente 28mm. Câmera estável na altura do peito registrando a adição dos bioativos na mesma tigela e a sincronização labial contínua do especialista.',
    visualSceneDescription: `Continuação direta: o recipiente já contém a mistura base do Prompt 4. O especialista adiciona os bioativos aromáticos com os dedos ou conta-gotas soltando aroma ativo e mexe com a colher, homogeneizando a fórmula enquanto fala na câmera.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Adição dos Bioativos Aromáticos', action: 'Continuação imediata: adiciona os bioativos concentrados direto no mesmo recipiente.' },
      { time: '00:03 - 00:06', title: 'Homogeneização da Fórmula Ativa', action: 'Mexe energicamente, criando uma textura uniforme com princípio ativo potente.' },
      { time: '00:06 - 00:08', title: 'Finalização do Preparo com Lip-Sync', action: 'Ergue levemente a fórmula mostrando a consistência pronta, concluindo a fala com sorriso de segurança.' }
    ],
    spokenLinePt: pest.cook2SpokenPt,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level, medium shot capturing both the presenter's face speaking with lip sync and the mixing vessel on the bench.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, unbroken medium shot continuation.
- Stable camera capturing both active mixing and presenter's expressive facial delivery.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The vessel already contains the initial blend from the previous cut. Active botanical essences or crushed herbs are blended finely between fingers directly into the vessel, releasing aromatic defense compounds.
• A few drops of natural activator are stirred in, forming the finished active defense formula against ${pest.nameEn}.
• The presenter lifts the mixture slightly toward the lens showing the finished active consistency, locking eyes with the camera with a satisfied smile.

DIRECT TEMPORAL & PHYSICAL CONTINUATION: Unbroken visual continuity. Inside the vessel on the wooden bench, the exact base prepared in Prompt 4 is visibly present and enhanced.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins flexing with physical cooking effort. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds.

ACTION: Fast-paced, tactile, highly satisfying homemade preparation continuing seamlessly. Presenter speaks with perfect lip sync.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${pest.cook2SpokenPt}"

${settingDesc}`
  };

  const stepPortions = {
    baseTitle: 'QUANTIDADE DE INGREDIENTES E PONTOS ESTRATÉGICOS DE APLICAÇÃO',
    focalObject: `Frasco dosador, porções da receita na bancada de madeira e especialista gesticulando com os dedos indicando aplicação contra ${pest.namePt}`,
    actionSummary: `Especialista fala diretamente para a câmera com lip-sync ao vivo detalhando as medidas exatas de cada ingrediente e ensina a posicionar em ${pest.habitatPt} para efeito 24 horas.`,
    cameraFraming: 'Plano Médio Frontal com lente 28mm. O especialista gesticula didaticamente com as mãos ao lado das porções dosadas, indicando medidas e locais de aplicação com clareza.',
    visualSceneDescription: `O especialista fala diretamente para a câmera com sincronização labial perfeita. Ele gesticula com as mãos e dedos ao lado das porções na bancada, detalhando as medidas exatas da receita e instruindo os locais estratégicos de aplicação (${pest.habitatPt}).`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Detalhamento das Medidas Exatas', action: 'Especialista fala diretamente para a câmera com sincronização labial, gesticulando com os dedos para indicar a quantidade precisa.' },
      { time: '00:03 - 00:06', title: 'Instrução dos Pontos Estratégicos', action: `Aponta e indica posicionar exatamente em ${pest.habitatPt}.` },
      { time: '00:06 - 00:08', title: 'Finalização do Protocolo de Aplicação', action: 'Confirma com um aceno confiante que a barreira fica ativa dia e noite sem precisar repor toda hora.' }
    ],
    spokenLinePt: pest.portionsSpokenPt,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at waist-up medium framing.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing showing presenter beside the prepared portions and dispenser, speaking directly to camera.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The presenter gestures expressively with open hands and counting fingers, explaining directly into the camera lens the exact measured amounts of each ingredient.
• He points with his right hand toward the prepared portions, holding up fingers to indicate strategic dark zones: ${pest.habitatEn}.
• He nods with authentic authority and warm charismatic reassurance, confirming the protocol works continuously without toxic fumes.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forearm veins, natural skin texture, vellus facial hairs. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Gold wedding band visible on left ring finger.

ACTION: Presenter delivers narration with direct, engaging conversational lip-sync, maintaining magnetic eye contact with the viewer while gesturing clearly to explain portions and application zones.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${pest.portionsSpokenPt}"

${settingDesc}`
  };

  const stepResult = {
    baseTitle: `COMPROVAÇÃO PRÁTICA: CASA LIMPA E LIVRE DE ${pest.namePt.toUpperCase()}`,
    focalObject: `Bancada e maquete agora totalmente desinfestada, limpa e sem nenhuma presença de ${pest.namePt}, especialista com sorriso de alívio e satisfação`,
    actionSummary: `Especialista mostra a bancada limpa e a maquete totalmente desinfestada sem nenhuma presença de ${pest.namePt}, relatando o alívio imediato e a segurança total para crianças e pets.`,
    cameraFraming: 'Plano Médio-Curto com foco límpido na bancada limpa e no especialista com expressão confiante e satisfeita.',
    visualSceneDescription: `O especialista apoia a mão na bancada limpa ao lado da maquete que agora exibe o ambiente limpo e livre de ${pest.namePt}. Ele sorri com alívio, respira com ar de tranquilidade e compartilha o resultado prático de quem nunca mais teve pragas em casa.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Comprovação da Casa Desinfestada', action: `Especialista gesticula para o espaço limpo e reluzente, sem nenhuma ${pest.namePt} à vista.` },
      { time: '00:03 - 00:06', title: 'Segurança para a Família', action: 'Explica com expressividade que não há veneno tóxico nem risco para crianças ou animais de estimação.' },
      { time: '00:06 - 00:08', title: 'Relato Prático de Sucesso', action: 'Confirma o resultado duradouro, preparando a chamada para o livro na cena seguinte.' }
    ],
    spokenLinePt: pest.resultSpokenPt,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with warm natural workshop light.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium close-up shot focused on the presenter beside the clean, cleared demonstration model.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• The presenter gestures toward the demonstration model on the bench, which is now completely spotless, cleared of any live ${pest.nameEn}, and free of residue.
• He rests his open hand comfortably against the wooden counter, smiling with genuine relief and domestic peace of mind.
• Authentic personal connection: delivering the line about household safety for children and pets with warmth and experienced mentor authority.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead lines, natural skin texture, vellus hairs. NO beauty filter, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds.

ACTION: Presenter delivers narration with direct, heartfelt conviction, looking into the camera lens with charismatic confidence.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${pest.resultSpokenPt}"

${settingDesc}`
  };

  const productVisualPt = isDigitalProduct
    ? `smartphone moderno segurado nas mãos com a tela virada para a câmera exibindo o material digital "${productTitle}"`
    : `produto físico impresso "${productTitle}" em destaque nas mãos do especialista`;
  const productVisualEn = isDigitalProduct
    ? `a modern smartphone held in his hands with the screen turned toward the camera, clearly displaying the digital product cover/title "${productTitle}"`
    : `a substantial printed physical product with the title clearly legible on its cover`;

  const stepCTA1Spoken = `Isso aqui é o ${productTitle}: o material completo que eu preparei para você eliminar ${pest.namePt} de vez usando só receitas caseiras seguras.`;
  const stepCTA2Spoken = `Comenta EU QUERO aqui embaixo agora mesmo que eu te mando o link do ${productTitle} no seu privado!`;

  const stepCTA1 = {
    baseTitle: `REVELAÇÃO DO PRODUTO "${productTitle.toUpperCase()}"`,
    focalObject: productVisualPt,
    actionSummary: `Especialista revela com orgulho o ${productKindPt} "${productTitle}" para a câmera, explicando o que ele resolve contra ${pest.namePt}.`,
    cameraFraming: 'Plano Médio Frontal com lente 28mm. O produto é apresentado no centro do enquadramento com iluminação limpa destacando o título.',
    visualSceneDescription: `O especialista segura ${productVisualPt} e o apresenta com clareza para a câmera, mostrando o título "${productTitle}" e explicando o que o conteúdo entrega contra ${pest.namePt}.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Revelação do Produto', action: `Especialista ergue ${isDigitalProduct ? 'o smartphone com a tela do material digital acesa e visível' : 'o produto físico'} de forma destacada em direção à câmera.` },
      { time: '00:03 - 00:06', title: 'Apresentação do Conteúdo', action: `Mostra o título "${productTitle}" com nitidez e afirma o que o ${productKindPt} resolve contra ${pest.namePt}.` },
      { time: '00:06 - 00:08', title: 'Conexão com o Espectador', action: 'Olhar firme e sorriso de autoridade conectando com o espectador, preparando a chamada final.' }
    ],
    spokenLinePt: stepCTA1Spoken,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing presenting the product prominently at chest height in the upper-center of the screen.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Presenter reveals the product for the camera with both hands, ${isDigitalProduct ? 'holding a smartphone with the digital product screen turned toward the lens' : 'showing its tangible physical presence and cover'}.
• He presents the title clearly and explains what the content delivers against the pest.
• Warm, authoritative smile and direct magnetic eye contact.

PRODUCT REVEAL:
In the center of the frame, the presenter proudly presents ${productVisualEn}${bookImageBase64 ? ', faithfully matching the uploaded custom cover reference in design, palette, artwork and styling' : ''}.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Tiny blemishes, natural expression lines, nasolabial folds. NO beauty filter, NO skin smoothing, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds.

ACTION: Presenter reveals and presents the product clearly, speaking with energetic warmth and magnetic conviction.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${stepCTA1Spoken}"

${settingDesc}`
  };

  const stepCTA2 = {
    baseTitle: 'CHAMADA PARA AÇÃO — "COMENTA EU QUERO"',
    focalObject: 'Especialista apontando o dedo indicador para baixo, na direção da área de comentários',
    actionSummary: `Especialista aponta para baixo e convoca o público a comentar "EU QUERO" para receber o ${productKindPt} no privado.`,
    cameraFraming: 'Plano Médio Frontal com lente 28mm, com espaço no enquadramento para o gesto de apontar para baixo.',
    visualSceneDescription: `Com o olhar firme na câmera, o especialista aponta o dedo indicador direito para baixo na direção dos comentários e conclama o público a comentar "EU QUERO" para receber o link do ${productKindPt} no privado.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Comando Direto', action: 'Especialista aponta o dedo indicador para baixo, na direção da área de comentários.' },
      { time: '00:03 - 00:06', title: 'CTA "Comenta EU QUERO"', action: `Fala com convicção o comando para comentar EU QUERO e receber o ${productKindPt} no privado.` },
      { time: '00:06 - 00:08', title: 'Fechamento com Urgência', action: 'Sorriso de autoridade e senso de urgência, encerrando a sequência.' }
    ],
    spokenLinePt: stepCTA2Spoken,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing with clear space below for the pointing gesture.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• Presenter looks straight into the lens and points his right index finger decisively downward toward the comment area.
• He delivers a direct call to action inviting viewers to comment "EU QUERO" to receive the link privately.
• Warm, authoritative closing smile and magnetic eye contact.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Tiny blemishes, natural expression lines, nasolabial folds. NO beauty filter, NO skin smoothing, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Right hand points with index finger downward toward the comment section.

ACTION: Presenter points directly down into the camera inviting viewers to comment, delivering the closing line with magnetic conviction.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${stepCTA2Spoken}"

${settingDesc}`
  };

  const stepOrganicClose = {
    baseTitle: `ORIENTAÇÕES DE MANUTENÇÃO & CASA BLINDADA CONTRA ${pest.namePt.toUpperCase()}`,
    focalObject: `Especialista na bancada de madeira ao lado do frasco da receita caseira e bancada impecavelmente limpa`,
    actionSummary: `Especialista compartilha a frequência ideal de reaplicação nos pontos estratégicos para manter a barreira ativa contra ${pest.namePt}, encerrando com carisma e autoridade.`,
    cameraFraming: 'Plano Médio Frontal com lente 28mm e iluminação natural limpa.',
    visualSceneDescription: `O especialista gesticula de forma acolhedora e confiante, orientando o espectador sobre a rotina de reaplicação preventiva contra ${pest.namePt}. Ele apoia a mão na bancada com segurança e fecha o vídeo com um sorriso fraterno sem apelo de venda.`,
    visualTimeline: [
      { time: '00:00 - 00:03', title: 'Orientação de Frequência Preventiva', action: `Especialista gesticula indicando reaplicar periodicamente para manter ${pest.namePt} longe.` },
      { time: '00:03 - 00:06', title: 'Proteção Contínua sem Química', action: 'Explica como a casa permanece cheirosa, limpa e blindada sem venenos industriais caros.' },
      { time: '00:06 - 00:08', title: 'Encerramento com Autoridade & Conexão', action: 'Sorriso caloroso e olhar fixo na câmera com autoridade amigável, encerrando o vídeo de forma 100% orgânica sem venda.' }
    ],
    spokenLinePt: pest.organicCloseSpokenPt,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing focused on the presenter beside the clean demonstration bench.

WHAT HAPPENS VISUALLY (ORGANIC CLOSING TIMELINE):
• Presenter gestures with open, communicative hands, explaining with authentic warmth how simple kitchen remedies keep homes permanently free of ${pest.nameEn}.
• He gestures toward the clean workbench and places his hand reassuringly on the counter, reinforcing clean domestic peace and safety.
• Direct magnetic eye contact into the lens, nodding with confident mentorship and charismatic warmth as the scene naturally concludes without any commercial pitch.

${presenterDesc}

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Natural skin texture, vellus facial hairs, arm veins bulging with realistic vascularity. NO beauty filter, NO wax skin, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Expressive open-palm gestures, gold wedding band visible on left ring finger.

ACTION: Presenter delivers closing guidance with direct, engaging conversational lip-sync, maintaining magnetic eye contact with the viewer while gesturing warmly.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${pest.organicCloseSpokenPt}"

${settingDesc}`
  };

  let contentSteps: any[] = [];
  if (targetCount <= 3) {
    contentSteps = [stepHook, stepIngredientsFewPrompts, stepQuickCook];
  } else if (targetCount === 4) {
    contentSteps = [stepHook, stepIngredientsFewPrompts, stepQuickCook, stepResult];
  } else if (targetCount === 5) {
    contentSteps = [stepHook, stepIngredientsFewPrompts, stepQuickCook, stepPortions, hasCTA ? stepResult : stepOrganicClose];
  } else if (targetCount === 6) {
    contentSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepPortions, stepResult];
  } else if (targetCount === 7) {
    contentSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepCook2, stepPortions, stepResult];
  } else {
    contentSteps = [stepHook, stepProblem, stepIngredients, stepCook1, stepCook2, stepPortions, stepResult, stepOrganicClose];
  }

  contentSteps = contentSteps.slice(0, targetCount);
  // O CTA (2 prompts) é EXTRA: NÃO conta na quantidade escolhida pelo usuário.
  const chosenSteps: any[] = hasCTA ? [...contentSteps, stepCTA1, stepCTA2] : contentSteps;

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
    promptCount: finalPrompts.length,
    includeCTA: hasCTA,
    totalDurationSeconds: finalPrompts.length * 8,
    summary: `Demonstração visual de alto impacto contra ${cleanTheme} utilizando maquete COLOSSAL de frestas e ralos (60% do quadro) em ${finalPrompts.length} prompts de 8s (${finalPrompts.length * 8}s total)${hasCTA ? ' (inclui 2 prompts de CTA extras)' : ''} com gancho de choque: ${selectedHook.summary}`,
    focalObject: focalModel,
    targetProblem: `Infestação de pragas em frestas e ralos associada a ${cleanTheme}`,
    solutionIngredients: ingredientsText,
    elementsPrepared: `Ingredientes caseiros simples em potes de vidro na bancada de madeira e recipientes de preparo (spray, tigela)`,
    transformationType: hasCTA 
      ? `Preparo ao vivo do repelente/isca caseira na bancada, seguido de comprovação da casa livre de pragas e CTA dividido em dois prompts com o ${productKindPt} ${productTitle}`
      : `Preparo ao vivo do repelente/isca caseira na bancada, seguido de comprovação prática da casa limpa sem venda`,
    characterUsed: characterLabel,
    settingUsed: settingLabel,
    bookTitleUsed: hasCTA ? productTitle : undefined,
    characterImagePreview: characterImageBase64 ? (characterImageBase64.startsWith('data:') ? characterImageBase64 : `data:image/jpeg;base64,${characterImageBase64}`) : undefined,
    settingImagePreview: settingImageBase64 ? (settingImageBase64.startsWith('data:') ? settingImageBase64 : `data:image/jpeg;base64,${settingImageBase64}`) : undefined,
    bookImagePreview: (hasCTA && bookImageBase64) ? (bookImageBase64.startsWith('data:') ? bookImageBase64 : `data:image/jpeg;base64,${bookImageBase64}`) : undefined,
    createdAt: new Date().toISOString(),
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
      hookActionType = 'spray_mist',
      characterMode = 'default_specialist',
      customCharacterDescription,
      characterImageBase64,
      characterImageMimeType,
      settingMode = 'default_workshop',
      customSettingDescription,
      settingImageBase64,
      settingImageMimeType,
      customBookTitle,
      bookImageBase64,
      bookImageMimeType,
      promptCount,
      includeCTA,
      includePrompt5,
      productType
    } = req.body;

    const targetPromptCount = Math.max(2, Math.min(10, Number(promptCount) || 8));
    const targetIncludeCTA = includeCTA !== undefined ? Boolean(includeCTA) : (includePrompt5 !== undefined ? Boolean(includePrompt5) : true);

    if (req.body?.lockMaquete && !giantModelPreference) {
      return res.status(400).json({ error: 'Você marcou a maquete como obrigatória. Escreva a maquete e clique em "Analisar e fixar".' });
    }

    if (!theme && !referenceText && !referenceImageBase64 && !referenceVideoBase64 && !characterImageBase64 && !settingImageBase64 && !customBookTitle && !bookImageBase64) {
      return res.status(400).json({ error: 'Forneça ao menos um tema, praga/inseto, vídeo viral, texto, livro ou imagem de referência.' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const script = generateLocalScript(
        theme || 'Exterminar e Afastar Baratas Definitivamente', 
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
        spray_mist: 'Borrifação de choque instantânea: no segundo 00:00, o especialista dispara um spray pressurizado de névoa bioativa caseira na fresta/ralo da maquete, fazendo os insetos ou ratos debandarem em pânico ou capotarem paralisados.',
        powder_dusting: 'Polvilhamento de bio-pó ativo: no segundo 00:00, o especialista polvilha uma linha de pó branco (bicarbonato, canela, sal) cortando a trilha das pragas na hora e desidratando seus corpos.',
        drain_flush: 'Despejo efervescente no ralo: no segundo 00:00, o especialista despeja solução borbulhante de vinagre e bicarbonato no ralo da maquete, expelindo espuma e eliminando o ninho de baratas e escorpiões.',
        bait_placement: 'Aplicação de isca atrativa: no segundo 00:00, o especialista coloca bolinhas de isca caseira na entrada do ninho, mostrando as pragas devorando a isca que causará reação mortal.',
        aromatic_barrier: 'Barreira aromática invisível: no segundo 00:00, o especialista aplica essência volátil de hortelã-pimenta e cravo na fresta, provocando choque sensorial olfativo imediato no roedor/inseto que foge desesperado.',
        trap_capture: 'Armadilha caseira: no segundo 00:00, o especialista mostra a armadilha atrativa capturando dezenas de insetos sem cheiro de veneno químico.',
        ultrasonic_smoke: 'Defumação repelente: no segundo 00:00, fumaça aromática suave de café seco e ervas queima expulsando vespas, mosquitos e pernilongos do ambiente.'
      };
      hookActionDirective = `AÇÃO ESPECÍFICA DO GANCHO NO SEGUNDO 00:00: ${hookDescriptions[hookActionType] || hookActionType}`;
    } else {
      hookActionDirective = `REGRA CRUCIAL DE GANCHO NO SEGUNDO 00:00 (NUNCA FAÇA A MESMA COISA SEMPRE!):
- CRIE UM GANCHO VISUAL TOTALMENTE INÉDITO, VISCERAL E SURPREENDENTE PARA ESTA PRAGA/INSETO!
- A ÚNICA COISA FIXA E OBRIGATÓRIA É A MAQUETE/SUPERFÍCIE COLOSSAL DA INFESTAÇÃO (55% a 65% do enquadramento vertical 9:16) SEMPRE EM PRIMEIRO PLANO DEMONSTRANDO A INFESTAÇÃO HIPER-REALISTA.
- A AÇÃO NO SEGUNDO 00:00 DEVE SER DIFERENTE E INOVADORA (ex.: spray pressurizado fazendo baratas capotarem, névoa de hortelã fazendo rato fugir, pó de bicarbonato cortando trilha de formigas, despejo efervescente no ralo borbulhando espuma).`;
    }

    let characterDirective = '';
    if (characterImageBase64) {
      characterDirective = `DIRETIVA DE PERSONAGEM PERSONALIZADO FORNECIDO VIA FOTO:
O usuário enviou uma FOTO DO PERSONAGEM/APRESENTADOR. Você DEVE analisar os traços da pessoa na foto (gênero, idade, formato facial, cabelo, barba, compleição, tom de pele e vestimenta) e descrevê-la com fidelidade absoluta em TODOS os prompts.`;
    } else if (customCharacterDescription) {
      characterDirective = `DIRETIVA DE PERSONAGEM PERSONALIZADO (TEXTO):
${customCharacterDescription}. Mantenha a identidade e características físicas deste personagem em todos os prompts.`;
    } else {
      characterDirective = `DIRETIVA DE PERSONAGEM PADRÃO:
Apresentador Oficial: Especialista brasileiro em bio-defesa e extermínio caseiro (~50 anos), porte forte e experiente, camisa polo utilitária escura com patch "BIO-DEFESA" no peito esquerdo, calça cargo escura, aliança de ouro no anular esquerdo, poros naturais e sem filtros de beleza.`;
    }

    let settingDirective = '';
    if (settingImageBase64) {
      settingDirective = `DIRETIVA DE CENÁRIO PERSONALIZADO FORNECIDO VIA FOTO:
O usuário enviou uma FOTO DO CENÁRIO. Utilize ESTE CENÁRIO exato como o fundo e bancada das ações em todos os prompts.`;
    } else if (customSettingDescription) {
      settingDirective = `DIRETIVA DE CENÁRIO PERSONALIZADO (TEXTO):
${customSettingDescription}. Mantenha este ambiente como o cenário e balcão de apoio em todos os prompts.`;
    } else {
      settingDirective = `DIRETIVA DE CENÁRIO PADRÃO:
Cenário Oficial: Oficina & estúdio doméstico de bio-defesa com bancada de madeira rústica, prateleiras ao fundo com frascos de vidro etiquetados (louro, cravo, vinagre, hortelã, bicarbonato e borrifadores).`;
    }

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
        text: `[IMAGEM 1 — FOTO DO PERSONAGEM]: Utilize este apresentador em todos os prompts com fidelidade facial e de vestimenta.`
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
        text: `[IMAGEM 2 — FOTO DO CENÁRIO]: Utilize este ambiente como fundo e bancada em todos os prompts.`
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
        text: `[IMAGEM 3 — REFERÊNCIA DE PRAGA OU MAQUETE]: Analise esta referência visual para conceber a maquete colossal de infestação em primeiro plano.`
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
Analise a retenção, gancho inicial e transposição para a fórmula de prompts virais contra pragas.`
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
        text: `[IMAGEM DO LIVRO]: Utilize a capa exata deste livro no prompt final de CTA.`
      });
    }

    const bookTitleToUse = customBookTitle ? customBookTitle.trim() : 'CASA LIVRE DE PRAGAS - 100 RECEITAS CASEIRAS INFALÍVEIS';
    const productIsDigitalAi = ['digital', 'ebook', 'e-book', 'curso', 'infoproduto', 'app', 'software', 'online']
      .some((k) => String(productType || '').toLowerCase().includes(k));
    const productKindAi = productIsDigitalAi ? 'material digital' : 'produto físico';
    const productVisualAi = productIsDigitalAi
      ? `um smartphone moderno com a tela virada para a câmera exibindo o material digital "${bookTitleToUse}"`
      : `o produto físico impresso "${bookTitleToUse}" erguido com as duas mãos`;
    const requestedPestProfile = detectPestProfile(theme || 'baratas', solutionIngredients);
    const spokenIngredientsForPrompt = solutionIngredients 
      ? formatIngredientsForSpeech(solutionIngredients) 
      : formatIngredientsForSpeech(requestedPestProfile.defaultIngredientsPt);

    const ctaStart = targetPromptCount + 1;
    const ctaEnd = targetPromptCount + 2;
    const bookDirective = targetIncludeCTA
      ? `DIRETIVA DE PRODUTO E CTA (DOIS PROMPTS EXTRA, que NÃO contam na quantidade de conteúdo): os prompts de conteúdo vão de 1 a ${targetPromptCount}; os DOIS prompts de CTA são o PROMPT ${ctaStart} (REVELAÇÃO DO PRODUTO) e o PROMPT ${ctaEnd} (CHAMADA PARA AÇÃO).
- PROMPT ${ctaStart} (REVELAÇÃO DO PRODUTO): O apresentador revela e apresenta para a câmera ${productVisualAi}. Deixe o título EXATO do produto legível na capa/tela e diga o NOME do produto em voz alta ("${bookTitleToUse}"). NUNCA fale "produto físico" nem "material digital": fale o NOME do produto. Ainda SEM o comando de comentar.
- PROMPT ${ctaEnd} (CHAMADA PARA AÇÃO): O apresentador aponta o dedo indicador para baixo na direção dos comentários, fala o NOME do produto ("${bookTitleToUse}") e conclama o público a comentar "EU QUERO" para receber o link no privado.`
      : `DIRETIVA SEM PRODUTO E SEM CTA COMERCIAL (VÍDEO 100% ORGÂNICO): O usuário escolheu NÃO incluir CTA nem produto. O último prompt de conteúdo (${targetPromptCount}) encerra na comprovação prática da casa livre de pragas, segurança da família e alívio de um ambiente protegido.`;
    
    const promptStepsGuidance = targetPromptCount <= 5
      ? `ESTRUTURA OBRIGATÓRIA ADAPTADA PARA POUCOS PROMPTS (${targetPromptCount} PROMPTS) — REGRA DE OURO:
Como o usuário escolheu poucos prompts (${targetPromptCount} prompts), aplique a estrutura acelerada para máxima retenção:
- PROMPT 1 (00:00 - 00:08): GANCHO CHOCANTE COM MAQUETE COLOSSAL DA PRAGA "${requestedPestProfile.namePt.toUpperCase()}" (55% a 65% do enquadramento vertical 9:16) com ação visceral de choque no segundo 00:00 (borrifação, pó ou choque provocando debandada ou paralisia da praga).
- PROMPT 2 (00:08 - 00:16): JÁ ENTRA DIRETO MOSTRANDO E FALANDO OS NOMES DOS INGREDIENTES CASEIROS NA BANCADA! Não gaste tempo explicando o problema ou ninhos. O apresentador entra imediatamente no segundo 00:08 apontando para os potes na bancada e falando claramente com sincronização labial perfeita (lip-sync direto) os nomes exatos de cada um dos ingredientes (${spokenIngredientsForPrompt}). Nunca use caracteres como "+" na fala.
- PROMPT 3 (00:16 - 00:24): PREPARO RÁPIDO & APLICAÇÃO IMEDIATA! O apresentador faz a mistura rápida ao vivo na tigela ou frasco borrifador em ritmo dinâmico, mostra a consistência ativa pronta e ensina a aplicar de imediato no ralo ou frestas contra ${requestedPestProfile.namePt}!
${targetPromptCount === 4 ? (targetIncludeCTA ? `- PROMPT 5 (EXTRA - REVELAÇÃO DO PRODUTO): o apresentador apresenta ${productVisualAi} e diz o NOME do produto em voz alta.\n- PROMPT 6 (EXTRA - CHAMADA PARA AÇÃO): aponta para baixo e comanda "Comenta EU QUERO aqui embaixo que te mando no privado!".` : `- PROMPT 4 (00:24 - 00:32): COMPROVAÇÃO PRÁTICA: CASA 100% LIMPA E PROTEGIDA. Mostra o ralo e cantos desinfestados, sem nenhuma praga e seguro para a família.`) : ''}
${targetPromptCount === 5 ? (targetIncludeCTA ? `- PROMPT 6 (EXTRA - REVELAÇÃO DO PRODUTO): o apresentador apresenta ${productVisualAi} e diz o NOME do produto em voz alta.\n- PROMPT 7 (EXTRA - CHAMADA PARA AÇÃO): aponta para baixo e comanda "Comenta EU QUERO aqui embaixo que te mando no privado!".` : `- PROMPT 4 (00:24 - 00:32): PONTOS ESTRATÉGICOS DE APLICAÇÃO E DOSAGENS. Detalha onde colocar e a frequência nos ralos e frestas.\n- PROMPT 5 (00:32 - 00:40): CASA BLINDADA & MANUTENÇÃO ORGÂNICA. Relato de proteção contínua sem menção a livros ou vendas.`) : ''}`
      : `ESTRUTURA DAS ETAPAS PARA OS ${targetPromptCount} PROMPTS (SEQUÊNCIA COMPLETA):
- PROMPT 1 (00:00 - 00:08): GANCHO CHOCANTE COM MAQUETE COLOSSAL DA PRAGA "${requestedPestProfile.namePt.toUpperCase()}" (60% do quadro) com ação de choque no segundo 00:00.
- PROMPT 2 (00:08 - 00:16): EXPLICAÇÃO DO PROBLEMA (ONDE ELAS SE ESCONDEM E POR QUE O VENENO FALHA). Aponta para frestas e ovos na maquete.
- PROMPT 3 (00:16 - 00:24): INGREDIENTES CASEIROS DA RECEITA. Mostra e cita na bancada os elementos naturais seguros (${spokenIngredientsForPrompt}).
- PROMPT 4 (00:24 - 00:32): PREPARO AO VIVO PARTE 1. Início do preparo na tigela/frasco com lip-sync conversacional direto.
${targetPromptCount >= 5 ? '- PROMPT 5 (00:32 - 00:40): PREPARO AO VIVO PARTE 2. Continuação contínua na mesma tigela/recipiente adicionando os bioativos aromáticos.\n' : ''}
${targetPromptCount >= 6 ? '- PROMPT 6 (00:40 - 00:48): QUANTIDADE E PONTOS ESTRATÉGICOS DE APLICAÇÃO. Apresentador detalha doses e locais onde aplicar (ralos, frestas, forros, rodapés).\n' : ''}
${targetPromptCount >= 7 ? `- PROMPT 7 (00:48 - 00:56): COMPROVAÇÃO PRÁTICA: CASA 100% LIVRE DE ${requestedPestProfile.namePt.toUpperCase()}. Mostra o ambiente limpo, sem insetos/roedores, segurança para crianças e pets.\n` : ''}
${targetIncludeCTA ? `- PROMPTS EXTRA DE CTA (PROMPT ${ctaStart} e PROMPT ${ctaEnd} — NÃO contam na quantidade): PROMPT ${ctaStart} = REVELAÇÃO DO PRODUTO (${productVisualAi} e o NOME do produto em voz alta); PROMPT ${ctaEnd} = CHAMADA PARA AÇÃO (aponta para baixo e comanda "Comenta EU QUERO aqui embaixo").` : `- PROMPT FINAL (PROMPT ${targetPromptCount}): CASA PROTEGIDA E CONCLUSÃO ORGÂNICA. Dicas de reaplicação preventiva sem menção a livros ou vendas.`}`;

    const totalPromptsAi = targetPromptCount + (targetIncludeCTA ? 2 : 0);
    let userPromptText = `Gere a sequência de EXATAMENTE ${totalPromptsAi} PROMPTS conectados de 8s cada (${totalPromptsAi * 8}s no total) com alta fidelidade visual para receitas caseiras para afastar e matar insetos e pragas.

TEMA / PRAGA SOLICITADA: ${theme || 'Exterminar Baratas de Esgoto e Cozinha'} (Foco 100% EXCLUSIVO em: ${requestedPestProfile.namePt})
QUANTIDADE: ${targetPromptCount} prompts de CONTEÚDO (numerados de 1 a ${targetPromptCount})${targetIncludeCTA ? ` + 2 prompts EXTRA de CTA (numerados ${ctaStart} e ${ctaEnd}, que NÃO contam na quantidade escolhida pelo usuário; total ${totalPromptsAi} prompts, ${totalPromptsAi * 8}s)` : ` (total ${totalPromptsAi} prompts, ${totalPromptsAi * 8}s)`}
INCLUIR PRODUTO/CTA NO FINAL: ${targetIncludeCTA ? `SIM (2 prompts EXTRA: o prompt ${ctaStart} revela o produto dizendo o NOME dele e o prompt ${ctaEnd} faz a chamada para ação)` : 'NÃO (vídeo 100% orgânico educacional, sem produto e sem venda)'}
${giantModelPreference ? `MAQUETE/OBJETO GIGANTE OBRIGATÓRIO (SUBSTITUI QUALQUER PADRÃO): use EXATAMENTE esta maquete/objeto colossal no gancho e na explicação: "${giantModelPreference}". NÃO use a maquete padrão da praga; use exatamente a descrição acima.` : ''}
${hookStyle ? `ESTILO DO GANCHO: ${hookStyle}` : ''}
INGREDIENTES CASEIROS: ${spokenIngredientsForPrompt}
ESCALA DO OBJETO NO GANCHO: MAQUETE/INFESTAÇÃO COLOSSAL OCUPANDO 55% A 65% DO ENQUADRAMENTO VERTICAL 9:16 (em primeiro plano extremo colado na lente, perspectiva forçada ultra-wide 20-24mm).
${hookActionDirective}

REGRA CRÍTICA INEGOCIÁVEL DE ZERO CONTAMINAÇÃO CRUZADA:
- O vídeo inteiro, todas as maquetes, todas as falas em português (spokenLinePt) e todos os prompts em inglês (promptText) devem ser 100% dedicados à praga "${requestedPestProfile.namePt}".
- NUNCA mencione outras pragas que não foram solicitadas.
- O promptText de cada prompt deve estar 100% em INGLÊS cinematográfico descritivo (use "${requestedPestProfile.nameEn}"), SEM NENHUMA palavra em português.
- As falas em português (spokenLinePt) não devem conter o símbolo "+" nem soar mecânicas; use linguagem coloquial, autoritária e engajante de especialista.

${characterDirective}

${settingDirective}

${bookDirective}

${promptStepsGuidance}

${referenceText ? `REFERÊNCIA / TRANSCRIÇÃO FORNECIDA:\n"""${referenceText}"""` : ''}

Lembre-se:
1. Formato exato: EXATAMENTE ${totalPromptsAi} PROMPTS conectados de 8 segundos cada (total ${totalPromptsAi * 8}s) — ${targetPromptCount} de conteúdo${targetIncludeCTA ? ` + 2 de CTA EXTRA (numerados ${ctaStart} e ${ctaEnd}, fora da contagem de conteúdo)` : ''}, formato 9:16 vertical, 4K, 30fps.
2. Cada prompt deve ser completo e independente, repetindo toda a descrição do Apresentador, da Pele Humana, das Mãos, do Cenário e da Câmera.
3. Maquete COLOSSAL da infestação em primeiro plano extremo (ocupando de 55% a 65% da tela 9:16) no Prompt 1.
4. Todas as falas em Português Brasileiro (~8 segundos cada, diretas, autênticas e magnéticas).
5. O promptText de cada cena deve estar em inglês altamente descritivo e pronto para ferramentas de geração de vídeo (Sora, Runway Gen-3, Kling, Luma).
6. REGRA CRÍTICA INEGOCIÁVEL — SEM LEGENDAS E SEM TEXTO NA TELA: O promptText de CADA UM dos prompts DEVE começar OBRIGATORIAMENTE com a proibição:
"NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO lower thirds, NO banners, NO typography, NO UI elements, NO watermarks. Clean raw cinematic video footage with zero text overlays and zero subtitles."`;

    contents.push({ text: userPromptText });

    let parsed: any = null;
    let sourceModel = 'gemini';

    try {
      const { response, modelUsed } = await generateWithGeminiFallback(
        ai,
        contents.length === 1 ? contents[0].text : { parts: contents },
        {
          systemInstruction: PRAGAS_INSETOS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING, description: 'Tema ou praga tratada no vídeo' },
              summary: { type: Type.STRING, description: 'Resumo da narrativa em 1 frase' },
              focalObject: { type: Type.STRING, description: 'Nome e descrição da maquete de infestação ou objeto em primeiro plano' },
              targetProblem: { type: Type.STRING, description: 'A infestação visual ou praga demonstrada' },
              solutionIngredients: { type: Type.STRING, description: 'Ingredientes caseiros reais da receita' },
              elementsPrepared: { type: Type.STRING, description: 'Elementos ou recipientes preparados na bancada' },
              transformationType: { type: Type.STRING, description: 'Tipo de reação ou eliminação demonstrada' },
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
      console.log('[Gemini Generator] Utilizing local pest script generator fallback');
      parsed = generateLocalScript(
        theme || 'Exterminar e Afastar Baratas Definitivamente', 
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

    parsed.promptCount = targetPromptCount;
    parsed.includeCTA = targetIncludeCTA;
    parsed.totalDurationSeconds = targetPromptCount * 8;

    if (!Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
      const fallback = generateLocalScript(
        theme || 'Exterminar e Afastar Baratas Definitivamente', 
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
          theme || 'Exterminar e Afastar Baratas Definitivamente', 
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
        targetIncludeCTA,
        productType,
        giantModelPreference
      );
        while (parsed.prompts.length < targetPromptCount) {
          const idx = parsed.prompts.length;
          parsed.prompts.push(fallback.prompts[idx] || fallback.prompts[fallback.prompts.length - 1]);
        }
      }

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

    const characterLabel = customCharacterDescription || (characterImageBase64 ? 'Personagem Personalizado (Foto enviada)' : 'Especialista em Bio-Defesa Oficial (Padrão)');
    const settingLabel = customSettingDescription || (settingImageBase64 ? 'Cenário Personalizado (Foto enviada)' : 'Oficina & Bancada Doméstica (Padrão)');
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

    parsed = enforceZeroTextAndSubtitles(parsed);
    parsed.id = `script-${Date.now()}`;
    parsed.createdAt = new Date().toISOString();

    return res.json({ script: parsed, source: sourceModel });
  } catch (fatalError: any) {
    console.log('[Generation Handler] Local fallback invoked');
    const fallbackPromptCount = Math.max(2, Math.min(10, Number(req.body?.promptCount) || 8));
    const fallbackIncludeCTA = req.body?.includeCTA !== undefined ? Boolean(req.body?.includeCTA) : (req.body?.includePrompt5 !== undefined ? Boolean(req.body?.includePrompt5) : true);
    const fallbackScript = generateLocalScript(
      req.body?.theme || 'Exterminar e Afastar Baratas Definitivamente', 
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
    const { message } = req.body;
    const lower = (message || '').trim().toLowerCase();

    const isStarterQuery = lower.includes('vamos começar') || 
                           lower.includes('novo vídeo') || 
                           lower.includes('novo video') || 
                           lower.includes('vamos fazer outro') || 
                           lower.includes('começar') || 
                           lower === 'oi' || 
                           lower === 'olá';

    if (isStarterQuery && lower.length < 30) {
      return res.json({
        reply: 'Qual é a praga ou inseto que você deseja afastar ou matar? Pode enviar também o vídeo ou fotos de referência.',
        action: 'ask_theme'
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const script = enforceZeroTextAndSubtitles(generateLocalScript(message));
      return res.json({
        reply: `Aqui está a sequência oficial de prompts virais contra "${message}", com maquete colossal no gancho (60% do quadro), ingredientes da cozinha, preparo ao vivo na bancada com lip-sync e livro Casa Livre de Pragas (sem legendas nem textos na tela):`,
        script,
        action: 'script_generated'
      });
    }

    try {
      const { response } = await generateWithGeminiFallback(
        ai,
        `O usuário enviou a seguinte mensagem para o Agente Especialista em Receitas contra Insetos e Pragas:
"""${message}"""

Se a mensagem for uma saudação como "vamos começar?", responda com energia: "Qual é a praga ou inseto que você deseja afastar ou matar? Pode enviar também o vídeo ou as fotos de referência."
Se o usuário já tiver fornecido um inseto/praga ou tema (baratas, ratos, formigas, pernilongos, escorpiões, etc.), explique resumidamente como a fórmula caseira age biologicamente e estruture a proposta no padrão oficial da maquete colossal, preparo ao vivo com lip-sync e livro Casa Livre de Pragas (SEM legendas nem textos na tela).`,
        {
          systemInstruction: PRAGAS_INSETOS_SYSTEM_INSTRUCTION
        }
      );

      return res.json({
        reply: response.text,
        action: 'response'
      });
    } catch (chatError: any) {
      console.warn('[Chat Warning] Generating resilient response:', chatError?.message || chatError);
      const script = enforceZeroTextAndSubtitles(generateLocalScript(message));
      return res.json({
        reply: `Aqui está a sequência de prompts para afastar e eliminar "${message}", com maquete colossal, preparo ao vivo e livro Casa Livre de Pragas:`,
        script,
        action: 'script_generated'
      });
    }
  } catch (error: any) {
    console.warn('[Chat Handler] Safe error catch:', error?.message || error);
    const script = generateLocalScript(req.body?.message || 'Exterminar Baratas');
    return res.json({
      reply: 'Qual é o inseto ou praga que você deseja afastar hoje? Pode enviar também o vídeo ou as fotos de referência.',
      script,
      action: 'ask_theme'
    });
  }
};

// Endpoint to recommend dynamic & curated viral themes for pests and insects
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
      const prompt = `Gere exatamente 6 ideias inéditas de temas virais de alta retenção para vídeos curtos de receitas caseiras para AFASTAR E MATAR INSETOS E BICHOS (ratos, ratazanas, baratas, formigas, pernilongos/mosquitos da dengue, escorpiões, aranhas, moscas, pulgas, traças, cupins, etc.).
Evite repetir os seguintes temas já exibidos: ${exclude.slice(0, 15).join(', ')}.

Retorne estritamente um array JSON contendo 6 objetos com as seguintes chaves:
- "theme": título curto em português brasileiro da praga/receita (ex: "Exterminar Baratas francesinhas da cozinha", "Expulsar Ratos do forro sem veneno", "Acabar com Formigas no açucareiro").
- "model": descrição da maquete de infestação ocupando 60% da tela (ex: "Ralo de pia com ninho de baratas 60%", "Forro de teto com ratos roendo cabos 60%").
- "hookType": exatamente um dos seguintes: "curiosidade", "problema_visivel", "segredo", "descoberta".
- "tag": categoria em português (ex: "Baratas", "Ratos & Roedores", "Formigas", "Mosquitos & Dengue", "Escorpiões", "Moscas", "Pulgas", "Cupins").
- "solutionIngredients": ingredientes caseiros seguros e acessíveis (ex: "Bicarbonato de sódio + Açúcar refinado + Folhas de louro").
- "hookActionType": exatamente uma das seguintes ações: "spray_mist", "powder_dusting", "drain_flush", "bait_placement", "aromatic_barrier", "trap_capture", "ultrasonic_smoke".`;

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

const handleAnalyzeMaquete = async (req: any, res: any) => {
  const text = String(req.body?.text || '').trim();
  const theme = String(req.body?.theme || '').trim();
  const base = text || theme;

  if (!base) {
    return res.status(400).json({ error: 'Escreva a maquete/objeto gigante que você quer usar.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ result: base, resultEn: base, source: 'offline' });
  }

  const prompt = `Você é diretor de arte de vídeos virais no formato vertical 9:16.
O usuário quer uma MAQUETE / OBJETO GIGANTE específica para o GANCHO de um vídeo sobre pragas/insetos.
O que o usuário escreveu: "${base}"
Tema/praga do vídeo: "${theme || base}"
Transforme isso numa DESCRIÇÃO TÉCNICA DETALHADA E OBRIGATÓRIA de uma maquete colossal (ocupando de 55% a 65% do quadro 9:16, em primeiro plano extremo, hiper-realista), com a praga correta e materiais/cenário coerentes. Depois forneça o equivalente em inglês cinematográfico técnico.
Responda APENAS com um objeto JSON (sem markdown):
{"pt": "descrição detalhada em português", "en": "detailed technical English description"}`;

  try {
    const { response } = await generateWithGeminiFallback(ai, prompt, { responseMimeType: 'application/json' });
    const parsed = JSON.parse(response.text);
    const pt = String(parsed?.pt || base).trim();
    const en = String(parsed?.en || '').trim();
    return res.json({ result: pt, resultEn: en, source: 'ai' });
  } catch (err) {
    return res.json({ result: base, resultEn: '', source: 'fallback' });
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

  const action = String(req.body?.action || '');

  try {
    if (action === 'chat') {
      return await handleChat(req, res);
    }

    if (action === 'recommend-suggestions') {
      return await handleRecommend(req, res);
    }

    if (action === 'analyze-maquete') {
      return await handleAnalyzeMaquete(req, res);
    }

    return await handleGenerateScript(req, res);
  } catch (error: any) {
    console.error('Insetos agent error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Nao consegui processar agora. Tente novamente em alguns instantes.' });
    }
  }
}
