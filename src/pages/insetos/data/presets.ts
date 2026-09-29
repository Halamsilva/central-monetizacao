import { VideoScript, ThemeSuggestion } from '../types';

export const OFFICIAL_CHARACTER_SPEC = `Brazilian domestic pest-control and natural bio-defense specialist, approximately 48 to 52 years old, rugged and athletic build, broad capable shoulders, strong forearms with visible veins and working hands. Short salt-and-pepper hair neatly cropped on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, neatly groomed salt-and-pepper stubble / 3-day beard, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted dark-slate / olive-green utility work polo shirt with a subtle embroidered "BIO-DEFESA" chest patch on the left, sturdy dark work cargo pants, and a simple gold wedding band on his left ring finger. Confident, authoritative, pedagogical, friendly mentor demeanor.`;

export const OFFICIAL_SETTING_SPEC = `Authentic organized domestic workshop / pest-defense demonstration studio. The floor is clean industrial matte slate-gray tiles. In the background are sturdy reclaimed wooden shelves holding neatly labeled glass jars of dried bay leaves (folhas de louro), whole cloves, baking soda containers, white vinegar jugs, amber essential oil bottles, spray bottles, and hanging dried bundles of mint and eucalyptus. The center foreground features a solid, rustic light-wood demonstration workbench / kitchen counter with warm natural overhead lighting complemented by directional studio lamps.`;

export const NEGATIVE_TEXT_AND_SUBTITLES_BAN = `NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO typography, NO transcripts, NO lower thirds, NO banners, NO graphic titles, NO digital overlays, NO logos, NO watermarks, NO artificial UI labels. Pure raw cinematic video footage with ZERO text overlays, ZERO subtitles, and ZERO written words on screen. Spoken audio delivered purely via realistic on-camera lip synchronization without on-screen subtitles.`;

