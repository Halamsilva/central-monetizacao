export interface CharacterProfile {
  name: string;
  visual: string;
  posture?: string;
  psychology?: string;
  motivation?: string;
  fear?: string;
}

export interface CharacterDialogue {
  characterName: string;
  speech: string;
}

export interface ScenePromptData {
  sceneNumber: string;
  sceneTitle?: string;
  sceneDescription: string;
  characterName: string; // Primary or first character
  characterVisual: string;
  characterBlockFull?: string;
  characterPosture: string;
  characterPsychology: string;
  motivation: string;
  fear: string;
  spokenDialogue: string;
  // Multi-character support
  characters?: CharacterProfile[];
  dialogues?: CharacterDialogue[];
  hasRealisticSkin: boolean;
}

export interface PresetTemplate {
  id: string;
  title: string;
  category: string;
  hookSummary: string;
  promptText: string;
}
