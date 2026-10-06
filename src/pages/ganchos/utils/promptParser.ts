import { ScenePromptData } from '../types/prompt';
import { SKIN_REALISM_COMMAND } from '../data/templates';

export type GanchosLanguage = 'brasil' | 'mexico';

const LANGUAGE_STORAGE_KEY = 'ganchos_language';

export const getGanchosLanguage = (): GanchosLanguage => {
  try {
    if (typeof window === 'undefined') return 'brasil';
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'mexico' ? 'mexico' : 'brasil';
  } catch {
    return 'brasil';
  }
};

export const setGanchosLanguage = (language: GanchosLanguage) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  } catch {
    // ignora falha de storage
  }
};

export const getGanchosLanguageLabel = () =>
  getGanchosLanguage() === 'mexico' ? 'México' : 'Brasil';

const LANGUAGE_TAG = 'fala no idioma e estilo de [^\\n:]+?:';

const buildMultiFalaRegex = () =>
  new RegExp(
    `([^\\n:]+?)\\s+${LANGUAGE_TAG}\\s*["“']?([\\s\\S]*?)(?:["”'](?=\\s*(?:[^\\n:]+?\\s+${LANGUAGE_TAG}|$))|(?=\\n\\s*[^\\n:]+?\\s+${LANGUAGE_TAG})|\\s*$)`,
    'gi'
  );

