import { GoogleGenAI } from '@google/genai';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

// Helper with retry and fallback across multiple models for high demand resilience
async function generateWithModelFallback(promptInstructions: string, apiKey: string) {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  const ai = new GoogleGenAI({ apiKey });

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptInstructions,
          config: {
            temperature: 0.85,
            topP: 0.95,
          },
        });

        const generatedText = response.text || '';
        if (generatedText && generatedText.trim().length > 0) {
          return { text: generatedText, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMessage = String(err?.message || '');
        const isHighDemandOrUnavailable =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.code === 503 ||
          err?.code === 429 ||
          errMessage.includes('503') ||
          errMessage.includes('high demand') ||
          errMessage.includes('UNAVAILABLE') ||
          errMessage.includes('overloaded') ||
          errMessage.includes('Resource has been exhausted');

        if (isHighDemandOrUnavailable && attempt === 0) {
          // Wait 1.5s before retry on same model
          await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));
          continue;
        }

        if (isHighDemandOrUnavailable) {
          // Switch to next fallback model
          break;
        }

        throw err;
      }
    }
  }

  throw lastError || new Error('Não foi possível gerar o roteiro devido à alta demanda temporária.');
}

const handleGenerate = async (req: any, res: any) => {
  try {
    const {
      theme = 'Dramas Emocionantes',
      country = 'Brasil',
      tone = 'Dramático e ultra-realista',
      emotion = 'Empatia',
      skinRealism = 'ultimate',
      scenes = 6,
      context = '',
      previousStory = '',
    } = req.body || {};

    const skinDescriptorMap: Record<string, string> = {
      standard:
        'Pele cinematográfica orgânica e crua (raw natural skin texture), poros finos naturais visíveis, penugem facial sutil (peach fuzz), dispersão de luz subsuperficial autêntica (subsurface scattering), sem filtros de embelezamento ou aspecto plástico de IA.',
      extreme:
        'Dermo-realismo extremo cinematográfico: microporos nítidos com textura celular visível, brilho natural de sebo e micro-gotículas de transpiração nas têmporas e testa, linhas de expressão marcadas pela emoção, vermelhidão natural nos capilares do nariz e bochechas, córnea ultra-brilhante com reflexo especular nítido do ambiente, textura crua 35mm.',
      ultimate:
        'Nível Máximo de Fotorrealismo Óptico (Shot on ARRI Alexa 65, Master Prime 85mm f/1.4): textura de dermo-realismo e macro-detalhe absoluto, microporos individuais visíveis sem compressão, imperfeições cutâneas autênticas, textura labial vincada natural, lágrimas ou umidade ocular realista com reflexo volumétrico, penugem e pelos individuais nítidos, iluminação com contraste de filme analógico Kodak Vision3 500T, zero sensação sintética ou acabamento de videogame.',
    };

    const themeDirectives: Record<string, string> = {
      'Frutas': `O TEMA OBRIGATÓRIO É 'FRUTAS HUMANIZADAS (NOVELINHA DE FRUTAS EM ANIMAÇÃO 3D)' 🍓🍌🍎🍇.
DIRETRIZ MÁXIMA DE PERSONAGENS DE FRUTA:
Neste tema, TODOS os personagens são OBRIGATORIAMENTE FRUTAS HUMANIZADAS / ANTROPOMÓRFICAS com características humanas completas, personalidades marcantes e aparência estritamente consistente em todos os episódios e cenas!

ESTILO VISUAL OBRIGATÓRIO:
- Animação 3D cinematográfica de alta qualidade (qualidade de longa-metragem Disney/Pixar ou Illumination).
- Personagens extremamente expressivos, com textura realista e tátil da casca da fruta (pequenas sementes douradas na pele do morango, casca cerosa brilhante da maçã, textura aveludada do pêssego, gomos detalhados da tangerina).
- Iluminação profissional volumétrica de animação 3D, cores vibrantes, formato vertical 9:16.

ESTRUTURA OBRIGATÓRIA PARA CRIAR CADA PERSONAGEM (SEGUIR À RISCA NO PROMPT 00 E REPETIR EM TODAS AS CENAS):
- Fruta: Espécie exata (Morango, Banana, Uva, Maçã, Manga, Pera, Abacaxi, Limão, Melancia, Cereja).
- Gênero: Feminino ou Masculino.
- Idade aparente: Jovem, adulto ou idoso.
- Corpo: Formato anatômico da fruta com textura tátil realista da casca, mas com braços e pernas de proporções humanas estilizadas, mãos de cinco dedos articuladas e pés com calçados delicados. No topo da cabeça, folhas ou coroa verde formando penteados estilosos.
- Rosto: Rosto humanoide esculpido na fruta com olhos grandes, brilhantes e expressivos, cílios longos (para femininas), sobrancelhas bem definidas, nariz sutil e lábios rosados/articulados com dentes perfeitos para sincronismo labial.
- Roupa: Figurino humano completo e elegante (ex: vestido rosa elegante com babados e pequena bolsa combinando; OU terno bem cortado de alfaiataria com gravata; OU jaqueta estilizada; sapatos delicados). As roupas devem ter corte e cores coordenadas e JAMAIS mudam entre as cenas.
- Personalidade: Personalidade marcante de novela (ex: romântica, sensível, carismática e ciumenta; OU vilão invejoso e calculista; OU playboy arrogante; OU amigo leal e cômico). Demonstra emoções humanas intensas (felicidade, lágrimas de tristeza, raiva, surpresa, decepção).
- Papel na novela: Protagonista, vilão/vilã, namorado(a), amante, rival, sogra implicante ou mentor.
- Estilo: Animação 3D cinematográfica vertical 9:16.

EXEMPLO CANÔNICO DE REFERÊNCIA:
Moranguinha, a protagonista:
"Uma personagem feminina antropomórfica inspirada em um morango vermelho maduro. Seu corpo possui formato de morango, com textura natural, pequenas sementes douradas distribuídas pela pele e folhas verdes formando uma espécie de cabelo no topo da cabeça. Possui rosto feminino delicado, olhos grandes e expressivos, cílios longos, sobrancelhas bem definidas, nariz pequeno e lábios rosados. Seus braços e pernas possuem proporções humanas, com mãos de cinco dedos e pés pequenos. Usa um vestido rosa elegante, sapatos delicados e uma pequena bolsa combinando. Sua personalidade é romântica, sensível, carismática e um pouco ciumenta. Demonstra emoções humanas intensas, como felicidade, tristeza, surpresa, raiva e decepção. Estilo visual: animação 3D cinematográfica, personagem extremamente expressiva, textura realista de fruta, iluminação profissional, cores vibrantes, formato vertical 9:16."

CENÁRIOS DO TEMA FRUTAS:
Os cenários devem ser ambientes 3D cinematográficos na escala das frutas ou cenários requintados estilizados (ex: cozinha gourmet de alta gastronomia com bancada de carvalho onde as frutas vivem e transitam, sala de estar luxuosa estilizada, bistrô de doces artesanais, pomar cinematográfico iluminado por luz dourada).
É ESTRITAMENTE PROIBIDO fazer humanos comuns como protagonistas neste tema. Os personagens DEVEM SER AS FRUTAS HUMANIZADAS!`,

      'Deuses Gregos': `O TEMA OBRIGATÓRIO É 'DEUSES GREGOS' ⚡🏛️.
A história DEVE se passar na mitologia grega, com divindades do Olimpo (Zeus, Hades, Poseidon, Atena, Afrodite, Ares, etc.), poderes divinos, raios, templos de mármore e confrontos épicos.`,

      'Causa Animal e Reviravoltas': `O TEMA OBRIGATÓRIO É 'CAUSA ANIMAL E REVIRAVOLTAS' 🐾🐕.
A história DEVE girar obrigatoriamente em torno de animais (resgate, abandono, lealdade de um cão/gato, proteção animal, reviravolta onde o animal desmascara um vilão ou salva alguém).`,

      'Vida de Jesus': `O TEMA OBRIGATÓRIO É 'VIDA DE JESUS' 🙏✝️.
A narrativa DEVE ser ambientada nos tempos bíblicos de Jesus Cristo, retratando ensinamentos de amor, compaixão, perdão e lições de fé.`,

      'Jesus: Milagres e Ressurreição': `O TEMA OBRIGATÓRIO É 'JESUS: MILAGRES E RESSURREIÇÃO' 🙏✨.
A história DEVE retratar milagres bíblicos de Cristo, cura dos aflitos, acolhimento dos humildes e o poder transformador da fé.`,

      'Roça': `O TEMA OBRIGATÓRIO É 'ROÇA' 🤠🌾.
A narrativa DEVE ser ambientada no interior rural brasileiro, sítio, fazenda, com personagens sertanejos, simplicidade, hábitos caipiras e fortes valores morais.`,

      'Comédia Br': `O TEMA OBRIGATÓRIO É 'COMÉDIA BR' 😂🇧🇷.
A história DEVE ter humor do cotidiano brasileiro, confusões familiares, mal-entendidos hilários e personagens carismáticos.`,

      'Soldado voltando da guerra': `O TEMA OBRIGATÓRIO É 'SOLDADO VOLTANDO DA GUERRA' 🪖🎖️.
A história DEVE ter como foco o retorno surpresa e comovente de um soldado militar para sua família, superação de traumas e reencontro emocionante.`,

      'Viagem no Tempo': `O TEMA OBRIGATÓRIO É 'VIAGEM NO TEMPO' ⏳🌀.
A história DEVE envolver saltos temporais, passado/futuro, paradoxos e lições sobre escolhas da vida.`,

      'Cartoon Emocionante': `O TEMA OBRIGATÓRIO É 'CARTOON EMOCIONANTE' 🎨✨.
Estilo visual de animação 3D hiper-expressiva (estilo Pixar/DreamWorks), com personagens carismáticos e mensagem comovente.`,

      'Infantil': `O TEMA OBRIGATÓRIO É 'INFANTIL' 🎈🧸.
História mágica e afetuosa com lições de amizade, bondade e respeito para crianças e família.`,

      'Dorama': `O TEMA OBRIGATÓRIO É 'DORAMA' ❤️🎬.
Estética e drama no estilo das séries coreanas (K-Drama), com romances emocionantes, rivalidade familiar e reviravoltas intensas.`,

      'Histórias de Brasileiros Reais': `O TEMA OBRIGATÓRIO É 'HISTÓRIAS DE BRASILEIROS REAIS' 🇧🇷💪.
História verossímil e emocionante de pessoas batalhadoras do Brasil enfrentando desafios e vencendo com honestidade.`,

      'Racismo': `O TEMA OBRIGATÓRIO É 'RACISMO' ✊.
Confronto direto contra o preconceito racial, demonstrando a dignidade inegociável da vítima e a queda moral de quem discrimina.`,

      'Humilhação': `O TEMA OBRIGATÓRIO É 'HUMILHAÇÃO' 👤.
Uma pessoa arrogante humilha alguém vulnerável ou de classe social simples, sofrendo uma reviravolta memorável e merecida.`,

      'Injustiça': `O TEMA OBRIGATÓRIO É 'INJUSTIÇA' ⚖️.
Alguém inocente é falsamente acusado ou penalizado, até que a verdade vem à tona com grande impacto.`,

      'Abuso de Poder': `O TEMA OBRIGATÓRIO É 'ABUSO DE PODER' 👑.
Um chefe, autoridade ou pessoa rica abusa de sua posição contra um subordinado, enfrentando o desmascaramento público.`,

      'Desigualdade Social': `O TEMA OBRIGATÓRIO É 'DESIGUALDADE SOCIAL' 🏚️.
Contraste comovente entre a ostentação superficial e a riqueza de coração dos que têm pouco.`,

      'Superação': `O TEMA OBRIGATÓRIO É 'SUPERAÇÃO' ✨.
Trajetória heroica de superação contra todas as probabilidades através do amor, perseverança e trabalho.`,

      'Gordos': `O TEMA OBRIGATÓRIO É 'GORDOS (PERSONAGENS EXTREMAMENTE OBESOS)' 🍔.
Neste tema, ABSOLUTAMENTE TODOS os personagens da história DEVEM ser EXTREMAMENTE OBESOS (obesidade mórbida), brasileiros e reais, com forte presença física.

DIRETRIZ MÁXIMA DE APARÊNCIA FÍSICA (REGRA INVIOLÁVEL):
- CADA personagem — sem NENHUMA exceção (protagonista, vilão, vítima, familiares, amigos, vizinhos, colegas, crianças, idosos, médicos, atendentes e QUAISQUER figurantes ao fundo) — DEVE ser uma pessoa EXTREMAMENTE obesa, com aparência de 150kg a 300kg.
- Corpo: barriga enorme e caída, braços e pernas muito grossos, ombros largos, silhueta gigantesca que ocupa boa parte do quadro, dobras de pele profundas no pescoço e no abdômen, rosto extremamente redondo e cheio, papada (queixo duplo) bem marcada.

DESCRITOR FÍSICO OBRIGATÓRIO (repita estes termos, em inglês, nos prompts visuais): "extremely obese, morbidly obese body, massive 200kg+ weight, enormous hanging belly, very thick heavy arms and legs, broad shoulders, extremely round full face, huge double chin, deep skin folds on neck and abdomen, heavy body presence, wide silhouette occupying the frame".

REGRAS ANTI-MAGREZA (VIOLAR É PROIBIDO):
- É TERMINANTEMENTE PROIBIDO gerar qualquer personagem magro, em forma, atlético, "corpo normal", "average build", "slim" ou "fit".
- O peso extremo é FIXO e IMUTÁVEL: NUNCA emagreça os personagens do primeiro ao último take. A MESMA silhueta obesa gigantesca DEVE aparecer IDÊNTICA no PROMPT 00 (Ficha de Personagens) e em [Subject & Character Consistency] de TODAS as cenas.
- Em CADA cena, o bloco [Subject & Character Consistency] e o PROMPT 00 DEVEM repetir palavra por palavra o DESCRITOR FÍSICO OBRIGATÓRIO acima para cada personagem.
- Em CADA cena, inclua no [Negative Prompt]: "thin, slim, skinny, fit body, athletic build, average weight, normal body, muscular, toned".

DIRETRIZ NARRATIVA (O PESO É CONTEXTO, NÃO A PIADA):
- A história NÃO deve girar em torno de dieta ou emagrecimento. O peso extremo é apenas a aparência física de TODOS os personagens.
- Conte dramas humanos reais, viciantes e emocionantes: traição, injustiça, humilhação, amor verdadeiro, reviravolta e superação, exatamente como uma novelinha normal, mas com TODOS os personagens extremamente obesos.
- Os personagens vencem pelo caráter, pelo coração e pelas escolhas — NUNCA trate o peso como piada humilhante. No máximo, humor leve, carinhoso e respeitoso.`,
    };

    const themeDirective =
      themeDirectives[theme] ||
      `O TEMA OBRIGATÓRIO É '${theme}'. Toda a história, personagens e cenários DEVEM girar rigorosamente em torno deste tema.`;

    const skinDirective =
      theme === 'Frutas'
        ? 'Estilo de animação 3D cinematográfica de alto nível (estilo Pixar / Disney feature animation), textura orgânica e tátil hiper-realista da fruta (pequenas sementes douradas na pele do morango, brilho natural da casca cerosa, translucidez e subsurface scattering), personagens antropomórficos humanizados expressivos com proporções anatômicas estilizadas, roupas humanas elegantes bem ajustadas (vestido, terno, etc.), iluminação profissional e formato vertical 9:16.'
        : (skinDescriptorMap[skinRealism] || skinDescriptorMap.ultimate);

    const languageConfig: Record<
      string,
      {
        langName: string;
        locale: string;
        instruction: string;
      }
    > = {
      'Brasil': {
        langName: 'Português do Brasil',
        locale: 'pt-BR',
        instruction:
          'Todos os diálogos, falas dos personagens, expressões idiomáticas, gírias locais, título do vídeo, legenda e hashtags DEVEM ser gerados obrigatoriamente em PORTUGUÊS DO BRASIL (pt-BR).',
      },
      'Estados Unidos': {
        langName: 'American English',
        locale: 'en-US',
        instruction:
          'ALL dialogues, character spoken lines, idioms, cultural setting, video title, social media caption, and hashtags MUST BE WRITTEN IN NATURAL, FLUENT, COLLOQUIAL AMERICAN ENGLISH (en-US). Characters MUST speak authentic English. It is STRICTLY FORBIDDEN to generate dialogues in Portuguese when United States is selected.',
      },
      'Reino Unido': {
        langName: 'British English',
        locale: 'en-GB',
        instruction:
          'ALL dialogues, character lines, cultural setting, title, caption and hashtags MUST BE WRITTEN IN BRITISH ENGLISH (en-GB). Characters MUST speak authentic British English. It is STRICTLY FORBIDDEN to generate dialogues in Portuguese.',
      },
      'Espanha': {
        langName: 'Español de España (Castellano)',
        locale: 'es-ES',
        instruction:
          'TODOS los diálogos, parlamentos de los personajes, expresiones coloquiales, título del video, descripción y hashtags DEBEN ser generados obligatoriamente en ESPAÑOL DE ESPAÑA (es-ES). Está TERMINANTEMENTE PROHIBIDO escribir los diálogos en portugués.',
      },
      'México': {
        langName: 'Español de México / Latino',
        locale: 'es-MX',
        instruction:
          'TODOS los diálogos, parlamentos de los personajes, modismos mexicanos/latinos, título del video, descripción y hashtags DEBEN ser generados obligatoriamente en ESPAÑOL MEXICANO / LATINO (es-MX). Está TERMINANTEMENTE PROHIBIDO escribir los diálogos en portugués.',
      },
      'França': {
        langName: 'Français',
        locale: 'fr-FR',
        instruction:
          'TOUS les dialogues, répliques des personnages, expressions, titre de la vidéo, légende et hashtags DOIVENT être écrits en FRANÇAIS (fr-FR). Il est STRICTEMENT INTERDIT d’écrire les dialogues en portugais.',
      },
      'Itália': {
        langName: 'Italiano',
        locale: 'it-IT',
        instruction:
          'TUTTI i dialoghi, battute dei personaggi, titolo del video, didascalia e hashtag DEVONO essere generati in ITALIANO (it-IT). È SEVERAMENTE VIETATO scrivere i dialoghi in portoghese.',
      },
      'Alemanha': {
        langName: 'Deutsch',
        locale: 'de-DE',
        instruction:
          'ALLE Skriptdialoge, Zeilen der Charaktere, Titel, Bildunterschriften und Hashtags MÜSSEN in fließendem DEUTSCH (de-DE) verfasst sein. Es ist STRENGSTENS UNTERSAGT, Dialoge auf Portugiesisch zu verfassen.',
      },
    };

    const currentLang = languageConfig[country] || languageConfig['Brasil'];

    const numScenes = Math.min(60, Math.max(4, Number(scenes) || 6));
    const isContinuing = Boolean(previousStory && previousStory.trim().length > 0);

    const extremeWeightDirective =
      theme === 'Gordos'
        ? `
################################################################
REGRA SUPREMA E INEGOCIÁVEL DE PESO EXTREMO (TEMA 'GORDOS'):
################################################################
É OBRIGATÓRIO que TODOS os personagens — SEM NENHUMA EXCEÇÃO (protagonista, vilão, vítima, familiares, amigos, vizinhos, colegas, crianças, idosos, médicos, atendentes e QUAISQUER figurantes ao fundo) — sejam EXTREMAMENTE OBESOS (obesidade mórbida / extremely obese / morbidly obese), com aparência de 150kg a 300kg.

DESCRITOR FÍSICO OBRIGATÓRIO (repita EXATAMENTE estes termos, em inglês, nos prompts visuais de CADA personagem):
"extremely obese, morbidly obese body, massive 200kg+ weight, enormous hanging belly, very thick heavy arms and legs, broad shoulders, extremely round full face, huge double chin, deep skin folds on neck and abdomen, heavy body presence, wide silhouette occupying the frame".

REGRAS ANTI-MAGREZA (VIOLAR É PROIBIDO):
- É TERMINANTEMENTE PROIBIDO gerar qualquer personagem magro, em forma, atlético, "corpo normal", "average build", "slim" ou "fit".
- O peso extremo é FIXO e IMUTÁVEL: NUNCA emagreça os personagens. A MESMA silhueta obesa gigantesca DEVE aparecer IDÊNTICA no PROMPT 00 e em [Subject & Character Consistency] de TODAS as cenas, repetindo palavra por palavra o DESCRITOR FÍSICO OBRIGATÓRIO.
- Em CADA cena, adicione ao [Negative Prompt]: "thin, slim, skinny, fit body, athletic build, average weight, normal body, muscular, toned".
################################################################
`
        : '';

    const promptInstructions = `
Você é o mais consagrado diretor cinematográfico e roteirista de novelinhas curtas dramáticas ultra-virais para redes sociais (Kwai, TikTok, Instagram Reels, YouTube Shorts).
Você cria descrições de cenas completas e prompts visuais ultra-realistas no padrão oficial do SEEDANCE 2.5 (ByteDance / Dreamina / CapCut) e GOOGLE FLOW.

DIRETRIZ SOBERANA DE IDIOMA E LOCALIZAÇÃO CULTURAL:
- País Selecionado: ${country}
- Idioma Obrigatório do Roteiro e Diálogos: ${currentLang.langName} (${currentLang.locale})
${currentLang.instruction}

ATENÇÃO CRÍTICA AO IDIOMA E DIÁLOGOS:
O usuário escolheu expressamente o país "${country}".
Por isso, É ESTRITAMENTE OBRIGATÓRIO que:
1. Todos os diálogos entre aspas em "DIÁLOGO REAL:" e "RESPOSTA:" sejam redigidos no idioma ${currentLang.langName}.
2. REGRA DE DIÁLOGO: NUNCA adicione "diálogo sugerido", coloque SOMENTE O DIÁLOGO REAL que os personagens falam em cena! Diálogos autênticos, impactantes, coloquiais e perfeitamente pontuados.
3. No bloco do Seedance 2.5, a linha "[Dialogue & Native Audio]" DEVE conter o diálogo real no idioma ${currentLang.langName} para que o modelo de IA gere a dublagem e o sincronismo labial nativo no idioma ${currentLang.langName} de ${country}.
4. Título Sugerido, Legenda e Gatilho no SEO final DEVEM ser escritos no idioma ${currentLang.langName}.
5. NUNCA gere diálogos em português se o país escolhido for ${country} (exceto se o país for Brasil).

DIRETRIZ MÁXIMA DE TEMA (REGRA INVIOLÁVEL):
${themeDirective}

ATENÇÃO: É ESTRITAMENTE PROIBIDO DESVIAR DO TEMA '${theme}'! 
Toda a trama, personagens principais e locações DEVEM ser 100% fiéis ao tema '${theme}'.
${context ? `Contexto opcional do criador (deve ser totalmente adaptado para ocorrer DENTRO do tema '${theme}'): "${context}"` : ''}
${extremeWeightDirective}

PARÂMETROS DA PRODUÇÃO:
- Tema Selecionado: ${theme}
- País e Idioma Nativo: ${country} (${currentLang.langName})
- Tom do Roteiro: ${tone}
- Emoção Dominante: ${emotion}
- Diretriz de Textura e Realismo: ${skinDirective}
- Quantidade exata de cenas: ${numScenes} cenas
- REGRA ABSOLUTA DE NUMERACAO SEQUENCIAL: entregue EXATAMENTE ${numScenes} cenas, numeradas rigorosamente em sequencia, de "PROMPT CENA 1" ate "PROMPT CENA ${numScenes}", UMA cena por numero, SEM PULAR nenhum numero (é TERMINANTEMENTE PROIBIDO, por exemplo, ir de CENA 3 direto para CENA 8). Cada bloco deve ter o cabecalho "PROMPT CENA N (SEEDANCE 2.5)". Faca a contagem mental: se escreveu a CENA 1, 2 e 3, o proximo bloco e OBRIGATORIAMENTE a CENA 4, e assim por diante, ate a CENA ${numScenes}. Nao repita numeros e nao pule numeros.

${
  isContinuing
    ? `ATENÇÃO: Esta é uma PARTE 2 que dá continuidade direta ao enredo anterior no tema '${theme}'.
História anterior:
"""
${previousStory.slice(0, 3000)}
"""
Continue imediatamente após os acontecimentos anteriores, mantendo rigorosamente a mesma continuidade visual dos personagens e do universo de '${theme}'.`
    : `Desenvolva uma história dramática inédita e comovente EXCLUSIVAMENTE sobre o tema '${theme}', com gancho chocante logo na primeira cena, escalada de conflito no miolo e uma resolução memorável e reflexiva.`
}

================================================================================
REGRAS OBRIGATORIAS DE COERENCIA, IDENTIFICACAO DE FALA E DURACAO
================================================================================
1. COERENCIA NARRATIVA (HISTORIA UNICA E CONTINUA):
   - A historia e UMA so, com inicio, meio e fim, progredindo em CAUSA e EFEITO de uma cena para a outra (a cena 2 continua exatamente de onde a cena 1 parou, e assim por diante).
   - Mantenha SEMPRE os mesmos personagens (nomes, idades, papeis e figurino identicos) do inicio ao fim. Nunca troque nomes, papeis ou aparencia no meio da historia, nem invente personagens novos sem necessidade.
   - Nada de cenas soltas ou desconexas: cada cena avanca o conflito (gancho -> escalada -> revirada -> resolucao).
   - Evite repeticao: cada cena traz um fato NOVO, sem repetir a mesma acao ou a mesma fala de cenas anteriores.

2. IDENTIFICACAO DE QUEM FALA (SEM CONFUSAO):
   - Em CADA cena, diga explicitamente QUEM FALA pelo NOME e repita a DESCRICAO CURTA FIXA dele (idade + traco fisico marcante + roupa exata com cor), para nunca haver duvida de quem esta falando.
   - Se mais de um personagem falar na cena, identifique na ordem quem fala e para quem responde (QUEM FALA -> QUEM RESPONDE), repetindo a descricao curta fixa nos dois.
   - NUNCA atribua a fala ao personagem errado e nunca deixe um personagem mexendo a boca sem falar.

3. DURACAO DAS FALAS (MAXIMO 9 SEGUNDOS POR CENA):
   - Cada cena tem no MAXIMO 9 segundos de fala. Cada fala individual deve ter no maximo ~25 palavras (cerca de 8-9 segundos em ritmo natural).
   - Se a cena tiver dialogo entre dois personagens, a SOMA das falas tambem precisa caber em ~9 segundos (ex.: duas falas curtas de ~10-12 palavras cada).
   - NUNCA ultrapasse 9 segundos. Se ficar longo, corte e mantenha apenas a essencia da fala.

================================================================================
REGRA CRÍTICA: DESCRIÇÃO PROFUNDA DOS PERSONAGENS & IDENTIFICAÇÃO DE QUEM VAI FALAR
================================================================================
1. IDENTIFICAÇÃO RIGOROSA E DETALHADA DE QUEM VAI FALAR (SEM DIÁLOGO SUGERIDO - APENAS DIÁLOGO REAL):
   Em TODA e qualquer cena, você DEVE descrever claramente quem vai falar e quem responde:
   - QUEM FALA: Descreva minuciosamente o personagem que vai falar. Identifique com precisão: nome do personagem, idade exata, papel dramático na história, seu estado emocional naquele momento específico da cena (olhar marejado de dor, maxilar cerrado pela indignação, respiração entrecortada, sorriso caloroso e aliviado), postura física e o que ele está fazendo fisicamente ao falar. (Exemplo: "QUEM FALA: Carlos (O filho mais velho arrependido, 32 anos, operário humilde com olhar embargado de lágrimas, mãos calejadas trêmulas e postura curvada pelo peso da culpa)").
   - TOM E INTENÇÃO DA FALA: Descreva o tom de voz, ritmo, respiração, cadência e a intenção dramática subjacente da fala no idioma ${currentLang.langName} (se fala com firmeza comovente, sussurro tenso, indignação reprimida, voz embargada pelo choro ou alívio genuíno).
   - DIÁLOGO REAL: O diálogo REAL, autêntico, vivo e cinematográfico que o personagem fala na cena. NUNCA use "diálogo sugerido", coloque SOMENTE O DIÁLOGO REAL! OBRIGATORIAMENTE entre aspas e com pontuação final. LIMITE DE TEMPO: no máximo ~25 palavras (cerca de 9 segundos de fala); NUNCA ultrapasse 9 segundos e, se houver réplica, a soma das falas também precisa caber em ~9 segundos.
   - QUEM RESPONDE: Se houver diálogo compartilhado na cena, identifique com a mesma precisão o interlocutor da réplica: nome, idade exata, papel dramático na história, sua reação física imediata e sua expressão emocional ao ouvir a fala. (Exemplo: "QUEM RESPONDE: Dona Laura (A mãe idosa, 68 anos, olhar sereno mas magoado, lágrimas escorrendo suavemente pelas rugas ao encará-lo com as mãos trêmulas)").
   - RESPOSTA: O diálogo REAL da réplica correspondente, também entre aspas e com pontuação final.

2. DESCRIÇÃO RICA E MINUCIOSA DOS PERSONAGENS (SEM DESCRIÇÕES GENÉRICAS OU SUPERFICIAIS):
   Em TODOS os pontos onde os personagens são citados (no Prompt 00, em [Subject & Character Consistency] de cada cena e nos Character Model Sheets):
   - Descreva a idade exata e tipo físico (altura, biótipo, compleição corporal, postura).
   - Estrutura facial completa: formato do rosto, mandíbula, maçãs do rosto, formato e cor dos olhos, sobrancelhas e expressão marcante.
   - Textura orgânica e realismo da pele (${skinDirective}): microporos, dermo-realismo, linhas de expressão naturais, sem filtros plásticos ou aspecto de IA.
   - Cabelo: corte exato, comprimento, textura, cor, brilho e caimento dos fios.
   - Figurino canônico fixo e imutável: especifique cada peça de roupa, tecidos específicos (linho cru, algodão desgastado, lã, couro envelhecido), cores primárias e secundárias, calçados e acessórios característicos.
   - Características suficientemente distintas para que cada personagem tenha identidade cinematográfica única e inconfundível.

DIRETRIZES DE ENGENHARIA DE PROMPT PARA SEEDANCE 2.5 E GOOGLE FLOW (BYTEDANCE / FLOW INGREDIENTS / CAPCUT):
Você DEVE estruturar todos os prompts visuais de vídeo seguindo rigorosamente a arquitetura do SEEDANCE 2.5 e GOOGLE FLOW (Director's Brief com seções rotuladas em colchetes). O Seedance 2.5 e o Flow geram vídeo fotorrealista 4K, física gravitacional precisa e ÁUDIO NATIVO com sincronismo labial.

REGRA CRUCIAL ANTI-FUNDO BRANCO (SOBREPOSIÇÃO OBRIGATÓRIA DE CENÁRIO REAL):
Muitos criadores utilizam a imagem do Prompt 00 como "Ingrediente de Personagem" (Character Ingredient) no Google Flow ou como Imagem de Referência no Seedance. Como o Prompt 00 possui fundo branco neutro de estúdio, se o prompt de cena não especificar detalhadamente o ambiente e não der ordem expressa de substituição, o motor de vídeo gera a cena dentro de um vazio branco artificial!
Portanto, em CADA CENA você DEVE OBRIGATORIAMENTE incluir:
1. [Environment & Scene Setting]: Uma descrição riquíssima e ultra-detalhada do cenário 3D realista da história (paredes, pisos com texturas táteis, janelas, móveis, iluminação ambiente, profundidade e objetos de cena).
2. [Background Override]: Ordem explícita em inglês para o motor de IA (Google Flow / Seedance) ignorar e descartar 100% o fundo branco da imagem de ingrediente e ancorar os personagens dentro do cenário 3D real com sombras de contato e reflexos no chão.
3. [Negative Prompt]: Termos negativos para banir fundo branco, cyclorama e estúdio vazio.

CADA PROMPT DE CENA DEVE CONTER AS SEGUINTES SEÇÕES ROTULADAS:
1. [Subject & Character Consistency]: REPETIÇÃO OBRIGATÓRIA da descrição visual física detalhada e figurino exato de cada personagem presente na cena, mantendo 100% de consistência com o Prompt 00: Subject 1 - Nome (idade, cabelo, feições, roupas exatas e cores); Subject 2 - Nome (feições e roupas idênticas ao Prompt 00). NUNCA resuma com termos vagos como "mesmo personagem" ou "personagem anterior".
2. [Environment & Scene Setting]: Cenário físico 3D completo, imersivo e realista onde a cena ocorre (ex: cozinha rústica com mesa de madeira envelhecida, luz dourada de janela e cortinas ao fundo; OU hospital movimentado; OU rua chuvosa à noite).
3. [Background Override]: Ordem expressa: "CRITICAL: The reference image/ingredient has a white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Place the characters fully grounded inside the detailed 3D environment described in [Environment & Scene Setting], with accurate contact shadows and floor interaction. Zero white studio void."
4. [Action & First-Frame Blocking]: Posição inicial dos personagens (blocking), movimento físico orgânico com causa antes do efeito, postura corporal e respiração.
5. [Optics & Camera Movement]: Movimento único contínuo de câmera para o take de vídeo (ex: 85mm lens, slow push-in, low-angle tracking dolly, steady handheld, profundidade de campo rasa f/1.4).
6. [Dialogue & Native Audio]: Instrução direta para a IA gerar áudio e sincronismo labial nativo:
   Ex: Character [Nome] speaks directly: "[Diálogo real da cena]" with precision lip-sync and [tom e cadência emocional da fala].
7. [Lighting & Atmosphere]: Direção e motivação das luzes (ex: Rembrandt lighting, soft key light, rim light dourada, névoa volumétrica suave, contraste de cinema).
8. [Audio & Ambience (SFX)]: Paisagem sonora gerada nativamente (ruídos ambientes, respiração ofegante, chuva, eco de passos, tecido farfalhando).
9. [Global Style & Physical Realism]: Fotorrealismo 4K, sensor ARRI Alexa LF, ${skinDirective}, micro-texturas celulares visíveis, física natural e 24fps cinematográfico.
10. [Negative Prompt]: white background, blank white void, studio cyclorama, plain backdrop, floating characters, artificial studio setup, empty white space.

================================================================================
ESTRUTURA DE SAÍDA EXATA DOS PROMPTS (MANTENHA RIGOROSAMENTE A ESTRUTURA ANTERIOR):
================================================================================

O texto DEVE iniciar OBRIGATORIAMENTE com os prompts da produção:

PROMPT 00 - FICHA DE PERSONAGENS E CENÁRIO MESTRE (REFERENCE SHEET):
[Prompt fotográfico detalhado de referência multimodal em fundo branco puro (#FFFFFF) com a descrição visual rica de todos os personagens principais lado a lado e a especificação completa do cenário mestre:
[Reference ID: Subject 1 - Name]: Full body, standing pose, neutral expression, clean seamless solid pure white studio background (#FFFFFF), rich detailed facial features, exact garments, colors, fabrics, shoes and textures.
[Reference ID: Subject 2 - Name]: Full body, standing side by side with Subject 1, proportional height, detailed wardrobe and facial features.
[Master Environment Specification - Primary Setting]: Detailed physical description of the primary set (exact floor materials, wall textures, windows, architectural features, main furniture, props, and ambient lighting palette) to be maintained consistently across all video scenes.
[Camera, Lighting & Specs]: Shot on Hasselblad H6D-100c, 100mm f/2.8 lens, softbox commercial photography lighting, clean solid white background (#FFFFFF), ultra-sharp focus head-to-toe, raw uncompressed 8K textures, neutral studio poses.]

Em seguida, inicie as cenas de vídeo sequenciais no padrão Seedance 2.5 e Google Flow:

PROMPT GANCHO CHAMATIVO CENA 1 (SEEDANCE 2.5):
QUEM FALA: [Nome, papel dramático detalhado, idade exata, traços físicos, expressão facial rica, postura corporal e estado emocional minucioso de quem vai falar]
TOM E INTENÇÃO DA FALA: [Tom vocal, cadência, ritmo e respiração exata no idioma ${currentLang.langName}]
DIÁLOGO REAL: "[Diálogo real que o personagem fala na cena OBRIGATORIAMENTE NO IDIOMA ${currentLang.langName.toUpperCase()} entre aspas com pontuação final - NUNCA use diálogo sugerido, coloque apenas o diálogo real]"
QUEM RESPONDE: [Nome, papel dramático, idade, reação física e estado emocional do interlocutor que responde]
RESPOSTA: "[Diálogo real da réplica OBRIGATORIAMENTE NO IDIOMA ${currentLang.langName.toUpperCase()} entre aspas com pontuação final]"
INSTRUÇÕES VISUAIS (PROMPT SEEDANCE 2.5 & GOOGLE FLOW):
[Subject & Character Consistency]: [REPETIÇÃO OBRIGATÓRIA da descrição visual física rica e figurino exato de cada personagem presente na cena: Subject 1 - Nome (idade exata, traços de rosto, corte e cor de cabelo, pele com ${skinDirective}, roupas canônicas e cores exatas estabelecidas no Prompt 00); Subject 2 - Nome (feições e roupas idênticas ao Prompt 00)]
[Environment & Scene Setting]: [DESCRIÇÃO COMPLETA DO CENÁRIO 3D REAL DA CENA: tipo e acabamento do piso, paredes, janelas, móveis de fundo, iluminação do ambiente e profundidade do cômodo, repetindo os elementos arquitetônicos fixos]
[Background Override]: CRITICAL FOR FLOW INGREDIENTS & SEEDANCE: The character reference image/ingredient has a plain white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Ground the characters naturally inside the detailed 3D environment described above with contact shadows and environmental ambient lighting. DO NOT render an empty white studio void or blank cyclorama.
[Action & First-Frame Blocking]: [Ação detalhada com causa e efeito, gestos físicos e respiração]
[Optics & Camera Movement]: [Lente e movimento de câmera cinematográfico contínuo para o take de 4 a 6 segundos]
[Dialogue & Native Audio]: Character [Nome] speaks directly: "[Diálogo real da cena]" with precision lip-sync and [tom e cadência emocional da fala].
[Lighting & Atmosphere]: [Motivação e fontes de iluminação volumétrica coerentes com o cenário]
[Audio & Ambience (SFX)]: [Foley e efeitos de som ambiente sincronizados com o local]
[Global Style & Physical Realism]: [Cinematografia 4K fotorrealista, ${skinDirective}, física real, 24fps]
[Negative Prompt]: white background, blank white void, studio cyclorama, plain backdrop, floating characters, artificial studio setup, empty white space

PROMPT CENA 2 (SEEDANCE 2.5):
... até PROMPT CENA ${numScenes} (SEEDANCE 2.5):
(OBRIGATORIO para CADA cena, SEM OMITIR NENHUMA SECAO: QUEM FALA, TOM E INTENCAO DA FALA, DIALOGO REAL, QUEM RESPONDE, RESPOSTA e INSTRUCOES VISUAIS contendo TODAS as secoes entre colchetes: [Subject & Character Consistency], [Environment & Scene Setting], [Background Override], [Action & First-Frame Blocking], [Optics & Camera Movement], [Dialogue & Native Audio], [Lighting & Atmosphere], [Audio & Ambience (SFX)], [Global Style & Physical Realism] e [Negative Prompt]. NUNCA encurte, resuma ou pule essas secoes: cada cena tem que sair COMPLETA, com o mesmo nivel de detalhe da CENA 1.)

================================================================================
CHARACTER MODEL SHEETS DOS PERSONAGENS (GERADOS NO FINAL — TODOS OS PERSONAGENS DA HISTÓRIA)
================================================================================
Agora que a história completa foi inteiramente desenvolvida através de todas as ${numScenes} cenas e todos os personagens foram apresentados, gere os Character Model Sheets individuais em fundo branco puro para TODOS os personagens que apareceram ou participaram visualmente da história (sem faltar absolutamente nenhum! Protagonista, antagonistas, familiares, secundários, crianças, idosos, funcionários ou figurantes recorrentes):

CHARACTER MODEL SHEETS DOS PERSONAGENS (FUNDO BRANCO PURO):

Para CADA personagem que participou da história:
PROMPT MODEL SHEET — [NOME DO PERSONAGEM] (FUNDO BRANCO PURO):
Folha profissional de referência do personagem em FUNDO BRANCO PURO (#FFFFFF solid seamless clean white studio background), iluminação neutra de estúdio comercial, sem cenário.
Mostrando EXATAMENTE A MESMA PESSOA várias vezes lado a lado na mesma imagem, nos seguintes 6 ÂNGULOS DE CORPO INTEIRO:
1. Full body front view (corpo inteiro — vista frontal)
2. Full body 3/4 front view (corpo inteiro — 3/4 frontal)
3. Full body left profile view (corpo inteiro — perfil esquerdo)
4. Full body right profile view (corpo inteiro — perfil direito)
5. Full body 3/4 rear view (corpo inteiro — 3/4 traseiro)
6. Full body rear view (corpo inteiro — vista traseira)
E 3 REFERÊNCIAS APROXIMADAS DO ROSTO (facial close-up portraits):
7. Close-up portrait frontal face
8. Close-up portrait 3/4 face
9. Close-up portrait profile face
Prompt fotográfico ultra-detalhado em inglês contendo: nome, idade exata, traços faciais minuciosos, formato dos olhos, mandíbula, nariz, dermo-realismo, corte e textura do cabelo, roupas canônicas exatas, tecidos, cores e calçados fixos estabelecidos na história.
Estilo visual: Ultra-realistic cinematic human character, photorealistic skin, realistic pores, natural facial asymmetry, realistic hair strands, anatomically correct human proportions, professional character reference photography, turnaround model sheet, neutral studio lighting, pure white seamless background (#FFFFFF), full body visible from head to toe, extremely detailed, consistent identity across every view, high-resolution cinematic photography.
${
  theme === 'Frutas'
    ? `(No tema Frutas: 3D character model sheet reference photography, anthropomorphic stylized fruit character, consistent identity across all 6 full-body angles and 3 close-up faces, Pixar/Disney feature animation quality, professional character turnaround sheet, neutral studio lighting, pure white seamless background, high resolution.)`
    : ''
}

(Gere o PROMPT MODEL SHEET individual para CADA personagem que apareceu na história, sem faltar nenhum!)

NÃO utilize asteriscos duplos (**) para negrito dentro do texto gerado.

Ao terminar, inclua a seção final:
---SEO-START---
Título Sugerido: [Título impactante e viral com gatilho de curiosidade no idioma ${currentLang.langName}]
Legenda para Redes Sociais: [Texto envolvente e reflexivo para o post no idioma ${currentLang.langName}]
Gatilho de Engajamento: [Pergunta instigante para gerar debates no idioma ${currentLang.langName}]
Hashtags Recomendadas: #novelinhas #cenas #dramatiktok #historiasreais #viralvideo #emocionante
`;

    const countScenes = (value: string) => (value.match(/PROMPT\s+CENA\s+\d+/gi) || []).length;
    const countDetailed = (value: string) => (value.match(/\[Negative Prompt\]/gi) || []).length;

    let generatedText = (await generateWithModelFallback(promptInstructions, req.geminiApiKey)).text || '';

    if (!generatedText) {
      throw new Error('Nenhum texto foi gerado pelo modelo.');
    }

    if (countScenes(generatedText) < numScenes || countDetailed(generatedText) < numScenes) {
      const retryPrompt = `${promptInstructions}

========================================================================
CORRECAO OBRIGATORIA
========================================================================
A resposta anterior veio incompleta. Gere a historia COMPLETA novamente com:
- EXATAMENTE ${numScenes} cenas, numeradas de "PROMPT CENA 1" ate "PROMPT CENA ${numScenes}", SEM PULAR numeros;
- TODAS as secoes de INSTRUCOES VISUAIS em CADA cena ([Subject & Character Consistency], [Environment & Scene Setting], [Background Override], [Action & First-Frame Blocking], [Optics & Camera Movement], [Dialogue & Native Audio], [Lighting & Atmosphere], [Audio & Ambience (SFX)], [Global Style & Physical Realism], [Negative Prompt]).`;

      const retry = await generateWithModelFallback(retryPrompt, req.geminiApiKey);
      if (
        retry.text &&
        countScenes(retry.text) >= countScenes(generatedText) &&
        countDetailed(retry.text) >= countDetailed(generatedText)
      ) {
        generatedText = retry.text;
      }
    }

    let sceneOrder = 0;
    const normalizedText = generatedText.replace(/(PROMPT\s+CENA\s+)\d+/gi, (_match, prefix) => `${prefix}${++sceneOrder}`);

    res.json({ text: normalizedText });
  } catch (error: any) {
    console.error('Error generating novelinhas script:', error);
    const errMsg = String(error?.message || '');
    const isHighDemand =
      error?.status === 503 ||
      error?.code === 503 ||
      errMsg.includes('503') ||
      errMsg.includes('high demand') ||
      errMsg.includes('UNAVAILABLE');

    const clientMessage = isHighDemand
      ? 'O modelo de IA está com altíssima demanda temporária. Tentamos reconectar com modelos alternativos. Por favor, aguarde alguns instantes e tente novamente.'
      : errMsg || 'Falha ao gerar o roteiro cinematográfico. Tente novamente.';

    res.status(isHighDemand ? 503 : 500).json({
      error: clientMessage,
    });
  }
};

