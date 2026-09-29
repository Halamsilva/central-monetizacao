export interface VideoPromptTake {
  takeNumber: 1 | 2 | 3 | 4;
  timeRange: string;
  actName: string;
  spokenLine: string;
  videoShotPrompt: string;
  soundFxCue: string;
  targetWords: number;
  fixedSceneContext: string; // Cenário Fixo & Iluminação que NÃO muda entre takes
  fixedObjectsProps: string; // Descrição Imutável dos Objetos, Panelas e Utensílios
}

export interface DetailedIngredient {
  name: string;
  quantity: string;
  prepTime: string; // Ex: "1 min para fatiar fino"
  techniqueTip: string; // Dica técnica de corte/temperatura do mestre
}

export interface DetailedStep {
  stepNumber: number;
  timeEstimate: string; // Ex: "1 min", "45 segundos"
  phase: 'Mise en Place' | 'Fogo & Cocção' | 'Finalização & Ponto';
  action: string;
  description: string;
  temperatureOrFire: string; // Ex: "Fogo médio-alto (200°C)"
}

export interface MasterRecipe {
  id: string;
  title: string;
  subtitle: string;
  cuisineType: 'brasileira' | 'internacional';
  country: string;
  flag: string;
  category: string;
  servings: string;
  prepTimeMinutes: number; // Tempo de preparo dos ingredientes
  cookTimeMinutes: number; // Tempo de fogo/montagem
  totalTimeDisplay: string;
  freshIngredients: DetailedIngredient[];
  pantryItems: { item: string; quantity: string }[];
  steps: DetailedStep[];
  masterSecret: string;
  flavorProfile: string;
  fixedSceneGlobal: string;
  fixedObjectsGlobal: string;
  prompts: VideoPromptTake[];
}

