import { CultivationTheme } from "./types";

export const CULTIVATION_THEMES: CultivationTheme[] = [
  {
    id: "abobrinha",
    title: "Abobrinha gigante",
    category: "Frutos",
    description: "Espécimes colossais de abobrinha romana em canteiro elevado.",
    emoji: "🥒",
    characterType: "homem-rural",
    settingType: "quintal-simples"
  },
  {
    id: "pepino",
    title: "Pepino carregado",
    category: "Frutos",
    description: "Ramas verticais de pepino caipira repletas de frutos verdes.",
    emoji: "🥒",
    characterType: "homem-rural",
    settingType: "quintal-simples"
  },
  {
    id: "tomate",
    title: "Tomate cereja",
    category: "Frutos",
    description: "Pés erguidos em vasos carregados com cachos vermelhos brilhantes.",
    emoji: "🍅",
    characterType: "jovem-urbano",
    settingType: "apartamento-sacada"
  },
  {
    id: "pimentao",
    title: "Pimentão",
    category: "Frutos",
    description: "Vasos de pimentão amarelo e vermelho com frutos firmes e polidos.",
    emoji: "🫑",
    characterType: "senhora-balcao",
    settingType: "apartamento-sacada"
  },
  {
    id: "quiabo",
    title: "Quiabo",
    category: "Frutos",
    description: "Cultivo simples de quiabo rústico com flores e frutos prontos.",
    emoji: "🌱",
    characterType: "homem-rural",
    settingType: "quintal-simples"
  },
  {
    id: "berinjela",
    title: "Berinjela",
    category: "Frutos",
    description: "Frutos roxos escuros reluzentes pesando nos galhos do vaso.",
    emoji: "🍆",
    characterType: "senhora-balcao",
    settingType: "quintal-simples"
  },
  {
    id: "morango",
    title: "Morango",
    category: "Frutos",
    description: "Vasos suspensos transbordando morangos maduros pendentes.",
    emoji: "🍓",
    characterType: "jovem-urbano",
    settingType: "apartamento-sacada"
  },
  {
    id: "alface",
    title: "Alface",
    category: "Folhas/Ervas",
    description: "Cabeças de alface crespa verde-clara formadas em caixa de madeira.",
    emoji: "🥬",
    characterType: "senhora-balcao",
    settingType: "apartamento-sacada"
  },
  {
    id: "couve",
    title: "Couve",
    category: "Folhas/Ervas",
    description: "Folhas largas e viçosas de couve-manteiga prontas para colher.",
    emoji: "🥬",
    characterType: "homem-rural",
    settingType: "quintal-simples"
  },
  {
    id: "hortela",
    title: "Hortelã",
    category: "Folhas/Ervas",
    description: "Vaso de hortelã cheiroso e ramificado com folhagem verde e densa.",
    emoji: "🌿",
    characterType: "jovem-urbano",
    settingType: "apartamento-sacada"
  },
  {
    id: "cebolinha",
    title: "Cebolinha",
    category: "Folhas/Ervas",
    description: "Touceiras cheias de cebolinhas grossas e eretas em baldes de plástico.",
    emoji: "🧅",
    characterType: "jovem-urbano",
    settingType: "apartamento-sacada"
  },
  {
    id: "vertical",
    title: "Jardim vertical",
    category: "Métodos",
    description: "Aproveitamento de paredes inteiras de tijolo com tubos ou bolsos.",
    emoji: "📐",
    characterType: "jovem-urbano",
    settingType: "apartamento-sacada"
  },
  {
    id: "caixas",
    title: "Horta em caixas",
    category: "Métodos",
    description: "Caixotes de feira de madeira reciclados com furos e adubo rico.",
    emoji: "📦",
    characterType: "homem-rural",
    settingType: "laje-cobertura"
  },
  {
    id: "baldes",
    title: "Horta em baldes",
    category: "Métodos",
    description: "Baldes de construção ou alimentares reaproveitados de 20 litros.",
    emoji: "🪣",
    characterType: "homem-rural",
    settingType: "quintal-simples"
  },
  {
    id: "pet",
    title: "Horta em garrafas PET",
    category: "Métodos",
    description: "Garrafas suspensas na horizontal cheias de terra, temperos e carinho.",
    emoji: "🍾",
    characterType: "jovem-urbano",
    settingType: "apartamento-sacada"
  }
];

export const CHARACTER_OPTIONS = [
  {
    id: "homem-rural",
    label: "👨‍🌾 Produtor Rural Simples",
    description: "Aprox. 50 anos, moreno carismático, mãos calejadas, camiseta humilde e sabedoria prática.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "senhora-balcao",
    label: "👵 Avó das Plantas (Vovó)",
    description: "Aprox. 65 anos, óculos no nariz, cabelos brancos presos, avental florido e voz terna.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "jovem-urbano",
    label: "🧑 Agricultor de Varanda Jovem",
    description: "Aprox. 30 anos, negro carismático, regata comum, olhar focado e entusiasmo por ideias compactas.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"
  }
];

export const SETTING_OPTIONS = [
  {
    id: "quintal-simples",
    label: "🏡 Quintal Brasileiro de Tijolos de Barro",
    description: "Solo úmido, paredão rústico de tijolo cinza, mangueiras velhas e vasos rústicos."
  },
  {
    id: "horta",
    label: "🌱 Horta Orgânica Abundante e Verde",
    description: "Canteiros elevados de madeira rústica, solo fofo e úmido extremamente rico, e hortaliças em fileiras."
  },
  {
    id: "roca",
    label: "👨‍🌾 Roça Tradicional e Campo de Cultivo",
    description: "Grandes plantações direto na terra natural fértil, ar livre, cerca rústica e horizonte aberto."
  },
  {
    id: "apartamento-sacada",
    label: "🏢 Varanda/Sacada de Apartamento",
    description: "Espaço vertical estreito, vasos reciclados, fios de arame e vista modesta da rua."
  },
  {
    id: "laje-cobertura",
    label: "☀️ Laje de Concreto com Sol Direto",
    description: "Cimento queimado, caixas de isopor rústicas para germinação e baldes de tinta reaproveitados."
  }
];
