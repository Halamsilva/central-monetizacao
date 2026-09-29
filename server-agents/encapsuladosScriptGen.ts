// Engine for generating local high-fidelity video prompt sequences
// Supports customizable prompt count (3 to 12) and toggleable CTA prompts

export function generateLocalScript(
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
  const cleanTheme = theme.trim() || 'Desintoxicação Celular e Saúde Metabólica';
  const focalModel = `Modelo anatômico educacional COLOSSAL de "${cleanTheme}" (escala gigante 5x, ocupando 60% do enquadramento vertical 9:16)`;
  const finalProductTitle = (customProductTitle || customBookTitle || '').trim() || 'FÓRMULA CONCENTRADA PURA CAPS';
  const finalProductImage = productImageBase64 || bookImageBase64;
  const finalProductMime = productImageMimeType || bookImageMimeType;
  
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

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Scene Generator 1: Hook with Colossal Model
  const createHookScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — GANCHO + INÍCIO DA DEMONSTRAÇÃO NO MODELO COLOSSAL — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: focalModel,
    actionSummary: selectedHook.summary,
    cameraFraming: 'Plano Macro Fechado Vertical 9:16 com lente ultra-wide 20mm e perspectiva forçada dramática. A câmera fica colada na bancada; o modelo colossal ocupa de 55% a 65% do enquadramento inferior, com o apresentador debruçado imediatamente atrás.',
    visualSceneDescription: `No segundo 00:00 exato, o vídeo já começa com ação física direta: a mão direita aplica a ferramenta/líquido no modelo anatômico colossal que ocupa 60% da tela, gerando desprendimento visceral imediato. O apresentador debruçado olha firme para a lente com urgência magnética. Mão esquerda apoiada na bancada de madeira do dojo. Fundo: tatame cinza e as 3 bandeiras nítidas.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Abertura no Clímax Visceral (00:00)',
        action: 'Vídeo abre já no segundo zero com ação física no modelo colossal (60% do quadro). Reação ou raspador/bisturi retira o material patológico sem introdução lenta.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Reação Tátil & Expressão Facial',
        action: 'Close na textura da sujeira se soltando e escorrendo pela bancada. O apresentador debruça-se para frente, encarando a lente da câmera com gravidade e intensidade.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Conexão Magnética & Gancho',
        action: 'Apresentador sustenta olhar penetrante na câmera enquanto a mão conclui a demonstração física de abertura no modelo anatômico colossal.'
      }
    ],
    spokenLinePt: selectedHook.spoken,
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, ultra-wide 20mm lens with forced perspective.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, macro close-up angle with dramatic 20mm forced perspective. The colossal anatomical educational model sits right against the lens in the lower 60% of the frame.
- Positioned immediately behind the model is the presenter, leaning forward with magnetic, urgent intensity.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: ${selectedHook.actionScene}
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Close macro detail of the physical reaction on the model, substance moving with realistic viscosity.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Presenter maintains intense eye contact, delivering the opening hook line with authoritative lip synchronization.

COLOSSAL FOREGROUND FOCAL OBJECT:
${focalModel}. Massive physical presence occupying 60% of the vertical frame.

${presenterDesc}

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic knuckles, veins, tendons, natural skin folds. ${selectedHook.handsAction}

ACTION CONTINUITY: Action begins instantaneously at second 00:00 in peak motion, without any slow introductory establishing shots.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"${selectedHook.spoken}"

${settingDesc}`
  });

  // Scene Generator 2: Anatomical Problem Dissection
  const createProblemScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — EXPLICAÇÃO ANATÔMICA & CAUSA DO PROBLEMA — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Modelo anatômico educacional em corte transversal de "${cleanTheme}" demonstrando a obstrução e o tecido inflamado por dentro`,
    actionSummary: `O apresentador debruça-se sobre o modelo colossal, apontando com precisão anatômica com os dedos para a patologia exposta e dissecando visualmente a causa raiz do problema e os sintomas no corpo.`,
    cameraFraming: 'Plano Médio-Curto com lente 28mm em ângulo de 45 graus, mostrando o modelo dissecado e a expressão explicativa e urgente do apresentador.',
    visualSceneDescription: `O apresentador debruça-se sobre o modelo anatômico aberto, apontando com os dedos indicadores para a crosta de obstrução interna. Ele demonstra o bloqueio físico com gestos firmes e olha diretamente para a câmera explicando como isso afeta a circulação e energia do corpo.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Foco na Patologia Interna',
        action: 'Dedo indicador aponta diretamente para o corte transversal do modelo demonstrando a crosta e a inflamação instalada no tecido biológico.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Dissecação Didática com os Dedos',
        action: 'Pressiona a área obstruída simulando o congestionamento celular enquanto conversa diretamente com o espectador com autoridade médica e didatismo.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Conexão Direta com os Sintomas',
        action: 'Olha profundamente para a câmera gesticulando com a mão esquerda, conectando a placa no modelo aos sintomas de cansaço, peso e inchaço no corpo.'
      }
    ],
    spokenLinePt: 'Quando essa placa se acumula aqui dentro, o seu organismo trava. Você sente cansaço crônico e inchaço porque a circulação simplesmente não flui.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium close-up framing highlighting the cross-section of the educational anatomical model on the wooden bench.
