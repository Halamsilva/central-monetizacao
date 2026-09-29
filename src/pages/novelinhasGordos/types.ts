export type TargetAiModel = "flow" | "kling" | "runway" | "sora" | "luma" | "hailuo" | "wan" | "veo";

export type StoryTone = "emocionante" | "comedia" | "misto" | "superacao";

export type SettingType =
  | "automatico"
  | "aleatorio"
  | "sala_cozinha"
  | "rua_lama"
  | "boteco_esquina"
  | "feira_livre"
  | "barbearia_salao"
  | "borracharia_oficina"
  | "obra_laje"
  | "ponto_onibus"
  | "mercearia"
  | "misto";

export type CharacterFocus =
  | "diversificado"
  | "todos"
  | "raimundo"
  | "dona_lucia"
  | "carla"
  | "seu_tiao"
  | "valdirene"
  | "tia_creuza"
  | "marcao_pedreiro"
  | "betinho_van"
  | "pastor_edvaldo"
  | "irmao";

export interface DialogueTurn {
  speaker: string; // Nome do personagem falante exclusivo deste turno
  speakerVisualAnchor?: string; // Identificação com características visuais e roupa
  timeRange: string; // Intervalo de tempo exato (ex: "01:00 - 03:50", "04:00 - 07:00")
  speech: string; // Fala exclusiva do personagem em português do Brasil
  characterAction: string; // Ação física motivada do falante durante a fala
  silentListeners: string; // Ouvintes em silêncio absoluto, lábios fechados e escuta ativa natural
  lipSyncExclusiveRule: string; // Instrução estrita: somente o falante move lábios
}

export interface TimingBreakdown {
  time: string;
  speaker?: string; // Nome do personagem falante exclusivo neste intervalo
  speech: string;
  action: string;
  silentListeners?: string; // Instrução de silêncio e reação natural dos ouvintes
}

export interface DialogueData {
  fullText: string;
  wordCount: number;
  timingBreakdown: TimingBreakdown[];
  turns?: DialogueTurn[]; // Sequência estruturada de turnos de diálogo entre múltiplos personagens
  speakersInvolved?: string[]; // Lista de todos os personagens com falas atribuídas nesta cena
  multiCharacterDialogue?: boolean; // Flag indicando diálogo entre 2 ou mais personagens
}

export interface CharacterVisualAnchor {
  name: string;
  ageAndFace: string;
  lockedAttire: string; // Roupas exatas travadas em todos os takes (cores, corte, manchas)
  bodyAndWeight300kg: string; // Físico e peso definido (massa visceral, dobras e silhueta)
  weightKg?: number; // Peso exato em kg configurado pelo usuário para o personagem (ex: 300, 200, 150)
  perspirationAndSkin: string; // Poros 8k, gotas de suor, brilho especular
  consistencyPromptClause: string; // Cláusula pronta em inglês para manter o personagem 100% idêntico
  roleInStory?: string; // Papel (ex: Protagonista, Esposa / Co-protagonista, Vizinho, Mãe)
  scenesPresent?: number[]; // Lista de cenas em que este personagem aparece (ex: [1, 2, 3])
  uploadedImageUrl?: string; // URL / Base64 da foto enviada pelo usuário para o personagem
  isCustomUploaded?: boolean; // Flag indicando que o personagem foi criado a partir de uma foto enviada
}

export interface UploadedCharacterData {
  imageDataUrl: string; // Imagem em base64 (data:image/...)
  fileName?: string;
  name: string; // Nome do personagem fornecido ou detectado
  role?: string; // "Protagonista Principal", "Coadjuvante Central", etc.
  genderAndAge?: string; // Idade aparente e gênero detectados
  faceAndHair?: string; // Feições faciais, cabelo, barba, olhos e marcas
  lockedAttire?: string; // Roupas e calçados travados da foto
  bodyTraits?: string; // Porte físico, postura e traços corporais
  distinguishingFeatures?: string; // Óculos, tatuagens, boné, acessórios ou cicatrizes
  visualSummaryForPrompt?: string; // Síntese de prompt visual em inglês para fixar nas IAs
  portugueseSummary?: string; // Resumo em português para o roteiro
  isAnalyzed?: boolean; // Se a IA já processou a foto com sucesso
}

