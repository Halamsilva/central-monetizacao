export interface SubconsciousTrigger {
  fase: string;
  gatilhoPrimitivo: string;
  alvoAtivado: string;
  impactoSubconscienteScore: number;
  analisePsicologica: string;
  palavrasChaveSensoriais: string[];
}

export interface NeuromarketingAudit {
  alvoPrincipal: string;
  scoreGeralPenetracao: number;
  resumoEstrategico: string;
  gatilhosDisparados: {
    quebraDePadrao: number;
    neuroniosEspelho: number;
    superioridadeStatus: number;
    magnetismoAtracao: number;
    alivioFrustracao: number;
    aversaoPerda: number;
  };
}

export interface ProductAnalysis {
  productName: string;
  type: string;
  colors: string[];
  materials: string;
  packaging?: string;
  targetAudience: string;
  likelyFunction: string;
  visualDetails?: string;
  anglesAnalyzed?: string;
}

export interface ScenePrompt {
  title: string;
  cenario: string;
  personagem: string;
  roupa: string;
  camera: string;
  iluminacao: string;
  produto: string;
  acao: string;
  continuidade: string;
  fala: string;
  restricoesNegativas: string;
  fullSeedancePrompt: string;
  gatilhoSubconsciente?: SubconsciousTrigger;
}

export interface PromptGenerationResponse {
  analysis: ProductAnalysis;
  prompts: ScenePrompt[];
  neuromarketingAudit?: NeuromarketingAudit;
}

export interface SavedProject {
  id: string;
  name: string;
  date: string;
  image?: string;
  image2?: string;
  image3?: string;
  presenterImage?: string;
  scenarioImage?: string;
  response: PromptGenerationResponse;
  videoType: string;
  voiceGender?: string;
  benefits?: string;
  spokenLines?: string;
  psychologicalTarget?: string;
}

