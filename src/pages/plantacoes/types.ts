export interface Scene {
  title: string;
  visualPrompt: string;
  narration: string;
  ambientSound: string;
}

export interface ScriptResponse {
  theme: string;
  characterProfile: string;
  scenographyDescription: string;
  scenes: Scene[];
  seo: string;
}

export interface CultivationTheme {
  id: string;
  title: string;
  category: "Frutos" | "Folhas/Ervas" | "Métodos" | "Outros";
  description: string;
  emoji: string;
  characterType?: string;
  settingType?: string;
}

export type CharacterType = "homem-rural" | "senhora-balcao" | "jovem-urbano" | "custom";
export type SettingType = "quintal-simples" | "apartamento-sacada" | "laje-cobertura" | "horta" | "roca" | "custom";
