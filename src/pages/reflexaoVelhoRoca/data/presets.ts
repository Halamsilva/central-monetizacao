import { ThemeItem, EnvironmentPreset, ReflectionScript } from '../types';

export const INITIAL_THEMES: ThemeItem[] = [
  {
    id: 1,
    title: "A vida devolve aquilo que você planta",
    description: "Sobre a lei da semeadura, a ilusão da impunidade de quem faz o mal e o silêncio da colheita que nunca falha.",
    category: "Semeadura & Consequências",
    hookPreview: "Quem fez inferno na sua vida hoje, amanhã vai ter que beber da própria fumaça."
  },
  {
    id: 2,
    title: "Quem só procura você quando precisa",
    description: "Sobre amizades interesseiras, o valor do silêncio e como reconhecer quem realmente caminha ao seu lado nos dias nublados.",
    category: "Interesse & Falsidade",
    hookPreview: "Cobra não avisa quando vai dar o bote, mas a gente aprende a olhar a grama torta."
  },
  {
    id: 3,
    title: "Filhos que esquecem dos pais depois de adultos",
    description: "A dor silenciosa do ninho vazio, o envelhecimento na roça e o amor paterno que continua esperando sem guardar rancor.",
    category: "Família & Gratidão",
    hookPreview: "Você já viu como uma casa grande fica pequena e fria quando os filhos acham que não precisam mais de raiz?"
  },
  {
    id: 4,
    title: "O perigo de confiar novamente em quem já te traiu",
    description: "Sobre o perdão que pacifica a alma versus a ingenuidade de colocar a mão no mesmo ninho de vespas.",
    category: "Confiança & Caráter",
    hookPreview: "A ingratidão é o único bicho que morde a mão depois de comer na palma."
  },
  {
    id: 5,
    title: "Pessoas que percebem seu valor somente depois que te perdem",
    description: "A cegueira do orgulho, a brevidade dos dias e o arrependimento tardio de quem desprezou a mão estendida.",
    category: "Arrependimento & Tempo",
    hookPreview: "Tem gente que joga fora a água limpa da fonte e depois chora de sede na lama."
  }
];

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "varanda-banco",
    name: "Varanda de madeira com banco rústico",
    description: "Casa rústica caiada, banco de peroba envelhecida, pilares de madeira e vista para as montanhas ao fundo.",
    timeOfDay: "Entardecer com luz dourada natural"
  },
  {
    id: "porteira-estrada",
    name: "Porteira rústica e estrada de terra",
    description: "Cerca de mourão antigo de aroeira e arame farpado, estrada vermelha sinuosa e pasto calmo ao longe.",
    timeOfDay: "Manhã fresca com bruma suave e sol nascendo"
  },
  {
    id: "fogao-lenha",
    name: "Cozinha rural com fogão a lenha",
    description: "Cozinha simples do sítio, fumaça sutil subindo da chaminé, bule esmaltado e paredes rústicas aconchegantes.",
    timeOfDay: "Luz suave entrando pela janela de madeira aberta"
  },
  {
    id: "debaixo-arvore",
    name: "Sombra de uma mangueira centenária",
    description: "Terreiro limpo varrido, tronco largo com raízes profundas na terra vermelha e folhagens balançando suavemente.",
    timeOfDay: "Fim de tarde morno com vento leve"
  }
];