const RAW_PRESET_SCRIPTS: VideoScript[] = [
  {
    id: 'script-baratas-ralo',
    theme: 'Exterminar e Afastar Baratas Definitivamente com Bicarbonato, Açúcar e Folhas de Louro',
    summary: 'Demonstração de infestação severa de baratas em frestas e ralos com maquete COLOSSAL (60% da tela) e borrifação de choque no gancho 00:00, seguida da explicação biológica da praga, ingredientes de cozinha, preparo ao vivo na bancada em 2 partes, quantidades exatas e locais de aplicação, comprovação da casa livre de baratas e CTA do livro.',
    focalObject: 'Maquete educacional COLOSSAL em corte transversal de ralo e fresta de cozinha (60% do quadro 9:16) infestada com dezenas de baratas marrons hiper-realistas',
    targetProblem: 'Ninho oculto de baratas em frestas escuras e encanamento de esgoto se proliferando e contaminando a comida',
    elementsPrepared: 'Frasco borrifador spray resistente, tigela de cerâmica, colher de madeira, bicarbonato de sódio, açúcar refinado e folhas secas de louro trituradas',
    transformationType: 'Paralisia instantânea e eliminação em massa das baratas por reação no sistema digestivo sem veneno tóxico',
    bookTitleUsed: 'Casa Livre de Pragas',
    promptCount: 8,
    includeCTA: true,
    totalDurationSeconds: 64,
    createdAt: new Date().toISOString(),
    prompts: [
      {
        id: 1,
        stepName: 'PROMPT 1 — GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL — 8s',
        durationSeconds: 8,
        timeRange: '00:00 - 00:08',
        focalObject: 'Colossal cutaway educational demonstration model of a dark kitchen wall crevice and infested drainage pipe (occupying 60% of vertical 9:16 frame) teeming with hyper-realistic brown cockroaches',
        actionSummary: 'Especialista em bio-defesa já começa no segundo 00:00 debruçado sobre a maquete colossal, disparando uma névoa contínua de spray bioativo caseiro direto sobre o ninho de baratas, fazendo-as debandar em pânico e capotar de costas.',
        spokenLinePt: 'Quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês. Olha o que acontece quando borrifa isso aqui!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

Extreme foreground macro close-up featuring a COLOSSAL educational demonstration model of an infested kitchen wall crevice and dark drainage pipe cross-section, occupying 60% of the entire lower vertical 9:16 frame directly against the camera lens. The massive demonstration model exhibits hyper-realistic detail: moist textured drain crevices, greasy kitchen grime, and dozens of ultra-detailed brown domestic cockroaches (periplaneta americana) with glistening exoskeletons, twitching antennae, and spiny legs crawling inside.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Positioned immediately behind the rustic wooden demonstration workbench, leaning forward aggressively toward the camera lens with an intense, magnetic, authoritative expression.

HUMAN SKIN PRIORITY: Genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression lines, nasolabial folds, natural skin texture, vellus facial hairs, arm hairs, arm veins slightly engorged. Subtle natural sheen on forehead and nose bridge; cheeks comparatively matte. Restrained realistic subsurface scattering under natural workshop daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. In his right hand he firmly grips an ergonomic dark trigger spray bottle, pumping a forceful, continuous aerosol mist directly onto the cluster of cockroaches at second 00:00. Simple gold wedding band on his left ring finger resting firmly against the wooden bench.

ACTION: The video opens already in explosive physical action at 00:00 with zero preamble. As the fine white bioactive mist strikes the cockroaches, they violently scatter, lose traction on the slick pipe, curl their legs, and flip onto their backs in frantic paralysis. The presenter speaks with piercing conviction directly into the camera lens, eyes wide and communicative. Natural irregular blinking, realistic breathing, micro-expressions.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês. Olha o que acontece quando borrifa isso aqui!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 2,
        stepName: 'PROMPT 2 — EXPLICAÇÃO DO PROBLEMA (ONDE ELAS SE ESCONDEM E POR QUE O VENENO FALHA) — 8s',
        durationSeconds: 8,
        timeRange: '00:08 - 00:16',
        focalObject: 'Colossal cutaway pipe model showing hidden egg cases (ootheca), greasy pheromone trails, and cockroach respiratory spiracles',
        actionSummary: 'Especialista aponta com o dedo indicador para os ovos e frestas profundas da maquete colossal, explicando como o veneno de mercado só mata as que estão fora enquanto o ninho continua multiplicando centenas de ovos.',
        spokenLinePt: 'O veneno aerosol comum só faz elas correrem para trás dos móveis. O segredo é atingir o ninho e a digestão delas sem contaminar sua família.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens with crisp demonstration depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY:
• 00:08 - 00:11: The camera moves into an intense, sharp macro view of the colossal cutaway model, revealing dark clustered cockroach egg cases (ootheca) wedged deep inside the porous concrete pipe. The presenter's left hand (with gold wedding band) points an anatomical pointer probe directly into the hidden breeding chamber.
• 00:11 - 00:14: The presenter looks straight into the camera lens with grave pedagogical authority, speaking with precise lip synchronization in Portuguese, explaining how chemical sprays merely irritate the pests without neutralizing the subterranean colony.
• 00:14 - 00:16: He gestures toward the greasy chemical pheromone trails on the wood, emphasizing how natural biological attractants turn the pests' own biology against them.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Standing behind the bench in the workshop, delivering the biological pest breakdown with passionate conviction.

HUMAN SKIN PRIORITY: Visible irregular pores, forehead expression creases, realistic tan skin, pronounced vascularity in forearms. NO beauty filter, NO plastic CGI smoothing.

HANDS: Five fingers per hand, natural skin folds, gold wedding band on left ring finger. Right hand gestures authoritatively; left hand holds the demonstration pointer.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O veneno aerosol comum só faz elas correrem para trás dos móveis. O segredo é atingir o ninho e a digestão delas sem contaminar sua família."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 3,
        stepName: 'PROMPT 3 — INGREDIENTES CASEIROS DA RECEITA NA BANCADA — 8s',
        durationSeconds: 8,
        timeRange: '00:16 - 00:24',
        focalObject: 'Colossal model in background alongside neat glass bowls of culinary baking soda, fine sugar, and dried fragrant bay leaves',
        actionSummary: 'Especialista mostra e cita na bancada os três ingredientes simples da cozinha: bicarbonato de sódio culinário puro, açúcar refinado que atrai pelo olfato e folhas secas de louro aromáticas.',
        spokenLinePt: 'Você só vai precisar desses três ingredientes da sua cozinha: bicarbonato de sódio, açúcar refinado e folhas secas de louro.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

PHYSICAL CONTINUITY: The colossal educational model remains in the foreground on the wooden bench, exactly as shown in Prompt 2.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the solid rustic wood workbench in front of the presenter are three transparent glass vessels displaying the real homemade ingredients:
1. A small clear glass bowl filled with ultra-fine, chalky-white pure baking soda (sodium bicarbonate).
2. A matching glass bowl filled with glistening white granulated sugar.
3. A rustic wooden dish piled with crisp, whole, fragrant dried bay leaves (folhas de louro).

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He stands behind the wooden workbench, gesturing warmly toward each natural kitchen ingredient.

HUMAN SKIN PRIORITY: Natural pores, realistic stubble, masculine weathered skin, visible forearm vascularity. NO CGI smoothing.

HANDS: Exactly five fingers per hand, gold wedding band on left ring finger. His right hand holds up the glass bowl of white baking soda powder; his left hand lifts a whole dried bay leaf, snapping it gently to release aroma.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Você só vai precisar desses três ingredientes da sua cozinha: bicarbonato de sódio, açúcar refinado e folhas secas de louro."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 4,
        stepName: 'PROMPT 4 — PREPARO PARTE 1: BASE & MISTURA ATIVA COM LIP-SYNC AO VIVO — 8s',
        durationSeconds: 8,
        timeRange: '00:24 - 00:32',
        focalObject: 'Rustic glazed ceramic mortar and wooden pestle on the workbench with white powder blend, colossal model in background',
        actionSummary: 'Especialista inicia o preparo da isca mortal na tigela cerâmica: adiciona o açúcar e o bicarbonato em proporções iguais, misturando vigorosamente enquanto fala olhando nos olhos do espectador.',
        spokenLinePt: 'Primeiro, mistura o açúcar com o bicarbonato na mesma medida. O açúcar atrai as baratas e o bicarbonato reage no estômago delas.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with focus locked on the ceramic mixing vessel and presenter.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

OBJECT CONTINUITY IN PREPARATION (CRITICAL REQUIREMENT):
In the center foreground rests a wide, heavy rustic dark-glazed ceramic mixing bowl with a rounded wooden spoon, placed securely on the solid light-wood bench. THIS EXACT SAME CERAMIC BOWL MUST REMAIN IN PROMPT 5.

WHAT HAPPENS VISUALLY (ANTI-VOICEOVER LIP-SYNC PREPARATION):
• 00:24 - 00:27: The presenter pours equal portions of fine white granulated sugar and pure sodium bicarbonate into the dark ceramic bowl. The powders form a dual white mound.
• 00:27 - 00:30: Without stopping his fluid stirring motion with the wooden spoon, he looks up directly into the camera lens with warm authoritative discipline, delivering his line with perfect Brazilian Portuguese lip-sync.
• 00:30 - 00:32: He taps the spoon against the bowl rim, showing the homogeneous blend that disguises the active agent completely.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Stirring with steady wrist precision behind the bench in the workshop. Gold wedding band visible on his left hand resting on the counter.

HUMAN SKIN PRIORITY: Visible skin pores, muscular forearm engaged, realistic hair follicles. NO wax skin, NO CGI.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Primeiro, mistura o açúcar com o bicarbonato na mesma medida. O açúcar atrai as baratas e o bicarbonato reage no estômago delas."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 5,
        stepName: 'PROMPT 5 — PREPARO PARTE 2: ADIÇÃO DAS FOLHAS DE LOURO & POTENCIALIZAÇÃO — 8s',
        durationSeconds: 8,
        timeRange: '00:32 - 00:40',
        focalObject: 'Identical dark-glazed ceramic bowl from Prompt 4 receiving crushed fragrant bay leaves and droplets of water to form bait paste',
        actionSummary: 'Continuidade exata na mesma tigela: especialista esfarela as folhas secas de louro com os dedos soltando aroma repelente e adiciona umas gotinhas de água, homogeneizando pequenas bolinhas atrativas.',
        spokenLinePt: 'Agora tritura o louro bem fino e joga junto. O louro tem eugenol que desorienta o olfato delas e faz elas engolirem a mistura na hora.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with macro clarity on bowl continuity.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

STRICT BOWL & SCENE CONTINUITY (CRITICAL MANDATE):
The camera framing maintains absolute continuity from Prompt 4: the EXACT SAME dark-glazed ceramic mixing bowl sits in the exact same spot on the wooden bench. The blended powder prepared in Prompt 4 is inside.

WHAT HAPPENS VISUALLY (LIVE-ACTION PREPARATION CONTINUATION):
• 00:32 - 00:35: The presenter's left hand (with gold wedding band) holds dry bay leaves, crumbling them between his muscular thumb and forefinger directly over the powder, releasing crisp aromatic green flakes.
• 00:35 - 00:38: His right hand gently sprinkles a few droplets of water from a small beaker, turning the powder into a moldable, aromatic bait paste.
• 00:38 - 00:40: He lifts a small teaspoon displaying a neat pea-sized ball of the finished bait toward the lens, speaking with authentic pride and direct eye contact.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Delivering speech live on-camera with synchronized lip movement.

HUMAN SKIN PRIORITY: Irregular pores, natural micro-blemishes, muscular forearms with veins. NO filters.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Agora tritura o louro bem fino e joga junto. O louro tem eugenol que desorienta o olfato delas e faz elas engolirem a mistura na hora."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 6,
        stepName: 'PROMPT 6 — QUANTIDADE DE INGREDIENTES E MODO DE APLICAÇÃO NOS RALOS — 8s',
        durationSeconds: 8,
        timeRange: '00:40 - 00:48',
        focalObject: 'Pequenas tampinhas de garrafa plástica com as porções de isca e frasco dosador com vinagre ao lado na bancada',
        actionSummary: 'Especialista fala diretamente na câmera com lip-sync detalhando as medidas exatas (duas colheres de açúcar, duas de bicarbonato e três folhas de louro) e ensina a posicionar em tampinhas atrás da geladeira e no ralo.',
        spokenLinePt: 'Anota a medida: duas colheres de sopa de bicarbonato, duas de açúcar e três folhas de louro. Coloca em tampinhas atrás da geladeira e perto dos ralos.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (MEASUREMENTS & APPLICATION PROTOCOL):
• 00:40 - 00:43: Presenter speaks directly to the camera with organic lip-sync, gesturing with his hands to explain the precise measurements: two tablespoons of baking soda, two tablespoons of refined sugar, and three crumbled bay leaves.
• 00:43 - 00:46: He shows how to place small portions inside shallow bottle caps, holding up two fingers to instruct placing them in strategic dark choke-points: behind the refrigerator and near floor drains.
• 00:46 - 00:48: He locks eyes with the camera with encouraging paternal confidence, showing that this clean home protocol protects the house 24 hours a day without dangerous poisons.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Delivering speech live on-camera with synchronized lip movement and authentic gestures.

HUMAN SKIN PRIORITY: Visible biological pores, authentic weathered tan skin, muscular neck and shoulders, veins in forearms. NO beauty filters.

HANDS: Exactly five fingers per hand, natural skin folds, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Anota a medida: duas colheres de sopa de bicarbonato, duas de açúcar e três folhas de louro. Coloca em tampinhas atrás da geladeira e perto dos ralos."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 7,
        stepName: 'PROMPT 7 — COMPROVAÇÃO PRÁTICA & CASA TOTALMENTE LIVRE DE BARATAS — 8s',
        durationSeconds: 8,
        timeRange: '00:48 - 00:56',
        focalObject: 'Bancada limpa e reluzente, maquete do ralo agora sem nenhuma barata, mostrando ambiente seguro e desinfestado',
        actionSummary: 'Especialista mostra a bancada limpa e a maquete do ralo agora totalmente vazia e limpa, relata o resultado de zero baratas em poucas horas e a segurança para crianças e animais de estimação.',
        spokenLinePt: 'Em vinte e quatro horas o ninho inteiro desaparece. Sua casa fica livre de baratas sem cheiro forte e sem risco pros seus filhos e cachorros.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (RESULTS TESTIMONIAL):
• 00:48 - 00:51: The presenter gestures toward the demonstration model on the bench, which is now completely cleared, gleaming, and devoid of any live cockroaches.
• 00:51 - 00:54: He places his open hand on the clean wooden counter, smiling with refreshing relief and total assurance.
• 00:54 - 00:56: He looks into the camera lens with warm, authentic specialist presence, nodding with certainty as he delivers the testimonial of a spotless, protected household.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Warm smile lines, direct charismatic eye contact, olive-green utility polo, gold wedding band on left hand.

HUMAN SKIN PRIORITY: Visible biological pores, authentic weathered tan skin, muscular neck and shoulders. NO CGI.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Em vinte e quatro horas o ninho inteiro desaparece. Sua casa fica livre de baratas sem cheiro forte e sem risco pros seus filhos e cachorros."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 8,
        stepName: 'PROMPT 8 — APRESENTAÇÃO DO LIVRO "CASA LIVRE DE PRAGAS" & CTA — 8s',
        durationSeconds: 8,
        timeRange: '00:56 - 01:04',
        focalObject: 'Livro físico publicado "CASA LIVRE DE PRAGAS - 100 RECEITAS INFALÍVEIS" segurado com as duas mãos pelo apresentador',
        actionSummary: 'Especialista segura com as duas mãos o livro físico "CASA LIVRE DE PRAGAS", exibe a capa nítida para a câmera e entrega o CTA direto para o público comentar EU QUERO.',
        spokenLinePt: 'Essa e mais de cem receitas caseiras para eliminar baratas de vez e proteger sua casa estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 35mm portrait lens with cinematic workshop depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (BOOK CTA CLIMAX):
• 00:56 - 00:59: The presenter picks up a premium, substantial, physical published hardcover book titled "CASA LIVRE DE PRAGAS" from the workbench, holding it firmly with BOTH hands at chest height. The book cover is rich forest-green and gold with embossed typography and an emblem of a protected house.
• 00:59 - 01:02: He presents the book directly toward the camera lens at a 15-degree angle, showing the solid spine and quality paper edges. His left hand with the gold wedding band grips the left spine; his right muscular hand holds the right edge.
• 01:02 - 01:04: He locks magnetic, friendly, authoritative eye contact with the viewer, nodding with conviction, pointing a finger downwards towards the comment section as he concludes his CTA.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Holding the book firmly with both hands, charismatic smile, confident mentor posture.

HUMAN SKIN PRIORITY: Authentic skin texture, visible pores, natural tan, vascular forearms. NO beauty smoothing.

HANDS: Exactly five fingers per hand, firm natural grip on the hardcover book, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Essa e mais de cem receitas caseiras para eliminar baratas de vez e proteger sua casa estão no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      }
    ]
  },
  {
    id: 'script-ratos-repelente',
    theme: 'Expulsar Ratos e Ratazanas sem Veneno com Hortelã-Pimenta, Cravo e Vinagre de Álcool',
    summary: 'Demonstração em maquete COLOSSAL de forro e fiação roída por ratos (60% da tela) com reação sensorial de fuga imediata no gancho 00:00, explicação biológica do olfato sensível do roedor, ingredientes bioativos, preparo em 2 partes, dosagem e locais estratégicos de aplicação, comprovação prática e CTA do livro.',
    focalObject: 'Maquete COLOSSAL em corte transversal de forro de teto e tubulação (60% do quadro 9:16) com roedor realista roendo cabos e marcas de infestação',
    targetProblem: 'Ratos e camundongos invadindo forros, fiações e despensas transmitindo doenças e roendo estruturas',
    elementsPrepared: 'Frasco de vidro âmbar com óleo essencial de hortelã-pimenta pura, pacote de cravos-da-índia, garrafa de vinagre branco e borrifador profissional',
    transformationType: 'Repulsão sensorial extrema atacando o olfato hiper-sensível dos ratos, forçando fuga imediata sem carcaças podres na casa',
    bookTitleUsed: 'Casa Livre de Pragas',
    promptCount: 8,
    includeCTA: true,
    totalDurationSeconds: 64,
    createdAt: new Date().toISOString(),
    prompts: [
      {
        id: 1,
        stepName: 'PROMPT 1 — GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL — 8s',
        durationSeconds: 8,
        timeRange: '00:00 - 00:08',
        focalObject: 'Colossal educational cutaway demonstration model of an attic ceiling floor and gnawed electrical cables (occupying 60% of vertical 9:16 frame) with a hyper-realistic brown rat',
        actionSummary: 'Especialista em bio-defesa já começa no segundo 00:00 disparando um spray concentrado de essência bioativa direto no canal da maquete colossal, fazendo o rato recuar em disparada e fugir do forro.',
        spokenLinePt: 'Nunca use veneno que faz o rato apodrecer dentro da sua parede. Olha como esse cheiro caseiro expulsa qualquer rato em segundos!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

Extreme foreground macro close-up featuring a COLOSSAL educational demonstration model representing a dark attic floor and gnawed electrical conduits, occupying 60% of the entire lower vertical 9:16 frame directly against the camera lens. Inside the cutaway structure is a hyper-realistic demonstration brown rat (rattus norvegicus) with coarse fur, twitching pink whiskers, and alert dark bead eyes sniffing around gnawed wires.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Positioned immediately behind the solid light-wood demonstration workbench, leaning forward toward the camera with an intense, magnetic, urgent facial expression.

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression creases, nasolabial folds, natural skin texture, vellus facial hairs, arm veins bulging with vascularity. Subtle natural sheen on forehead; cheeks comparatively matte. Restrained realistic subsurface scattering under workshop lighting. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. In his right hand he pumps a high-output spray dispenser, releasing a dense, fine aromatic vapor directly toward the attic entry hole at second 00:00. Simple gold wedding band on his left ring finger resting on the bench.

ACTION: The video opens already in explosive motion at 00:00 with zero delay. As the concentrated aromatic mist expands into the pipe, the rat twitches violently in sensory distress, rubs its snout frantically, turns around, and scrambles in rapid retreat away through the opening. The presenter leans in close behind the colossal model, locking piercing eye contact with the camera lens, delivering the opening hook with urgency. Natural blinking, micro-expressions, subtle breathing.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Nunca use veneno que faz o rato apodrecer dentro da sua parede. Olha como esse cheiro caseiro expulsa qualquer rato em segundos!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 2,
        stepName: 'PROMPT 2 — EXPLICAÇÃO DO PROBLEMA (O OLFATO DOS ROEDORES E O PERIGO DO VENENO) — 8s',
        durationSeconds: 8,
        timeRange: '00:08 - 00:16',
        focalObject: 'Colossal cutaway rat model showing nasal olfactory bulb, sensory whiskers, and territorial scent markers',
        actionSummary: 'Especialista aponta para a anatomia sensorial do roedor na maquete colossal, explicando que o olfato do rato é 200 vezes mais sensível que o humano e que usar veneno faz o rato morrer podre dentro do forro.',
        spokenLinePt: 'O olfato do rato é duzentas vezes mais potente que o nosso. O veneno comum faz ele morrer podre dentro do gesso com cheiro insuportável.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens with crisp demonstration depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY:
• 00:08 - 00:11: The camera pushes closer into the colossal demonstration model, showing an illuminated cross-section of a rodent's hypersensitive nasal cavity and sensory whiskers. The presenter's left hand (with gold wedding band) points an anatomical probe to the olfactory nerves.
• 00:11 - 00:14: The presenter looks straight into the camera lens with intense disciplinary focus, speaking with precise Portuguese lip-sync about why commercial anticoagulant rodenticides create biohazard rotting odors in attics.
• 00:14 - 00:16: He traces the pheromone scent paths along the wooden model, demonstrating how rats follow invisible chemical trails that can be completely scrambled naturally.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Standing behind the wooden bench in the workshop, delivering the pest behavior breakdown with gravitas.

HUMAN SKIN PRIORITY: Visible irregular pores, forehead lines, authentic tan, muscular forearms. NO beauty smoothing.

HANDS: Exactly five fingers per hand, natural skin folds, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O olfato do rato é duzentas vezes mais potente que o nosso. O veneno comum faz ele morrer podre dentro do gesso com cheiro insuportável."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 3,
        stepName: 'PROMPT 3 — INGREDIENTES CASEIROS REPELENTES NA BANCADA — 8s',
        durationSeconds: 8,
        timeRange: '00:16 - 00:24',
        focalObject: 'Colossal attic model in midground alongside pure peppermint essential oil, whole cloves, and distilled white vinegar',
        actionSummary: 'Especialista mostra e cita na bancada os três bioativos repelentes: óleo essencial puro de hortelã-pimenta, cravos-da-índia ricos em eugenol e vinagre de álcool branco.',
        spokenLinePt: 'Para criar uma barreira impenetrável que nenhum rato aguenta, você só precisa de: óleo de hortelã-pimenta, cravo-da-índia e vinagre de álcool.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

PHYSICAL CONTINUITY: The colossal educational demonstration model remains in the foreground on the wooden bench, with gnawed wires preserved in exact detail.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the solid light-wood workbench in front of the presenter are three transparent glass vessels displaying the real homemade ingredients:
1. A small amber glass dropper bottle containing concentrated dark green peppermint essential oil (óleo de hortelã-pimenta).
2. A rustic clear glass bowl filled with fragrant whole dried cloves (cravos-da-índia).
3. A 1-liter clear glass jug of pure distilled white alcohol vinegar.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He stands behind the wooden workbench, gesturing toward each kitchen ingredient with authority.

HUMAN SKIN PRIORITY: Natural biological pores, realistic stubble, masculine weathered skin, visible forearm vascularity. NO CGI smoothing.

HANDS: Five fingers per hand, gold wedding band on left ring finger. Right hand lifts the amber peppermint dropper; left hand holds up the glass jug of white vinegar.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Para criar uma barreira impenetrável que nenhum rato aguenta, você só precisa de: óleo de hortelã-pimenta, cravo-da-índia e vinagre de álcool."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 4,
        stepName: 'PROMPT 4 — PREPARO PARTE 1: BASE DE INFUSÃO COM CRAVO E VINAGRE — 8s',
        durationSeconds: 8,
        timeRange: '00:24 - 00:32',
        focalObject: 'Wide-mouth clear glass infusion jar with measuring markings on portable wooden bench, colossal model in background',
        actionSummary: 'Especialista inicia o preparo da fórmula repelente: coloca 300ml de vinagre branco no frasco de vidro e joga um punhado de cravos-da-índia, mexendo com bastão de vidro enquanto fala olhando na câmera.',
        spokenLinePt: 'Você começa colocando trezentos ml de vinagre de álcool no frasco e adiciona uma colher cheia de cravo pra extrair o eugenol.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with focus locked on the glass mixing jar and presenter.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

OBJECT CONTINUITY IN PREPARATION (CRITICAL REQUIREMENT):
In the center foreground rests a wide-mouth clear 500ml glass infusion jar with embossed measurement lines, placed securely on the solid workbench. THIS EXACT SAME GLASS JAR MUST REMAIN IN PROMPT 5.

WHAT HAPPENS VISUALLY (ANTI-VOICEOVER LIP-SYNC PREPARATION):
• 00:24 - 00:27: The presenter pours clear distilled white vinegar into the glass infusion jar up to the 300ml mark, watching light bubbles settle.
• 00:27 - 00:30: Holding a handful of whole dark cloves with his left hand, he sprinkles them into the vinegar; they float and swirl in the acidic liquid.
• 00:30 - 00:32: With his right hand he swirls a glass stirring rod, looking up directly into the camera lens with confident charismatic presence and perfect Portuguese lip-sync.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Stirring with athletic composure behind the workbench. Gold wedding band visible on left hand resting on the bench.

HUMAN SKIN PRIORITY: Visible skin pores, muscular arm contours, natural forehead lines. NO CGI smoothing.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Você começa colocando trezentos ml de vinagre de álcool no frasco e adiciona uma colher cheia de cravo pra extrair o eugenol."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 5,
        stepName: 'PROMPT 5 — PREPARO PARTE 2: ADIÇÃO DO ÓLEO DE HORTELÃ E ENVASE NO BORRIFADOR — 8s',
        durationSeconds: 8,
        timeRange: '00:32 - 00:40',
        focalObject: 'Identical glass jar from Prompt 4 receiving drops of pure peppermint oil, then transferred with funnel into heavy-duty spray bottle',
        actionSummary: 'Continuidade exata no mesmo frasco: especialista pinga 20 gotas concentradas do óleo de hortelã-pimenta, mistura até homogeneizar e transfere para o borrifador com funil de inox.',
        spokenLinePt: 'Agora você pinga vinte gotas do óleo concentrado de hortelã-pimenta. Mexe bem e transfere direto pro borrifador.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with macro clarity on bottle continuity.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

STRICT JAR & SCENE CONTINUITY (CRITICAL MANDATE):
The camera framing maintains absolute continuity from Prompt 4: the EXACT SAME glass infusion jar with vinegar and cloves sits in the exact same spot on the wooden bench.

WHAT HAPPENS VISUALLY (LIVE-ACTION PREPARATION CONTINUATION):
• 00:32 - 00:35: The presenter's left hand (with gold wedding band) holds the amber dropper, releasing twenty rich emerald-tinted drops of pure peppermint oil into the vinegar solution.
• 00:35 - 00:38: He swirls the glass jar briskly; micro-droplets of essential oil emulsify in the vinegar, turning the liquid slightly opalescent with fresh volatile vapor.
• 00:38 - 00:40: Using a sleek stainless steel funnel, he pours the fragrant active solution into a professional matte-black spray bottle, locking confident eye contact while delivering the line.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Synchronized Portuguese lip-sync on-camera, master technician presence.

HUMAN SKIN PRIORITY: Irregular pores, natural micro-blemishes, muscular forearms with veins. NO filters.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Agora você pinga vinte gotas do óleo concentrado de hortelã-pimenta. Mexe bem e transfere direto pro borrifador."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 6,
        stepName: 'PROMPT 6 — QUANTIDADE DE INGREDIENTES E PONTOS ESTRATÉGICOS DE BORRIFAÇÃO — 8s',
        durationSeconds: 8,
        timeRange: '00:40 - 00:48',
        focalObject: 'Frasco borrifador preto na bancada ao lado de bolas de algodão embebidas na solução aromática',
        actionSummary: 'Especialista fala diretamente na câmera com lip-sync detalhando as doses (300ml de vinagre, 1 colher de cravo e 20 gotas de hortelã) e ensina a embeber bolas de algodão para colocar no forro e borrifar rodapés.',
        spokenLinePt: 'A receita exata é trezentos ml de vinagre, uma colher de cravo e vinte gotas de hortelã. Borrifa nos rodapés e põe algodão embebido no forro.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (INGREDIENT QUANTITY & PREPARATION PROTOCOL):
• 00:40 - 00:43: Presenter speaks directly into the camera lens with organic Brazilian Portuguese lip-sync, gesturing with muscular hands as he details the exact quantities: 300ml of white vinegar, one tablespoon of whole cloves, and twenty drops of pure peppermint oil.
• 00:43 - 00:46: He demonstrates soaking white cotton balls in the solution, holding them up to explain placing them directly inside ceiling hatches, crawlspaces, and behind kitchen stoves.
• 00:46 - 00:48: He nods with unwavering authority and reassuring warmth, indicating the repellent barrier is immediately active upon application.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Charismatic, direct eye contact, olive-green utility polo shirt, gold wedding band on left hand.

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, cheeks, arms, authentic skin folds. NO CGI.

HANDS: Exactly five fingers per hand, correct adult human anatomy, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"A receita exata é trezentos ml de vinagre, uma colher de cravo e vinte gotas de hortelã. Borrifa nos rodapés e põe algodão embebido no forro."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 7,
        stepName: 'PROMPT 7 — COMPROVAÇÃO PRÁTICA: CASA BLINDADA E LIVRE DE ROEDORES — 8s',
        durationSeconds: 8,
        timeRange: '00:48 - 00:56',
        focalObject: 'Forro limpo e sem vestígios de roedores na maquete colossal, especialista respirando aroma refrescante de hortelã',
        actionSummary: 'Especialista mostra a maquete do forro agora 100% desocupada e intacta, respira fundo o aroma agradável de menta e cravo e relata que os ratos fogem para bem longe da casa.',
        spokenLinePt: 'O cheiro pra nós é uma delícia refrescante de menta, mas para os ratos é insuportável. Eles fogem para o terreno baldio e não voltam nunca mais.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (PEST-FREE PROOF TESTIMONIAL):
• 00:48 - 00:51: The presenter breathes in deeply through his nose, smiling with refreshing vigor as he appreciates the pleasant, minty freshness of the non-toxic remedy.
• 00:51 - 00:54: He gestures with his left hand (gold wedding band visible) toward the colossal demonstration attic model on the bench, where the entry tunnels are empty and completely abandoned by rodents.
• 00:54 - 00:56: He looks into the camera lens with authentic warmth and authority, nodding firmly as he delivers the testimonial of total home protection without rotting corpses.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Warm smile lines, charismatic eye contact, olive-green utility polo, gold wedding band on left hand.

HUMAN SKIN PRIORITY: Visible biological pores, authentic weathered tan skin, muscular neck and shoulders. NO CGI.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O cheiro pra nós é uma delícia refrescante de menta, mas para os ratos é insuportável. Eles fogem para o terreno baldio e não voltam nunca mais."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 8,
        stepName: 'PROMPT 8 — APRESENTAÇÃO DO LIVRO "CASA LIVRE DE PRAGAS" & CTA — 8s',
        durationSeconds: 8,
        timeRange: '00:56 - 01:04',
        focalObject: 'Livro físico publicado "CASA LIVRE DE PRAGAS - 100 RECEITAS INFALÍVEIS" segurado com as duas mãos pelo apresentador',
        actionSummary: 'Especialista segura com as duas mãos o livro físico "CASA LIVRE DE PRAGAS", exibe a capa nítida para a câmera e entrega o CTA direto convidando a comentar EU QUERO.',
        spokenLinePt: 'O guia definitivo para expulsar ratos e blindar sua casa contra roedores está no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 35mm portrait lens with cinematic workshop depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (BOOK CTA CLIMAX):
• 00:56 - 00:59: The presenter picks up a premium, substantial, physical published book titled "CASA LIVRE DE PRAGAS" from the workbench, holding it firmly with BOTH hands at chest height. The book cover is rich emerald-green and gold with embossed lettering and pest-defense botanical icons.
• 00:59 - 01:02: He presents the book directly toward the camera lens at a 15-degree angle, displaying the thick physical spine and clean trim. His left hand with the gold wedding band grips the left spine; his right hand holds the right edge.
• 01:02 - 01:04: He locks magnetic, authoritative, warm eye contact with the viewer, nodding with conviction, pointing a finger downward toward the comment section as he concludes his CTA.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Holding the book firmly with both hands, charismatic smile, confident workshop posture.

HUMAN SKIN PRIORITY: Authentic skin texture, visible pores, natural tan, vascular forearms. NO beauty smoothing.

HANDS: Exactly five fingers per hand, firm natural grip on the hardcover book, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O guia definitivo para expulsar ratos e blindar sua casa contra roedores está no meu livro Casa Livre de Pragas. Comenta EU QUERO aqui embaixo que te mando no privado!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      }
    ]
  },
  {
    id: 'script-formigas-rapido',
    theme: 'Acabar com Formigas na Cozinha com Canela, Café e Detergente Neutro',
    summary: 'Sequência rápida de 3 prompts (24s): gancho de choque com maquete colossal de formigueiro cortando a trilha com pó bioativo, prompt 2 entrando direto mostrando e citando os ingredientes na bancada e prompt 3 com preparo rápido e aplicação instantânea.',
    focalObject: 'Maquete COLOSSAL em corte transversal de bancada e açucareiro com trilha de formigas (60% do quadro 9:16)',
    targetProblem: 'Trilha invasiva de formigas no açucareiro e na bancada da pia se espalhando pela comida',
    elementsPrepared: 'Potes de vidro na bancada com canela em pó, borra de café seca, detergente neutro e frasco aplicador',
    transformationType: 'Paralisia olfativa imediata e dissolução do rastro de feromônios sem venenos químicos',
    promptCount: 3,
    includeCTA: false,
    totalDurationSeconds: 24,
    createdAt: new Date().toISOString(),
    prompts: [
      {
        id: 1,
        stepName: 'PROMPT 1 — GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL — 8s',
        durationSeconds: 8,
        timeRange: '00:00 - 00:08',
        focalObject: 'Colossal cutaway educational demonstration model of a kitchen counter and sugar bowl infested with realistic black ants (occupying 60% of vertical 9:16 frame)',
        actionSummary: 'Especialista começa no segundo 00:00 debruçado sobre a maquete colossal, polvilhando uma linha de bio-pó ativo direto sobre a trilha de formigas, fazendo-as dispersar desorientadas e cessar o avanço.',
        spokenLinePt: 'Se você tem formigas invadindo a pia ou o açúcar, olha como esse pó caseiro corta a trilha inteira no mesmo segundo!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

Extreme foreground macro close-up featuring a COLOSSAL educational demonstration model of an infested kitchen sugar jar and porous wood countertop cross-section, occupying 60% of the entire lower vertical 9:16 frame directly against the camera lens. Teeming inside are dozens of hyper-detailed black carpenter ants crawling along an oily pheromone trail.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Positioned immediately behind the rustic wooden demonstration workbench, leaning forward aggressively toward the camera lens with an intense, magnetic, authoritative expression.

HUMAN SKIN PRIORITY: Genuine biological surface complexity with visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression lines, nasolabial folds, natural skin texture, vellus facial hairs, arm hairs. NO beauty filter, NO skin smoothing, NO wax skin, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. In his right hand he shakes a small wooden scoop of active fragrant brown mineral powder, laying down a neat barrier line right over the ant trail at second 00:00. Gold wedding band visible on left ring finger resting on the counter.

ACTION: The video opens already in explosive tactile action at 00:00 with zero preamble. As the active powder settles, the ants instantly freeze, lose their chemical scent trail, scatter in total confusion, and turn around in disarray. The presenter leans into the lens, speaking with direct magnetic authority and natural lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Se você tem formigas invadindo a pia ou o açúcar, olha como esse pó caseiro corta a trilha inteira no mesmo segundo!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 2,
        stepName: 'PROMPT 2 — JÁ MOSTRANDO E FALANDO OS NOMES DOS INGREDIENTES CASEIROS NA BANCADA — 8s',
        durationSeconds: 8,
        timeRange: '00:08 - 00:16',
        focalObject: 'Colossal model in background alongside neat glass bowls of pure ground cinnamon, dried coffee grounds, and mild liquid dish soap',
        actionSummary: 'Sem perder tempo com explicações longas, o especialista entra direto mostrando na bancada e falando com lip-sync claro os nomes exatos de cada ingrediente: canela em pó pura, borra de café seca e detergente neutro.',
        spokenLinePt: 'Para fazer essa receita rápida você só vai precisar de três coisas da sua cozinha: canela em pó, borra de café seca e detergente neutro.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

DIRECT FAST ADAPTATION: The video cuts directly to the homemade ingredients on the workbench with zero delay.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the solid light-wood workbench in front of the presenter are three transparent glass containers showing the real kitchen ingredients:
1. A small clear glass bowl of fragrant, fine-milled pure cinnamon powder (canela em pó).
2. A matching glass dish filled with rich dark dried coffee grounds (borra de café seca).
3. A small transparent squeeze dispenser containing clear amber mild liquid soap.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He stands behind the wooden workbench, gesturing warmly toward each kitchen ingredient with authority and speed.

HUMAN SKIN PRIORITY: Natural pores, realistic stubble, masculine weathered skin, visible forearm vascularity. NO CGI smoothing.

HANDS: Exactly five fingers per hand, gold wedding band on left ring finger. Right hand lifts the glass dish of cinnamon powder; left hand points toward the coffee grounds and soap.

ACTION: Presenter immediately introduces and names each accessible kitchen ingredient on the bench with dynamic energy and perfect on-camera lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Para fazer essa receita rápida você só vai precisar de três coisas da sua cozinha: canela em pó, borra de café seca e detergente neutro."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 3,
        stepName: 'PROMPT 3 — PREPARO RÁPIDO & APLICAÇÃO IMEDIATA — 8s',
        durationSeconds: 8,
        timeRange: '00:16 - 00:24',
        focalObject: 'Ceramic bowl and applicator on the workbench where the ingredients are rapidly combined, shown active and ready for immediate application',
        actionSummary: 'Especialista executa o preparo rápido da receita ao vivo na bancada: mistura rapidamente a canela e o café com umas gotas de detergente, mostra a textura ativa pronta e ensina a aplicar de imediato nos rodapés e cantos.',
        spokenLinePt: 'Mistura uma colher de canela com uma de café e umas gotas de detergente. Coloca nos cantos da pia e nunca mais aparece uma formiga!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens at chest level.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (RAPID PREPARATION & IMMEDIATE APPLICATION):
• 00:16 - 00:19: Fast-paced live mixing. The presenter quickly spoons equal measures of cinnamon powder and dried coffee grounds into a shallow ceramic mixing bowl, adding two drops of detergent.
• 00:19 - 00:22: With quick, confident stirs using a wooden spoon, he blends the fragrant bioactive repellent, lifting a pinch to display the homogeneous active texture.
• 00:22 - 00:24: He gestures toward the corner of the counter and baseboards, locking reassuring eye contact with the viewer while delivering the line with flawless Portuguese lip-sync.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Delivering speech live on-camera with synchronized lip movement and authentic gestures.

HUMAN SKIN PRIORITY: Irregular biological pores across forehead, cheeks, arms, authentic skin folds, visible forearm veins. NO filters.

HANDS: Exactly five fingers per hand, correct adult human anatomy, gold wedding band on left ring finger. Fast, dexterous, tactile hand motions.

ACTION: Rapid, satisfying, tactile preparation. Presenter delivers dialogue with snappy, engaging lip-sync and direct eye contact, closing with an encouraging mentor smile.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mistura uma colher de canela com uma de café e umas gotas de detergente. Coloca nos cantos da pia e nunca mais aparece uma formiga!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      }
    ]
  },
  {
    id: 'script-baratas-rapido',
    theme: 'Eliminar Baratas no Ralo e Cozinha Rápido (3 Prompts)',
    summary: 'Demonstração rápida de choque em 3 etapas (24s): Gancho visceral com maquete colossal (60% da tela) no segundo 00:00, corte imediato para a bancada mostrando e citando os ingredientes caseiros (bicarbonato, açúcar e louro), seguido de preparo ágil e aplicação nos ralos.',
    focalObject: 'Maquete educacional COLOSSAL em corte transversal de ralo de esgoto e fresta úmida (60% do quadro 9:16) infestada com baratas marrons hiper-realistas',
    targetProblem: 'Ninho de baratas escondido em ralos de banheiro e frestas de armários se proliferando e contaminando a comida',
    elementsPrepared: 'Frasco borrifador spray resistente, tigela de cerâmica, colher de madeira, bicarbonato de sódio culinário, açúcar refinado e folhas secas de louro trituradas',
    transformationType: 'Paralisia instantânea e eliminação de baratas por atração biológica e digestão neutralizada sem veneno tóxico',
    bookTitleUsed: 'Casa Livre de Pragas',
    promptCount: 3,
    includeCTA: false,
    totalDurationSeconds: 24,
    createdAt: new Date().toISOString(),
    prompts: [
      {
        id: 1,
        stepName: 'PROMPT 1 — GANCHO CHOCANTE COM MAQUETE COLOSSAL & AÇÃO VISCERAL — 8s',
        durationSeconds: 8,
        timeRange: '00:00 - 00:08',
        focalObject: 'Colossal cutaway educational demonstration model of an infested bathroom floor drain and concrete pipe cross-section (occupying 60% of vertical 9:16 frame) teeming with hyper-realistic brown domestic cockroaches (periplaneta americana)',
        actionSummary: 'Especialista em bio-defesa já começa no segundo 00:00 debruçado sobre a maquete colossal, disparando uma névoa contínua de spray bioativo caseiro direto sobre o ninho de baratas, fazendo-as debandar em pânico e capotar de costas.',
        spokenLinePt: 'Se você tem baratas invadindo o ralo ou a cozinha, quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês. Olha o que acontece quando borrifa isso aqui!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, macro close-up with 20mm ultra-wide lens.
- A COLOSSAL educational demonstration model of an infested dark drain cross-section occupies 60% of the entire lower frame directly against the camera lens.
- Inside the porous concrete drain pipe, dozens of glistening brown domestic cockroaches (periplaneta americana) with twitching spiny legs and antennae crawl inside.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Positioned immediately behind the rustic wooden workbench, leaning forward aggressively into the lens with urgent, magnetic authority.

HUMAN SKIN PRIORITY: Visible biological skin pores across forehead, nose, cheeks, forearms, and hands. Natural expression lines, masculine salt-and-pepper stubble, arm veins. NO beauty filter, NO plastic CGI smoothing.

HANDS: Exactly five fingers per hand, correct adult human anatomy, gold wedding band on left ring finger. Right hand firmly pumps an ergonomic dark trigger spray bottle at second 00:00, releasing a fine white bioactive mist directly onto the cluster of cockroaches.

ACTION: The video opens already in explosive physical action at second 00:00 with zero preamble. As the fine mist strikes the cockroaches, they violently scatter, lose traction on the slick pipe, and flip onto their backs in frantic paralysis. Presenter delivers the hook line directly into the lens with piercing conviction and flawless Brazilian Portuguese lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Se você tem baratas invadindo o ralo ou a cozinha, quase ninguém te ensina isso porque as empresas de veneno querem que você gaste todo mês. Olha o que acontece quando borrifa isso aqui!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 2,
        stepName: 'PROMPT 2 — JÁ MOSTRANDO E FALANDO OS NOMES DOS INGREDIENTES CASEIROS NA BANCADA — 8s',
        durationSeconds: 8,
        timeRange: '00:08 - 00:16',
        focalObject: 'Colossal drain model in background alongside three neat clear glass bowls containing pure baking soda, white sugar, and dried aromatic bay leaves',
        actionSummary: 'Sem perder tempo com explicações longas, o especialista entra direto no segundo 00:08 mostrando na bancada e falando com lip-sync claro os nomes exatos de cada ingrediente: bicarbonato de sódio culinário, açúcar refinado e folhas secas de louro.',
        spokenLinePt: 'Para acabar com as baratas de vez você só vai precisar desses três ingredientes da sua cozinha: bicarbonato de sódio, açúcar refinado e folhas secas de louro.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

DIRECT FAST ADAPTATION: The video cuts directly to the homemade kitchen ingredients on the workbench with zero delay at second 00:08.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the solid rustic wood workbench in front of the presenter are three transparent glass containers showing the real kitchen ingredients:
1. A small clear glass bowl of ultra-fine, chalky-white pure culinary baking soda (sodium bicarbonate).
2. A matching glass bowl filled with glistening white granulated sugar.
3. A rustic wooden dish piled with crisp, whole, fragrant dried bay leaves.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He stands behind the wooden workbench, gesturing warmly toward each kitchen ingredient with authority, speed, and confidence.

HUMAN SKIN PRIORITY: Natural pores, realistic stubble, masculine weathered skin, visible forearm vascularity. NO CGI smoothing.

HANDS: Exactly five fingers per hand, gold wedding band on left ring finger. Right hand lifts the glass bowl of white baking soda powder; left hand gestures to the sugar and bay leaves.

ACTION: Presenter immediately introduces and names each accessible kitchen ingredient on the bench with dynamic energy and perfect on-camera lip synchronization.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Para acabar com as baratas de vez você só vai precisar desses três ingredientes da sua cozinha: bicarbonato de sódio, açúcar refinado e folhas secas de louro."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 3,
        stepName: 'PROMPT 3 — PREPARO RÁPIDO & APLICAÇÃO IMEDIATA — 8s',
        durationSeconds: 8,
        timeRange: '00:16 - 00:24',
        focalObject: 'Rustic ceramic bowl and wooden spoon on the workbench with the active white homemade blend ready for instant drain and crevice deployment',
        actionSummary: 'Especialista executa o preparo rápido da receita ao vivo na bancada: mistura rapidamente o bicarbonato com o açúcar e as folhas de louro trituradas, mostra a consistência ativa pronta e ensina a aplicar de imediato nos ralos e cantos.',
        spokenLinePt: 'Mistura o bicarbonato com o açúcar na mesma medida e o louro triturado. Coloca nos ralos e cantos e as baratas desaparecem em vinte e quatro horas!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens at chest level.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (RAPID PREPARATION & IMMEDIATE APPLICATION):
• 00:16 - 00:19: Fast-paced live mixing. The presenter quickly spoons equal measures of white baking soda and granulated sugar into a shallow ceramic mixing bowl, adding finely crushed dried bay leaves.
• 00:19 - 00:22: With quick, confident stirs using a wooden spoon, he blends the active dry bait mixture, lifting a spoonful to display the uniform active texture.
• 00:22 - 00:24: He gestures toward the floor drain and baseboards, locking reassuring eye contact with the viewer while delivering the line with flawless Brazilian Portuguese lip-sync.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Delivering speech live on-camera with synchronized lip movement and authentic gestures.

HUMAN SKIN PRIORITY: Irregular biological pores across forehead, cheeks, arms, authentic skin folds, visible forearm veins. NO filters.

HANDS: Exactly five fingers per hand, correct adult human anatomy, gold wedding band on left ring finger. Fast, dexterous, tactile hand motions.

ACTION: Rapid, satisfying, tactile preparation. Presenter delivers dialogue with snappy, engaging lip-sync and direct eye contact, closing with an encouraging mentor smile.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mistura o bicarbonato com o açúcar na mesma medida e o louro triturado. Coloca nos ralos e cantos e as baratas desaparecem em vinte e quatro horas!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      }
    ]
  }
];

