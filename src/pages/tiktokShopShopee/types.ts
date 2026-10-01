export type Platform = "shopee" | "tiktok_shop";

export interface UgcScene {
  numero: number;
  titulo: string;
  objetivoPsicologico: string;
  promptVisual: string;
  fala: string;
  somAmbiente: string;
}

export interface SavedScript {
  id: string;
  date: string;
  productName: string;
  productDescription: string;
  mainBenefit: string;
  platform: Platform;
  videoStyle?: "presenter" | "pov";
  voiceGender?: "female" | "male";
  scenes: UgcScene[];
}

export interface DefaultProductPreset {
  name: string;
  niche: string;
  description: string;
  benefit: string;
}