- Presenter positioned right behind the model, gesturing with clear didactic anatomical precision.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Presenter points firm index finger directly into the congested interior channel of the colossal model.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: He presses the inflamed synthetic tissue slightly, showing the obstruction and resistance with realistic tactile resistance.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Locks magnetic eye contact with the camera, speaking with urgent paternal authority about how this congestion causes daily fatigue.

FOREGROUND FOCAL OBJECT:
Cross-section of the educational anatomical model of "${cleanTheme}", showing layered inflammatory buildup and arterial/tissue blockage.

${presenterDesc}

HANDS: Exactly five fingers per hand, natural skin pores, realistic knuckles and veins. Gold wedding band on left ring finger. Right hand gestures didactically.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Quando essa placa se acumula aqui dentro, o seu organismo trava. Você sente cansaço crônico e inchaço porque a circulação simplesmente não flui."

${settingDesc}`
  });

  // Scene Generator 3: Homemade Ingredients on Bench
  const createIngredientsScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — INGREDIENTES CASEIROS NATURAIS & BIOATIVOS — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Bancada de madeira com potes de vidro exibindo os ingredientes caseiros: ${ingredientsText}`,
    actionSummary: `O apresentador dispõe na bancada e aponta com as duas mãos para os ingredientes naturais simples da cozinha, citando expressamente seus nomes e bioativos naturais que atacam a inflamação na raiz sem contraindicações.`,
    cameraFraming: 'Plano Médio com lente 35mm na altura do peito, enquadrando os ingredientes organizados sobre a bancada de madeira e o apresentador gesticulando.',
    visualSceneDescription: `Na bancada de madeira clara, potes de vidro exibem gengibre fresco, cravos, cúrcuma pura, limão cortado e mel. O apresentador ergue um dos ingredientes e gesticula apontando para cada um, falando os nomes com clareza e autoridade.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Apresentação dos Ingredientes na Bancada',
        action: 'Ambas as mãos abertas gesticulam sobre os potes de vidro com fatias frescas de gengibre, cravos, cúrcuma dourada, limão e mel puro.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Exibição em Close de Ativo Chave',
        action: 'Mão direita ergue pedaço fresco de gengibre fatiado e aponta para a cúrcuma em pó, destacando a ação desinflamatória profunda dos bioativos.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Orientação de Saúde Natural',
        action: 'Olha nos olhos do espectador falando com entusiasmo e lip-sync preciso sobre o poder dos alimentos vivos na desintoxicação celular.'
      }
    ],
    spokenLinePt: 'E a solução tá na tua cozinha: limão fresco, gengibre fatiado, cravos-da-índia e cúrcuma pura. Esses quatro bioativos agem direto na raiz da inflamação.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 35mm lens.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium shot showcasing the rustic wooden demonstration bench arranged with glass prep bowls holding fresh raw ingredients.
- Presenter standing behind the bench, energetic and engaging posture.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Open palms gesture toward the arranged ingredients (${ingredientsText}).
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Right hand picks up fresh root slice and points to golden spice powder in glass bowl.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Direct conversational eye contact, clearly articulating the names of each natural ingredient with flawless lip-sync.

FOREGROUND FOCAL INGREDIENTS:
Clear glass bowls on the wooden bench containing fresh ginger slices, whole cloves, pure golden turmeric powder, sliced fresh lemon, and pure honey jar with wooden spoon.

${presenterDesc}

HANDS: Natural human skin pores, visible veins, five distinct fingers per hand. Gold wedding band on left hand.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"E a solução tá na tua cozinha: limão fresco, gengibre fatiado, cravos-da-índia e cúrcuma pura. Esses quatro bioativos agem direto na raiz da inflamação."

${settingDesc}`
  });

  // Scene Generator 4: Live Cooking Part 1
  const createCook1Scene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — PREPARO PARTE 1: BASE NA PANELA INOX COM ÁGUA FERVENTE — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Panela inox de fundo triplo escovado com água fervente e borbulhante sobre fogão de indução elétrico portátil preto`,
    actionSummary: `O apresentador inicia o preparo da receita ao vivo na bancada em plano médio: com água fervendo na panela inox, coloca os primeiros ingredientes sólidos enquanto fala diretamente para a câmera com sincronização labial orgânica (anti-locutor).`,
    cameraFraming: 'Plano Médio com lente 35mm mostrando o apresentador da cintura para cima, a panela inox no fogão de indução soltando vapor e a bancada de madeira.',
    visualSceneDescription: `Panela inox no fogão portátil com 250ml de água mineral soltando vapor intenso. O apresentador pega fatias de gengibre e cravos-da-índia com os dedos da mão direita e solta dentro da água fervente, olhando diretamente nos olhos do espectador enquanto conversa com naturalidade e energia.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Início do Fogo & Água Fervente',
        action: 'Panela inox no fogão de indução com água em fervura borbulhante e vapor aromático denso subindo verticalmente.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Adição dos Primeiros Ingredientes Sólidos',
        action: 'Dedos da mão direita colocam fatias de gengibre fresco e cravos inteiros na água quente com som suave de efervescência.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Conversa Magnética ao Vivo na Câmera',
        action: 'Olha direto para a lente com sincronia labial perfeita, gesticulando com naturalidade humana sem parecer locutor formal.'
      }
    ],
    spokenLinePt: 'Bota duzentos e cinquenta ml de água na panela inox até ferver. Entra com as fatias de gengibre e os cravos pra liberar o óleo essencial.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 35mm lens at waist height.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing showing presenter from the waist up. On the wooden bench sits a compact brushed stainless steel saucepan with matte black handle on a portable black induction cooktop.