export function parsePromptText(raw: string): ScenePromptData {
  const text = raw.trim();

  // Scene Number
  const sceneMatch = text.match(/CENA\s+([0-9A-Za-z]+)/i);
  const sceneNumber = sceneMatch ? sceneMatch[1] : '01';

  // Support for Seedance / Google Flow / Script formats
  const quemFalaMatch = text.match(/QUEM FALA:\s*([^(:\n]+)(?:\(([^)]+)\))?/i);
  const quemRespondeMatch = text.match(/QUEM RESPONDE:\s*([^(:\n]+)(?:\(([^)]+)\))?/i);
  const dialogoRealMatch = text.match(/DIÁLOGO REAL:\s*["“']?([^"\n\r”']+)["”']?/i) || text.match(/DIÁLOGO:\s*["“']?([^"\n\r”']+)["”']?/i);
  const respostaMatch = text.match(/RESPOSTA:\s*["“']?([^"\n\r”']+)["”']?/i);
  const envMatch = text.match(/\[Environment & Scene Setting\]:\s*([^\n\[]+)/i);
  const actionMatch = text.match(/\[Action & First-Frame Blocking\]:\s*([^\n\[]+)/i);
  const opticsMatch = text.match(/\[Optics & Camera Movement\]:\s*([^\n\[]+)/i);
  const lightingMatch = text.match(/\[Lighting & Atmosphere\]:\s*([^\n\[]+)/i);

  // Scene Description
  let sceneDescription = '';
  const cenaMatch = text.match(/CENA:\s*([\s\S]*?)(?=PERSONAGENS:|$)/i);
  if (cenaMatch) {
    sceneDescription = cenaMatch[1].trim();
  } else if (envMatch) {
    const env = envMatch[1].trim();
    const optics = opticsMatch ? ` Câmera: ${opticsMatch[1].trim()}.` : '';
    const light = lightingMatch ? ` Iluminação: ${lightingMatch[1].trim()}.` : '';
    sceneDescription = `${env}.${optics}${light}`;
  }

  // Character Extraction
  let characterName = '';
  let characterVisual = '';
  let characterBlockFull = '';

  if (quemFalaMatch) {
    const char1Name = quemFalaMatch[1].trim();
    const char1Desc = quemFalaMatch[2] ? quemFalaMatch[2].trim() : '';
    characterName = char1Name;
    characterVisual = char1Desc;

    if (quemRespondeMatch) {
      const char2Name = quemRespondeMatch[1].trim();
      const char2Desc = quemRespondeMatch[2] ? quemRespondeMatch[2].trim() : '';
      characterBlockFull = `${char1Name}:\n${char1Desc}\n\n${char2Name}:\n${char2Desc}`;
    }
  }

  // Fallback to PERSONAGENS: block
  if (!characterBlockFull) {
    const charBlockMatch = text.match(/PERSONAGENS:\s*([\s\S]*?)(?=POSTURA:|$)/i);
    if (charBlockMatch) {
      characterBlockFull = charBlockMatch[1].trim();
      const lines = characterBlockFull.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const firstLine = lines[0].replace(/:$/, '').trim();
        characterName = firstLine;
        characterVisual = lines.slice(1).join('\n').trim();
      }
    }
  }

  if (!characterName) {
    characterName = 'Personagem Principal';
  }

  // Posture
  let characterPosture = '';
  const posturaMatch = text.match(/POSTURA:\s*([\s\S]*?)(?=PERFIL PSICOLÓGICO:|$)/i);
  if (posturaMatch) {
    characterPosture = posturaMatch[1].trim();
  } else if (actionMatch) {
    characterPosture = actionMatch[1].trim();
  }

  // Psychology, Motivation, Fear
  let characterPsychology = '';
  const psicoMatch = text.match(/PERFIL PSICOLÓGICO:\s*([\s\S]*?)(?=Motivação:|Motivacao:|$)/i);
  if (psicoMatch) characterPsychology = psicoMatch[1].trim();

  let motivation = '';
  const motivMatch = text.match(/Motivação:\s*([\s\S]*?)(?=Medo:|$)/i) || text.match(/Motivacao:\s*([\s\S]*?)(?=Medo:|$)/i);
  if (motivMatch) motivation = motivMatch[1].trim();

  let fear = '';
  const medoMatch = text.match(new RegExp(`Medo:\\s*([\\s\\S]*?)(?=(?:.*${LANGUAGE_TAG})|$)`, 'i'));
  if (medoMatch) fear = medoMatch[1].trim();

  // Dialogues extraction
  const dialogues: { characterName: string; speech: string }[] = [];

  // 1. Try explicit "[Nome] fala no idioma e estilo de [Brasil/México]:"
  const multiFalaRegex = buildMultiFalaRegex();
  let match: RegExpExecArray | null;
  while ((match = multiFalaRegex.exec(text)) !== null) {
    const rawName = match[1].trim().replace(/^[-*•\s]+/, '');
    let speechVal = match[2].trim().replace(/^["“']+/, '').replace(/["”']+$/, '').trim();
    if (rawName && speechVal && speechVal !== '“”' && speechVal !== '""') {
      dialogues.push({
        characterName: rawName,
        speech: speechVal,
      });
    }
  }

  // 2. If no multiFala dialogues found, check DIÁLOGO REAL / RESPOSTA or [Dialogue & Native Audio]
  if (dialogues.length === 0) {
    if (quemFalaMatch && dialogoRealMatch) {
      const speech1 = dialogoRealMatch[1].trim().replace(/^["“']+/, '').replace(/["”']+$/, '').trim();
      if (speech1) {
        dialogues.push({
          characterName: quemFalaMatch[1].trim(),
          speech: speech1,
        });
      }
      if (quemRespondeMatch && respostaMatch) {
        const speech2 = respostaMatch[1].trim().replace(/^["“']+/, '').replace(/["”']+$/, '').trim();
        if (speech2) {
          dialogues.push({
            characterName: quemRespondeMatch[1].trim(),
            speech: speech2,
          });
        }
      }
    } else {
      // Check native audio tags
      const nativeAudioMatch = text.match(/\[Dialogue & Native Audio\]:\s*FIRST Character ([^(:]+).*?speaks:\s*["“']([^"”']+)["”'].*?THEN Character ([^(:]+).*?responds:\s*["“']([^"”']+)["”']/i);
      if (nativeAudioMatch) {
        dialogues.push({
          characterName: nativeAudioMatch[1].trim(),
          speech: nativeAudioMatch[2].trim(),
        });
        dialogues.push({
          characterName: nativeAudioMatch[3].trim(),
          speech: nativeAudioMatch[4].trim(),
        });
      }
    }
  }

  // Fallback single dialogue if still empty
  let spokenDialogue = dialogues.length > 0 ? dialogues[0].speech : '';
  if (!spokenDialogue) {
    const singleMatch = text.match(/fala no idioma e estilo de [^\n:]+:\s*["“']?([^"”\n\r]+)["”']?/i);
    if (singleMatch && singleMatch[1].trim()) {
      spokenDialogue = singleMatch[1].trim();
      if (dialogues.length === 0) {
        dialogues.push({
          characterName: characterName,
          speech: spokenDialogue,
        });
      }
    }
  }

  // Check if skin realism exists
  const hasRealisticSkin = (characterVisual + ' ' + characterBlockFull).toLowerCase().includes('textura de pele') ||
    (characterVisual + ' ' + characterBlockFull).toLowerCase().includes('poros visíveis');

  return {
    sceneNumber,
    sceneDescription: sceneDescription || 'Ambiente tenso com iluminação cinematográfica de alto contraste.',
    characterName: characterName,
    characterVisual: characterVisual || 'Expressão fria, semblante rígido e olhar de profundo desprezo.',
    characterBlockFull: characterBlockFull || undefined,
    characterPosture: characterPosture || 'Corpo projetado para a frente em atitude agressiva e dominadora.',
    characterPsychology: characterPsychology || 'Prepotente, soberbo, com fúria desmedida diante de quem ousa desobedecer.',
    motivation: motivation || 'Destruir a dignidade do alvo e impor poder absoluto sem piedade.',
    fear: fear || 'Perder autoridade e controle diante dos demais presentes.',
    spokenDialogue: spokenDialogue,
    dialogues: dialogues.length > 0 ? dialogues : undefined,
    hasRealisticSkin,
  };
}

export function formatPromptText(data: ScenePromptData, includeSkinRealism: boolean = true): string {
  let visual = data.characterVisual.trim();

  // If skin realism is requested and not already contained
  if (includeSkinRealism && !visual.toLowerCase().includes('textura de pele ultra-realista')) {
    if (!visual.toLowerCase().includes('textura de pele')) {
      visual = `${visual} ${SKIN_REALISM_COMMAND}.`;
    }
  } else if (!includeSkinRealism) {
    visual = visual.replace(new RegExp(SKIN_REALISM_COMMAND, 'gi'), '').trim();
  }

  // Character block rendering
  let charSection = '';
  if (data.characterBlockFull && data.characterBlockFull.includes('\n')) {
    charSection = data.characterBlockFull;
    if (includeSkinRealism && !charSection.toLowerCase().includes('textura de pele')) {
      charSection += `\n\n${SKIN_REALISM_COMMAND}.`;
    }
  } else {
    charSection = `${data.characterName.trim()}:\n${visual}`;
  }

  // Render dialogues separately for each character - NEVER EMPTY
  const languageLabel = getGanchosLanguageLabel();
  const emptySpeechFallback =
    languageLabel === 'México'
      ? `¡Cállate la boca ahora mismo! ¡No eres nadie para hablarme así! ¡Lárgate de mi vista antes de que te destruya!`
      : `CALA ESSA BOCA AGORA! Você não passa de um derrotado patético! Some da minha frente antes que eu destrua você!`;

  let dialoguesBlock = '';
  if (data.dialogues && data.dialogues.length > 0) {
    dialoguesBlock = data.dialogues
      .map(d => {
        let clean = (d.speech || '').replace(/^["“]+/, '').replace(/["”]+$/, '').trim();
        if (!clean) {
          clean = emptySpeechFallback;
        }
        return `${d.characterName.trim()} fala no idioma e estilo de ${languageLabel}:\n“${clean}”`;
      })
      .join('\n\n');
  } else {
    let cleanDialogue = (data.spokenDialogue || '').replace(/^["“]+/, '').replace(/["”]+$/, '').trim();
    if (!cleanDialogue) {
      cleanDialogue = emptySpeechFallback;
    }
    dialoguesBlock = `${data.characterName.trim()} fala no idioma e estilo de ${languageLabel}:\n“${cleanDialogue}”`;
  }

  return `PROMPT GANCHO CHAMATIVO CENA ${data.sceneNumber || '01'}

CENA:
${data.sceneDescription.trim()}

PERSONAGENS:

${charSection}

POSTURA:
${data.characterPosture.trim()}

PERFIL PSICOLÓGICO:
${data.characterPsychology.trim()}

Motivação:
${data.motivation.trim()}

Medo:
${data.fear.trim()}

${dialoguesBlock}`;
}

export function estimateDialogueTiming(text: string): {
  wordCount: number;
  durationSeconds: number;
  isOptimal: boolean;
  statusText: string;
} {
  const words = text
    .trim()
    .replace(/[“”!?,.;:]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;

  const durationSeconds = Number((wordCount / 3.1).toFixed(1));

  let isOptimal = false;
  let statusText = '';

  if (durationSeconds >= 8.2 && durationSeconds <= 9.8) {
    isOptimal = true;
    statusText = 'Tempo Perfeito (Exatos ~9s de Retenção)';
  } else if (durationSeconds < 8.2) {
    statusText = 'Abaixo de 9s';
  } else {
    statusText = 'Acima de 9s (pode perder o gancho)';
  }

  return {
    wordCount,
    durationSeconds,
    isOptimal,
    statusText,
  };
}

export function adaptSpeechPreservingCharacters(rawPrompt: string, includeSkinRealism: boolean = true): string {
  const parsed = parsePromptText(rawPrompt);
  const isSpanish = getGanchosLanguage() === 'mexico';

  const fallbacks = isSpanish
    ? {
        firstShort: '¡Óyeme bien, miserable! ¡No tienes derecho ni de mirarme a la cara! ¡Lárgate de aquí ahora antes de que llame a la policía y acabe contigo!',
        secondShort: '¡Por favor, escúchame! ¡Te juro por mis hijos que no hice nada malo! ¡Estoy trabajando honesto, no me hagas esta injusticia!',
        firstAngry: '¡Mírame bien, ratero! ¡Tu lugar es la cárcel! ¡Lárgate de mi calle ahora antes de que llame a la policía y te destroce la cara!',
        secondDesperate: '¡Por favor, escúchame! ¡Te juro por mis hijos que no robé nada esta vez! ¡Estoy trabajando honesto, no me hagas esta injusticia!',
        single: '¡Cállate la boca ahora mismo! ¿No te da vergüenza desafiarme así? ¡Recoge lo que queda de tu dignidad y lárgate antes de que te destruya!',
      }
    : {
        firstShort: 'Olha aqui pro meu rosto, seu marginal miserável! Você não tem autorização pra pisar nessa rua! Vaza daqui agora antes que eu chame a polícia e acabe com você!',
        secondShort: 'Pelo amor de Deus, me escuta! Eu juro pelos meus filhos que não fiz nada de errado! Eu tô trabalhando honesto, não faz essa injustiça covarde comigo!',
        firstAngry: 'Olha bem pra mim, seu marginal! Lugar de ladrão é na cadeia! Some da minha rua agora antes que eu chame a polícia e arrebente a sua cara!',
        secondDesperate: 'Pelo amor de Deus, me escuta! Eu juro pelos meus filhos que não roubei nada dessa vez! Eu tô trabalhando honesto, não faz essa injustiça comigo!',
        single: 'CALA ESSA BOCA AGORA! Você não tem vergonha de me desafiar desse jeito? Recolha o que sobrou da sua dignidade e desaparece da minha frente antes que eu destrua você!',
      };

  // If dialogues already exist in the input, build intensified, high-impact speech for each speaker (~9 seconds)
  if (parsed.dialogues && parsed.dialogues.length > 0) {
    const updatedDialogues = parsed.dialogues.map((d, index) => {
      let cleanSpeech = (d.speech || '').replace(/^["“]+/, '').replace(/["”]+$/, '').trim();
      const lower = cleanSpeech.toLowerCase();

      // If speech is empty or short, generate punchy viral line of ~9 seconds
      if (!cleanSpeech || cleanSpeech.length < 15) {
        cleanSpeech = index === 0 ? fallbacks.firstShort : fallbacks.secondShort;
      } else if (index === 0 && (lower.includes('ladrão') || lower.includes('some') || lower.includes('ratero') || lower.includes('lárgate'))) {
        cleanSpeech = fallbacks.firstAngry;
      } else if (index === 1 && (lower.includes('juro') || lower.includes('roubei') || lower.includes('robé'))) {
        cleanSpeech = fallbacks.secondDesperate;
      }

      return {
        characterName: d.characterName,
        speech: cleanSpeech,
      };
    });

    return formatPromptText({ ...parsed, dialogues: updatedDialogues }, includeSkinRealism);
  }

  // Single character fallback
  const charName = parsed.characterName.trim();
  const cleanSpeech = fallbacks.single;

  return formatPromptText({
    ...parsed,
    spokenDialogue: cleanSpeech,
    dialogues: [{ characterName: charName, speech: cleanSpeech }],
  }, includeSkinRealism);
}

/**
 * Separa o gancho em DOIS prompts independentes (um por falante), cada um com a
 * estrutura tecnica completa e identificando claramente quem fala.
 */
export function buildSpeakerPrompts(
  data: ScenePromptData,
  includeSkinRealism: boolean = true
): { speaker: string; label: string; prompt: string }[] {
  const dialogues =
    data.dialogues && data.dialogues.length > 0
      ? data.dialogues
      : data.spokenDialogue
        ? [{ characterName: data.characterName, speech: data.spokenDialogue }]
        : [];

  if (dialogues.length < 2) return [];

  return dialogues.map((dialogue, index) => {
    const single = formatPromptText(
      { ...data, dialogues: [dialogue], spokenDialogue: dialogue.speech },
      includeSkinRealism
    );

    const lines = single.split('\n');
    const title = lines[0];
    const header = `QUEM FALA: ${dialogue.characterName.trim()} (FALA ${index + 1} DE ${dialogues.length})`;

    return {
      speaker: dialogue.characterName.trim(),
      label: `PROMPT ${index + 1} - QUEM FALA: ${dialogue.characterName.trim()}`,
      prompt: `${title} - FALA ${index + 1}\n${header}\n${lines.slice(1).join('\n')}`,
    };
  });
}
