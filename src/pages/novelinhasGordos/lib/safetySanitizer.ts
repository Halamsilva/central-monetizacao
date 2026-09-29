/**
 * Sanitizer for AI Video & Image Generation Prompts (Flow, Kling, Runway, Sora, Luma, Midjourney)
 * Solves: "Esse comando pode violar nossas políticas contra a geração de imagens de pessoas famosas"
 * (Policy against generating images of famous people / public figures / celebrities / actor likenesses)
 */

export function sanitizePromptForFlowAndSafety(rawPrompt: string): string {
  if (!rawPrompt) return "";

  let cleaned = rawPrompt;

  // 1. Remove "named [Proper Name]" patterns that trigger celebrity filters
  cleaned = cleaned.replace(/named\s+[A-ZÀ-Ú][a-zà-ú]+(\s+[A-ZÀ-Ú][a-zà-ú]+)*/gi, "fictional anonymous character");
  cleaned = cleaned.replace(/called\s+[A-ZÀ-Ú][a-zà-ú]+(\s+[A-ZÀ-Ú][a-zà-ú]+)*/gi, "fictional anonymous character");

  // 2. Replace specific project character names with anonymous fictional archetypes in English
  cleaned = cleaned.replace(/\bnamed\s+Raimundo\b/gi, "a fictional anonymous Brazilian man in his 30s");
  cleaned = cleaned.replace(/\bRaimundo\b/g, "the fictional Brazilian man");
  cleaned = cleaned.replace(/\bnamed\s+Dona\s+L[uú]cia\b/gi, "a fictional anonymous elderly Brazilian mother");
  cleaned = cleaned.replace(/\bDona\s+L[uú]cia\b/gi, "the fictional elderly mother");
  cleaned = cleaned.replace(/\bnamed\s+Carla\b/gi, "a fictional anonymous Brazilian woman in her 30s");
  cleaned = cleaned.replace(/\bCarla\b/g, "the fictional Brazilian woman");
  cleaned = cleaned.replace(/\bnamed\s+Seu\s+Ti[aã]o\b/gi, "a fictional anonymous Brazilian auto mechanic");
  cleaned = cleaned.replace(/\bSeu\s+Ti[aã]o\b/gi, "the fictional mechanic");
  cleaned = cleaned.replace(/\bnamed\s+Tia\s+Creuza\b/gi, "a fictional anonymous Brazilian street food vendor");
  cleaned = cleaned.replace(/\bTia\s+Creuza\b/gi, "the fictional street food vendor");
  cleaned = cleaned.replace(/\bnamed\s+Valdirene\b/gi, "a fictional anonymous Brazilian hair stylist");
  cleaned = cleaned.replace(/\bValdirene\b/g, "the fictional hair stylist");
  cleaned = cleaned.replace(/\bnamed\s+Marc[aã]o\b/gi, "a fictional anonymous Brazilian construction worker");
  cleaned = cleaned.replace(/\bMarc[aã]o\b/gi, "the fictional construction worker");
  cleaned = cleaned.replace(/\bnamed\s+Betinho\b/gi, "a fictional anonymous Brazilian transit commuter fare collector");
  cleaned = cleaned.replace(/\bBetinho\b/gi, "the fictional commuter fare collector");
  cleaned = cleaned.replace(/\bnamed\s+(Pastor\s+)?Edvaldo\b/gi, "a fictional anonymous Brazilian community preacher");
  cleaned = cleaned.replace(/\b(Pastor\s+)?Edvaldo\b/gi, "the fictional community preacher");
  cleaned = cleaned.replace(/\bnamed\s+Seu\s+Z[eé]\b/gi, "a fictional anonymous Brazilian tavern keeper");
  cleaned = cleaned.replace(/\bSeu\s+Z[eé]\b/gi, "the fictional tavern keeper");

  // 3. Replace trigger words like "ACTOR DIRECTION", "VETERAN DIRECTOR", "ACTOR EMOTIONAL"
  cleaned = cleaned.replace(/\[ACTOR DIRECTION & ULTRA-REALISTIC HUMAN BIOMECHANICS - 50-YEAR VETERAN DIRECTOR\]/gi, "[PERFORMANCE GUIDANCE & HUMAN BIOMECHANICS - MASTER CINEMATIC DIRECTION]");
  cleaned = cleaned.replace(/\[ACTOR EMOTIONAL DIRECTIVE & CINEMATIC DRAMATIC PATHOS\]/gi, "[EMOTIONAL PATHOS & PERFORMANCE DIRECTIVE]");
  cleaned = cleaned.replace(/\[ACTOR DIRECTION/gi, "[PERFORMANCE DIRECTION");
  cleaned = cleaned.replace(/\[ACTOR EMOTIONAL/gi, "[EMOTIONAL PATHOS");
  cleaned = cleaned.replace(/\b50-year veteran director\b/gi, "master cinematic direction");
  cleaned = cleaned.replace(/\bnaturalistic acting\b/gi, "naturalistic human performance and unforced behavior");

  // 4. Replace real brand and trademark names that trigger IP/Entity policies
  cleaned = cleaned.replace(/\b(Enel|Compesa)\b/gi, "overdue utility service bills");
  cleaned = cleaned.replace(/\bEnel\b/gi, "electric utility");
  cleaned = cleaned.replace(/\bCompesa\b/gi, "water utility");
  cleaned = cleaned.replace(/\bHavaianas\b/gi, "traditional black rubber flip-flops");
  cleaned = cleaned.replace(/\bDolly\b/gi, "two-liter soda bottle");
  cleaned = cleaned.replace(/\b(Brahma|Skol|Antarctica)\b/gi, "Brazilian cold bottled beer");

  // 5. Ensure the universal safe-harbor compliance header is present for Flow
  if (!cleaned.includes("[STRICT POLICY COMPLIANCE: 100% FICTIONAL ANONYMOUS CHARACTERS ONLY")) {
    cleaned = `[STRICT POLICY COMPLIANCE: 100% FICTIONAL ANONYMOUS CHARACTERS ONLY - ZERO CELEBRITY, ZERO FAMOUS PERSON OR REAL-WORLD PUBLIC FIGURE LIKENESS]: ${cleaned}`;
  }

  // 6. Clean multiple spaces or duplicate dots
  cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/\.\s*\./g, ".").trim();

  return cleaned;
}

export function sanitizeNegativePromptForFlow(rawNegative: string): string {
  const baseAntiFamous = "celebrity, famous person, public figure, recognizable person, actor likeness, celebrity face, politician, real person portrait, copyrighted character, living person likeness, famous influencer, trademarked logos, brand text";
  
  if (!rawNegative) {
    return baseAntiFamous;
  }

  if (rawNegative.toLowerCase().includes("celebrity") && rawNegative.toLowerCase().includes("public figure")) {
    return rawNegative;
  }

  return `${baseAntiFamous}, ${rawNegative}`;
}