export interface CameraShotSegment {
  timecode: string; // Ex: "[00:00 - 00:03]"
  shotType: string; // Ex: "Plano Médio Handheld (OTS / Over-the-Shoulder)" ou "Close-up Expressivo"
  movement: string; // Ex: "Slow push-in sutil acompanhando a respiração e a tensão"
  focalPoint: string; // Ex: "Expressão chocada e gotículas de suor na testa"
  lensAndAperture?: string; // Ex: "35mm prime, f/2.4, profundidade de campo cinematográfica"
  cinematicIntent: string; // Ex: "Revelar o impacto da notícia e conectar o espectador à gravidade cômica"
}

export interface CinematographyDirection {
  directorVision: string; // Visão de fotografia do diretor com +50 anos de experiência
  cameraType: string; // Ex: "Handheld orgânica com oscilações humanas sutis de operador físico presente"
  shotProgression: CameraShotSegment[]; // 2 a 3 enquadramentos complementares em 8-9s ou tomada contínua detalhada
  lightingAndAtmosphere: string; // Iluminação naturalista, sombras, contraste e atmosfera
  lensChoice: string; // Lente e profundidade de campo
  emotionalToneAlignment: string; // Como o enquadramento amplifica a comédia/tensão da cena
}

export interface ContinuityBridge {
  outgoingMoment: string; // Como o take anterior terminou (último frame, posição das mãos, olhar, objeto segurado, expressão, fala)
  incomingMoment: string; // Como este take começa no primeiro frame (conexão 1:1 e continuidade exata da ação)
  nextSceneHandoff: string; // Como este take termina e prepara o próximo (gancho de ação, movimento inacabado ou reação para o take seguinte)
  matchCutType: string; // Tipo de corte contínuo (ex: "Corte na Ação Contínua", "Corte para Reação/Contra-campo", "Corte por Vetor de Movimento", "Match-cut de Objeto")
  characterSpatialPositions: string; // Posição física exata dos personagens no ambiente e direção dos olhares
  emotionalContinuity: string; // Evolução e coerência do estado emocional vindo da cena anterior
}

export interface ActorDirection {
  directorVision: string; // Visão do diretor de atores (50+ anos de experiência em naturalismo e comportamento humano)
  microMovements: string; // Micro-movimentos: respiração diafragmática, pestanejar espontâneo, micro-inclinações de cabeça, deslocamento de peso
  handsAndGrip: string; // Biomecânica das mãos: exatamente 5 dedos articulados por mão, contato sólido com objetos, sem clipping nem flutuação
  biomechanicsAndWeight: string; // Física corporal: inércia, equilíbrio, aceleração/desaceleração gradual, passos assentados no solo sem deslizar
  reactionSequence: string; // Ordem temporal da reação humana: percepção -> olhos -> cabeça -> microexpressão facial -> corpo -> fala/ação
  dialogueDeliveryAndLips: string; // Sincronia labial milissegundo a milissegundo com pausas respiratórias e escuta ativa de quem ouve
  spatialInteraction: string; // Interação física realista com o ambiente (cadeiras, balcões, superfícies sólidas respeitando a massa)
  antiDeformationRules: string; // Salvaguardas anti-deformação estritas de IA (sem membros atravessando corpos, sem dedos extras, sem morphing)
}

export interface NarrativeHook {
  headline: string; // Frase de impacto ou gancho magnético dos primeiros 3 segundos
  hookType: "pergunta_provocativa" | "acao_em_andamento" | "revelacao_chocante" | "quebra_expectativa" | "dilema_urgente" | "no_na_garganta";
  visualElement: string; // O que os olhos do espectador veem nos primeiros 2 a 3 segundos para prender a atenção
  corePromise: string; // A promessa implícita da história (o mistério ou tensão que será resolvido no final)
  retentionTrigger: string; // O motivo psicológico que impede o espectador de pular o vídeo
}