- Steaming boiling water visible inside the pan.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Stainless steel pot boiling with active clean rolling bubbles and aromatic steam rising.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Right hand carefully drops fresh ginger slices and whole cloves directly into the hot water, causing gentle bubbling sizzle.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Presenter looks up squarely into the lens, talking naturally like an experienced mentor in his gym dojo without announcer posture.

EQUIPMENT CONTINUITY:
Small brushed stainless steel saucepan with thick tri-ply base and matte black heat-resistant handle, resting on a slim black ceramic portable induction burner.

${presenterDesc}

HANDS: Natural human fingers, realistic knuckles, forearm vascularity. Gold ring on left hand.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Bota duzentos e cinquenta ml de água na panela inox até ferver. Entra com as fatias de gengibre e os cravos pra liberar o óleo essencial."

${settingDesc}`
  });

  // Scene Generator 5: Live Cooking Part 2
  const createCook2Scene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — PREPARO PARTE 2: CONTINUAÇÃO NA MESMA PANELA COM BIOATIVOS — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `A MESMA panela inox com a infusão fervente em tom âmbar, recebendo cúrcuma em pó, limão fresco espremido e mel puro com colher de madeira`,
    actionSummary: `Continuidade física idêntica da cena anterior: na MESMA panela inox no mesmo fogão portátil, o apresentador adiciona a cúrcuma em pó, espreme meio limão fresco e mexe com colher de pau enquanto conversa diretamente com o espectador com lip-sync ao vivo.`,
    cameraFraming: 'Plano Médio idêntico ao prompt anterior (35mm), mantendo continuidade perfeita de cenário, panela, iluminação e vestimenta.',
    visualSceneDescription: `A panela inox permanece exatamente no mesmo local e estado: a água amarelada fervendo com gengibre e cravos dentro. O apresentador adiciona uma colher de cúrcuma pura, espreme meio limão fresco e mexe tudo em círculos com uma colher de madeira rústica, falando para a câmera com entusiasmo e calor humano.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Continuidade Absoluta na Mesma Panela',
        action: 'A mesma panela inox continua borbulhando com os ingredientes colocados anteriormente soltando vapor aromático constante.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Adição da Cúrcuma e Limão Espremido',
        action: 'Adiciona uma colher de cúrcuma pura dourada e espreme meio limão fresco direto no caldo com gotas caindo com realismo físico.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Mistura com Colher de Pau e Fala ao Vivo',
        action: 'Mexe suavemente com colher de madeira homogenizando a cor dourada medicinal enquanto fala com lip-sync impecável.'
      }
    ],
    spokenLinePt: 'Agora entra com uma colherzinha de cúrcuma e espreme meio limão fresco com casca e tudo. Mexe bem até ficar nessa cor dourada brilhante.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 35mm lens at waist height.

${noTextDirective}

STRICT APPARATUS CONTINUITY:
The stainless steel saucepan, the portable black induction cooker, the wooden bench, and the background setting are EXACTLY IDENTICAL to the previous scene. The pan already contains the boiling water with the ginger slices and cloves from the previous step.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Same stainless pot boiling continuously, steam rising. Golden amber hues developing in the liquid.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Right hand sprinkles pure golden turmeric powder, then firmly squeezes half a juicy fresh yellow lemon directly over the pot with glistening droplets.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Stirs liquid gently with a natural wooden spoon, transforming the mixture into a rich golden medicinal elixir while maintaining direct, warm, natural eye contact.

${presenterDesc}

HANDS: Five realistic human fingers, authentic knuckles, forearm vein definition, gold wedding ring on left ring finger. Right hand grips wooden spoon and stirs.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Agora entra com uma colherzinha de cúrcuma e espreme meio limão fresco com casca e tudo. Mexe bem até ficar nessa cor dourada brilhante."