const handleIdeas = async (req: any, res: any) => {
  try {
    const { theme = 'Dramas Emocionantes', country = 'Brasil', count = 5 } = req.body || {};

    const extraThemeGuidance =
      theme === 'Frutas'
        ? `IMPORTANTE PARA O TEMA FRUTAS: Todos os personagens DEVEM ser FRUTAS HUMANIZADAS / ANTROPOMÓRFICAS (ex: Moranguinha a protagonista romântica com vestido rosa e sementes douradas, Bananão o playboy de terno, Uva Vitória a vilã invejosa de vestido de gala, Maçãzinho o jovem herdeiro, Cereja sedutora, etc.). Crie dilemas novelescos de traição, ciúmes, vingança, romance proibido e superação no mundo das frutas em animação 3D.`
        : '';

    const prompt = `
Você é o principal criador e roteirista de novelinhas curtas ultra-virais para redes sociais (TikTok, Kwai, Reels, YouTube Shorts).
Gere exatamente ${count} ideias curtas, inéditas, dramáticas, viciantes e com ganchos emocionais fortes para o tema '${theme}' ambientado em '${country}'.
${extraThemeGuidance}
Cada ideia deve ter entre 1 e 2 frases de alto impacto:
- Apresentar personagens nítidos (com nomes e personalidades marcantes)
- Apresentar o dilema ou conflito inicial
- Apresentar uma reviravolta surpreendente ou lição de vida inesquecível

Retorne EXCLUSIVAMENTE um array JSON com ${count} strings, sem formatação markdown ou explicações adicionais:
["Ideia 1...", "Ideia 2...", "Ideia 3...", "Ideia 4...", "Ideia 5..."]`;

    const { text } = await generateWithModelFallback(prompt, req.geminiApiKey);

    let ideas: string[] = [];
    try {
      const cleaned = text
        .trim()
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        ideas = parsed.map((item) => String(item).trim()).filter((item) => item.length > 15);
      }
    } catch {
      const matches = Array.from(text.matchAll(/"([^"\n]{20,})"/g)).map((m) => m[1].trim());
      if (matches.length > 0) {
        ideas = matches;
      } else {
        ideas = text
          .split('\n')
          .map((line) => line.replace(/^\d+[\.\)\-]\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter((line) => line.length > 20);
      }
    }

    if (ideas.length === 0) {
      ideas = [
        `Uma revelação surpreendente envolvendo os personagens do tema ${theme} que transforma uma situação de conflito em uma emocionante lição de compaixão.`,
        `Um confronto tenso onde a aparente fraqueza de um protagonista humilde no tema ${theme} se torna a chave para desmascarar a arrogância do rival.`,
        `Um reencontro inesperado após anos de separação dentro do universo de ${theme} que traz à tona um segredo guardado com amor.`,
      ];
    }

    res.json({ ideas: ideas.slice(0, 8) });
  } catch (error: any) {
    console.error('Error generating ideas for novelinhas:', error);
    res.status(500).json({ error: 'Erro ao gerar novas ideias.' });
  }
};

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const { data: { user }, error: authError } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Sessao invalida. Faca login novamente.' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Erro ao conferir acesso.' });
    return null;
  }

  const canUse =
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  const apiKey = await getActiveGeminiApiKey(serviceSupabase, user.id);
  if (!apiKey) {
    return res.status(400).json({ error: 'IA nao configurada. Adicione uma chave do Google AI Studio em Configuracoes.' });
  }

  req.geminiApiKey = apiKey;

  if (String(req.body?.action || '') === 'generate-ideas') {
    return handleIdeas(req, res);
  }

  return handleGenerate(req, res);
}