export interface NarrativeIdentity {
  mainTheme: string; // Tema principal
  centralEvent: string; // Acontecimento central
  charactersInvolved: string[]; // Personagens envolvidos
  environment: string; // Ambiente da história (preservado/coerente)
  narrativeObjective: string; // Objetivo narrativo
  mainConflict: string; // Conflito principal
  expectedDevelopment: string; // Desenvolvimento esperado
  possibleResolution: string; // Possível desfecho
  isLocked: boolean; // Trava inviolável de continuidade
}

export interface NarrativeMemory {
  establishedFacts: string[]; // O que já aconteceu nos takes anteriores
  currentLocations: string; // Onde os personagens estão agora
  charactersKnowledge: string; // O que cada um já sabe
  completedActions: string[]; // Ações já concluídas (sem repetição)
  pendingEvents: string[]; // O que ainda precisa se desenvolver
  logicalNextStep: string; // Próximo passo estritamente decorrente
}

export type NovelinhaStage = "gancho_inicial" | "desenvolvimento" | "complicacao" | "climax" | "desfecho";

export interface NovelinhaProgression {
  stage: NovelinhaStage;
  stageName: string; // Ex: "ETAPA 1 — GANCHO INICIAL" | "ETAPA 2 — DESENVOLVIMENTO" | "ETAPA 3 — COMPLICAÇÃO" | "ETAPA 4 — CLÍMAX" | "ETAPA 5 — DESFECHO"
  whatHappenedBefore: string; // O que aconteceu anteriormente
  characterDesireNow: string; // O que o personagem deseja neste momento
  logicalNextAction: string; // Próxima ação lógica
  whyActionHappens: string; // Por que essa ação acontece (relação clara de causa)
  immediateConsequence: string; // Qual será a consequência imediata
  preparesNextPrompt: string; // Como essa consequência prepara o próximo prompt
  emotionalEvolution: string; // Evolução emocional gradual (sem mudanças bruscas ou choro gratuito)
  humanInteractionFraming: string; // Enquadramento que prioriza ver os personagens interagindo juntos (sem closes excessivos)
}

export interface NarrativePlan {
  protagonist: string; // Quem é o protagonista
  supportingCharacters: string[]; // Quem são os personagens secundários
  initialSituation: string; // Qual é a situação inicial
  mainConflict: string; // Qual é o conflito principal
  characterDesires: string; // O que cada personagem deseja
  conflictDevelopments: string[]; // Quais acontecimentos desenvolvem o conflito
  keyDecisions: string[]; // Quais decisões os personagens precisam tomar
  consequences: string[]; // Quais consequências surgem dessas decisões
  highestTensionPeak: string; // Qual será o momento de maior tensão (Clímax)
  storyResolution: string; // Como a história será concluída com sentido para toda a jornada
  directorExperienceNote: string; // Direção cinematográfica de novelinhas com mais de 50 anos de experiência
}

export interface GeneratedScene {
  sceneNumber: number;
  title: string;
  location: string;
  durationSeconds: number;
  characterSpeaking: string;
  narrativeBeat?: string; // Ex: "Ato 1: Início & Gancho", "Ato 2: Desenvolvimento", "Ato 3: Complicação", "Ato 4: Clímax", "Ato Final: Desfecho"
  storyConnection?: string; // Como esta cena responde: "O que acontece em seguida nesta história?"
  novelinhaProgression?: NovelinhaProgression; // Estrutura obrigatória de novelinha em 5 etapas e causa-efeito
  narrativeHook?: NarrativeHook; // Gancho narrativo inicial (presente especialmente na Cena 1 e referenciado nas demais)
  hookPayoff?: string; // Como este take desenvolve ou entrega a promessa do gancho inicial
  narrativeMemory?: NarrativeMemory; // Memória narrativa preservada entre os takes
  characterVisualAnchor?: CharacterVisualAnchor; // Ficha do personagem principal / falante
  charactersInScene?: CharacterVisualAnchor[]; // Ficha detalhada de TODOS os personagens presentes nesta cena (falantes ou ouvintes)
  dialogue: DialogueData;
  englishPrompt: string;
  portuguesePrompt: string;
  negativePrompt: string;
  cameraDirection: string;
  cinematography?: CinematographyDirection; // Decupagem cinematográfica profissional de takes e closes
  continuityBridge?: ContinuityBridge; // Conexão e continuidade exata entre o último e primeiro frame
  actorDirection?: ActorDirection; // Direção de atores, micro-movimentos e biomecânica humana ultrarrealista
  skinAndLighting: string;
  environmentDetails: string;
}