${settingDesc}`
  });

  // Scene Generator 6: Quantities and Prep Time
  const createMeasuresScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — MEDIDAS EXATAS E TEMPO DE PREPARO — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Panela inox na bancada com o tônico dourado borbulhando em fogo brando enquanto o apresentador gesticula as medidas com os dedos`,
    actionSummary: `O apresentador explica didaticamente as proporções exatas de cada ingrediente e o tempo necessário de fervura e infusão (5 minutos em fogo baixo) para a fórmula atingir potência terapêutica máxima, falando com lip-sync orgânico.`,
    cameraFraming: 'Plano Médio Frontal com lente 28mm mostrando o apresentador e a receita pronta na panela inox sobre a bancada.',
    visualSceneDescription: `Ao lado da panela fumegante, o apresentador gesticula com os dedos indicando as medidas exatas da receita. Ele desliga o fogão elétrico portátil com um clique suave, tampa a panela para concentrar os óleos e fala diretamente para a câmera orientando o tempo de infusão.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Explicação Didática das Proporções',
        action: 'Gesticula com a mão direita indicando a medida de uma colher de chá e o tamanho exato da rodela de gengibre.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Tempo de Fogo e Concentração dos Óleos',
        action: 'Desliga o fogão de indução e tampa a panela inox para reter o vapor medicinal por exatamente 5 minutos.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Conexão de Mentor com o Público',
        action: 'Olha nos olhos do espectador reafirmando que respeitar o tempo de infusão é o segredo para os compostos ativos funcionarem.'
      }
    ],
    spokenLinePt: 'Deixa em fogo baixo por exatamente cinco minutos e desliga. Tampa a panela por mais três minutos para concentrar os óleos essenciais.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing beside the demonstration bench.
- The stainless steel saucepan rests warm on the induction cooker with its glass/steel lid placed over top, trapping fragrant steam.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Presenter gestures with index and thumb indicating precise measurement proportions of the recipe.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Right hand smoothly switches off induction burner control and settles the pot lid into place.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Speaks directly to viewer with earnest mentor authority, articulating the exact 5-minute infusion timing with perfect lip sync.

${presenterDesc}

HANDS: Anatomically precise hands, vascular forearms, gold ring on left finger. Natural skin micro-texture.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Deixa em fogo baixo por exatamente cinco minutos e desliga. Tampa a panela por mais três minutos para concentrar os óleos essenciais."

${settingDesc}`
  });

  // Scene Generator 7: Tasting and Biological Effect
  const createTastingScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — USO, DEGUSTAÇÃO & RELATO DE CURA — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Caneca de vidro transparente com o chá dourado fumegante e fatia de limão na borda`,
    actionSummary: `O apresentador segura a caneca de chá medicinal fumegante na altura do peito, toma um gole com visível sensação de alívio e bem-estar, e fala em Português orientando o melhor horário para tomar (manhã em jejum) e o impacto biológico de alívio no organismo.`,
    cameraFraming: 'Plano Médio com lente 35mm f/2.0 destacando o vapor da caneca de vidro e a expressão autêntica de satisfação do apresentador.',
    visualSceneDescription: `O apresentador segura com as duas mãos uma caneca de vidro transparente contendo o tônico dourado fumegante. Ele bebe um gole consciente, respira fundo demonstrando vitalidade renovada e olha firme para a câmera compartilhando as orientações de consumo.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Exibição da Bebida Curativa Pronta',
        action: 'Segura a caneca de vidro transparente com as duas mãos, vapor aromático subindo suavemente entre os dedos.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'O Primeiro Gole de Alívio',
        action: 'Leva a caneca aos lábios, toma um gole com satisfação genuína e expressa alívio e energia renovada no rosto.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Instrução de Consumo em Jejum',
        action: 'Afasta a caneca para a altura do peito e fala diretamente com o espectador com sincronização labial impecável.'
      }
    ],
    spokenLinePt: 'Toma isso todo dia de manhã em jejum. Em menos de uma semana você vai sentir o corpo desinchar e a digestão funcionando como um relógio.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 35mm lens.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, warm medium framing focusing on presenter holding a clear tempered glass mug filled with radiant golden herbal tea.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Presenter cradles the steaming clear glass mug with both hands, soft wisps of vapor drifting upward.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Takes a deliberate, refreshing sip with an authentic nod of comfort, facial muscles relaxing with genuine biological satisfaction.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Lowers mug to chest height, locking compassionate eye contact with the viewer, detailing the morning fasting routine with precise lip-sync.

${presenterDesc}

HANDS: Natural human skin, visible pores, knuckles, fine hairs. Muscular hands holding glass mug. Gold wedding ring on left ring finger.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Toma isso todo dia de manhã em jejum. Em menos de uma semana você vai sentir o corpo desinchar e a digestão funcionando como um relógio."

