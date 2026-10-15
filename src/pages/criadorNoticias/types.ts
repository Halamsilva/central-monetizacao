export interface NewsBreakdown {
  hook: string;
  context: string;
  development: string;
  consequences: string;
  closing: string;
}

export interface KeyFacts {
  whatHappened?: string;
  location?: string;
  when?: string;
  who?: string;
  consequences?: string;
  authorities?: string;
  currentStatus?: string;
}

export interface SearchLink {
  title: string;
  uri: string;
}

export interface VideoPromptBlock {
  blockNumber: number; // 1 to 8
  timecode: string; // e.g. "00:00 - 00:10"
  phaseTitle: string; // e.g. "Bloco 1: O Gancho / O Impacto Inicial"
  sceneDescription: string; // Portuguese description of the scene
  visualPromptPt: string; // Portuguese visual prompt for 10-second shot without speech
  visualPromptEn: string; // English prompt optimized for AI video generators (Runway, Kling, Sora, Veo)
  cameraMovement: string; // e.g. "Slow drone push-in", "Tracking shot"
}

export interface GeneratedNewsData {
  title: string;
  script: string;
  estimatedDuration: string;
  wordCount: number;
  sources: string;
  rawFormattedOutput: string;
  breakdown: NewsBreakdown;
  keyFacts?: KeyFacts;
  alternativeTitles?: string[];
  viralityInsights?: string;
  searchLinks?: SearchLink[];
  scrapedSource?: {
    title?: string;
    url?: string;
  } | null;
  videoPrompts?: VideoPromptBlock[];
  generatedAt?: string;
  id?: string;
  isContingency?: boolean;
}

export type InputMode = 'url' | 'text' | 'quick_facts' | 'examples';

export type PacingOption = 'standard' | 'fast' | 'investigative';

export interface QuickFactsForm {
  title: string;
  location: string;
  whatHappened: string;
  details: string;
}
