export interface RecipeStepItem {
  stepNumber: number;
  title: string;
  instruction: string;
  timeEstimate: string;
  keyIngredient: string;
}

export interface RecipeStepByStep {
  prepTime: string; // Ex: "3 minutos de preparo"
  totalReadyTime: string; // Ex: "Pronto em 5 minutos (ação rápida sem esfregar)"
  difficulty: string; // Ex: "Muito Fácil • Ingredientes que você tem na despensa"
  servings: string; // Ex: "Rende 500ml de solução potente ou 1 aplicação profunda"
  ingredientsWithMeasurements: string[]; // Ex: ["2 colheres (sopa) de bicarbonato de sódio", "100ml de vinagre de álcool branco", "1 colher (sopa) de detergente neutro"]
  steps: RecipeStepItem[];
  howToConsume: string; // Modo exato de aplicação, tempo de ação e remoção com pano de microfibra
  safetyNotice: string; // Segurança doméstica (não misturar com cloro, seguro para superfícies)
  scientificBacking: string; // Respaldo químico/físico da ação desengordurante ou desincrustante
}

export interface PromptItem {
  step: number;
  title: string;
  duration: string;
  goal: string;
  spokenScript: string;
  wordCount: number;
  voiceDirection: string;
  facialExpressionsAndHumanRealism: string;
  handMovements: string;
  cameraAndLighting: string;
  videoPromptVisual: string;
  videoPromptEnglish: string;
  engineParameters: string;
  scientificBacking?: string;
  recipeStepDetail?: string; // Detalhe da etapa da misturinha ou ação na cena
  timeToReady?: string; // Tempo específico desta etapa
}

export interface CampaignOverview {
  productName: string;
  niche: string;
  consistentCharacter: string;
  consistentSetting: string;
  bodyPartModel: string; // Maquete gigante 1,20m da sujeira / corte transversal
  ingredientsList: string[];
  bottleAppearance: string;
  technicalSpecs: string;
  scientificBacking?: string;
  recipeStepByStep?: RecipeStepByStep;
}

export interface GeneratedCampaign {
  campaignOverview: CampaignOverview;
  prompts: PromptItem[];
}

export interface PresetNiche {
  id: string;
  name: string;
  icon: string;
  productName: string;
  nicheDescription: string;
  bodyPartModel: string;
  ingredients: string;
  characterDescription: string;
  settingDescription: string;
  supplementDescription: string;
  scientificBacking?: string;
  recipeStepByStep?: RecipeStepByStep;
}