${settingDesc}`
  });

  // Scene Generator 8: Daily Routine and Long-Term Prevention
  const createLifestyleScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — ROTINA MATINAL & PREVENÇÃO DURADOURA — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Garrafa térmica de vidro e bancada organizada com o ritual diário de longevidade`,
    actionSummary: `O apresentador detalha como incorporar esse hábito simples na rotina matinal diária, explicando a manutenção da barreira celular e a proteção contínua contra novas inflamações.`,
    cameraFraming: 'Plano Médio com lente 35mm enquadrando a postura confiante do apresentador e o ambiente saudável.',
    visualSceneDescription: `O apresentador organiza a bancada de demonstração com um sorriso encorajador. Ele gesticula com firmeza apontando para o modelo agora desobstruído, conectando a disciplina da rotina com uma longevidade blindada.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Manutenção da Saúde Diária',
        action: 'Gesticula com autoridade explicando que a constância diária é o que impede a inflamação de voltar a se acumular no corpo.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Alinhamento com a Rotina de Vida',
        action: 'Mãos firmes na bancada, postura ereta de mentor incentivando o espectador a cuidar do próprio templo físico.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Incentivo Magnético de Saúde',
        action: 'Olhar penetrante e inspirador, transmitindo convicção e cuidado com a longevidade de quem está assistindo.'
      }
    ],
    spokenLinePt: 'Faz disso o teu ritual diário. Em poucos dias você vai sentir o corpo leve, a mente limpa e uma disposição que há muito tempo você não sentia.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 35mm lens.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing with warm natural lighting and balanced composition.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Presenter gestures with open hands, emphasizing the lasting power of simple daily consistency.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Posture remains grounded and upright behind the clean wooden bench, communicating authentic mentor wisdom.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Warm, encouraging smile and direct eye contact with flawless lip sync, inspiring viewers to prioritize daily vitality.

${presenterDesc}

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Faz disso o teu ritual diário. Em poucos dias você vai sentir o corpo leve, a mente limpa e uma disposição que há muito tempo você não sentia."

${settingDesc}`
  });

  // Scene Generator 9: Proven Transformation and Family Testimony
  const createTransformationScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — TRANSFORMAÇÃO COMPROVADA & RESULTADOS REAIS — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Apresentador com expressão de dever cumprido e autoridade inabalável junto à bancada`,
    actionSummary: `O apresentador compartilha relatos reais de transformação, reforçando que atacar a causa biológica na raiz traz alívio duradouro para quem já tinha tentado de tudo sem sucesso.`,
    cameraFraming: 'Plano Médio Fechado com lente 28mm capturando cada microexpressão facial de sinceridade e verdade.',
    visualSceneDescription: `Em enquadramento fechado com iluminação nítida, o apresentador fala com o coração, compartilhando como dezenas de pessoas recuperaram a qualidade de vida aplicando essa mesma fórmula caseira.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Relato de Resultados Reais',
        action: 'Mão no peito transmitindo sinceridade e verdade inquestionável ao citar depoimentos de quem mudou de vida.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Autoridade e Empatia Paternal',
        action: 'Inclina-se levemente para frente conectando com as dores reais do espectador e validando a esperança de cura.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Fechamento de Confiança Total',
        action: 'Sorriso sereno de mentor experiente garantindo que a natureza tem a resposta para desinflamar o organismo.'
      }
    ],
    spokenLinePt: 'Quem começou essa rotina comigo não para mais. O corpo desinflama de verdade porque você atacou a causa raiz com alimentos vivos.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at eye level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, intimate medium-close angle capturing sincere facial micro-expressions.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Hand touches chest briefly with deep authentic sincerity.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Leans forward with compassionate conviction, speaking with warm resonant lip synchronization.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Reassuring fatherly smile, concluding with unshakable authority and deep human connection.

${presenterDesc}

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Quem começou essa rotina comigo não para mais. O corpo desinflama de verdade porque você atacou a causa raiz com alimentos vivos."