export const SAMPLE_SAVED_SCRIPT: ReflectionScript = {
  id: "script-semeadura-01",
  title: "A vida devolve aquilo que você planta",
  theme: "A vida devolve aquilo que você planta",
  environment: "Varanda de madeira com banco rústico",
  lighting: "Luz dourada do entardecer da roça brasileira",
  clothing: "Camisa xadrez desgastada de algodão, chapéu de palha tradicional com aba flexível, botinas de couro velhas",
  createdAt: "2026-09-07T17:00:00Z",
  prompts: [
    {
      index: 1,
      stageName: "Prompt 1 — Gancho",
      cameraAngle: "Plano médio vertical 9:16 estilo smartphone documental 4K HDR",
      characterAction: "O senhor de 80 anos está sentado no banco de madeira desgastada, olhando pausadamente para a câmera com olhar calmo e experiente, respirando suavemente.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits quietly on a weathered wooden bench on the humble porch of a rural Brazilian farmhouse during golden hour. Soft natural light, skin texture with authentic age spots and wrinkles preserved, very subtle breathing movement, natural blinking. He looks directly at the camera and speaks calmly with deep life experience. No actors, no artificial lighting, no cinema gimmicks.",
      spokenDialogue: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu.",
      estimatedSeconds: 8,
      hookStyle: "Choque de Realidade",
      narrativeConnector: "Abertura impactante que fisga a atenção",
      alternativeHooks: [
        {
          style: "Choque de Realidade",
          text: "Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu."
        },
        {
          style: "Metáfora da Roça",
          text: "Árvore que dá fruto bom é a que mais leva pedrada de quem não planta."
        },
        {
          style: "Pergunta Direta",
          text: "Você já reparou como o silêncio às vezes machuca muito mais do que uma bofetada?"
        },
        {
          style: "Sabedoria de Raiz",
          text: "Meu finado pai já dizia: nunca confunda quem te aplaude com quem te segura."
        },
        {
          style: "Verdade Crua",
          text: "O caixão não tem gaveta e a terra nunca cobrou aluguel de ninguém nessa vida."
        },
        {
          style: "Alerta de Caráter",
          text: "Cobra não avisa o bote; desconfie de quem te cerca de agrado doce demais."
        }
      ],
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits quietly on a weathered wooden bench on the humble porch of a rural Brazilian farmhouse during golden hour. Soft natural light, skin texture with authentic age spots and wrinkles preserved, very subtle breathing movement, natural blinking. He looks directly at the camera and speaks calmly with deep life experience.

Spoken dialogue in Brazilian Portuguese:
"Quem fez inferno na sua vida hoje, amanhã vai beber da própria fumaça que acendeu."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 2,
      stageName: "Prompt 2 — Conexão com o Gancho",
      cameraAngle: "Enquadramento ligeiramente mais aproximado, plano médio-curto vertical 9:16",
      characterAction: "Ele apoia as mãos calejadas sobre os joelhos, faz um pequeno gesto com a mão direita e desvia o olhar sutilmente para o pasto antes de voltar a olhar nos olhos de quem assiste.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits quietly on a weathered wooden bench on the humble porch of a rural Brazilian farmhouse during golden hour. Slightly closer framing. He rests his weathered calloused hands on his knees, gestures subtly with his right hand, and speaks slowly with calm authority. Soft golden light catches the wrinkles around his eyes. Subtle natural breathing and camera sway as if held by a smartphone in hand.",
      spokenDialogue: "Porque a vida anota direitinho cada semente ruim jogada na terra alheia, sem esquecer nada.",
      estimatedSeconds: 8,
      narrativeConnector: "Explica a causa do gancho conectando com a lei da semeadura",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits quietly on a weathered wooden bench on the humble porch of a rural Brazilian farmhouse during golden hour. Slightly closer framing. He rests his weathered calloused hands on his knees, gestures subtly with his right hand, and speaks slowly with calm authority. Soft golden light catches the wrinkles around his eyes. Subtle natural breathing and camera sway as if held by a smartphone in hand.

Spoken dialogue in Brazilian Portuguese:
"Porque a vida anota direitinho cada semente ruim jogada na terra alheia, sem esquecer nada."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 3,
      stageName: "Prompt 3 — Continuação no Tempo",
      cameraAngle: "Plano médio vertical 9:16, ângulo sutilmente lateral mantendo a mesma cena e luz",
      characterAction: "Ele balança levemente a cabeça com serenidade, como quem já viu muitas estações passarem e conhece o resultado das coisas.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits on a weathered wooden bench on the porch of a rural Brazilian farmhouse during golden hour. Gentle warm sunset illumination. The elder tilts his head slightly with quiet contemplation, taking a measured breath before delivering his line directly to the lens with grave, humble wisdom.",
      spokenDialogue: "O tempo pode até fingir demora, mas nunca deixa de cobrar cada passo torto que deram.",
      estimatedSeconds: 8,
      narrativeConnector: "Aprofunda a passagem do tempo e a certeza da cobrança",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits on a weathered wooden bench on the porch of a rural Brazilian farmhouse during golden hour. Gentle warm sunset illumination. The elder tilts his head slightly with quiet contemplation, taking a measured breath before delivering his line directly to the lens with grave, humble wisdom.

Spoken dialogue in Brazilian Portuguese:
"O tempo pode até fingir demora, mas nunca deixa de cobrar cada passo torto que deram."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 4,
      stageName: "Prompt 4 — Consequência Inevitável",
      cameraAngle: "Plano vertical 9:16 detalhando a expressão serena e firme do rosto marcado pelo tempo",
      characterAction: "O senhor ajusta discretamente a aba do chapéu de palha com os dedos calejados e fixa o olhar sincero na câmera.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting on the rustic wooden porch bench of a Brazilian country house. Close-up vertical framing emphasizing realistic facial texture, crow's feet, and weathered skin. He gently adjusts the brim of his straw hat with calloused fingers, looking intently at the viewer with an honest, unhurried expression.",
      spokenDialogue: "E quando essa conta chega, a tempestade desce e arranca do chão quem não tem raiz.",
      estimatedSeconds: 8,
      narrativeConnector: "Consequência prática com a força da metáfora da tempestade",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting on the rustic wooden porch bench of a Brazilian country house. Close-up vertical framing emphasizing realistic facial texture, crow's feet, and weathered skin. He gently adjusts the brim of his straw hat with calloused fingers, looking intently at the viewer with an honest, unhurried expression.

Spoken dialogue in Brazilian Portuguese:
"E quando essa conta chega, a tempestade desce e arranca do chão quem não tem raiz."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 5,
      stageName: "Prompt 5 — Virada para o Ouvinte",
      cameraAngle: "Plano médio vertical 9:16 com fundo mostrando a cerca e árvores ao entardecer",
      characterAction: "Ele aponta sutilmente para o chão de terra batida e solta um suspiro leve de experiência vivida.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting on the wooden bench of a simple rural porch in Brazil at sunset. Warm golden amber sunlight. He gestures subtly toward the soil with his index finger, exhaling gently as he speaks a profound truth learned from a lifetime of soil and seasons.",
      spokenDialogue: "Enquanto a maldade tropeça na própria vala, você não deve gastar a sua paz revidando.",
      estimatedSeconds: 8,
      narrativeConnector: "Contraste entre a ruína do injusto e a postura digna do ouvinte",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting on the wooden bench of a simple rural porch in Brazil at sunset. Warm golden amber sunlight. He gestures subtly toward the soil with his index finger, exhaling gently as he speaks a profound truth learned from a lifetime of soil and seasons.

Spoken dialogue in Brazilian Portuguese:
"Enquanto a maldade tropeça na própria vala, você não deve gastar a sua paz revidando."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 6,
      stageName: "Prompt 6 — Conselho Prático",
      cameraAngle: "Plano vertical 9:16 íntimo e acolhedor",
      characterAction: "Ele inclina o corpo ligeiramente para frente, com olhar paternal e compassivo, sem agressividade.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits on a wooden bench on the porch of a rural home. He leans slightly forward with a compassionate, paternal posture, speaking softly directly to someone he wishes to comfort. Golden evening light softly illuminating the side of his weathered face.",
      spokenDialogue: "Nunca suje as suas mãos com vingança: cuide da sua lida e guarde o seu coração.",
      estimatedSeconds: 8,
      narrativeConnector: "Conselho prático de honra e preservação da paz interior",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. He sits on a wooden bench on the porch of a rural home. He leans slightly forward with a compassionate, paternal posture, speaking softly directly to someone he wishes to comfort. Golden evening light softly illuminating the side of his weathered face.

Spoken dialogue in Brazilian Portuguese:
"Nunca suje as suas mãos com vingança: cuide da sua lida e guarde o seu coração."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 7,
      stageName: "Prompt 7 — Conclusão de Paz",
      cameraAngle: "Plano médio vertical 9:16",
      characterAction: "Ele coloca a mão no peito, com sorriso quase imperceptível de paz interior e integridade.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting on the porch of a rural Brazilian home at golden dusk. He places his weathered hand over his chest with quiet dignity, gazing deeply into the camera lens with absolute serenity.",
      spokenDialogue: "No fim das contas, a terra nunca erra: quem plantou com honra deita e dorme sereno.",
      estimatedSeconds: 8,
      narrativeConnector: "Conclusão memorável de integridade recompensada",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting on the porch of a rural Brazilian home at golden dusk. He places his weathered hand over his chest with quiet dignity, gazing deeply into the camera lens with absolute serenity.

Spoken dialogue in Brazilian Portuguese:
"No fim das contas, a terra nunca erra: quem plantou com honra deita e dorme sereno."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    },
    {
      index: 8,
      stageName: "Prompt 8 — Encerramento de Fé",
      cameraAngle: "Plano vertical 9:16 final, enquadrando o senhor e a luz crepuscular do campo",
      characterAction: "Ele acena com a cabeça muito suavemente em despedida afetuosa, respirando a calma da roça.",
      visualPrompt: "Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting quietly on a wooden bench on the porch of his rural house as the sun sets over the Brazilian hills. Soft natural twilight colors. He nods gently in quiet farewell, exuding humility and deep peace.",
      spokenDialogue: "E descansa no peito: Deus escuta o seu silêncio e tá ajeitando cada coisa no lugar.",
      estimatedSeconds: 8,
      narrativeConnector: "Fechamento espiritual comovente e pacificador",
      fullFormattedPrompt: `Vertical 9:16 documentary smartphone style 4K HDR footage. An authentic 80-year-old Brazilian rural elder man with deeply wrinkled sun-weathered dark-tanned skin, short neat gray beard, natural gray hair, and calm profound wise eyes. He is wearing a simple traditional straw hat, a worn rustic long-sleeved work shirt, and dusty boots. Sitting quietly on a wooden bench on the porch of his rural house as the sun sets over the Brazilian hills. Soft natural twilight colors. He nods gently in quiet farewell, exuding humility and deep peace.

Spoken dialogue in Brazilian Portuguese:
"E descansa no peito: Deus escuta o seu silêncio e tá ajeitando cada coisa no lugar."

No speech other than the exact dialogue provided.
No subtitles, captions, text, logos, watermarks or graphical overlays anywhere in the video.`
    }
  ]
};