export const MASTER_RECIPES: MasterRecipe[] = [
  {
    id: 'tapioca-coalho-melaco',
    title: 'Tapioca de Queijo Coalho Dourado com Alecrim & Melaço',
    subtitle: 'Crosta de tapioca nevada, queijo coalho artesanal grelhado e perfume herbal de alecrim fresco.',
    cuisineType: 'brasileira',
    country: 'Brasil (Nordeste)',
    flag: '🇧🇷',
    category: 'Artesanal / Raiz',
    servings: '1 porção farta',
    prepTimeMinutes: 2,
    cookTimeMinutes: 2,
    totalTimeDisplay: '4 minutos',
    freshIngredients: [
      {
        name: 'Goma de tapioca fresca hidratada',
        quantity: '100g (4 colheres de sopa cheias)',
        prepTime: '40s para peneirar',
        techniqueTip: 'Peneire direto na bancada para quebrar os grumos e criar uma crosta rendada e aerada.'
      },
      {
        name: 'Queijo coalho artesanal da serra',
        quantity: '120g (3 fatias longitudinais de 3mm)',
        prepTime: '45s de corte',
        techniqueTip: 'Corte lâminas uniformes de 3mm de espessura para que o interior derreta no tempo certo de selagem.'
      },
      {
        name: 'Alecrim fresco da horta',
        quantity: '2 ramos pequenos (apenas as folhas)',
        prepTime: '20s para desfolhar',
        techniqueTip: 'Aperte levemente as folhas entre os dedos antes de salpicar para liberar os óleos essenciais.'
      },
      {
        name: 'Melaço de cana-de-açúcar artesanal puro',
        quantity: '2 colheres de sopa (30ml)',
        prepTime: 'Temperatura ambiente',
        techniqueTip: 'Mantenha em temperatura ambiente de 24°C para obter viscosidade perfeita sem cristalizar.'
      }
    ],
    pantryItems: [
      { item: 'Flor de sal marinho', quantity: '1 pitada leve (1g)' }
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '1 min 30s',
        action: 'Peneiração & Lâminas de Queijo',
        description: 'Peneire 100g de goma fresca hidratada sobre uma tigela limpa. Fatie os 120g de queijo coalho em três tiras finas e desfolhe os ramos de alecrim fresco.',
        temperatureOrFire: 'Bancada de preparo'
      },
      {
        stepNumber: 2,
        phase: 'Fogo & Cocção',
        timeEstimate: '1 minuto',
        action: 'Distribuição Térmica da Goma',
        description: 'Aqueça a frigideira de ferro seca. Espalhe as 4 colheres de goma em círculo contínuo com as costas da colher até unir as bordas em disco uniforme.',
        temperatureOrFire: 'Fogo médio-alto (190°C a 210°C)'
      },
      {
        stepNumber: 3,
        phase: 'Fogo & Cocção',
        timeEstimate: '45 segundos',
        action: 'Fusão do Queijo & Alecrim',
        description: 'Acomode as fatias de queijo coalho na metade do disco, salpique as folhas de alecrim e dobre a massa ao meio pressionando a borda com espátula.',
        temperatureOrFire: 'Fogo médio (deixe 20s de cada lado)'
      },
      {
        stepNumber: 4,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Fio de Melaço & Descanso',
        description: 'Transfira para o prato de cerâmica aquecido, regue com as 2 colheres de melaço dourado e deixe repousar 20 segundos para o calor estabilizar.',
        temperatureOrFire: 'Descanso no prato'
      }
    ],
    masterSecret: 'O queijo precisa estar em temperatura ambiente antes de entrar na frigideira; se estiver gelado da geladeira, o calor da massa não atinge o núcleo.',
    flavorProfile: 'Crocância seca na mordida, queijo elástico dourado, notas resinosas de alecrim e doçura encorpada de melaço.',
    fixedSceneGlobal: 'Cozinha rústica artesanal com bancada de pedra-sabão cinza escuro, parede ao fundo de tijolo de barro aparente com textura suave, prateleira de ferro com potes de barro e iluminação lateral dourada a 45° simulando luz da tarde com névoa sutil de vapor.',
    fixedObjectsGlobal: 'Frigideira preta de ferro fundido de 22cm com cabo de madeira clara envelhecida, espátula de inox com cabo de jacarandá escuro, tigela de cerâmica terracota com a goma branca, molheira de vidro âmbar com melaço viscoso e ramos de alecrim verde fresco.',
    prompts: [
      {
        takeNumber: 1,
        timeRange: '0:00 - 0:09',
        actName: 'Take 1: O Gancho & Apresentação',
        spokenLine: 'Hoje você vai dominar a verdadeira tapioca nordestina: queijo coalho dourado com alecrim fresco e melaço de cana borbulhando na frigideira!',
        videoShotPrompt: 'Câmera vertical 9:16, close macro na espátula quebrando a crosta da tapioca fumegante na frigideira de ferro enquanto o queijo coalho estica em câmera lenta com vapor denso.',
        soundFxCue: 'Estalo seco e crocante da dobra da tapioca seguido por chiado suave de queijo grelhando.',
        targetWords: 24,
        fixedSceneContext: 'Cozinha rústica com bancada de pedra-sabão cinza escuro, parede ao fundo de tijolo de barro em bokeh suave, iluminação dourada lateral a 45° com feixe quente da tarde.',
        fixedObjectsProps: 'Frigideira preta de ferro fundido de 22cm com cabo de madeira clara envelhecida, espátula de inox com cabo de jacarandá e molheira de vidro âmbar com melaço viscoso na lateral direita.'
      },
      {
        takeNumber: 2,
        timeRange: '0:09 - 0:18',
        actName: 'Take 2: Ingredientes & Quantidades na Bancada',
        spokenLine: 'São cem gramas de goma fresca bem peneirada, cento e vinte gramas de queijo coalho em fatias finas e folhas de dois ramos de alecrim recém-colhido!',
        videoShotPrompt: 'Ângulo zenital top-down sobre a mesma bancada de pedra-sabão, mãos do chef salpicando folhas de alecrim fresco caindo sobre as fatias douradas de queijo coalho.',
        soundFxCue: 'Som nítido de dedos esfregando o alecrim e o pó suave da goma caindo na pedra.',
        targetWords: 24,
        fixedSceneContext: 'Cozinha rústica com bancada de pedra-sabão cinza escuro, parede ao fundo de tijolo de barro em bokeh suave, iluminação dourada lateral a 45° com feixe quente da tarde.',
        fixedObjectsProps: 'Tigela de cerâmica terracota com goma branca, tábua de madeira nobre de peroba-rosa, ramos de alecrim verde vivo e fatias finas de queijo coalho dispostas em linha uniforme.'
      },
      {
        takeNumber: 3,
        timeRange: '0:18 - 0:27',
        actName: 'Take 3: O Ponto do Fogo & Tempo de Frigideira',
        spokenLine: 'Frigideira a duzentos graus, a goma sela em um minuto! Entra o queijo e o alecrim, dobrou no meio e quarenta segundos tostando os lados!',
        videoShotPrompt: 'Plano médio dinâmico em 60fps acompanhando o movimento rápido da panela no fogão na mesma bancada, chama viva azul e alaranjada ao fundo e fumaça aromática subindo.',
        soundFxCue: 'Chiado intenso da tapioca selando e o sopro quente do fogo alto.',
        targetWords: 25,
        fixedSceneContext: 'Cozinha rústica com bancada de pedra-sabão cinza escuro, parede ao fundo de tijolo de barro em bokeh suave, iluminação dourada lateral a 45° com feixe quente da tarde.',
        fixedObjectsProps: 'Mesma frigideira preta de ferro fundido de 22cm com cabo de madeira clara no fogo, mesma espátula de inox e jacarandá virando a massa com firmeza e vapor denso subindo.'
      },
      {
        takeNumber: 4,
        timeRange: '0:27 - 0:36',
        actName: 'Take 4: Finalização com Melaço & Mordida',
        spokenLine: 'Finaliza com trinta mililitros de melaço puro sobre a crosta crocante. Olha essa textura absurda! Salva essa receita e prepara aí hoje!',
        videoShotPrompt: 'Super close no prato de pedra escura sobre a bancada de pedra-sabão, fio viscoso de melaço escorrendo pelo queijo esticado e a mordida com som cristalino de crocância.',
        soundFxCue: 'Trilha percussiva brasileira subindo no final com estalo de mordida impecável.',
        targetWords: 24,
        fixedSceneContext: 'Cozinha rústica com bancada de pedra-sabão cinza escuro, parede ao fundo de tijolo de barro em bokeh suave, iluminação dourada lateral a 45° com feixe quente da tarde.',
        fixedObjectsProps: 'Prato rústico de cerâmica cinza grafite fosca, mesma molheira de vidro âmbar despejando o melaço viscoso e raminho de alecrim decorativo fresco no topo.'
      }
    ]
  },
  {
    id: 'bruschetta-pomodoro-basilico',
    title: 'Bruschetta Rústica de Tomates Rama & Basílico Roxo',
    subtitle: 'Pão de fermentação natural grelhado, alho roxo friccionado e tomates marinados com azeite toscano.',
    cuisineType: 'internacional',
    country: 'Itália (Toscana)',
    flag: '🇮🇹',
    category: 'Artesanal / Mediterrâneo',
    servings: '2 fatias generosas',
    prepTimeMinutes: 3,
    cookTimeMinutes: 2,
    totalTimeDisplay: '5 minutos',
    freshIngredients: [
      {
        name: 'Pão sourdough de fermentação natural',
        quantity: '2 fatias grossas de 2cm (aprox. 140g)',
        prepTime: '2 min de grelha',
        techniqueTip: 'Fatie com faca serrilhada em ângulo para criar maior área de crosta tostada e áspera.'
      },
      {
        name: 'Tomates rama ou cereja maduros',
        quantity: '200g (cerca de 3 tomates médios cortados em cubos de 1cm)',
        prepTime: '1 min 30s de corte',
        techniqueTip: 'Pique mantendo as sementes e o líquido para que o azeite emulsione no fundo da tigela.'
      },
      {
        name: 'Dente de alho roxo fresco',
        quantity: '1 dente grande descascado',
        prepTime: '10s para descascar',
        techniqueTip: 'Esfregue o dente inteiro cru direto na crosta quente: o atrito do pão rala o alho na hora.'
      },
      {
        name: 'Manjericão roxo e verde fresco',
        quantity: '10 folhas grandes',
        prepTime: '15s para rasgar',
        techniqueTip: 'Rasgue manualmente apenas no instante de misturar para preservar os compostos aromáticos.'
      },
      {
        name: 'Azeite de oliva extravirgem colheita precoce',
        quantity: '3 colheres de sopa (45ml)',
        prepTime: 'Temperatura ambiente',
        techniqueTip: 'Utilize azeite extravirgem verde de acidez abaixo de 0,2% para untuosidade intensa.'
      }
    ],
    pantryItems: [
      { item: 'Flor de sal marinho', quantity: '1/2 colher de chá (2g)' },
      { item: 'Pimenta-do-reino moída na hora', quantity: '1 pitada generosa' }
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '2 minutos',
        action: 'Corte dos Tomates & Marinada',
        description: 'Corte os 200g de tomates rama em cubos médios. Misture na tigela com 30ml de azeite, flor de sal, pimenta moída e as folhas rasgadas de manjericão.',
        temperatureOrFire: 'Tábua de corte'
      },
      {
        stepNumber: 2,
        phase: 'Fogo & Cocção',
        timeEstimate: '1 min 30s',
        action: 'Tostagem do Pão na Grelha',
        description: 'Aqueça a frigideira de ferro estriada. Pincele levemente as fatias de pão com azeite e toste por 45 segundos de cada lado até marcar linhas douradas escuras.',
        temperatureOrFire: 'Fogo alto na grelha'
      },
      {
        stepNumber: 3,
        phase: 'Fogo & Cocção',
        timeEstimate: '30 segundos',
        action: 'Fricção do Alho Quente',
        description: 'Retire as fatias imediatamente e friccione com vigor o dente de alho roxo cru na crosta áspera do pão ainda fumegante.',
        temperatureOrFire: 'Calor residual do pão'
      },
      {
        stepNumber: 4,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Montagem Farta & Fio Verde',
        description: 'Disponha a marinada de tomates com colher generosa deixando o caldo aromático regar o miolo do pão. Finalize com fio de azeite cru e sirva.',
        temperatureOrFire: 'Bancada'
      }
    ],
    masterSecret: 'Deixe os tomates marinando no azeite e sal por exatamente 2 minutos antes de montar: o sal extrai o néctar do tomate que vira um molho aveludado.',
    flavorProfile: 'Crocância firme do pão tostado, frescor ácido e adocicado do tomate, pungência quente do alho e perfume floral do manjericão.',
    fixedSceneGlobal: 'Cozinha toscana mediterrânea com bancada pesada de mármore travertino rústico, parede de pedra calcária clara ao fundo com garrafas de azeite em nicho iluminado e luz solar natural quente entrando pela janela à direita em ângulo rasante.',
    fixedObjectsGlobal: 'Tábua de corte rústica de madeira de oliveira com bordas naturais, frigideira estriada de ferro fundido preto, tigela rasa de cerâmica branca artesanal esmaltada, garrafa de azeite de cerâmica verde-oliva com bico dosador metálico e faca serrilhada de pão com cabo de nogueira.',
    prompts: [
      {
        takeNumber: 1,
        timeRange: '0:00 - 0:09',
        actName: 'Take 1: O Gancho & Apresentação',
        spokenLine: 'Hoje você aprende a verdadeira bruschetta toscana: pão rústico de fermentação natural bem tostado com tomates perfumados no manjericão!',
        videoShotPrompt: 'Enquadramento vertical 9:16 na tábua de oliveira sobre o travertino, plano detalhe no dente de alho roxo sendo friccionado na crosta rústica do pão tostado levantando perfume visível.',
        soundFxCue: 'Som áspero e delicioso do alho friccionando na crosta dourada do pão.',
        targetWords: 23,
        fixedSceneContext: 'Cozinha toscana com bancada de mármore travertino rústico, parede de pedra calcária ao fundo em desfoque natural, luz solar quente rasante vinda da direita.',
        fixedObjectsProps: 'Tábua rústica de madeira de oliveira italiana com bordas naturais, fatia grossa de pão rústico de fermentação natural com marcas douradas de grelha e dente de alho roxo fresco com casca avermelhada.'
      },
      {
        takeNumber: 2,
        timeRange: '0:09 - 0:18',
        actName: 'Take 2: Ingredientes & Quantidades na Bancada',
        spokenLine: 'Duzentos gramas de tomate rama maduro em cubos, quarenta e cinco mililitros de azeite extravirgem, um dente de alho e dez folhas de manjericão fresco!',
        videoShotPrompt: 'Top-down macro na mesma tábua de oliveira, gotas douradas de azeite extravirgem caindo da garrafa verde-oliva sobre as sementes vermelhas dos tomates e folhas roxas de manjericão.',
        soundFxCue: 'Som de folhas sendo rasgadas e o líquido denso do azeite caindo na tigela.',
        targetWords: 24,
        fixedSceneContext: 'Cozinha toscana com bancada de mármore travertino rústico, parede de pedra calcária ao fundo em desfoque natural, luz solar quente rasante vinda da direita.',
        fixedObjectsProps: 'Tigela rasa de cerâmica branca artesanal esmaltada com os tomates em cubos, garrafa de azeite verde-oliva com bico dosador de inox e folhas inteiras de manjericão roxo e verde fresco.'
      },
      {
        takeNumber: 3,
        timeRange: '0:18 - 0:27',
        actName: 'Take 3: O Ponto do Fogo & Tempo de Frigideira',
        spokenLine: 'Dois minutos de grelha quente para dourar o pão! Esfregue o alho na crosta quente e deixe o tomate marinando dois minutos no azeite!',
        videoShotPrompt: 'Câmera na altura dos olhos acompanhando o pão saindo da frigideira de ferro fundido estriada e a colherada generosa de tomates acomodando sobre o pão na tábua de oliveira.',
        soundFxCue: 'Chiado seco do pão na tábua e colherada generosa acomodando os tomates.',
        targetWords: 24,
        fixedSceneContext: 'Cozinha toscana com bancada de mármore travertino rústico, parede de pedra calcária ao fundo em desfoque natural, luz solar quente rasante vinda da direita.',
        fixedObjectsProps: 'Frigideira estriada de ferro fundido fumegante na boca do fogão ao lado, mesma tábua de oliveira e colher de servir de madeira de faia acomodando os tomates suculentos.'
      },
      {
        takeNumber: 4,
        timeRange: '0:27 - 0:36',
        actName: 'Take 4: Montagem Farta & Mordida',
        spokenLine: 'Acomode os tomates com o caldo perfumado, flor de sal e dê essa mordida crocante inesquecível! Faz na sua casa hoje mesmo!',
        videoShotPrompt: 'Super close no momento em que as mãos do chef erguem a bruschetta sobre a tábua de oliveira e a mordida esmaga o pão com quebra audível e os sucos vermelhos do tomate brilham.',
        soundFxCue: 'Crocância limpa do pão quebrando e nota musical alegre de encerramento.',
        targetWords: 25,
        fixedSceneContext: 'Cozinha toscana com bancada de mármore travertino rústico, parede de pedra calcária ao fundo em desfoque natural, luz solar quente rasante vinda da direita.',
        fixedObjectsProps: 'Mesma tábua rústica de madeira de oliveira, bruschetta montada com tomates rubis transbordando e folhas frescas de manjericão roxo decorando a borda.'
      }
    ]
  },
  {
    id: 'guacamole-express-molcajete',
    title: 'Guacamole Rústico de Molcajete com Lima & Coentro Selvagem',
    subtitle: 'Abacate hass amanteigado amassado na pedra com lima fresca espremida, cebola roxa e coentro.',
    cuisineType: 'internacional',
    country: 'México (Oaxaca)',
    flag: '🇲🇽',
    category: 'Fresco / Sem Fogo',
    servings: '2 a 3 porções',
    prepTimeMinutes: 4,
    cookTimeMinutes: 0,
    totalTimeDisplay: '4 minutos',
    freshIngredients: [
      {
        name: 'Abacate tipo avocado ou hass no ponto',
        quantity: '2 unidades maduras (cerca de 300g de polpa)',
        prepTime: '1 min para abrir e descaroçar',
        techniqueTip: 'Escolha abacates que cedem levemente ao toque suave do polegar perto do pedúnculo.'
      },
      {
        name: 'Lima da pérsia ou limão taiti fresco',
        quantity: 'Suco fresco de 1 unidade e meia (35ml)',
        prepTime: '20s para espremer',
        techniqueTip: 'Esprema a lima diretamente na polpa logo após amassar para criar barreira cítrica contra oxidação.'
      },
      {
        name: 'Cebola roxa fresca',
        quantity: '1/2 unidade média em brunoise miúda (50g)',
        prepTime: '1 min de corte',
        techniqueTip: 'Pique em cubos de 2mm bem uniformes para que a crocância contraste suavemente com o veludo do abacate.'
      },
      {
        name: 'Coentro fresco com talos finos',
        quantity: '1 punhado farto (15g picado grosseiramente)',
        prepTime: '30s de corte',
        techniqueTip: 'Inclua os talos mais tenros: é neles que reside a maior concentração de óleos aromáticos cítricos.'
      },
      {
        name: 'Pimenta dedo-de-moça fresca sem sementes',
        quantity: '1/2 unidade bem picada (5g)',
        prepTime: '30s de corte',
        techniqueTip: 'Retire as nervuras brancas e sementes para manter apenas o aroma floral e picância sutil.'
      }
    ],
    pantryItems: [
      { item: 'Flor de sal marinho', quantity: '1 colher de chá rasa (3g)' },
      { item: 'Totopos artesanais de milho', quantity: '1 porção de 100g' }
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '2 minutos',
        action: 'Corte da Cebola, Pimenta & Ervas',
        description: 'Pique finamente os 50g de cebola roxa, o coentro fresco com talos tenros e a pimenta fresca em brunoise minúscula sobre a tábua.',
        temperatureOrFire: 'Bancada'
      },
      {
        stepNumber: 2,
        phase: 'Mise en Place',
        timeEstimate: '1 minuto',
        action: 'Abertura & Extração da Polpa',
        description: 'Corte os 2 avocados maduros ao meio contornando o caroço. Gire as metades, retire o caroço com um golpe leve de faca e retire a polpa verde com colher para o molcajete.',
        temperatureOrFire: 'Temperatura ambiente'
      },
      {
        stepNumber: 3,
        phase: 'Fogo & Cocção',
        timeEstimate: '45 segundos',
        action: 'Esmagamento Rústico & Lima',
        description: 'Esprema imediatamente os 35ml de suco de lima sobre o abacate. Esmague com o garfo por 30 segundos, mantendo pedaços rústicos e sem bater.',
        temperatureOrFire: 'Sem fogo'
      },
      {
        stepNumber: 4,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Incorporação dos Aromáticos',
        description: 'Acrescente a cebola roxa picada, a pimenta, o coentro e a flor de sal. Dê três voltas com a colher e sirva no próprio molcajete com totopos.',
        temperatureOrFire: 'Temperatura ambiente'
      }
    ],
    masterSecret: 'Nunca use liquidificador ou mixer! O guacamole autêntico precisa da textura fibrosa do abacate intercalada com o estalo crocante da cebola roxa.',
    flavorProfile: 'Cremosidade untuosa e fresca, acidez vibrante da lima, perfume anisado do coentro e final picante equilibrado.',
    fixedSceneGlobal: 'Bancada rústica de ardósia negra fosca com detalhes de madeira queimada, parede de terracota ocre ao fundo com cestaria artesanal mexicana em desfoque e iluminação quente de fim de tarde criando realces dourados nas superfícies sem estourar reflexos.',
    fixedObjectsGlobal: 'Molcajete tradicional de pedra vulcânica negra porosa com pilão correspondente (tejolote), tábua de madeira clara de tília, faca de chef pequena com cabo de madeira escura, tigelinha de barro vermelho com totopos de milho triangulares dourados e garfo de ferro rústico.',
    prompts: [
      {
        takeNumber: 1,
        timeRange: '0:00 - 0:09',
        actName: 'Take 1: O Gancho & Apresentação',
        spokenLine: 'Aprenda a fazer o guacamole autêntico de molcajete: textura pedaçuda perfeita, frescor da lima e o perfume vivo do coentro selvagem!',
        videoShotPrompt: 'Enquadramento 9:16 dinâmico sobre a bancada de ardósia negra, faca abrindo o abacate verde vibrante com um giro perfeito ao lado do molcajete de pedra vulcânica.',
        soundFxCue: 'Som aveludado do corte no abacate e o eco rústico da tigela de pedra.',
        targetWords: 24,
        fixedSceneContext: 'Bancada de ardósia negra fosca com parede ao fundo de terracota ocre em desfoque suave, iluminação quente lateral de fim de tarde.',
        fixedObjectsProps: 'Molcajete de pedra vulcânica negra porosa no centro, tábua de madeira clara de tília e abacate hass com casca escura rugosa e interior verde-limão vibrante.'
      },
      {
        takeNumber: 2,
        timeRange: '0:09 - 0:18',
        actName: 'Take 2: Ingredientes & Quantidades na Bancada',
        spokenLine: 'Dois avocados maduros, trinta e cinco mililitros de suco de lima fresca, cinquenta gramas de cebola roxa picadinha e coentro fresco farto!',
        videoShotPrompt: 'Macro em ângulo inclinado capturando a metade de lima fresca sendo espremida com respingos transparentes sobre a polpa verde dentro do molcajete de pedra negra.',
        soundFxCue: 'Jato cítrico da lima sendo espremida e queda de sal marinho na tigela.',
        targetWords: 21,
        fixedSceneContext: 'Bancada de ardósia negra fosca com parede ao fundo de terracota ocre em desfoque suave, iluminação quente lateral de fim de tarde.',
        fixedObjectsProps: 'Mesmo molcajete de pedra vulcânica negra porosa com polpa verde, cebola roxa em cubinhos minúsculos, pimenta vermelha picada e folhas viçosas de coentro fresco.'
      },
      {
        takeNumber: 3,
        timeRange: '0:18 - 0:27',
        actName: 'Take 3: O Ponto do Amassado & Tempo de Preparo',
        spokenLine: 'Apenas quarenta segundos esmagando no garfo para manter pedacinhos! A lima entra na hora para não oxidar e o sal realça a gordura boa!',
        videoShotPrompt: 'Câmera próxima com garfo rústico esmagando os pedaços de abacate dentro do molcajete de pedra, misturando os pedaços roxos e verdes em textura aerada pedaçuda.',
        soundFxCue: 'Som cremoso e espesso do garfo incorporando os ingredientes frescos.',
        targetWords: 24,
        fixedSceneContext: 'Bancada de ardósia negra fosca com parede ao fundo de terracota ocre em desfoque suave, iluminação quente lateral de fim de tarde.',
        fixedObjectsProps: 'Mesmo molcajete de pedra vulcânica negra, garfo de ferro rústico misturando com firmeza e pitada de flor de sal marinho caindo em câmera lenta.'
      },
      {
        takeNumber: 4,
        timeRange: '0:27 - 0:36',
        actName: 'Take 4: Mistura Final & Mergulho com Totopo',
        spokenLine: 'Mistura três vezes, mergulha a tortilha crocante e sente esse frescor maravilhoso! Salva esse vídeo para o seu próximo lanche!',
        videoShotPrompt: 'Uma tortilha de milho dourada mergulhando no guacamole rústico dentro do molcajete de pedra vulcânica e erguendo uma porção farta com coentro no topo.',
        soundFxCue: 'Estalo hiper crocante da tortilha de milho quebrando sob a mordida.',
        targetWords: 23,
        fixedSceneContext: 'Bancada de ardósia negra fosca com parede ao fundo de terracota ocre em desfoque suave, iluminação quente lateral de fim de tarde.',
        fixedObjectsProps: 'Mesmo molcajete de pedra vulcânica negra com guacamole pronto, cesta de palha com totopos triangulares dourados de milho e gomo de lima decorativo.'
      }
    ]
  },
  {
    id: 'omelette-minute-fines-herbes',
    title: 'Omelete Francesa de Bistrô com Fines Herbes & Manteiga Pura',
    subtitle: 'Ovos caipiras de gema dourada, interior baveuse sedoso e manteiga francesa noisette com ervas frescas.',
    cuisineType: 'internacional',
    country: 'França (Paris)',
    flag: '🇫🇷',
    category: 'Gourmet / Bistrô',
    servings: '1 porção individual',
    prepTimeMinutes: 2,
    cookTimeMinutes: 2,
    totalTimeDisplay: '4 minutos',
    freshIngredients: [
      {
        name: 'Ovos caipiras frescos de galinha livre',
        quantity: '3 unidades médias em temperatura ambiente (150g)',
        prepTime: '30s para bater com garfo',
        techniqueTip: 'Bata com garfo levantando a mistura em movimentos elípticos apenas até romper as gemas, sem incorporar ar excessivo.'
      },
      {
        name: 'Manteiga francesa sem sal de primeira linha',
        quantity: '25g (1 colher de sopa bem cheia)',
        prepTime: 'Fracionada em 20g para a frigideira e 5g para pincelar',
        techniqueTip: 'Use manteiga com mais de 82% de gordura; ela espuma sem queimar e cria a película aveludada.'
      },
      {
        name: 'Cebolinha francesa fresca (ciboulette/chives)',
        quantity: '1 colher de sopa finamente laminada (5g)',
        prepTime: '30s de corte fino',
        techniqueTip: 'Use faca bem afiada para não amassar as lâminas de cebolinha, preservando a forma de anéis perfeitos.'
      },
      {
        name: 'Folhas frescas de estragão ou salsa crespa',
        quantity: '1 colher de chá de folhas picadas (3g)',
        prepTime: '20s para picar',
        techniqueTip: 'O estragão confere a nota anisada típica dos melhores bistrôs parisienses.'
      }
    ],
    pantryItems: [
      { item: 'Sal refinado marinho', quantity: '1 pitada precisa (1.5g)' },
      { item: 'Pimenta branca moída', quantity: '1 leve toque' }
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '1 minuto',
        action: 'Batimento Suave & Ervas',
        description: 'Quebre os 3 ovos caipiras na tigela de vidro. Adicione o sal refinado e a pimenta branca. Bata com garfo por 30 segundos até misturar claro e gema sem formar espuma.',
        temperatureOrFire: 'Bancada'
      },
      {
        stepNumber: 2,
        phase: 'Fogo & Cocção',
        timeEstimate: '30 segundos',
        action: 'Espumação da Manteiga',
        description: 'Aqueça a frigideira antiaderente em fogo médio e adicione os 20g de manteiga. Deixe derreter e espumar em pequenas bolhas douradas sem escurecer.',
        temperatureOrFire: 'Fogo médio (160°C)'
      },
      {
        stepNumber: 3,
        phase: 'Fogo & Cocção',
        timeEstimate: '45 segundos',
        action: 'Mexedura Vigorosa & Ponto Baveuse',
        description: 'Despeje os ovos batidos de uma vez. Mexa rapidamente com a espátula de silicone em círculos por 25 segundos enquanto sacode a panela. Quando formar creme coalhado denso, salpique as ervas no centro.',
        temperatureOrFire: 'Fogo médio-baixo'
      },
      {
        stepNumber: 4,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Rolagem Suave & Brilho',
        description: 'Incline a frigideira a 45°, dobre as bordas sobre si mesma em formato de charuto oval e deslize para o prato aquecido. Pincele os 5g restantes de manteiga sobre a superfície.',
        temperatureOrFire: 'Calor residual'
      }
    ],
    masterSecret: 'O segredo da textura baveuse: desligue o fogo quando a omelete ainda parecer 30% líquida no centro; o calor interno termina a cocção no prato!',
    flavorProfile: 'Untuosidade aveludada, sabor lácteo rico da manteiga, ovos sedosos e frescor aromático refinado das ervas.',
    fixedSceneGlobal: 'Cozinha de bistrô parisiense clássico com bancada de mármore Carrara branco polido com veios cinza suaves, parede ao fundo com azulejos de metrô parisienses esmaltados brilhantes e iluminação de estúdio difusa com reflexos suaves no aço inox e na manteiga derretida.',
    fixedObjectsGlobal: 'Frigideira francesa antiaderente preta fosca de 20cm com cabo longo de aço rebitado, espátula de silicone termorresistente cinza grafite, tigela de vidro temperado transparente, prato raso de porcelana branca com filete dourado na borda e garfo prateado de bistrô.',
    prompts: [
      {
        takeNumber: 1,
        timeRange: '0:00 - 0:09',
        actName: 'Take 1: O Gancho & Apresentação',
        spokenLine: 'Hoje você vai dominar a clássica omelete francesa de bistrô: casca dourada sedosa e um miolo aveludado que derrete na boca!',
        videoShotPrompt: 'Vertical 9:16, plano médio fechado, a espátula cinza inclinando a frigideira francesa preta sobre o mármore Carrara e a omelete deslizando perfeitamente redonda e brilhante para o prato de porcelana branca.',
        soundFxCue: 'Som macio da manteiga derretida na frigideira e chiado aveludado dos ovos.',
        targetWords: 25,
        fixedSceneContext: 'Bancada de mármore Carrara branco polido com veios cinzas, azulejos de metrô parisienses ao fundo, iluminação suave difusa de bistrô.',
        fixedObjectsProps: 'Frigideira francesa antiaderente preta fosca de 20cm com cabo longo de aço rebitado, espátula de silicone cinza grafite e prato raso de porcelana branca clássica com borda dourada.'
      },
      {
        takeNumber: 2,
        timeRange: '0:09 - 0:18',
        actName: 'Take 2: Ingredientes & Quantidades na Bancada',
        spokenLine: 'Três ovos caipiras em temperatura ambiente, vinte e cinco gramas de manteiga pura, cebolinha francesa bem fina e estragão aromático fresco!',
        videoShotPrompt: 'Top-down macro na bancada de mármore Carrara branco, ovos quebrando com facilidade em tigela de vidro transparente mostrando as gemas laranja brilhantes ao lado das ervas verdes picadas.',
        soundFxCue: 'Estalo límpido das cascas de ovos e corte preciso da faca na cebolinha.',
        targetWords: 23,
        fixedSceneContext: 'Bancada de mármore Carrara branco polido com veios cinzas, azulejos de metrô parisienses ao fundo, iluminação suave difusa de bistrô.',
        fixedObjectsProps: 'Tigela de vidro temperado transparente, ramequim pequeno de porcelana branca com noz de manteiga amarela pura e tábua de madeira pequena com cebolinha francesa picada finíssima.'
      },
      {
        takeNumber: 3,
        timeRange: '0:18 - 0:27',
        actName: 'Take 3: O Ponto do Fogo & Tempo de Cocção',
        spokenLine: 'Manteiga espumou, despeja os ovos! Mexe em círculos por vinte e cinco segundos, entra com as ervas e enrola com carinho na ponta!',
        videoShotPrompt: 'Close acelerado na mesma frigideira francesa preta no fogão, mãos com a espátula cinza grafite mexendo em movimentos circulares frenéticos enquanto a manteiga espuma em bolhas finas.',
        soundFxCue: 'Espátula raspando delicadamente o fundo e o borbulhar suave da manteiga.',
        targetWords: 24,
        fixedSceneContext: 'Bancada de mármore Carrara branco polido com veios cinzas, azulejos de metrô parisienses ao fundo, iluminação suave difusa de bistrô.',
        fixedObjectsProps: 'Mesma frigideira antiaderente preta de 20cm com cabo longo de aço rebitado, mesma espátula de silicone cinza grafite e manteiga espumando em dourado claro no fundo da panela.'
      },
      {
        takeNumber: 4,
        timeRange: '0:27 - 0:36',
        actName: 'Take 4: Brilho de Manteiga & Mordida',
        spokenLine: 'Pincela manteiga por cima para dar brilho, corta ao meio e vê esse veludo escorrendo! Simples e perfeito. Salva para o seu café!',
        videoShotPrompt: 'Faca fina de bistrô abrindo delicadamente o centro da omelete no prato de porcelana branca liberando vapor quente e mostrando o interior ultra cremoso cor de ouro.',
        soundFxCue: 'Suspiro suave de vapor liberado e corte cremoso da lâmina.',
        targetWords: 25,
        fixedSceneContext: 'Bancada de mármore Carrara branco polido com veios cinzas, azulejos de metrô parisienses ao fundo, iluminação suave difusa de bistrô.',
        fixedObjectsProps: 'Mesmo prato de porcelana branca clássica com borda dourada repousando sobre o mármore Carrara, faca fina de aço inox polido e garfo clássico ao lado.'
      }
    ]
  },
  {
    id: 'ceviche-caipira-tilapia',
    title: 'Ceviche Caipira de Tilápia com Tangerina Cravo & Pimenta Biquinho',
    subtitle: 'Filé de peixe branco fresquíssimo marinado no néctar de tangerina do quintal, cebola roxa fina e coentro.',
    cuisineType: 'brasileira',
    country: 'Brasil (Minas Gerais & Litoral)',
    flag: '🇧🇷',
    category: 'Fresco / Sem Fogo',
    servings: '2 porções de entrada',
    prepTimeMinutes: 4,
    cookTimeMinutes: 0,
    totalTimeDisplay: '4 minutos',
    freshIngredients: [
      {
        name: 'Filé fresco de tilápia limpa (ou robalo/corvina)',
        quantity: '220g (cortado em lâminas de 3mm)',
        prepTime: '2 min para fatiar em ângulo',
        techniqueTip: 'Mantenha o peixe sobre placa fria ou tigela com gelo por baixo para garantir temperatura abaixo de 4°C no corte.'
      },
      {
        name: 'Tangerina cravo madura (mexerica do quintal)',
        quantity: 'Suco fresco de 2 unidades (80ml)',
        prepTime: '40s para espremer',
        techniqueTip: 'Peneire o suco para retirar sementes e fibras grossas, mantendo a doçura natural translúcida.'
      },
      {
        name: 'Limão taiti fresco',
        quantity: 'Suco de 1/2 unidade (15ml)',
        prepTime: '15s para espremer',
        techniqueTip: 'O limão confere a acidez necessária para equilibrar os açúcares naturais da tangerina cravo.'
      },
      {
        name: 'Pimenta biquinho fresca em conserva suave',
        quantity: '8 a 10 unidades abertas ao meio (20g)',
        prepTime: '30s para abrir',
        techniqueTip: 'Corte ao meio no sentido do comprimento para que a marinada penetre em seu interior.'
      },
      {
        name: 'Cebola roxa cortada em plumas',
        quantity: '1/3 de unidade média fatiada finíssima (40g)',
        prepTime: '45s de corte',
        techniqueTip: 'Deixe as fatias em água com gelo por 1 minuto antes de usar para remover o ardor excessivo e manter crocância.'
      },
      {
        name: 'Coentro fresco ou cheiro-verde picadinho',
        quantity: '1 colher de sopa cheia (8g)',
        prepTime: '20s para picar',
        techniqueTip: 'Adicione apenas no instante de servir para manter o tom verde vivo sem murchar no cítrico.'
      }
    ],
    pantryItems: [
      { item: 'Flor de sal marinho', quantity: '1 colher de chá rasa (3g)' },
      { item: 'Azeite extravirgem suave', quantity: '1 colher de sopa (15ml)' }
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '2 minutos',
        action: 'Lâminas do Peixe & Choque na Cebola',
        description: 'Fatie os 220g de tilápia com faca bem afiada em lâminas anguladas de 3mm. Deixe a cebola roxa fatiada em água gelada por 1 minuto e escorra.',
        temperatureOrFire: 'Tábua gelada'
      },
      {
        stepNumber: 2,
        phase: 'Mise en Place',
        timeEstimate: '1 minuto',
        action: 'Extração do Leite de Tigre Caipira',
        description: 'Esprema as 2 tangerinas cravo (80ml) e o meio limão (15ml) em uma molheira. Dissolva a flor de sal e emulsione com os 15ml de azeite.',
        temperatureOrFire: 'Bancada'
      },
      {
        stepNumber: 3,
        phase: 'Fogo & Cocção',
        timeEstimate: '45 segundos',
        action: 'Cura Cítrica Flash',
        description: 'Disponha as lâminas de peixe no prato azul petróleo. Despeje o suco cítrico sobre o peixe com a cebola roxa e deixe marinar por 30 segundos.',
        temperatureOrFire: 'Sem fogo (marinado a frio)'
      },
      {
        stepNumber: 4,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Guarnição de Pimentas & Servir',
        description: 'Distribua as pimentas biquinho cortadas ao meio e salpique o coentro fresco. Sirva imediatamente enquanto o peixe mantém o centro translúcido.',
        temperatureOrFire: 'Servir frio'
      }
    ],
    masterSecret: 'Nunca deixe o peixe marinar por mais de 3 minutos no cítrico: a cura rápida de 30 a 60 segundos preserva a textura acetinada do peixe cru no centro!',
    flavorProfile: 'Explosão cítrica frutada da tangerina, acidez refrescante, estalo adocicado da pimenta biquinho e textura tenra do peixe.',
    fixedSceneGlobal: 'Bancada de granito São Gabriel preto fosco com esteira artesanal de palha clara à esquerda, parede de taipa de pilão terrosa ao fundo com folhagens tropicais verdes em desfoque cinematográfico e iluminação refrescante de 5500K com reflexos cristalinos nos cítricos.',
    fixedObjectsGlobal: 'Prato fundo de cerâmica artesanal azul petróleo com borda rústica irregular, faca fina japonesa yanagiba com cabo de madeira clara, tábua de polietileno sanitária branca com base antiderrapante escura, tigelinha de barro escura com pimentas biquinho vermelhas brilhantes e colher de cerâmica.',
    prompts: [
      {
        takeNumber: 1,
        timeRange: '0:00 - 0:09',
        actName: 'Take 1: O Gancho & Apresentação',
        spokenLine: 'Hoje você aprende o ceviche caipira mais refrescante do país: peixe fresco com marinada de tangerina cravo e pimenta biquinho!',
        videoShotPrompt: 'Enquadramento 9:16 vertical sobre o granito preto fosco, lâminas peroladas de peixe fresco sendo dispostas no prato azul petróleo com gotas de suco de tangerina escorrendo.',
        soundFxCue: 'Som fluido do suco cítrico caindo suavemente sobre a cerâmica gelada.',
        targetWords: 22,
        fixedSceneContext: 'Bancada de granito São Gabriel preto fosco, esteira de palha clara e parede de taipa de pilão ao fundo com iluminação clara e cristalina de 5500K.',
        fixedObjectsProps: 'Prato fundo de cerâmica artesanal azul petróleo com borda irregular orgânica e lâminas translúcidas de peixe branco fresco dispostas em leque.'
      },
      {
        takeNumber: 2,
        timeRange: '0:09 - 0:18',
        actName: 'Take 2: Ingredientes & Quantidades na Bancada',
        spokenLine: 'Duzentos e vinte gramas de tilápia fresca, oitenta mililitros de suco de tangerina cravo, cebola roxa fininha e dez pimentas biquinho!',
        videoShotPrompt: 'Top-down zenital sobre o granito preto, faca yanagiba fatiando o peixe translúcido com facilidade cirúrgica e as pimentas biquinho brilhando ao lado da tangerina cortada.',
        soundFxCue: 'Corte suave da lâmina afiada deslizando na tábua de madeira rústica.',
        targetWords: 23,
        fixedSceneContext: 'Bancada de granito São Gabriel preto fosco, esteira de palha clara e parede de taipa de pilão ao fundo com iluminação clara e cristalina de 5500K.',
        fixedObjectsProps: 'Faca yanagiba japonesa com cabo de madeira clara de magnólia, meia tangerina cravo alaranjada com gomos brilhantes e tigelinha com pimentas biquinho vermelhas reluzentes.'
      },
      {
        takeNumber: 3,
        timeRange: '0:18 - 0:27',
        actName: 'Take 3: O Ponto da Cura Cítrica & Tempo de Marinar',
        spokenLine: 'Dois minutos de preparo na bancada e quarenta segundos de marinada! O ácido cura as bordas do peixe mantendo o miolo incrivelmente macio!',
        videoShotPrompt: 'Close médio nas lâminas de peixe dentro do prato azul petróleo mudando suavemente de cor translúcida para branco opaco enquanto a marinada emulsiona com o azeite.',
        soundFxCue: 'Som de garfo misturando o líquido aromático espalhando pequenas bolhas.',
        targetWords: 25,
        fixedSceneContext: 'Bancada de granito São Gabriel preto fosco, esteira de palha clara e parede de taipa de pilão ao fundo com iluminação clara e cristalina de 5500K.',
        fixedObjectsProps: 'Mesmo prato fundo de cerâmica artesanal azul petróleo com os sucos alaranjados de tangerina e limão, fatias roxas finas de cebola e colher de cerâmica misturando delicadamente.'
      },
      {
        takeNumber: 4,
        timeRange: '0:27 - 0:36',
        actName: 'Take 4: Montagem Final & Degustação',
        spokenLine: 'Decora com as pimentas biquinho, pega na colher e sente essa explosão cítrica tropical! Perfeito e elegante. Compartilha com quem ama peixe!',
        videoShotPrompt: 'Colher de sobremesa preenchida com peixe brilhante, caldo alaranjado de tangerina e pimenta biquinho erguida diretamente em direção à câmera sobre o prato azul petróleo.',
        soundFxCue: 'Som de degustação suculenta acompanhado de acorde musical vivo e vibrante.',
        targetWords: 24,
        fixedSceneContext: 'Bancada de granito São Gabriel preto fosco, esteira de palha clara e parede de taipa de pilão ao fundo com iluminação clara e cristalina de 5500K.',
        fixedObjectsProps: 'Mesmo prato azul petróleo com ceviche caipira finalizado com folhas de coentro, colher de cerâmica levantando a porção suculenta com caldo brilhante.'
      }
    ]
  },
  {
    id: 'tataki-salmao-ponzu',
    title: 'Tataki de Salmão com Crosta de Gergelim & Ponzu Cítrico',
    subtitle: 'Lombo de salmão selado com gergelim tostado, interior cru amanteigado e molho ponzu com cebolinha.',
    cuisineType: 'internacional',
    country: 'Japão (Tóquio)',
    flag: '🇯🇵',
    category: 'Gourmet / Asiático',
    servings: '1 a 2 porções',
    prepTimeMinutes: 3,
    cookTimeMinutes: 1,
    totalTimeDisplay: '4 minutos',
    freshIngredients: [
      {
        name: 'Lombo alto de salmão fresco qualidade sashimi',
        quantity: '250g (bloco retangular uniforme de 4x4cm)',
        prepTime: '1 min para aparar e secar',
        techniqueTip: 'Seque a superfície com papel toalha antes de aplicar as sementes para aderência perfeita.'
      },
      {
        name: 'Mix de gergelim branco e preto frescos',
        quantity: '40g (cerca de 3 colheres de sopa cheias)',
        prepTime: '20s para misturar',
        techniqueTip: 'Use mix meio a meio cru; ele tostará e liberará o aroma amendoado durante a selagem relâmpago.'
      },
      {
        name: 'Cebolinha verde fresca fatiada',
        quantity: '2 colheres de sopa de anéis finos (10g)',
        prepTime: '30s de corte fino',
        techniqueTip: 'Fatie a parte verde em lâminas quase transparentes para decorar e aromatizar o molho.'
      },
      {
        name: 'Gengibre fresco ralado',
        quantity: '1 colher de chá (5g)',
        prepTime: '20s no ralador fino',
        techniqueTip: 'Rale no ralador de cerâmica para extrair o suco picante sem fiapos de fibra.'
      },
      {
        name: 'Molho ponzu cítrico artesanal',
        quantity: '4 colheres de sopa (60ml)',
        prepTime: 'Pronto para uso',
        techniqueTip: 'Mistura de shoyu com suco de limão ou yuzu e gota de vinagre de arroz para corte de gordura.'
      }
    ],
    pantryItems: [
      { item: 'Óleo de gergelim torrado para untar a frigideira', quantity: '1 colher de chá (5ml)' },
      { item: 'Flor de sal marinho', quantity: '1 pitada leve' }
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '1 min 30s',
        action: 'Secagem & Empanamento no Gergelim',
        description: 'Seque o bloco de 250g de salmão com papel toalha. Espalhe os 40g de gergelim na tábua e pressione cada uma das quatro faces do peixe para empanar uniformemente.',
        temperatureOrFire: 'Tábua Hinoki'
      },
      {
        stepNumber: 2,
        phase: 'Fogo & Cocção',
        timeEstimate: '45 segundos',
        action: 'Selagem Flash de 8 Segundos por Lado',
        description: 'Aqueça a frigideira de ferro com 5ml de óleo de gergelim até soltar primeira fumaça. Sele cada uma das 4 faces por apenas 8 segundos até o gergelim dourar sem cozinhar o interior.',
        temperatureOrFire: 'Fogo alto extremo (230°C)'
      },
      {
        stepNumber: 3,
        phase: 'Mise en Place',
        timeEstimate: '30 segundos',
        action: 'Descanso Rápido & Corte com Faca Afiada',
        description: 'Transfira para a tábua e deixe descansar 20 segundos. Com faca de sashimi bem afiada, fatie em lâminas generosas de 1cm de espessura.',
        temperatureOrFire: 'Bancada'
      },
      {
        stepNumber: 4,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Empratamento & Banho de Ponzu',
        description: 'Disponha as fatias sobrepostas no prato de cerâmica japonesa. Regue com os 60ml de molho ponzu, salpique a cebolinha e sirva com o gengibre ralado.',
        temperatureOrFire: 'Servir morno/frio'
      }
    ],
    masterSecret: 'O choque de temperatura é tudo: a panela deve estar estalando de quente para tostar o gergelim em 8 segundos sem penetrar mais de 2 milímetros na carne do salmão!',
    flavorProfile: 'Crocância tostada intensa do gergelim, miolo macio e amanteigado de salmão cru, acidez umami salina do ponzu e frescor do gengibre.',
    fixedSceneGlobal: 'Balcão minimalista japonês de madeira Hinoki clara com acabamento acetinado natural, painel de ripas de carvalho escuro (shoji) ao fundo com iluminação zenital difusa e névoa sutil de fumaça aromática de óleo de gergelim.',
    fixedObjectsGlobal: 'Prato retangular de cerâmica japonesa preta fosca com textura de pedra e detalhes em esmalte verde musgo escuro, frigideira retangular pesada de ferro fundido com cabo de metal, faca de sashimi japonesa de lâmina longa escura e hashi de ébano com descanso de cerâmica.',
    prompts: [
      {
        takeNumber: 1,
        timeRange: '0:00 - 0:09',
        actName: 'Take 1: O Gancho & Apresentação',
        spokenLine: 'Hoje você aprende o tataki de salmão perfeito de restaurante japonês: crosta crocante de gergelim e o interior cru mais amanteigado do mundo!',
        videoShotPrompt: 'Vertical 9:16, close macro na lâmina da faca de sashimi fatiando o salmão selado no balcão de madeira Hinoki, revelando a borda dourada e o centro rosa choque brilhante.',
        soundFxCue: 'Estalo de corte limpo e suave na pele e sementes de gergelim tostadas.',
        targetWords: 24,
        fixedSceneContext: 'Balcão minimalista japonês de madeira Hinoki clara, ripas de carvalho escuro ao fundo, iluminação zenital suave e foco preciso no balcão.',
        fixedObjectsProps: 'Prato retangular de cerâmica japonesa preta com esmalte verde musgo, faca longa japonesa de sashimi e bloco de salmão fresco com crosta de gergelim preto e branco.'
      },
      {
        takeNumber: 2,
        timeRange: '0:09 - 0:18',
        actName: 'Take 2: Ingredientes & Quantidades na Bancada',
        spokenLine: 'Duzentos e cinquenta gramas de lombo alto de salmão, quarenta gramas de mix de gergelins, cebolinha fatiada fininha e gengibre ralado na hora!',
        videoShotPrompt: 'Ângulo zenital top-down com luz lateral suave, o bloco de salmão fresco sendo envolvido pelas sementes de gergelim branco e preto sobre a madeira Hinoki.',
        soundFxCue: 'Som seco e rítmico das sementes de gergelim se acomodando na tábua.',
        targetWords: 24,
        fixedSceneContext: 'Balcão minimalista japonês de madeira Hinoki clara, ripas de carvalho escuro ao fundo, iluminação zenital suave e foco preciso no balcão.',
        fixedObjectsProps: 'Tábua de corte plana de madeira Hinoki, tigela pequena de cerâmica com as sementes misturadas, gengibre fresco ralado e cebolinha fatiada em tiras finas de papel.'
      },
      {
        takeNumber: 3,
        timeRange: '0:18 - 0:27',
        actName: 'Take 3: O Ponto do Fogo & Tempo de Selagem',
        spokenLine: 'Frigideira fumegando em calor extremo: são apenas oito segundos de cada lado! Tostou o gergelim, retira imediatamente para não cozinhar por dentro!',
        videoShotPrompt: 'Foco na frigideira pesada de ferro fundido retangular com fumaça aromática de óleo de gergelim e as sementes de gergelim pipocando com calor intenso.',
        soundFxCue: 'Chiado elétrico e imediato do peixe encostando na frigideira em brasa.',
        targetWords: 24,
        fixedSceneContext: 'Balcão minimalista japonês de madeira Hinoki clara, ripas de carvalho escuro ao fundo, iluminação zenital suave e foco preciso no balcão.',
        fixedObjectsProps: 'Frigideira pesada de ferro fundido retangular preta sobre fogareiro portátil de inox, pinça metálica de cozinha virando o bloco de salmão em 4 lados com rapidez.'
      },
      {
        takeNumber: 4,
        timeRange: '0:27 - 0:36',
        actName: 'Take 4: Fatiamento, Molho Ponzu & Mordida',
        spokenLine: 'Fatia em lâminas generosas, banha com sessenta mililitros de molho ponzu e cai dentro! Puro luxo. Salva e prepara hoje mesmo!',
        videoShotPrompt: 'Lâmina de tataki no prato japonês de cerâmica preta sendo mergulhada no molho ponzu brilhante com cebolinha antes de ser erguida com hashi de ébano para a lente.',
        soundFxCue: 'Gotas de molho pingando e estalo crocante ao mastigar.',
        targetWords: 25,
        fixedSceneContext: 'Balcão minimalista japonês de madeira Hinoki clara, ripas de carvalho escuro ao fundo, iluminação zenital suave e foco preciso no balcão.',
        fixedObjectsProps: 'Prato retangular de cerâmica japonesa preta com 4 fatias generosas de tataki, molheira quadrada pequena com molho ponzu cítrico e par de hashi de ébano escuro.'
      }
    ]
  }
];