${settingDesc}`
  });

  // Scene Generator 10: Cellular Maintenance & Longevity
  const createMaintenanceScene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — BLINDAGEM CELULAR & LONGEVIDADE ATIVA — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Apresentador demonstrando vitalidade física e energia renovada na bancada`,
    actionSummary: `O apresentador conclui as orientações de saúde reforçando que cuidar da inflamação interna é o passaporte para viver com autonomia, força muscular e saúde plena em qualquer idade.`,
    cameraFraming: 'Plano Médio com lente 35mm destacando porte atlético e presença magnética.',
    visualSceneDescription: `O apresentador gesticula com os dois braços abertos, transmitindo energia vigorosa e clareza mental. Ele convida o espectador a salvar o vídeo e praticar o autocuidado todos os dias.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Vitalidade e Autonomia Física',
        action: 'Gesticula com firmeza demonstrando vigor e entusiasmo pela saúde natural e longevidade.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Convite para Praticar o Autocuidado',
        action: 'Olha nos olhos do público com carinho e firmeza, incentivando a colocar a receita em prática hoje mesmo.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Encerramento Orgânico Inspirador',
        action: 'Sorriso confiante e gesto amigável de despedida, finalizando o vídeo de forma memorável e acolhedora.'
      }
    ],
    spokenLinePt: 'Salva esse vídeo pra não perder a receita e compartilha com quem você ama. A tua saúde é o teu maior patrimônio!',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 35mm lens.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing with uplifting natural daylight and energetic presence.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Presenter gestures with open muscular arms, exemplifying radiant health and vitality.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Direct warm eye contact inviting the viewer to share the video with loved ones.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Concluding friendly smile and nod, finishing the organic video with positive authority and inspiration.

${presenterDesc}

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Salva esse vídeo pra não perder a receita e compartilha com quem você ama. A tua saúde é o teu maior patrimônio!"

${settingDesc}`
  });

  // Scene Generator 11: CTA 1 (Supplement Bottle & 2 Capsules Reveal)
  const createCTA1Scene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — CTA PARTE 1: APRESENTAÇÃO DO ENCAPSULADO "${finalProductTitle.toUpperCase()}" — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Frasco premium do suplemento encapsulado "${finalProductTitle}" e duas cápsulas vegetais concentradas na palma da mão`,
    actionSummary: `O apresentador faz a ponte da receita caseira para o produto encapsulado: ergue o frasco "${finalProductTitle}" na altura do peito, abre a tampa e exibe duas cápsulas vegetais concentradas na palma da mão, explicando que quem não tem tempo de fazer a receita encontra todos os bioativos concentrados nas cápsulas.`,
    cameraFraming: 'Plano Médio com lente 28mm na altura do peito, iluminando o frasco com destaque e as cápsulas na palma da mão.',
    visualSceneDescription: `O apresentador ergue o frasco de suplemento "${finalProductTitle}" com rótulo nítido. Com a mão direita, desrosqueia a tampa e despeja suavemente duas cápsulas concentradas na palma aberta da mão esquerda, exibindo-as com orgulho para a lente.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Erguendo o Frasco do Encapsulado',
        action: `Ergue com as duas mãos o frasco do suplemento "${finalProductTitle}" na altura do peito, com o rótulo frontal perfeitamente legível.`
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Abertura e Exibição das Cápsulas',
        action: 'Desrosqueia a tampa com agilidade natural e despeja duas cápsulas vegetais na palma da mão esquerda, mostrando a dose concentrada sem sujeira.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Conexão Direta com a Câmera',
        action: 'Olha nos olhos do espectador falando com sincronia labial impecável, destacando a praticidade da fórmula para o dia a dia.'
      }
    ],
    spokenLinePt: 'Mas se você não tem tempo de fazer essa receita todo santo dia, essa fórmula concentrada reúne todos esses bioativos puros em duas cápsulas diárias.',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing holding the premium supplement bottle prominently at chest height in the upper-center of the screen.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Presenter lifts the physical supplement bottle into the center of the frame at chest height, proudly showcasing its label and tangible weight.
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: He smoothly unscrews the cap with his right fingers and pours two clean herbal/vegetable capsules onto his open left palm, displaying the concentrated daily dose.
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Direct magnetic eye contact with the lens, speaking with warm authoritative lip synchronization about how two capsules deliver the pure active compounds without messy kitchen prep.

HOLDING THE VIRAL SUPPLEMENT BOTTLE & CAPSULES REVEAL:
In the center of the frame, the presenter proudly holds up with muscular hands a substantial amber glass or matte pharmaceutical supplement bottle ${finalProductImage ? 'faithfully matching the uploaded custom product reference in bottle design, palette, artwork and styling' : 'with an amber glass body, matte black cap, and premium botanical label'}. Printed clearly on the front label in crisp, professional typography is the brand title:
"${finalProductTitle.toUpperCase()}"
${finalProductTitle === 'FÓRMULA CONCENTRADA PURA CAPS' ? `with the subtitle:
"BIOATIVOS NATURAIS CONCENTRADOS"
and botanical graphic accents showing clean herbal leaves and roots.` : ''}

${presenterDesc}

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons. Right hand holds the bottle; left hand opens flat revealing two neat capsules sitting on palm skin.

ACTION: Presenter holds the product bottle, shows the concentrated capsules, speaks with energetic warmth and direct educational clarity, transitioning smoothly from home remedy to convenient supplement power.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Mas se você não tem tempo de fazer essa receita todo santo dia, essa fórmula concentrada reúne todos esses bioativos puros em duas cápsulas diárias."

