import { VideoScript, ThemeSuggestion } from '../types';

export const OFFICIAL_CHARACTER_SPEC = `Brazilian veteran martial arts master, approximately 50 years old, highly athletic muscular fighter physique, broad powerful shoulders, thick developed chest, muscular arms with bulging vascularity and prominent forearm veins, authentic cauliflower ears (thickened cartilage deformity characteristic of veteran Brazilian Jiu-Jitsu and Judo fighters). Short salt-and-pepper hair closely cropped on the sides, masculine weathered Brazilian face with charismatic natural laugh lines, crow's feet, neatly groomed salt-and-pepper stubble, warm dark brown eyes, medium tan Brazilian skin. He wears a fitted HEATHER-GRAY short-sleeve athletic compression shirt / rashguard with bold black-and-white "BJJ" lettering printed on the left chest, black athletic training shorts, and a simple gold wedding band on his left ring finger.`;

export const OFFICIAL_SETTING_SPEC = `Authentic Brazilian Jiu-Jitsu (BJJ) martial arts dojo gym. Floor is covered with seamless light-gray puzzle/roll-out tatami mats. Lower section of back wall is lined with black/dark-gray protective tatami wall pads. Upper wall is off-white with high windows letting in bright natural daylight, plus warm ceiling gym lighting.
HANGING PROMINENTLY ON THE BACK WALL ARE THREE NATIONAL FLAGS SIDE BY SIDE IN EXACT ORDER:
1. Brazilian Flag (left, green and yellow with blue globe);
2. United States Flag (center, stars and stripes);
3. Israel Flag (right, white with blue stripes and Star of David).
Solid light-wood gym bench in foreground.`;

export const NEGATIVE_TEXT_AND_SUBTITLES_BAN = `NEGATIVE PROMPT & ON-SCREEN TEXT BAN: ABSOLUTELY NO on-screen text, NO subtitles, NO captions, NO closed captions, NO words written on screen, NO text overlays, NO floating text, NO typography, NO transcripts, NO lower thirds, NO banners, NO graphic titles, NO digital overlays, NO logos, NO watermarks, NO artificial UI labels. Pure raw cinematic video footage with ZERO text overlays, ZERO subtitles, and ZERO written words on screen. Spoken audio delivered purely via realistic on-camera lip synchronization without on-screen subtitles.`;