export interface CharacterVisualReference {
  name: string;
  role: string;
  weight: string;
  fullBodyDescription: string;
  clothingAndFootwear: string;
  hairAndFacialFeatures: string;
  spatialArrangement: string; // Ex: "Posicionado à esquerda, corpo inteiro, em pé, sem sobreposição"
  uploadedImageUrl?: string; // URL / Base64 da foto enviada para o personagem
  isCustomUploaded?: boolean; // Flag indicando que é o personagem da foto
}

export interface PromptZeroReference {
  title: string; // "PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS"
  purpose: string;
  englishPrompt: string;
  portuguesePrompt: string;
  negativePrompt: string;
  characters: CharacterVisualReference[];
  aspectRatio: string; // "16:9"
  modelTips?: string;
  technicalSpecs: {
    background: string; // "Fundo branco puro (pure white seamless studio background)"
    framing: string; // "Corpo inteiro de todos os personagens, lado a lado, sem sobreposição"
    lighting: string; // "Iluminação fotográfica de estúdio uniforme e difusa"
    resolution: string; // "Fotografia profissional 4K, alta definição facial, texturas de pele ultrarrealistas"
    zeroSceneryRule: string; // "Sem cenário, sem objetos decorativos, sem textos ou elementos adicionais"
  };
}

export interface GeneratedBatch {
  themeTitle: string;
  synopsis: string;
  promptZero?: PromptZeroReference; // PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS (OBRIGATÓRIO)
  narrativePlan?: NarrativePlan; // Planejamento completo de novelinha (50+ anos de experiência)
  narrativeIdentity?: NarrativeIdentity; // Identidade narrativa fixa e travada da história
  narrativeHook?: NarrativeHook; // Gancho forte de abertura nos primeiros segundos que orienta todo o arco da história
  narrativeArc?: string; // Síntese do arco narrativo que conecta todos os takes do início ao encerramento
  storyTone?: StoryTone; // Tom da história (ex: emocionante, comedia, misto, superacao)
  characterWeightKg?: number; // Peso em kg configurado para todos os personagens pelo usuário (ex: 300, 200, 150)
  uploadedCharacter?: UploadedCharacterData; // Dados e foto do personagem personalizado enviado pelo usuário
  scenes: GeneratedScene[];
  consistencyKeywords: string;
  castDossier?: CharacterVisualAnchor[]; // Elenco completo travado de personagens do episódio com todas as roupas e traços consistentes
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  actorArchetype: string;
  weight: string;
  anatomyTraits: string[];
  clothing: string[];
  signatureProps: string[];
  skinTextureFormula: string;
  voiceStyle: string;
  promptSnippet: string;
}

export interface VideoReferenceAnalysis {
  title: string;
  description: string;
  category: "personagens" | "pele_suor" | "cenario_interior" | "cenario_exterior" | "falas_9s" | "direcao_fotografia" | "continuidade_narrativa";
  keyDetails: string[];
  visualPromptKeywords: string[];
  negativeKeywords: string[];
}

export interface PresetSituation {
  id: string;
  title: string;
  synopsis: string;
  setting: SettingType;
  characterFocus: CharacterFocus;
  storyTone?: StoryTone;
  icon?: string;
  customDetails?: string;
}

export interface StoryAnalysisResult {
  theme: string;
  synopsis: string;
  storyTone: StoryTone;
  numScenes: number;
  setting: SettingType;
  settingDescription?: string;
  customDetails: string;
  hookHeadline?: string;
  mainCharacters?: { name: string; role: string; attire?: string }[];
  explanation?: string;
}
