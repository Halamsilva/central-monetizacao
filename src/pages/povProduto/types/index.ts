export interface VisualMetrics {
  width: number;
  height: number;
  aspectRatioLabel: string;
  shapeDescription: string;
  dominantColor: {
    name: string;
    hex: string;
    rgb: [number, number, number];
  };
  secondaryColor: {
    name: string;
    hex: string;
    rgb: [number, number, number];
  };
  luminance: 'alta' | 'média' | 'escura';
  finishType: string;
  textureDensity: 'lisa e uniforme' | 'texturizada e detalhada' | 'com relevos visíveis';
  contrastLevel: 'alto contraste' | 'contraste suave' | 'tonalidade equilibrada';
}

export interface ProductDiagnostic {
  productName: string;
  category: string;
  confidenceScore: number;
  detectedFeatures: string[];
  dominantColor: { name: string; hex: string };
  secondaryColor: { name: string; hex: string };
  finishType: string;
  textureDensity: string;
  shapeDescription: string;
  aspectRatioLabel: string;
  handContactPoint: string;
  suggestedSpeechThemes: {
    hook: string;
    demo: string;
    cta: string;
  };
}

export interface ProductAnalysis {
  productName: string;
  category: string;
  visualDetails: string[];
  materialsAndColors: string[];
  handInteractionNotes: string;
  visualMetrics?: VisualMetrics;
}

export interface ScenePrompt {
  sceneNumber: 1 | 2 | 3;
  sceneType: 'gancho' | 'detalhes' | 'cta';
  title: string;
  timestampRange: string;
  englishPrompt: string;
  spokenDialogue: string;
  visualInteraction: string;
  keyFocalPoint: string;
  mentalTrigger?: string;
  alternativeDialogues?: string[];
}

export interface GeneratedResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  productAnalysis: ProductAnalysis;
  scenes: [ScenePrompt, ScenePrompt, ScenePrompt];
  rawText: string;
  customBrand?: string;
  customNotes?: string;
  ctaType?: string;
}

export interface SampleProduct {
  id: string;
  name: string;
  category: string;
  badge: string;
  imageUrl: string;
  description: string;
  defaultNotes?: string;
}