const RAW_PRESET_SCRIPTS: VideoScript[] = [
  {
    id: 'script-tartaro-dental',
    theme: 'Tártaro endurecido e placa bacteriana nos dentes',
    summary: 'Demonstração de tártaro severo com modelo COLOSSAL de arcada dentária (60% da tela) e raspagem mecânica imediata no gancho, seguida da explicação do problema, ingredientes, preparo em 2 partes na panela, quantidade e tempo de preparo, degustação e 2 prompts de CTA para venda do suplemento encapsulado.',
    focalObject: 'Modelo anatômico COLOSSAL de arcada dentária com dentes apodrecidos, cavidades escuras e tártaro calcificado (60% do quadro 9:16)',
    targetProblem: 'Dentes com cavidades pretas de cárie e crosta espessa marrom-amarelada de tártaro calcificado na base e entre os dentes',
    elementsPrepared: 'Raspador odontológico de aço inox, panela esmaltada pequena no fogareiro portátil do banco de madeira, ingredientes caseiros em potes de vidro, frasco de suplemento encapsulado',
    transformationType: 'Remoção mecânica e química com desprendimento de crosta e apresentação da fórmula concentrada em cápsulas',
    productTitleUsed: 'BioDent Própolis & Cálcio Caps',
    bookTitleUsed: 'BioDent Própolis & Cálcio Caps',
    createdAt: new Date().toISOString(),
    prompts: [
      {
        id: 1,
        stepName: 'PROMPT 1 — GANCHO + INÍCIO DA DEMONSTRAÇÃO — 8s',
        durationSeconds: 8,
        timeRange: '00:00 - 00:08',
        focalObject: 'Colossal anatomical dental model of human teeth and gumline (occupying 60% of 9:16 frame) with rotting cavities and thick calcified dark tartar',
        actionSummary: 'Mestre de BJJ já começa no segundo 00:00 debruçado sobre o modelo colossal na bancada do dojo, raspando com cureta de aço inox a crosta de tártaro, soltando lascas secas.',
        spokenLinePt: 'Quase ninguém te mostra isso quando o assunto é aquela crosta dura presa atrás dos seus dentes. Olha bem isso aqui.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 20mm ultra-wide lens with dramatic forced perspective.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

Extreme foreground macro close-up featuring a COLOSSAL educational anatomical model of human teeth and textured gums, occupying 60% of the lower vertical 9:16 frame directly against the camera lens. The massive educational teeth exhibit hyper-realistic, grotesque detail: yellowed stained enamel, dark black cavitated decay holes, and thick, rough, petrified yellowish-brown calcified dental calculus (tartar) packed along the gum margins and interdental crevices.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He is positioned immediately behind the solid light-wood gym bench, leaning forward aggressively toward the camera with an intense, urgent, magnetic facial expression.

HUMAN SKIN PRIORITY: Genuine biological surface complexity with visible irregular pores distributed across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression lines, nasolabial folds, natural skin texture, vellus facial hairs, arm hairs, arm veins bulging with realistic vascularity. Subtle natural sheen on forehead and nose bridge; cheeks comparatively matte. Restrained realistic subsurface scattering under natural daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. In his right hand he firmly grips a precision stainless steel dental curette scaler, angled at 45 degrees, scraping forcefully against the petrified tartar deposit on the giant central incisor at second 00:00. Deliberate physical force, vein definition in forearm. Simple gold wedding band on his left ring finger resting firmly against the wooden bench.

ACTION: The video opens already in explosive physical action at 00:00 with no preamble. The sharp stainless steel tip digs into the hardened calcified tartar crust of the giant teeth model, flaking off crisp, brittle, dry yellowish shards that snap free and bounce onto the wooden bench in the foreground. The presenter speaks with piercing conviction directly into the camera lens, eyes wide and communicative. Natural irregular blinking, realistic breathing, micro-expressions.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Quase ninguém te mostra isso quando o assunto é aquela crosta dura presa atrás dos seus dentes. Olha bem isso aqui."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 2,
        stepName: 'PROMPT 2 — EXPLICAÇÃO DO PROBLEMA (O QUE É O PROBLEMA) — 8s',
        durationSeconds: 8,
        timeRange: '00:08 - 00:16',
        focalObject: 'Colossal anatomical dental model showing internal bio-film, gum inflammation, and bacterial plaque mineralization',
        actionSummary: 'Mestre de BJJ explica a fundo a patologia: mostra como a placa bacteriana se mineraliza com a saliva formando a crosta que asfixia a gengiva e inflama o osso alveolar.',
        spokenLinePt: 'O que está acontecendo aqui é que as bactérias se misturam com os minerais da sua saliva e formam essa pedra de tártaro que apodrece a gengiva.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens with crisp medical demonstration depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY:
• 00:08 - 00:11: The camera moves into an intense, sharp macro view of the colossal dental model's gumline, revealing swollen, inflamed simulated gum tissue and dark subgingival plaque. The presenter's left hand (with gold wedding band) points an anatomical pointer probe directly into the infected crevice.
• 00:11 - 00:14: The presenter looks straight into the camera lens with grave pedagogical authority, speaking with precise lip synchronization in Portuguese, explaining how bacterial biofilm crystallizes with saliva minerals into calcified dental stone.
• 00:14 - 00:16: He tilts the colossal model slightly to reveal deep cavitations and bone pockets under the gum, emphasizing the invisible destruction happening inside.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Standing behind the bench in the BJJ dojo, delivering the medical-pathology breakdown with passionate conviction.

HUMAN SKIN PRIORITY: Visible irregular pores, forehead expression creases, realistic tan skin, pronounced vascularity in forearms, authentic cauliflower ears. NO beauty filter, NO plastic CGI smoothing.

HANDS: Five fingers per hand, natural skin folds, gold wedding band on left ring finger. Right hand gestures authoritatively; left hand holds the dental model securely.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O que está acontecendo aqui é que as bactérias se misturam com os minerais da sua saliva e formam essa pedra de tártaro que apodrece a gengiva."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 3,
        stepName: 'PROMPT 3 — INGREDIENTES CASEIROS DA CURA — 8s',
        durationSeconds: 8,
        timeRange: '00:16 - 00:24',
        focalObject: 'Colossal dental model remains in midground on wooden bench alongside three glass jars of simple kitchen ingredients',
        actionSummary: 'Mestre de BJJ mostra e fala na bancada do dojo os ingredientes caseiros: bicarbonato simples de cozinha, óleo de coco extravirgem e gotas de própolis pura.',
        spokenLinePt: 'Para dissolver esse tártaro sem estragar seu esmalte, você só precisa desses três ingredientes caseiros: bicarbonato de cozinha, óleo de coco e própolis.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

PHYSICAL CONTINUITY: The colossal educational anatomical dental jaw model remains in the foreground on the wooden bench, exactly as shown in Prompt 2.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the solid light-wood gym bench in front of the presenter are three transparent glass vessels displaying the real homemade ingredients:
1. A small clear glass bowl filled with ultra-fine, chalky-white pure baking soda (sodium bicarbonate).
2. A wide-mouth glass jar filled with rich, translucent virgin coconut oil.
3. An amber glass dropper bottle containing concentrated deep-golden green propolis extract with a rubber bulb pipette.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He stands behind the wooden gym bench in the BJJ dojo, gesturing warmly toward each natural kitchen ingredient.

HUMAN SKIN PRIORITY: Natural pores, realistic stubble, cauliflower ears, masculine weathered skin, visible forearm vascularity. NO CGI smoothing.

HANDS: Exactly five fingers per hand, gold wedding band on left ring finger. His right hand holds up the glass bowl of white baking soda powder; his left hand lifts the amber dropper bottle, pointing to each ingredient.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Para dissolver esse tártaro sem estragar seu esmalte, você só precisa desses três ingredientes caseiros: bicarbonato de cozinha, óleo de coco e própolis."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 4,
        stepName: 'PROMPT 4 — PREPARO PARTE 1: BASE & LIP-SYNC AO VIVO — 8s',
        durationSeconds: 8,
        timeRange: '00:24 - 00:32',
        focalObject: 'Small dark-gray enameled cast iron saucepan with brass side handles on portable burner on the gym bench, colossal teeth in background',
        actionSummary: 'Mestre de BJJ inicia o preparo ao vivo na panela esmaltada sobre o banco de madeira: adiciona o óleo de coco e o bicarbonato, mexendo com colher de pau enquanto fala olhando na câmera.',
        spokenLinePt: 'Primeiro, você coloca na panela o óleo de coco e adiciona o bicarbonato, mexendo devagar enquanto os bioativos se fundem nessa base.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with focus locked on the cooking pot and presenter.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

OBJECT CONTINUITY IN PREPARATION (CRITICAL REQUIREMENT):
In the center foreground rests a compact, rustic dark-gray enameled cast-iron saucepan with vintage brass side handles, placed securely on an electric burner on the solid light-wood gym bench. THIS EXACT SAME PAN WITH BRASS HANDLES MUST REMAIN IN PROMPT 5.

WHAT HAPPENS VISUALLY (ANTI-VOICEOVER LIP-SYNC PREPARATION):
• 00:24 - 00:27: The presenter holds a rustic wooden cooking spoon in his right hand, stirring the coconut oil and baking soda in the saucepan. The mixture melts into a smooth white base with gentle bubbling.
• 00:27 - 00:30: Without stopping the stirring motion, he looks up directly into the camera lens with warm martial arts discipline, delivering his line with perfect Brazilian Portuguese lip-sync.
• 00:30 - 00:32: He gently taps the wooden spoon against the saucepan rim, pointing into the active liquid base as it warms up.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Stirring with athletic precision behind the bench in the BJJ dojo. Gold wedding band visible on his left hand resting on the bench.

HUMAN SKIN PRIORITY: Visible skin pores, athletic forearm muscles engaged, realistic hair follicles, cauliflower ears. NO wax skin, NO CGI.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Primeiro, você coloca na panela o óleo de coco e adiciona o bicarbonato, mexendo devagar enquanto os bioativos se fundem nessa base."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 5,
        stepName: 'PROMPT 5 — PREPARO PARTE 2: CONTINUAÇÃO NA PANELA COM BIOATIVOS — 8s',
        durationSeconds: 8,
        timeRange: '00:32 - 00:40',
        focalObject: 'Identical small dark-gray enameled cast iron saucepan with brass handles from Prompt 4 receiving propolis extract',
        actionSummary: 'Continuidade exata na mesma panela esmaltada: Mestre de BJJ pinga o extrato de própolis pura, mexendo vigorosamente com a colher de pau até emulsificar uma pasta ativa.',
        spokenLinePt: 'Agora com o fogo brando você pinga a própolis pura. Olha a cor dourada que ela solta quando emulsifica essa mistura curativa.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with macro clarity on pan continuity.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

STRICT PAN & SCENE CONTINUITY (CRITICAL MANDATE):
The camera framing maintains absolute continuity from Prompt 4: the EXACT SAME dark-gray enameled cast-iron saucepan with brass side handles sits in the exact same spot on the wooden bench. The liquid base prepared in Prompt 4 is now gently simmering with golden steam rising.

WHAT HAPPENS VISUALLY (LIVE-ACTION COOKING CONTINUATION):
• 00:32 - 00:35: The presenter's left hand (with gold wedding band) holds the amber glass dropper, releasing three rich golden-amber droplets of concentrated propolis extract directly into the center of the simmering pan.
• 00:35 - 00:38: His right hand vigorously swirls the wooden spoon in steady circles, blending the propolis into the white base. The mixture transforms into a rich, creamy, golden-flecked bioactive paste.
• 00:38 - 00:40: He lifts the wooden spoon towards the camera lens, showing the thick, glossy emulsion dripping slowly, speaking with authentic pride and direct eye contact.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Delivering speech live on-camera with synchronized lip movement.

HUMAN SKIN PRIORITY: Irregular pores, natural micro-blemishes, muscular forearms with veins, cauliflower ears. NO filters.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Agora com o fogo brando você pinga a própolis pura. Olha a cor dourada que ela solta quando emulsifica essa mistura curativa."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 6,
        stepName: 'PROMPT 6 — QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO — 8s',
        durationSeconds: 8,
        timeRange: '00:40 - 00:48',
        focalObject: 'Panela esmaltada com a pasta ativa no fogão portátil ao lado de colher dosadora na bancada de madeira',
        actionSummary: 'Mestre de BJJ fala diretamente na câmera com lip-sync detalhando as medidas exatas da receita (1 colher de bicarbonato, 1 colher de óleo de coco e 5 gotas de própolis) e o tempo exato de 3 minutos em fogo brando para homogeneizar.',
        spokenLinePt: 'Anota a proporção: uma colher de bicarbonato, uma de óleo de coco e cinco gotas de própolis. Deixa três minutos em fogo baixo mexendo sem parar.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (INGREDIENT QUANTITY & PREPARATION TIME):
• 00:40 - 00:43: Presenter speaks directly to the camera with organic lip-sync, gesturing with his hands to explain the precise measurements: one tablespoon of culinary baking soda, one tablespoon of virgin coconut oil, and five drops of green propolis extract.
• 00:43 - 00:46: He points to the simmering saucepan and holds up three fingers to instruct the exact preparation time: three minutes on low heat with continuous stirring until smooth.
• 00:46 - 00:48: He locks eyes with the camera with encouraging paternal confidence, showing that the formula has reached peak bioactive consistency, ready to use.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Delivering speech live on-camera with synchronized lip movement and authentic gestures.

HUMAN SKIN PRIORITY: Visible biological pores, authentic weathered tan skin, cauliflower ears, muscular neck and shoulders, veins in forearms. NO beauty filters.

HANDS: Exactly five fingers per hand, natural skin folds, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Anota a proporção: uma colher de bicarbonato, uma de óleo de coco e cinco gotas de própolis. Deixa três minutos em fogo baixo mexendo sem parar."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 7,
        stepName: 'PROMPT 7 — USO, DEGUSTAÇÃO & RELATO DE CURA — 8s',
        durationSeconds: 8,
        timeRange: '00:48 - 00:56',
        focalObject: 'Small clear tasting glass/spoon with the freshly prepared remedy, colossal teeth in background showing sparkling clean enamel',
        actionSummary: 'Mestre de BJJ degusta e aplica a solução fresca na ponta do dedo/escova, relatando a sensação de alívio e a ação antibacteriana imediata.',
        spokenLinePt: 'Você faz um bochecho suave ou passa na escova. A sensação de limpeza é imediata e o tártaro vai se soltando sem agredir o esmalte.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (TASTING & HEALING TESTIMONIAL):
• 00:48 - 00:51: The presenter takes a clean natural bristle toothbrush, dips the tip into the freshly prepared warm paste from the small dish, and touches it to his clean canine tooth, smiling with refreshing vigor.
• 00:51 - 00:54: He gestures toward the colossal dental model on the bench, which now shows the central incisors completely spotless, gleaming, and free of tartar, with detached residue collected in a small glass tray.
• 00:54 - 00:56: He looks into the camera lens with warm, authentic master presence, nodding with certainty as he delivers the healing testimonial.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Warm smile lines, direct charismatic eye contact, heather-gray rashguard with BJJ lettering, gold wedding band on left hand.

HUMAN SKIN PRIORITY: Visible biological pores, authentic weathered tan skin, cauliflower ears, muscular neck and shoulders. NO CGI.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Você faz um bochecho suave ou passa na escova. A sensação de limpeza é imediata e o tártaro vai se soltando sem agredir o esmalte."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 8,
        stepName: 'PROMPT 8 — CTA PARTE 1: APRESENTAÇÃO DO ENCAPSULADO DENTAL CONCENTRADO — 8s',
        durationSeconds: 8,
        timeRange: '00:56 - 01:04',
        focalObject: 'Premium amber glass supplement bottle with clean label "BioDent Caps" held at chest height, revealing two herbal capsules in open palm',
        actionSummary: 'Mestre de BJJ faz a ponte da receita para o suplemento encapsulado: ergue o frasco de BioDent Caps na altura do peito, abre a tampa e exibe duas cápsulas na palma da mão, explicando que a fórmula concentra própolis verde pura e minerais alcalinizantes em grau farmacêutico sem sujeira.',
        spokenLinePt: 'Mas se você não quer ter o trabalho de preparar isso todo santo dia, essa fórmula encapsulada reúne esses mesmos bioativos concentrados em duas cápsulas diárias.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm portrait lens with cinematic dojo depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (ENCAPSULATED SUPPLEMENT REVEAL):
• 00:56 - 00:59: The presenter transitions smoothly from the wooden bench, lifting a premium pharmaceutical amber glass supplement bottle labeled "BioDent Caps" firmly with both hands to chest height. The clean label displays botanical propolis emblem and mineral symbols.
• 00:59 - 01:02: With a fluid, natural movement, he twists open the black textured cap, tilting the bottle slightly to tip out two golden-amber herbal vegetable capsules directly onto his open left palm (gold wedding band visible on left ring finger), displaying the concentrated capsules clearly toward the lens.
• 01:02 - 01:04: He speaks with charismatic warmth and scientific conviction directly into the camera lens with organic Portuguese lip-sync, demonstrating the convenience and high bio-availability of the encapsulated formula.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Holding the supplement bottle and capsules with natural confidence, magnetic eye contact.

HUMAN SKIN PRIORITY: Authentic skin texture, visible biological pores across face and arms, natural tan, cauliflower ears, vascular forearms. NO CGI or beauty filters.

HANDS: Exactly five fingers per hand, firm natural grip on the supplement bottle, two vegetable capsules resting naturally on the palm skin creases, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mas se você não quer ter o trabalho de preparar isso todo santo dia, essa fórmula encapsulada reúne esses mesmos bioativos concentrados em duas cápsulas diárias."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 9,
        stepName: 'PROMPT 9 — CTA PARTE 2: OFERTA, CONVITE PARA AÇÃO & ESCASSEZ DO ENCAPSULADO — 8s',
        durationSeconds: 8,
        timeRange: '01:04 - 01:12',
        focalObject: 'Premium amber supplement bottle "BioDent Caps" held firmly in left hand while presenter points decisively towards bio link / comments',
        actionSummary: 'Mestre de BJJ entrega o CTA de venda: segura o frasco na mão esquerda e aponta o dedo indicador direito com autoridade para baixo, convocando a comentar EU QUERO ou acessar o link da bio com desconto de fábrica e frete grátis antes de esgotar o lote.',
        spokenLinePt: 'Comenta EU QUERO aqui embaixo ou clica no link da minha bio agora. O lote com desconto de fábrica e frete grátis é limitado. Garante o teu frasco antes que acabe!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm portrait lens with crisp dojo lighting.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (PRODUCT SALES CALL-TO-ACTION & SCARCITY):
• 01:04 - 01:07: The presenter holds the premium amber supplement bottle firmly in his left hand at mid-chest level (gold wedding band gleaming under warm gym light). With his right muscular hand, he points his index finger decisively straight down toward the bottom of the frame (bio link / comment section), delivering the urgent CTA.
• 01:07 - 01:10: He maintains magnetic, intense, trustworthy martial arts master eye contact, leaning forward slightly into the camera, nodding with encouraging paternal authority as he warns about the limited factory batch and free shipping offer.
• 01:10 - 01:12: He concludes his speech with synchronized lip movement in Brazilian Portuguese, offering a warm reassuring nod of certainty, holding the product steady as the video finishes on a high-converting climax.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Authoritative martial artist posture, heather-gray rashguard with BJJ lettering, charismatic and urgent expression.

HUMAN SKIN PRIORITY: Visible biological pores across forehead and cheeks, authentic expression lines, vascular forearms, cauliflower ears. NO smoothing, NO CGI.

HANDS: Exactly five fingers per hand, natural skin folds, firm grip on bottle, right hand pointing downward with realistic anatomy, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Comenta EU QUERO aqui embaixo ou clica no link da minha bio agora. O lote com desconto de fábrica e frete grátis é limitado. Garante o teu frasco antes que acabe!"

SETTING: ${OFFICIAL_SETTING_SPEC}`
      }
    ]
  },
  {
    id: 'script-figado-gordura',
    theme: 'Gordura no fígado (Esteatose hepática) e acúmulo de lipídios',
    summary: 'Demonstração em fígado educacional COLOSSAL (60% da tela) com despejo visceral de gordura líquida amarela no gancho, explicação médica do problema, ingredientes, preparo em 2 partes na panela, quantidade e tempo de preparo, degustação e 2 prompts de CTA para venda do suplemento encapsulado.',
    focalObject: 'Modelo anatômico COLOSSAL de fígado humano em silicone médico translúcido com crostas espessas de gordura visceral (60% da tela 9:16)',
    targetProblem: 'Placas espessas de gordura amarelada e óleo visceral asfixiando o tecido hepático',
    elementsPrepared: 'Frasco de vidro com gordura amarela viscosa despejada no gancho, panela esmaltada pequena no fogareiro portátil, ingredientes curativos em potes de vidro, frasco de suplemento encapsulado',
    transformationType: 'Emulsificação progressiva da camada viscosa amarela e apresentação do suplemento encapsulado concentrado',
    productTitleUsed: 'HepatoClean Curcumina & Silimarina Caps',
    bookTitleUsed: 'HepatoClean Curcumina & Silimarina Caps',
    createdAt: new Date().toISOString(),
    prompts: [
      {
        id: 1,
        stepName: 'PROMPT 1 — GANCHO + INÍCIO DA DEMONSTRAÇÃO — 8s',
        durationSeconds: 8,
        timeRange: '00:00 - 00:08',
        focalObject: 'Colossal anatomical model of human liver (occupying 60% of vertical 9:16 frame) with thick yellow lipid fat deposits',
        actionSummary: 'Mestre de BJJ já começa no segundo 00:00 debruçado sobre o fígado colossal na bancada do dojo, despejando óleo denso e viscoso de um frasco de vidro sobre o órgão, mostrando o sufocamento do tecido.',
        spokenLinePt: 'Se você come carboidrato refinado todo santo dia, olha exatamente o que começa a sufocar o seu fígado por dentro.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 20mm ultra-wide lens with extreme forced perspective.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

Extreme foreground macro close-up featuring a COLOSSAL educational anatomical model of a human liver, occupying 60% of the entire lower vertical 9:16 frame directly against the camera lens. The giant model displays congested dark reddish-brown lobules heavily encrusted with thick, lumpy, yellowish-white plaques of simulated visceral hepatic fat.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Standing directly behind the solid light-wood gym bench, leaning forward toward the camera with an intense, magnetic, urgent facial expression.

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, nose, cheeks, neck, shoulders, arms, forearms, and hands. Forehead expression creases, nasolabial folds, natural skin texture, vellus facial hairs, arm veins bulging with vascularity. Subtle natural oiliness on forehead; cheeks comparatively matte. Restrained realistic subsurface scattering under natural daylight. NO beauty filter, NO skin smoothing, NO wax skin, NO porcelain skin, NO plastic skin, NO uniform artificial pores, NO excessive HDR, NO artificial glossy face, NO CGI appearance.

HANDS: Exactly five fingers per hand, correct adult male anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. In his right hand he tilts a heavy glass jar, pouring a thick, viscous, golden-amber liquid fat directly onto the top lobe of the colossal liver at second 00:00. Simple gold wedding band on his left ring finger resting on the bench.

ACTION: The video opens already in explosive motion at 00:00 with zero delay. The thick viscous golden fat coats the textured liver tissue, slowly oozing through the anatomical fissures and dripping heavily over the lower edge onto the wooden bench. The presenter leans in close behind the colossal model, locking piercing eye contact with the camera lens, delivering the opening hook with urgency. Natural blinking, micro-expressions, subtle breathing.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Se você come carboidrato refinado todo santo dia, olha exatamente o que começa a sufocar o seu fígado por dentro."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 2,
        stepName: 'PROMPT 2 — EXPLICAÇÃO DO PROBLEMA (O QUE É O PROBLEMA) — 8s',
        durationSeconds: 8,
        timeRange: '00:08 - 00:16',
        focalObject: 'Colossal liver model showing cellular lipid infiltration, portal vein pressure, and hepatic congestion',
        actionSummary: 'Mestre de BJJ explica a esteatose hepática: mostra como o excesso de frutose e carboidratos se transforma em triglicerídeos que entopem os hepatócitos e causam inflamação silenciosa.',
        spokenLinePt: 'O fígado não consegue processar tanta glicose e transforma tudo em triglicerídeos, empilhando placas de gordura que matam suas células hepáticas.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm lens with crisp medical pedagogical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY:
• 00:08 - 00:11: The camera pushes closer into a cross-section of the colossal liver model, showing yellow fat globule clusters squeezing simulated micro-vessels and bile ducts. The presenter's left hand (with gold wedding band) points an anatomical pointer to the swollen, yellowed tissue.
• 00:11 - 00:14: The presenter looks straight into the camera lens with intense disciplinary focus, speaking with precise Portuguese lip-sync about how silent fatty liver disease develops without causing pain until it is advanced.
• 00:14 - 00:16: He presses gently on the congested lobe with his thumb, demonstrating the loss of elasticity and dense fat saturation inside the organ.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Standing behind the wooden bench in the BJJ dojo, delivering the anatomical breakdown with gravitas.

HUMAN SKIN PRIORITY: Visible irregular pores, forehead lines, authentic tan, cauliflower ears, muscular forearms. NO beauty smoothing.

HANDS: Exactly five fingers per hand, natural skin folds, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"O fígado não consegue processar tanta glicose e transforma tudo em triglicerídeos, empilhando placas de gordura que matam suas células hepáticas."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 3,
        stepName: 'PROMPT 3 — INGREDIENTES CASEIROS DA CURA — 8s',
        durationSeconds: 8,
        timeRange: '00:16 - 00:24',
        focalObject: 'Colossal liver model in midground alongside raw apple cider vinegar, fresh lemon, and pure turmeric powder',
        actionSummary: 'Mestre de BJJ mostra e fala na bancada do dojo os ingredientes caseiros: garrafa de vinagre de maçã cru, limão fresco cortado e pote de cúrcuma pura em pó.',
        spokenLinePt: 'Para derreter essa esteatose e desobstruir seu fígado, esses três ingredientes caseiros ativam a quebra da gordura: vinagre de maçã cru, limão e cúrcuma.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens, realistic optical depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

PHYSICAL CONTINUITY: The colossal educational anatomical silicone liver model remains in the foreground on the wooden bench, with dense yellow lipid deposits from Prompt 2 preserved in exact location and texture.

HOMEMADE INGREDIENTS ON DISPLAY: Arranged neatly on the solid light-wood gym bench in front of the presenter are three transparent glass vessels displaying the real homemade ingredients:
1. A clear glass bottle filled with unfiltered, raw organic apple cider vinegar showing the cloudy bioactive 'mother' floating inside.
2. A freshly sliced juicy yellow lemon cut in half, resting beside a glass citrus squeezer with glistening pulp droplets.
3. A small clear glass bowl piled with intense, vibrant golden-yellow turmeric rhizome powder.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
He stands behind the wooden gym bench in the BJJ dojo, gesturing toward each kitchen ingredient with authority.

HUMAN SKIN PRIORITY: Natural biological pores, realistic stubble, cauliflower ears, masculine weathered skin, visible forearm vascularity. NO CGI smoothing.

HANDS: Five fingers per hand, gold wedding band on left ring finger. Right hand uses a small wooden spoon to lift golden turmeric; left hand holds up the raw vinegar bottle.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Para derreter essa esteatose e desobstruir seu fígado, esses três ingredientes caseiros ativam a quebra da gordura: vinagre de maçã cru, limão e cúrcuma."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 4,
        stepName: 'PROMPT 4 — PREPARO PARTE 1: BASE & LIP-SYNC AO VIVO — 8s',
        durationSeconds: 8,
        timeRange: '00:24 - 00:32',
        focalObject: 'Small dark-gray enameled cast iron saucepan with brass side handles on portable burner on the gym bench, colossal liver in background',
        actionSummary: 'Mestre de BJJ inicia o preparo do tônico curativo ao vivo na panela esmaltada sobre o banco do dojo: despeja água filtrada morna e adiciona o vinagre de maçã cru, mexendo enquanto fala olhando na câmera.',
        spokenLinePt: 'Você começa colocando a água morna na panela e adiciona duas colheres do vinagre de maçã cru, mantendo a temperatura branda para não perder os probióticos.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with focus locked on the cooking pot and presenter.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

OBJECT CONTINUITY IN PREPARATION (CRITICAL REQUIREMENT):
In the center foreground rests a compact, rustic dark-gray enameled cast-iron saucepan with vintage brass side handles, placed on an electric burner on the solid light-wood gym bench. THIS EXACT SAME PAN WITH BRASS HANDLES MUST REMAIN IN PROMPT 5.

WHAT HAPPENS VISUALLY (ANTI-VOICEOVER LIP-SYNC PREPARATION):
• 00:24 - 00:27: The presenter pours raw cloudy apple cider vinegar from the bottle into the warm water inside the dark-gray saucepan, seeing delicate swirls form in the liquid.
• 00:27 - 00:30: Holding a wooden spoon with his right hand, he looks directly into the camera lens with charismatic presence, explaining the temperature control with perfect lip synchronization in Portuguese.
• 00:30 - 00:32: He stirs with steady wrist motion, veins defined in his muscular forearm, keeping continuous tactile engagement with the pan.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Stirring with athletic composure behind the wooden bench in the BJJ dojo. Gold wedding band visible on left hand resting on the bench.

HUMAN SKIN PRIORITY: Visible skin pores, muscular arm contours, authentic cauliflower ears, natural forehead lines. NO CGI smoothing.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Você começa colocando a água morna na panela e adiciona duas colheres do vinagre de maçã cru, mantendo a temperatura branda para não perder os probióticos."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 5,
        stepName: 'PROMPT 5 — PREPARO PARTE 2: CONTINUAÇÃO NA PANELA COM BIOATIVOS — 8s',
        durationSeconds: 8,
        timeRange: '00:32 - 00:40',
        focalObject: 'Identical small dark-gray enameled cast iron saucepan with brass handles from Prompt 4 receiving fresh lemon juice and turmeric',
        actionSummary: 'Continuidade exata na mesma panela esmaltada: Mestre de BJJ espreme o limão fresco vendo as gotas caírem e adiciona a cúrcuma em pó, mexendo até virar um tônico dourado fumegante.',
        spokenLinePt: 'Agora entra o sumo fresco de meio limão e a colher de cúrcuma pura. Repara como essa mistura ganha esse tom dourado denso que quebra gordura.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with macro clarity on pan continuity.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

STRICT PAN & SCENE CONTINUITY (CRITICAL MANDATE):
The camera framing maintains absolute continuity from Prompt 4: the EXACT SAME dark-gray enameled cast-iron saucepan with brass side handles sits in the exact same spot on the wooden bench. The liquid base from Prompt 4 is warm and ready for the bioactive infusion.

WHAT HAPPENS VISUALLY (LIVE-ACTION COOKING CONTINUATION):
• 00:32 - 00:35: The presenter's left hand (with gold wedding band) firmly squeezes a fresh lemon half over the saucepan, sending real glistening droplets of citrus juice into the liquid.
• 00:35 - 00:38: His right hand tips a spoonful of vibrant golden turmeric powder into the saucepan, stirring briskly with the wooden spoon. The mixture effervesces lightly, turning into an intense golden-amber tonic with aromatic steam.
• 00:38 - 00:40: He lifts the wooden spoon towards the camera lens, showing the golden tonic dripping, locking confident eye contact while delivering the line.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Synchronized Portuguese lip-sync on-camera, martial arts presence.

HUMAN SKIN PRIORITY: Irregular pores, natural micro-blemishes, muscular forearms with veins, cauliflower ears. NO filters.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Agora entra o sumo fresco de meio limão e a colher de cúrcuma pura. Repara como essa mistura ganha esse tom dourado denso que quebra gordura."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 6,
        stepName: 'PROMPT 6 — QUANTIDADE DE INGREDIENTES E TEMPO DE PREPARO — 8s',
        durationSeconds: 8,
        timeRange: '00:40 - 00:48',
        focalObject: 'Panela esmaltada fumegante no fogareiro com o tônico dourado borbulhando suavemente, frascos dosadores na bancada',
        actionSummary: 'Mestre de BJJ fala diretamente na câmera com lip-sync detalhando as doses exatas (200ml de água, 2 colheres de vinagre de maçã com a mãe, meio limão e 1 colher de cúrcuma) e os 5 minutos de infusão lenta em fogo brando.',
        spokenLinePt: 'A medida exata é duzentos ml de água morna, duas colheres de vinagre de maçã cru, meio limão e uma colher de cúrcuma. Ferve cinco minutos e desliga.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (INGREDIENT QUANTITY & PREPARATION TIME):
• 00:40 - 00:43: Presenter speaks directly into the camera lens with organic Brazilian Portuguese lip-sync, gesturing with muscular hands as he details the exact quantities: 200ml of warm water, two tablespoons of raw unfiltered apple cider vinegar, half a freshly squeezed lemon, and one full spoon of pure turmeric.
• 00:43 - 00:46: He gestures toward the gently simmering saucepan, holding up five fingers to instruct the exact 5-minute simmer time needed to release the therapeutic curcuminoids and acetic acid synergy.
• 00:46 - 00:48: He nods with unwavering authority and paternal warmth, indicating the remedy is now at its peak therapeutic potency, preparing to taste.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Charismatic, direct eye contact, heather-gray rashguard with BJJ lettering, gold wedding band on left hand.

HUMAN SKIN PRIORITY: Visible irregular pores across forehead, cheeks, arms, authentic skin folds, cauliflower ears. NO CGI.

HANDS: Exactly five fingers per hand, correct adult human anatomy, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"A medida exata é duzentos ml de água morna, duas colheres de vinagre de maçã cru, meio limão e uma colher de cúrcuma. Ferve cinco minutos e desliga."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 7,
        stepName: 'PROMPT 7 — USO, DEGUSTAÇÃO & RELATO DE CURA — 8s',
        durationSeconds: 8,
        timeRange: '00:48 - 00:56',
        focalObject: 'Glass tumbler containing the golden healing tonic, colossal liver model in background showing cleansed healthy red tissue',
        actionSummary: 'Mestre de BJJ bebe um gole do tônico morno em copo de vidro no dojo, respira fundo demonstrando vitalidade e relata a melhora imediata na digestão e desinchaço.',
        spokenLinePt: 'Você toma essa xícara ainda morna em jejum pela manhã. Em poucos dias o inchaço abdominal desaba e o fígado volta a respirar com potência.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens with realistic optical depth.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (TASTING & HEALING TESTIMONIAL):
• 00:48 - 00:51: The presenter lifts a heavy glass tumbler filled with the warm golden turmeric-cider tonic, takes a deliberate, refreshing sip, swallows naturally, and lets out an invigorating breath of vitality.
• 00:51 - 00:54: He gestures with his left hand (gold wedding band visible) toward the colossal liver model on the bench, where the thick yellow lipid plaques have emulsified and washed away into the acrylic tray, revealing healthy deep mahogany tissue.
• 00:54 - 00:56: He looks into the camera lens with authentic warmth and authority, nodding firmly as he delivers the testimonial of liver recovery.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Warm smile lines, charismatic eye contact, heather-gray rashguard with BJJ lettering, gold wedding band on left hand.

HUMAN SKIN PRIORITY: Visible biological pores, authentic weathered tan skin, cauliflower ears, muscular neck and shoulders. NO CGI.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Você toma essa xícara ainda morna em jejum pela manhã. Em poucos dias o inchaço abdominal desaba e o fígado volta a respirar com potência."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 8,
        stepName: 'PROMPT 8 — CTA PARTE 1: APRESENTAÇÃO DO ENCAPSULADO HEPÁTICO CONCENTRADO — 8s',
        durationSeconds: 8,
        timeRange: '00:56 - 01:04',
        focalObject: 'Premium dark pharmaceutical bottle "HepatoClean Caps" held at chest height with two concentrated golden-orange capsules displayed in palm',
        actionSummary: 'Mestre de BJJ faz a transição para o suplemento encapsulado: ergue o frasco de HepatoClean Caps na altura do peito, desrosqueia a tampa e exibe duas cápsulas na palma da mão, explicando que a fórmula concentra 95% de curcuminoides puros e silimarina sem precisar cozinhar todo dia.',
        spokenLinePt: 'Mas se você não tem tempo de fazer essa mistura toda manhã, essa fórmula encapsulada concentra noventa e cinco por cento dos bioativos puros em duas cápsulas diárias.',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm portrait lens with cinematic dojo depth of field.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (CONCENTRATED CAPSULE REVEAL):
• 00:56 - 00:59: Smoothly following the tea tasting, the presenter lifts a premium dark pharmaceutical bottle labeled "HepatoClean Caps" from the wooden bench, holding it at chest height with both hands. The label features clean botanical curcuma and milk thistle artwork with gold trim.
• 00:59 - 01:02: With fluid martial artist dexterity, he twists open the black textured cap and tilts the bottle, dropping two rich golden-orange herbal vegetable capsules into his open left palm (gold wedding band visible on left ring finger), displaying the concentrated capsules clearly toward the lens.
• 01:02 - 01:04: Direct magnetic eye contact with the camera, speaking with authoritative conviction about the potency of the standardized bioactives compared to raw roots, showing genuine enthusiasm.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Holding the bottle and capsules with natural confidence, magnetic and trustworthy expression.

HUMAN SKIN PRIORITY: Visible biological pores across face and arms, authentic weathered skin, cauliflower ears, vascular forearms. NO CGI or beauty filters.

HANDS: Exactly five fingers per hand, natural grip on bottle, two golden capsules resting cleanly on the open palm, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mas se você não tem tempo de fazer essa mistura toda manhã, essa fórmula encapsulada concentra noventa e cinco por cento dos bioativos puros em duas cápsulas diárias."

SETTING: ${OFFICIAL_SETTING_SPEC}`
      },
      {
        id: 9,
        stepName: 'PROMPT 9 — CTA PARTE 2: OFERTA, CONVITE PARA AÇÃO & ESCASSEZ DO ENCAPSULADO — 8s',
        durationSeconds: 8,
        timeRange: '01:04 - 01:12',
        focalObject: 'Premium dark supplement bottle "HepatoClean Caps" held firmly in left hand while presenter points decisively toward bio link / comments',
        actionSummary: 'Mestre de BJJ entrega o CTA de venda: segura o frasco na mão esquerda e aponta o indicador direito com autoridade para baixo, convocando a comentar EU QUERO ou acessar o link da bio com desconto de fábrica e frete grátis antes de esgotar o estoque.',
        spokenLinePt: 'Comenta EU QUERO aqui embaixo ou clica no link da minha bio hoje. O lote promocional com frete grátis tá no fim. Garante o teu frasco antes que zere o estoque!',
        promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, captured with a 28mm portrait lens with crisp dojo lighting.

${NEGATIVE_TEXT_AND_SUBTITLES_BAN}

WHAT HAPPENS VISUALLY (PRODUCT SALES CALL-TO-ACTION & SCARCITY):
• 01:04 - 01:07: The presenter holds the premium dark supplement bottle firmly in his left hand at mid-chest level (gold wedding band gleaming under warm gym light). With his right muscular hand, he points his index finger decisively straight down toward the bottom of the frame (bio link / comment section), delivering the urgent CTA.
• 01:07 - 01:10: He maintains intense, magnetic, trustworthy eye contact, leaning forward slightly into the camera, nodding with encouraging paternal authority as he warns about the limited factory batch and free shipping offer.
• 01:10 - 01:12: He concludes his speech with synchronized lip movement in Brazilian Portuguese, offering a warm reassuring nod of certainty, holding the product steady as the video finishes on a high-converting climax.

PRESENTER: ${OFFICIAL_CHARACTER_SPEC}
Authoritative martial artist posture, heather-gray rashguard with BJJ lettering, charismatic and urgent expression.

HUMAN SKIN PRIORITY: Visible biological pores across forehead and cheeks, authentic expression lines, vascular forearms, cauliflower ears. NO smoothing, NO CGI.

HANDS: Exactly five fingers per hand, natural skin folds, firm grip on bottle, right hand pointing downward with realistic anatomy, gold wedding band on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Comenta EU QUERO aqui embaixo ou clica no link da minha bio hoje. O lote promocional com frete grátis tá no fim. Garante o teu frasco antes que zere o estoque!"

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
    theme: 'Tártaro endurecido e placa dental calcificada',
    model: 'Arcada Dentária Gigante 60% com Tártaro Calcificado e Cáries',
    hookType: 'curiosidade',
    tag: 'Saúde Bucal',
    solutionIngredients: 'Bicarbonato de sódio culinário + Óleo de coco extravirgem + Própolis verde',
    hookActionType: 'scraping_abrasion',
  },
  {
    theme: 'Gordura no fígado (Esteatose) e carboidratos refinados',
    model: 'Fígado Anatômico Gigante Translúcido com Placas Lipídicas Amarelas',
    hookType: 'problema_visivel',
    tag: 'Fígado & Metabolismo',
    solutionIngredients: 'Vinagre de maçã cru com a mãe + Limão espremido + Cúrcuma pura em pó',
    hookActionType: 'liquid_pouring',
  },
  {
    theme: 'Vaporizador / Vape vs Fumaça de Cigarro no Tecido Pulmonar',
    model: 'Pulmão Educacional Gigante em Acrílico com Alvéolos Petrificados de Alcatrão',
    hookType: 'segredo',
    tag: 'Pulmão & Respiração',
    solutionIngredients: 'Chá concentrado de gengibre fresco + Cravo-da-índia + Mel de abelha silvestre',
    hookActionType: 'surgical_slice',
  },
  {
    theme: 'Pico de açúcar no sangue e espessamento sanguíneo',
    model: 'Vaso Sanguíneo Gigante em Corte com Globos Cristalizados de Glicose',
    hookType: 'descoberta',
    tag: 'Glicemia & Dieta',
    solutionIngredients: 'Canela-do-ceilão em pó + Vinagre de maçã orgânico + Folhas secas de oliveira',
    hookActionType: 'needle_injection',
  },
  {
    theme: 'Cera de ouvido impactada e tampão escuro no tímpano',
    model: 'Canal Auditivo Gigante em Seção Transversal com Tampão de Cerúmen Rígido',
    hookType: 'curiosidade',
    tag: 'Ouvido & Audição',
    solutionIngredients: 'Gotas de azeite de oliva morno prensado a frio + Óleo essencial puro de melaleuca (tea tree)',
    hookActionType: 'pinch_extraction',
  },
  {
    theme: 'Ácido úrico e cristais pontiagudos nas articulações (Gota)',
    model: 'Articulação do Dedão do Pé e Joelho Gigante com Cristais de Urato Espiculados',
    hookType: 'problema_visivel',
    tag: 'Articulações & Dor',
    solutionIngredients: 'Suco de cereja fresca concentrado + Bicarbonato culinário + Infusão forte de cavalinha',
    hookActionType: 'pressure_squeeze',
  },
  {
    theme: 'Parasitas intestinais e biofilme aderido na parede do cólon',
    model: 'Intestino Grosso e Delgado Gigante Aberto com Parasitas e Muco Putrefato',
    hookType: 'curiosidade',
    tag: 'Intestino & Parasitas',
    solutionIngredients: 'Sementes de abóbora cruas trituradas + Dentes de alho roxo amassados + Óleo de orégano selvagem',
    hookActionType: 'pinch_extraction',
  },
  {
    theme: 'Cálculo renal (Pedra nos rins) de oxalato de cálcio obstruindo o ureter',
    model: 'Rim Humano Gigante em Corte Anatômico com Pedras Pontiagudas Presas nos Cálices',
    hookType: 'problema_visivel',
    tag: 'Rins & Vias Urinárias',
    solutionIngredients: 'Suco de limão taiti puro + Chá de quebra-pedra (Phyllanthus niruri) + Azeite extravirgem',
    hookActionType: 'catheter_unclog',
  },
  {
    theme: 'Refluxo esofágico, queimação e acidez cáustica no estômago',
    model: 'Estômago e Esôfago Gigante com Válvula Cárdia Aberta e Queimadura por Ácido',
    hookType: 'segredo',
    tag: 'Digestão & Estômago',
    solutionIngredients: 'Suco de batata inglesa crua coado + Gel de babosa (aloe vera) puro + Água de coco natural',
    hookActionType: 'liquid_pouring',
  },
  {
    theme: 'Fungo de unha (Micose crônica) destruindo a lâmina de queratina',
    model: 'Dedo do Pé Gigante em Corte com Unha Espessa Esfarelada e Colônia de Fungos Amarelos',
    hookType: 'problema_visivel',
    tag: 'Pele & Unhas',
    solutionIngredients: 'Óleo essencial de melaleuca (tea tree) + Bicarbonato de sódio + Vinagre de álcool 100%',
    hookActionType: 'scraping_abrasion',
  },
  {
    theme: 'Sinusite crônica e secreção purulenta travada nos seios da face',
    model: 'Crânio e Cavidade Sinusal Gigante em Acrílico Transparente Entupida de Secreção',
    hookType: 'curiosidade',
    tag: 'Respiração & Sinusite',
    solutionIngredients: 'Soro fisiológico caseiro hipertônico morno + Extrato de própolis alcoólico + Infusão de eucalipto',
    hookActionType: 'catheter_unclog',
  },
  {
    theme: 'Gordura visceral e placas de ateroma entupindo artérias do coração',
    model: 'Coração Humano Gigante com Artérias Coronárias Amarelas Obstruídas por Gordura',
    hookType: 'descoberta',
    tag: 'Coração & Circulação',
    solutionIngredients: 'Extrato de alho negro macerado + Suco de romã fresca + Pimenta caiena pura',
    hookActionType: 'surgical_slice',
  },
  {
    theme: 'Nódulo na tireoide e lentidão metabólica (Hipotireoidismo)',
    model: 'Glândula Tireoide Gigante em Silicone com Nódulos Fibrosos no Pescoço',
    hookType: 'segredo',
    tag: 'Hormônios & Tireoide',
    solutionIngredients: 'Castanhas-do-pará ricas em selênio + Folhas de alga kelp iodada + Gengibre fresco ralado',
    hookActionType: 'pressure_squeeze',
  },
  {
    theme: 'Inflamação no nervo ciático e hérnia de disco comprimindo raiz nervosa',
    model: 'Coluna Lombar Gigante com Disco Intervertebral Herniado Esmagando o Nervo Ciático Amarelo',
    hookType: 'problema_visivel',
    tag: 'Coluna & Nervos',
    solutionIngredients: 'Cataplasma de argila verde com óleo de arnica + Infusão concentrada de cúrcuma e gengibre',
    hookActionType: 'pressure_squeeze',
  },
  {
    theme: 'Glicação avançada (Açúcar caramelizando colágeno e rugas profundas)',
    model: 'Camadas da Pele Humana Gigante com Fibras de Colágeno Quebradiças e Enegrecidas',
    hookType: 'descoberta',
    tag: 'Rejuvenescimento & Pele',
    solutionIngredients: 'Chá verde matcha cerimonial + Óleo de rosa mosqueta prensado a frio + Vitamina C de acerola',
    hookActionType: 'uv_reveal',
  },
  {
    theme: 'Placa bacteriana grossa e saburra branca acumulada na língua',
    model: 'Língua Humana Gigante Hiper-Realista com Papilas Encobertas por Crosta Branca Fétida',
    hookType: 'curiosidade',
    tag: 'Hálito & Língua',
    solutionIngredients: 'Raspador de cobre puro + Bochecho com água morna e óleo de gergelim prensado a frio',
    hookActionType: 'scraping_abrasion',
  },
  {
    theme: 'Varizes dilatadas e estagnação venosa com refluxo sanguíneo nas pernas',
    model: 'Perna Anatômica Gigante com Veias Safenas Tortuosas Dilatadas e Válvulas Rompidas',
    hookType: 'problema_visivel',
    tag: 'Circulação & Varizes',
    solutionIngredients: 'Tintura de castanha-da-índia + Gel concentrado de hamamélis + Infusão de centella asiática',
    hookActionType: 'pressure_squeeze',
  },
  {
    theme: 'Artrose severa e atrito osso com osso por perda de líquido sinovial no joelho',
    model: 'Joelho Gigante em Corte com Cartilagem Esfarelada e Superfície Óssea Esfolada',
    hookType: 'segredo',
    tag: 'Ossos & Cartilagem',
    solutionIngredients: 'Caldo de ossos gelatinoso de cozimento longo + Cloreto de magnésio P.A. + Cúrcuma e pimenta-preta',
    hookActionType: 'scraping_abrasion',
  },
  {
    theme: 'Úlcera gástrica corroída por colônia da bactéria Helicobacter pylori',
    model: 'Parede Estomacal Gigante com Cratera Vermelha Viva de Úlcera e Bactérias Espiraladas',
    hookType: 'curiosidade',
    tag: 'Estômago & Bactérias',
    solutionIngredients: 'Sumo fresco de folha de couve manteiga batida + Própolis verde alcoólico 70% + Mel puro de melipona',
    hookActionType: 'uv_reveal',
  },
  {
    theme: 'Gordura nas costas e estagnação na circulação linfática',
    model: 'Tronco Muscular Gigante com Tecido Adiposo e Linfonodos Entupidos de Resíduos',
    hookType: 'descoberta',
    tag: 'Linfático & Detox',
    solutionIngredients: 'Chá de hibisco com cavalinha + Gotas de limão siciliano + Óleo essencial de gengibre para massagem',
    hookActionType: 'pressure_squeeze',
  },
  {
    theme: 'Próstata aumentada (HPB) comprimindo a uretra e impedindo fluxo urinário',
    model: 'Bexiga e Próstata Gigante em Silicone Hipertrofiada Estrangulando o Canal Uretral',
    hookType: 'problema_visivel',
    tag: 'Saúde Masculina',
    solutionIngredients: 'Óleo de semente de abóbora extravirgem prensado a frio + Chá concentrado de saw palmetto + Zinco quelado',
    hookActionType: 'catheter_unclog',
  },
  {
    theme: 'Falta de memória e nevoeiro cerebral por metais pesados e toxinas',
    model: 'Hemisfério Cerebral Gigante com Depósitos Escuros Entre os Circuitos Neuronais',
    hookType: 'segredo',
    tag: 'Cérebro & Foco',
    solutionIngredients: 'Clorela orgânica em pó + Coentro fresco batido no suco verde + Óleo de coco MCT',
    hookActionType: 'uv_reveal',
  },
  {
    theme: 'Pedras na vesícula biliar (Cálculos de colesterol cristalizado)',
    model: 'Vesícula Biliar Gigante Translúcida Verde-Escura Repleta de Pedras Amarelas de Colesterol',
    hookType: 'problema_visivel',
    tag: 'Digestão & Fígado',
    solutionIngredients: 'Chá de boldo do chile fresco + Sumo de maçã fresca rica em ácido málico + Azeite de oliva com limão',
    hookActionType: 'pinch_extraction',
  },
  {
    theme: 'Olho seco, fadiga visual e início de degeneração macular por telas azuis',
    model: 'Globo Ocular Gigante em Corte com Vasos Retinianos Secos e Cristalino Turvo',
    hookType: 'curiosidade',
    tag: 'Visão & Olhos',
    solutionIngredients: 'Compressa morna de infusão de camomila biológica + Óleo de peixe rico em ômega-3 DHA + Cenoura fresca ralada com azeite',
    hookActionType: 'needle_injection',
  }
];

export const QUICK_STARTER_THEMES: ThemeSuggestion[] = ALL_CURATED_THEME_SUGGESTIONS.slice(0, 6);

/**
 * Utility to get randomized or paginated theme suggestions avoiding previous picks
 */
export function getRandomThemeSuggestions(count: number = 6, excludeThemes: string[] = []): ThemeSuggestion[] {
  const available = ALL_CURATED_THEME_SUGGESTIONS.filter(
    (item) => !excludeThemes.includes(item.theme)
  );

  const pool = available.length >= count ? available : ALL_CURATED_THEME_SUGGESTIONS;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