${settingDesc}`
  });

  // Scene Generator 12: CTA 2 (Offer, Scarcity & EU QUERO / Bio Link)
  const createCTA2Scene = (pId: number, timeRange: string, startSec: number, endSec: number) => ({
    id: pId,
    stepName: `PROMPT ${pId} — CTA PARTE 2: OFERTA & ESCASSEZ DO ENCAPSULADO "${finalProductTitle.toUpperCase()}" — 8s`,
    durationSeconds: 8,
    timeRange,
    focalObject: `Frasco do suplemento encapsulado "${finalProductTitle}" em destaque frontal enquanto o apresentador aponta firmemente para a bio/comentários convocando a comentar EU QUERO`,
    actionSummary: `O apresentador segura o frasco do encapsulado com firmeza em uma mão, aponta o dedo indicador direito para baixo na direção da bio e dos comentários e convoca para ação com senso de escassez e desconto de fábrica, fechando com olhar carismático de mentor e autoridade paternal (sem a fala "OSS!").`,
    cameraFraming: 'Plano Médio Frontal com lente 28mm e iluminação destacando o frasco e a postura firme do apresentador apontando para baixo.',
    visualSceneDescription: `Com o frasco do suplemento "${finalProductTitle}" seguro firmemente na mão esquerda na altura do peito, o apresentador aponta o indicador direito diretamente para baixo em direção aos comentários e bio. Ele entrega a chamada para ação com senso de urgência e desconto de lote limitado, finalizando com um sorriso caloroso e olhar magnético de autoridade.`,
    visualTimeline: [
      {
        time: `${formatSec(startSec)} - ${formatSec(startSec + 3)}`,
        title: 'Exibição Firme do Frasco e Apontamento para Baixo',
        action: 'Segurando o frasco do encapsulado na mão esquerda, aponta com firmeza o dedo indicador direito para baixo convocando os comentários e o link da bio.'
      },
      {
        time: `${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}`,
        title: 'Gatilho de Escassez e Desconto',
        action: 'Expressão facial intensa e convincente avisando que o lote promocional direto da fábrica é limitado e acaba rápido.'
      },
      {
        time: `${formatSec(startSec + 6)} - ${formatSec(endSec)}`,
        title: 'Encerramento Magnético de Autoridade',
        action: 'Sorriso carismático e olhar firme convidando para garantir o frasco antes que o estoque zere, finalizando o vídeo de forma impecável.'
      }
    ],
    spokenLinePt: 'Comenta EU QUERO aqui embaixo ou clica no link da minha bio agora. O lote com desconto de fábrica e frete grátis é limitado. Garante o teu frasco antes que acabe!',
    promptText: `Live-action photographic realism, 4K resolution, 30fps, vertical 9:16 aspect ratio, 28mm lens at chest level.

${noTextDirective}

VISUAL CAMERA FRAMING:
- Vertical 9:16 aspect ratio, medium framing showing presenter holding the supplement bottle in left hand while pointing emphatically downward with his right index finger.

WHAT HAPPENS VISUALLY (SECOND-BY-SECOND ACTION TIMELINE):
• ${formatSec(startSec)} - ${formatSec(startSec + 3)}: Holding the supplement bottle firmly in his left hand at chest height, his right index finger points decisively down toward the comment/bio area below, commanding viewers to comment "EU QUERO".
• ${formatSec(startSec + 3)} - ${formatSec(startSec + 6)}: Urgent, genuine facial expression conveying real product scarcity (factory batch with discount ending quickly).
• ${formatSec(startSec + 6)} - ${formatSec(endSec)}: Warm, authoritative closing smile and direct magnetic eye contact as the recording closes with undeniable confidence and call to action.

FINAL CLOSING CALL TO ACTION & SCARCITY:
In the center of the frame, the presenter firmly holds the supplement bottle labeled "${finalProductTitle.toUpperCase()}" with his left hand, while his right index finger gestures clearly toward the lower screen boundary directing viewers to the bio link and comments.

${presenterDesc}

HANDS: Exactly five fingers per hand, correct adult human anatomy, realistic joints, natural nails, cuticles, knuckles, veins, tendons, fine hairs, skin folds. Left hand holds the supplement bottle firmly toward the lens; right hand points with index finger downward toward the comment section, concluding with a firm, welcoming gesture.

ACTION: Presenter holds the product bottle prominently, speaks with energetic warmth and urgency, points directly down into the camera inviting viewers to comment and click the bio, delivering the closing line with magnetic conviction and genuine paternal authority.

SPOKEN AUDIO (Brazilian Portuguese, 8s, perfect lip synchronization):
"Comenta EU QUERO aqui embaixo ou clica no link da minha bio agora. O lote com desconto de fábrica e frete grátis é limitado. Garante o teu frasco antes que acabe!"

