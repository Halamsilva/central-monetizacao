export interface CorpoReveladoPrompt {
  id: number; // 1 to 9
  stepName: string; // e.g., "PROMPT 1 — GANCHO + INÍCIO DA DEMONSTRAÇÃO"
  durationSeconds: 8;
  timeRange: string; // e.g., "00:00 - 00:08"
  promptText: string; // Full standalone English prompt ready for AI video generation
  spokenLinePt: string; // Spoken Brazilian Portuguese line (~8s spoken timing)
  focalObject: string; // Educational anatomical model or giant object
  actionSummary: string; // Physical action & continuity
  cameraFraming?: string; // Framing & lens specification (e.g. 20mm ultra-wide 9:16)
}

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
  productTitleUsed?: string;
  productImagePreview?: string;
  bookTitleUsed?: string;
  bookImagePreview?: string;
  includePrompt5?: boolean;
  promptCount?: number;
  includeCTA?: boolean;
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
  | 'surgical_slice'
  | 'pinch_extraction'
  | 'pressure_squeeze'
  | 'scraping_abrasion'
  | 'catheter_unclog'
  | 'uv_reveal'
  | 'liquid_pouring'
  | 'needle_injection';

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
  // Prompt Structure Customization
  promptCount?: number; // Number of prompts (e.g. 3 to 12, default: 9)
  includeCTA?: boolean; // Whether to include the 2 CTA prompts for product/encapsulado (default: true)
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
  // Custom Encapsulated Product (Prompts 8 and 9 - CTA)
  customProductTitle?: string;
  productImageBase64?: string;
  productImageMimeType?: string;
  productImageName?: string;
  // Custom Book / Legacy compatibility
  includePrompt5?: boolean;
  customBookTitle?: string;
  bookImageBase64?: string;
  bookImageMimeType?: string;
  bookImageName?: string;
}
