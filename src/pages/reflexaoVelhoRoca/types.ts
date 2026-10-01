export type SpeakerGender = 'male' | 'female';

export interface ThemeItem {
  id: number;
  title: string;
  description: string;
  category: string;
  hookPreview: string;
}

export interface PromptScene {
  index: number;
  stageName: string; // e.g. "Prompt 1 — Gancho", "Prompt 2 — Apresentação da ideia", etc.
  visualPrompt: string; // Complete independent description of character, environment, lighting, camera, action
  spokenDialogue: string; // Speech strictly ~8 seconds in PT-BR
  estimatedSeconds: number; // ~8 seconds
  cameraAngle: string;
  characterAction: string;
  fullFormattedPrompt: string; // The ready-to-copy block for AI video generators (Sora, Kling, Runway, Luma, etc.)
  hookStyle?: string; // e.g. "Metáfora Rural", "Pergunta Direta", "Choque de Realidade", "Verdade Crua"
  alternativeHooks?: Array<{ style: string; text: string }>; // Varied hook alternatives ready to swap
  narrativeConnector?: string; // Logical connection bridge explaining how this speech connects to the previous one
}

export interface ReflectionScript {
  id: string;
  title: string;
  theme: string;
  environment: string;
  lighting: string;
  clothing: string;
  speakerGender?: SpeakerGender;
  customAvatarUrl?: string;
  customAvatarDescription?: string;
  customAvatarVisualProfile?: string;
  customEnvironmentUrl?: string;
  customEnvironmentDescription?: string;
  prompts: PromptScene[];
  createdAt: string;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  timeOfDay: string;
}