export const PRESET_SCRIPTS: VideoScript[] = RAW_PRESET_SCRIPTS.map(script => ({
  ...script,
  prompts: script.prompts.map(p => ({
    ...p,
    promptText: p.promptText.includes('NEGATIVE PROMPT & ON-SCREEN TEXT BAN:')
      ? p.promptText
      : `${NEGATIVE_TEXT_AND_SUBTITLES_BAN}\n\n${p.promptText}`
  }))
}));

export const ALL_CURATED_THEME_SUGGESTIONS: ThemeSuggestion[] = [
  {
    theme: 'Exterminar Baratas de Esgoto e Cozinha definitivamente',
    model: 'Maquete de Ralo e Fresta de Azulejo 60% com Ninho de Baratas Marrons',
    hookType: 'problema_visivel',
    tag: 'Baratas',
    solutionIngredients: 'Bicarbonato de sódio + Açúcar refinado + Folhas de louro secas',
    hookActionType: 'spray_mist',
  },
  {
    theme: 'Expulsar Ratos e Ratazanas do Forro e Quintal sem veneno',
    model: 'Maquete de Forro de Teto e Tubulação 60% com Ratos Roendo Fiação Elétrica',
    hookType: 'segredo',
    tag: 'Ratos & Roedores',
    solutionIngredients: 'Óleo essencial de hortelã-pimenta + Cravos-da-índia + Vinagre de álcool branco',
    hookActionType: 'spray_mist',
  },
  {
    theme: 'Acabar com Formigas na Cozinha e no Açucareiro na raiz do ninho',
    model: 'Açucareiro e Bancada em Corte Transversal 60% com Trilha e Ninho Subterrâneo de Formigas',
    hookType: 'curiosidade',
    tag: 'Formigas',
    solutionIngredients: 'Canela em pó + Borra de café seca + Detergente líquido neutro',
    hookActionType: 'powder_dusting',
  },
  {
    theme: 'Repelente Caseiro Definitivo contra Pernilongos e Mosquito da Dengue',
    model: 'Quarto em Meia-Luz 60% com Nuvem Hiper-Realista de Pernilongos e Aedes aegypti',
    hookType: 'descoberta',
    tag: 'Mosquitos & Dengue',
    solutionIngredients: 'Limão fresco espetado com cravos-da-índia + Álcool 70% + Óleo de eucalipto',
    hookActionType: 'aromatic_barrier',
  },
  {
    theme: 'Barreira Infranqueável contra Escorpiões e Aranhas nos Ralos e Portas',
    model: 'Ralo de Banheiro e Soleira da Porta 60% com Escorpião Amarelo Espreitando na Fresta',
    hookType: 'problema_visivel',
    tag: 'Escorpiões & Aranhas',
    solutionIngredients: 'Essência concentrada de lavanda + Vinagre de álcool + Óleo de melaleuca (tea tree)',
    hookActionType: 'drain_flush',
  },
  {
    theme: 'Exterminar Moscas e Mosquitinhos de Banheiro e Fruta',
    model: 'Ralo Sifonado e Fruteira 60% com Larvas e Nuvens de Moscas Varejeiras e Mosquitinhos',
    hookType: 'curiosidade',
    tag: 'Moscas & Mosquitinhos',
    solutionIngredients: 'Vinagre de maçã morno + Detergente de prato + Açúcar mascavo',
    hookActionType: 'trap_capture',
  },
  {
    theme: 'Eliminar Pulgas e Carrapatos de Carpetes e Sofás sem intoxicar Pets',
    model: 'Corte Transversal de Fibras de Carpete e Estofado 60% com Pulgas e Ovos Microscópicos',
    hookType: 'segredo',
    tag: 'Pulgas & Carrapatos',
    solutionIngredients: 'Sal fino de cozinha + Bicarbonato de sódio + Chá forte de alecrim fresco',
    hookActionType: 'powder_dusting',
  },
  {
    theme: 'Blindar Guarda-Roupas e Livros contra Traças e Cupins de Madeira',
    model: 'Armário de Madeira Rústica 60% com Casulos de Traça e Galerias de Cupim na Gaveta',
    hookType: 'descoberta',
    tag: 'Traças & Cupins',
    solutionIngredients: 'Pimenta-do-reino em grãos + Cravos-da-índia + Óleo de cedro ou óleo de nim',
    hookActionType: 'bait_placement',
  },
  {
    theme: 'Afastar Lesmas e Caracóis da Horta e Jardim sem veneno químico',
    model: 'Canteiro de Hortaliças 60% com Lesmas Gigantes Devorando Folhas Úmidas à Noite',
    hookType: 'problema_visivel',
    tag: 'Horta & Jardim',
    solutionIngredients: 'Cinzas de madeira + Cascas de ovos secas trituradas + Isca atrativa de cerveja',
    hookActionType: 'powder_dusting',
  },
  {
    theme: 'Exterminar Percevejos de Colchão (Bed Bugs) e Ácaros na cama',
    model: 'Costura e Tecido de Colchão em Corte Macro 60% com Colônia de Percevejos Ocultos',
    hookType: 'segredo',
    tag: 'Percevejos & Ácaros',
    solutionIngredients: 'Álcool isopropílico 70% + Óleo essencial de cravo + Bicarbonato polvilhado',
    hookActionType: 'spray_mist',
  },
  {
    theme: 'Eliminar Lacraias e Centopeias Venenosas dos Ralos e Encanamentos',
    model: 'Cano de Esgoto e Caixa de Gordura 60% com Lacraia Gigante de Patas Laranjas Saindo do Ralo',
    hookType: 'problema_visivel',
    tag: 'Lacraias & Centopeias',
    solutionIngredients: 'Sal grosso marinho + Bicarbonato + Água fervente com vinagre concentrado',
    hookActionType: 'drain_flush',
  },
  {
    theme: 'Defumação Caseira para Expulsar Marimbondos e Vespas do Telhado',
    model: 'Beiral de Telhado com Casa de Marimbondo 60% em Madeira e Enxame Zumbindo',
    hookType: 'curiosidade',
    tag: 'Vespas & Marimbondos',
    solutionIngredients: 'Borra de café seca queimando lentamente com cascas de alho e folhas de louro',
    hookActionType: 'ultrasonic_smoke',
  }
];

export const QUICK_STARTER_THEMES: ThemeSuggestion[] = ALL_CURATED_THEME_SUGGESTIONS.slice(0, 6);

export function getRandomThemeSuggestions(count: number = 6, excludeThemes: string[] = []): ThemeSuggestion[] {
  const excludeSet = new Set(excludeThemes.map(t => t.toLowerCase().trim()));
  const available = ALL_CURATED_THEME_SUGGESTIONS.filter(item => !excludeSet.has(item.theme.toLowerCase().trim()));
  const pool = available.length >= count ? available : ALL_CURATED_THEME_SUGGESTIONS;
  
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