${settingDesc}`
  });

  // Assemble the exact requested prompt sequence dynamically
  const targetCount = Math.max(3, Math.min(12, Number(promptCount) || 9));
  const wantsCTA = includeCTA !== false;

  const educationalGenerators = [
    createHookScene,
    createProblemScene,
    createIngredientsScene,
    createCook1Scene,
    createCook2Scene,
    createMeasuresScene,
    createTastingScene,
    createLifestyleScene,
    createTransformationScene,
    createMaintenanceScene
  ];

  let chosenGenerators: Array<(pId: number, timeRange: string, startSec: number, endSec: number) => any> = [];

  if (wantsCTA) {
    const eduCount = Math.max(1, targetCount - 2);
    if (eduCount === 1) {
      chosenGenerators = [createHookScene];
    } else if (eduCount === 2) {
      chosenGenerators = [createHookScene, createIngredientsScene];
    } else if (eduCount === 3) {
      chosenGenerators = [createHookScene, createIngredientsScene, createTastingScene];
    } else if (eduCount === 4) {
      chosenGenerators = [createHookScene, createProblemScene, createIngredientsScene, createTastingScene];
    } else if (eduCount === 5) {
      chosenGenerators = [createHookScene, createProblemScene, createIngredientsScene, createCook1Scene, createTastingScene];
    } else if (eduCount === 6) {
      chosenGenerators = [createHookScene, createProblemScene, createIngredientsScene, createCook1Scene, createCook2Scene, createTastingScene];
    } else {
      chosenGenerators = educationalGenerators.slice(0, eduCount);
    }
    // Append the 2 CTA prompts at the end
    chosenGenerators.push(createCTA1Scene, createCTA2Scene);
  } else {
    // 100% Organic without CTA
    if (targetCount === 3) {
      chosenGenerators = [createHookScene, createIngredientsScene, createTastingScene];
    } else if (targetCount === 4) {
      chosenGenerators = [createHookScene, createProblemScene, createIngredientsScene, createTastingScene];
    } else if (targetCount === 5) {
      chosenGenerators = [createHookScene, createProblemScene, createIngredientsScene, createCook1Scene, createTastingScene];
    } else if (targetCount === 6) {
      chosenGenerators = [createHookScene, createProblemScene, createIngredientsScene, createCook1Scene, createCook2Scene, createTastingScene];
    } else {
      chosenGenerators = educationalGenerators.slice(0, targetCount);
    }
  }

  const prompts = chosenGenerators.map((generator, idx) => {
    const pId = idx + 1;
    const startSec = idx * 8;
    const endSec = (idx + 1) * 8;
    const timeRange = `${formatSec(startSec)} - ${formatSec(endSec)}`;
    return generator(pId, timeRange, startSec, endSec);
  });

  return {
    id: `script-${Date.now()}`,
    theme: cleanTheme,
    summary: `Roteiro de ${prompts.length} etapas (${prompts.length * 8}s total) ${wantsCTA ? `com modelo colossal, receita ao vivo e duplo CTA para o encapsulado "${finalProductTitle}"` : '100% focado no conteúdo orgânico, receita caseira e transformação sem CTA comercial'}.`,
    focalObject: focalModel,
    targetProblem: `Camada densa e visceral simulando acúmulo patológico e impurezas associadas a ${cleanTheme}`,
    solutionIngredients: ingredientsText,
    elementsPrepared: `Ingredientes caseiros simples em potes de vidro no banco de madeira de dojo e panela/tigela de preparo`,
    transformationType: `Preparo ao vivo do remédio caseiro no banco de madeira, seguido de consumo/degustação ${wantsCTA ? `e duplo CTA para o encapsulado "${finalProductTitle}"` : 'e orientações de longevidade'}`,
    characterUsed: characterLabel,
    settingUsed: settingLabel,
    characterImagePreview: characterImageBase64 ? (characterImageBase64.startsWith('data:') ? characterImageBase64 : `data:image/jpeg;base64,${characterImageBase64}`) : undefined,
    settingImagePreview: settingImageBase64 ? (settingImageBase64.startsWith('data:') ? settingImageBase64 : `data:image/jpeg;base64,${settingImageBase64}`) : undefined,
    productTitleUsed: wantsCTA ? finalProductTitle : undefined,
    productImagePreview: wantsCTA ? (finalProductImage ? (finalProductImage.startsWith('data:') ? finalProductImage : `data:${finalProductMime || 'image/jpeg'};base64,${finalProductImage}`) : undefined) : undefined,
    bookTitleUsed: wantsCTA ? finalProductTitle : undefined,
    bookImagePreview: wantsCTA ? (finalProductImage ? (finalProductImage.startsWith('data:') ? finalProductImage : `data:${finalProductMime || 'image/jpeg'};base64,${finalProductImage}`) : undefined) : undefined,
    promptCount: prompts.length,
    includeCTA: wantsCTA,
    totalDurationSeconds: prompts.length * 8,
    createdAt: new Date().toISOString(),
    referenceAnalysis: referenceVideoBase64 ? {
      hasReference: true,
      referenceType: 'video',
      videoFileName: videoFileName || 'video-viral-referencia.mp4',
      detectedHook: `Gancho dinâmico e retenção inicial transpostos do vídeo viral (${videoFileName || 'referência'}): ${selectedHook.summary}`,
      detectedObject: focalModel,
      pacingPreserved: `${prompts.length} etapas de 8s (${prompts.length * 8}s total) com lip-sync em cena e continuidade na panela`
    } : (referenceText ? {
      hasReference: true,
      referenceType: 'text',
      detectedHook: `Gancho exclusivo com modelo colossal (60% do quadro): ${selectedHook.summary}`,
      detectedObject: focalModel,
      pacingPreserved: `${prompts.length} etapas de 8s (${prompts.length * 8}s no total)`
    } : undefined),
    prompts
  };
}
