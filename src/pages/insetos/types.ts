export interface CorpoReveladoPrompt {
  id: number; // 1 to 8
  stepName: string; // e.g., "PROMPT 1 — GANCHO CHOCANTE COM MODELO COLOSSAL & AÇÃO VISCERAL"
  durationSeconds: 8;
  timeRange: string; // e.g., "00:00 - 00:08"
  promptText: string; // Full standalone English prompt ready for AI video generation
  spokenLinePt: string; // Spoken Brazilian Portuguese line (~8s spoken timing)
  focalObject: string; // Educational nest, colossal insect model or demonstration surface
  actionSummary: string; // Physical action & continuity
  cameraFraming?: string; // Framing & lens specification (e.g. 20mm ultra-wide 9:16)
}

export type InsectPrompt = CorpoReveladoPrompt;

export interface VideoScript {
  id: string;
  theme: string;
  summary: string;
  focalObject: string;
  targetProblem: string;
  solutionIngredients?: string;
  elementsPrepared: string;
  transformationType: string;
  characterUsed?: string;
  settingUsed?: string;
  characterImagePreview?: string;
  settingImagePreview?: string;
  bookTitleUsed?: string;
  bookImagePreview?: string;
  includePrompt5?: boolean;
  includeCTA?: boolean;
  promptCount?: number;
  totalDurationSeconds?: number;
  prompts: CorpoReveladoPrompt[];
  createdAt: string;
  referenceAnalysis?: {
    hasReference: boolean;
    referenceType?: 'image' | 'video' | 'video_transcript' | 'text';
    videoFileName?: string;
    videoFileSizeMB?: number;
    detectedHook?: string;
    detectedObject?: string;
    pacingPreserved?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  imageUrl?: string;
  script?: VideoScript;
  isQuickAction?: boolean;
}

export type HookActionType = 
  | 'varied_dynamic'
  | 'spray_mist'
  | 'powder_dusting'
  | 'bait_placement'
  | 'drain_flush'
  | 'aromatic_barrier'
  | 'ultrasonic_smoke'
  | 'trap_capture'
  | 'liquid_pouring'
  | 'surgical_slice'
  | 'pinch_extraction'
  | 'pressure_squeeze'
  | 'scraping_abrasion';

export interface ThemeSuggestion {
  theme: string;
  model: string;
  hookType: 'curiosidade' | 'segredo' | 'problema_visivel' | 'descoberta';
  tag: string;
  solutionIngredients?: string;
  hookActionType?: HookActionType;
}

export interface PromptGenerationRequest {
  theme: string;
  referenceText?: string;
  referenceImageBase64?: string;
  imageMimeType?: string;
  referenceVideoBase64?: string;
  videoMimeType?: string;
  videoFileName?: string;
  videoFileSizeMB?: number;
  giantModelPreference?: string;
  hookStyle?: 'curiosidade' | 'segredo' | 'problema_visivel' | 'descoberta';
  solutionIngredients?: string;
  objectScale?: 'colossal_60' | 'large_45';
  hookActionType?: HookActionType;
  // Prompt Count & CTA options
  promptCount?: number; // e.g. 3, 4, 5, 6, 7, 8 (default 8)
  includeCTA?: boolean; // true = generate CTA with book at the end, false = 100% organic without CTA/book
  // Custom Character (Personagem)
  characterMode?: 'default_bjj_master' | 'custom';
  customCharacterDescription?: string;
  characterImageBase64?: string;
  characterImageMimeType?: string;
  characterImageName?: string;
  // Custom Scenario (Cenário)
  settingMode?: 'default_dojo_flags' | 'custom';
  customSettingDescription?: string;
  settingImageBase64?: string;
  settingImageMimeType?: string;
  settingImageName?: string;
  // Custom Book (Livro do Prompt de CTA)
  includePrompt5?: boolean;
  customBookTitle?: string;
  bookImageBase64?: string;
  bookImageMimeType?: string;
  bookImageName?: string;
}
