// Configuração de idioma de saída compartilhada pelos agentes de sequência
// (Receitas p/ Ebook, Encapsulados e Anti-Pragas).
//
// Padrão: Português do Brasil. O aluno pode escolher o idioma das FALAS
// (spokenLinePt) e do restante do conteúdo gerado pela IA.

export type OutputLanguageKey = 'brasil' | 'estados_unidos' | 'espanha';

export type OutputLanguageConfig = {
  key: OutputLanguageKey;
  label: string;
  spokenLabel: string;
  locale: string;
  flag: string;
  uiLabel: string;
  audioTag: string;
  rule: string;
};

const CONFIGS: Record<OutputLanguageKey, OutputLanguageConfig> = {
  brasil: {
    key: 'brasil',
    label: 'Portuguese (Brazil)',
    spokenLabel: 'Brazilian Portuguese',
    locale: 'pt-BR',
    flag: '🇧🇷',
    uiLabel: 'Brasil',
    audioTag: 'Brazilian Portuguese',
    rule: 'TODAS as falas (spokenLinePt), titulos, legendas e textos de apoio DEVEM estar em PORTUGUES DO BRASIL (pt-BR). E TERMINANTEMENTE PROIBIDO escrever as falas em ingles ou espanhol.',
  },
  estados_unidos: {
    key: 'estados_unidos',
    label: 'English (United States)',
    spokenLabel: 'American English',
    locale: 'en-US',
    flag: '🇺🇸',
    uiLabel: 'EUA',
    audioTag: 'American English',
    rule: 'ALL spoken lines (spokenLinePt), titles, captions and support text MUST be written in NATURAL AMERICAN ENGLISH (en-US). It is STRICTLY FORBIDDEN to write the spoken lines in Portuguese or Spanish. Keep the same energy, sales tone and directness, but in idiomatic US English.',
  },
  espanha: {
    key: 'espanha',
    label: 'Spanish (Spain)',
    spokenLabel: 'European Spanish',
    locale: 'es-ES',
    flag: '🇪🇸',
    uiLabel: 'Espanha',
    audioTag: 'European Spanish',
    rule: 'TODAS las falas (spokenLinePt), titulos, subtitulos y textos de apoyo DEBEN estar en ESPANOL DE ESPANA (es-ES). Esta TERMINANTEMENTE PROHIBIDO escribir las falas en portugues o ingles. Mantiene la misma energia, tono de venta y directitud, pero en espanol de Espana.',
  },
};

export const OUTPUT_LANGUAGE_OPTIONS = [
  CONFIGS.brasil,
  CONFIGS.estados_unidos,
  CONFIGS.espanha,
];

export const getOutputLanguage = (value: unknown): OutputLanguageConfig => {
  const key = String(value || '').trim().toLowerCase();

  if (key === 'estados_unidos' || key === 'eua' || key === 'en' || key === 'en-us' || key === 'english') {
    return CONFIGS.estados_unidos;
  }

  if (key === 'espanha' || key === 'espanol' || key === 'es' || key === 'es-es' || key === 'spanish') {
    return CONFIGS.espanha;
  }

  return CONFIGS.brasil;
};

// Bloco injetado no prompt do usuario. Fica no FIM de proposito: como ele vem
// depois da system instruction (que fala em portugues), ele funciona como
// override explicito do idioma escolhido pelo aluno.
export const buildLanguageDirective = (config: OutputLanguageConfig) => `
################################################################
REGRA #0 - IDIOMA DE SAIDA (PRIORIDADE MAXIMA - VALE ACIMA DE QUALQUER OUTRA REGRA)
################################################################
IDIOMA ESCOLHIDO PELO ALUNO: ${config.label} (${config.locale}).
${config.rule}

REGRAS DE IDIOMA (OBRIGATORIAS):
1. O campo spokenLinePt e o campo que SERÁ DITO em voz alta no video. Ele TEM que estar 100% em ${config.spokenLabel}.
2. O promptText (a descricao visual) continua sendo em INGLÊS fotorrealico, como sempre foi. ONLY THE SPOKEN LINES CHANGE LANGUAGE.
3. O bloco SPOKEN AUDIO dentro do promptText deve identificar o idioma como "${config.audioTag}".
4. Mantenha o TOM, o ritmo e a forca de venda exatamente iguais: nao encurte a fala, nao suavize, nao vire texto de manual. Traduza o impacto, nao o apegue.
5. Revise CADA fala antes de entregar e confirme que esta em ${config.spokenLabel}. Idioma errado = tarefa invalida.
################################################################
`;