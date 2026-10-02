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
      userScript = '',
      userScriptMode = '',
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
- Os personagens vencem pelo caráter, pelo coração e pelas escolhas — NUNCA trate o peso como piada humilhante. No máximo, humor leve, carinhoso e respeitoso.

COTIDIANO BRASILEIRO REAL (FONTE OBRIGATÓRIA DAS HISTÓRIAS):
- Toda história deve nascer de uma situação REAL, reconhecível e do dia a dia do povo brasileiro: periferia, interior, feira, fila do posto de saúde, ônibus lotado, igreja, boteco, salão de beleza, grupo da família no WhatsApp, dívida no cartão, bico, programa social, golpe na internet, rede social e briga por dinheiro.
- O contexto social e econômico é o MOTOR da trama (o peso extremo continua sendo apenas a aparência de TODOS os personagens).
- Traga humor honesto, crítica leve e emoção verdadeira — NUNCA deboche gratuito nem piada humilhante.
- Exemplos do TIPO de premissa desejada (VARIE sempre, NUNCA repita a mesma):
  * Uma família que teve 10 filhos para ganhar mais Bolsa Família e entra em colapso quando o benefício é cortado.
  * Um pobre que mora numa casa caindo aos pedaços e finge ser rico nas redes sociais, até a farsa ser exposta AO VIVO.
  * Outras sementes: o vizinho do "golpe do Pix", a tia que vende bolo no sinal, o tio das pirâmides, o "influencer" de fachada, a mãe que faz bico de tudo, o compadre que deve a todos, a fila do INSS, o delivery que não paga, o agiota do bairro, o churrasco que virou briga de família, a loteria que promete tudo.
- Cada história deve ser ÚNICA e específica: use detalhes concretos (um objeto, um lugar, uma dívida, uma decisão) que só existem nessa história.`,
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

    // O usuario pode colar um roteiro ja pronto. Nesse caso a historia dele e CANONICA:
    // a IA nao reescreve, nao troca o desfecho e nao inventa outra trama.
    const ownScript = String(userScript || '').trim();
    const ownScriptMode = String(userScriptMode || '').trim() === 'adapt' ? 'adapt' : 'continue';
    const hasOwnScript = ownScript.length > 0;

    const ownScriptDirective = hasOwnScript
      ? `
################################################################
ROTEIRO DO USUÁRIO (FONTE CANÔNICA E OBRIGATÓRIA DA HISTÓRIA)
################################################################
O usuário JÁ TEM um roteiro pronto. Esse texto abaixo é a VERDADE da história e NÃO PODE ser reescrito, resumido, corrigido, reordenado nem substituído:

"""
${ownScript.slice(0, 6000)}
"""

REGRAS INEGOCIÁVEIS:
1. ACOMPANHE A HISTÓRIA IDÊNTICA ao texto do usuário: mesma ordem de acontecimentos, mesmos nomes, mesmos personagens, mesmos lugares, mesmo tom e MESMO FINAL. É TERMINANTEMENTE PROIBIDO inventar outra história, trocar o desfecho, mudar o nome de qualquer personagem ou acrescentar um enredo parallel que contradiga o roteiro.
2. Reutilize as falas do próprio roteiro do usuário sempre que elas existirem no texto. NÃO reescreva, NÃO modernize e NÃO troque o texto das falas já escritas.
${
  ownScriptMode === 'continue'
    ? `3. MODO CONTINUAR: o roteiro do usuário é o COMEÇO da história. Continue a partir de EXATAMENTE onde o texto termina (mesma cena, mesma hora do dia, mesma situação), criando apenas os acontecimentos seguintes até fechar a história com um desfecho memorável. Não repita e não reconte nada do que já está escrito.`
    : `3. MODO ADAPTAR: NÃO escreva cenas novas. Converta o roteiro do usuário, cena por cena e na MESMA ordem, no formato técnico completo do agente (${numScenes} cenas de 8 segundos, PROMPT 00 com ficha dos personagens, [Subject & Character Consistency], [Dialogue & Native Audio] em ${currentLang.langName}, e o bloco SEO final), preservando integralmente a história, os diálogos e o desfecho do usuário.`
}
4. As ${numScenes} cenas devem cobrir o roteiro do usuário de forma COMPLETA, sem pular nenhum TRECHO RELEVANTE do texto e sem inventar cenas que não estejam no que ele escreveu.
5. Se o roteiro do usuário for curto, complete as cenas restantes com continuação coerente a partir do ponto em que ele parou — sempre respeitando o tom, os personagens e o desfecho descritos por ele.
################################################################
`
      : '';

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
${ownScriptDirective}

PARÂMETROS DA PRODUÇÃO:
- Tema Selecionado: ${theme}
- País e Idioma Nativo: ${country} (${currentLang.langName})
- Tom do Roteiro: ${tone}
- Emoção Dominante: ${emotion}
- Diretriz de Textura e Realismo: ${skinDirective}
- Quantidade exata de cenas: ${numScenes} cenas
- REGRA ABSOLUTA DE NUMERACAO SEQUENCIAL: entregue EXATAMENTE ${numScenes} cenas, numeradas rigorosamente em sequencia, de "PROMPT CENA 1" ate "PROMPT CENA ${numScenes}", UMA cena por numero, SEM PULAR nenhum numero (é TERMINANTEMENTE PROIBIDO, por exemplo, ir de CENA 3 direto para CENA 8). Cada bloco deve ter o cabecalho "PROMPT CENA N (SEEDANCE 2.5)". Faca a contagem mental: se escreveu a CENA 1, 2 e 3, o proximo bloco e OBRIGATORIAMENTE a CENA 4, e assim por diante, ate a CENA ${numScenes}. Nao repita numeros e nao pule numeros.

${
  hasOwnScript
    ? `ATENÇÃO SUPREMA: o roteiro do usuário acima é a FONTE CANÔNICA desta história e sua prioridade é ABSOLUTA MAIOR do que qualquer sugestão de tema, estrutura, engine ou regra anti-clichê desta minha diretriz. Você NÃO cria uma nova história: você executa o roteiro dele, na ordem dele, com as falas dele, até o final que ele escreveu. As regras de formato (numeração de cenas, PROMPT 00, ficha física, Subject & Character Consistency, SEO) continuam OBRIGATÓRIAS — elas mudam COMO o roteiro é entregue, nunca O QUE acontece.`
    : isContinuing
      ? `ATENÇÃO: Esta é a PARTE 2 da MESMA história (continuação direta) no tema '${theme}'.

CONTEÚDO DA PARTE 1 (JÁ ENTREGUE AO PÚBLICO - use só como referência de continuidade):
"""
${previousStory.slice(0, 7000)}
"""

REGRA OBRIGATÓRIA DA PARTE 2 - PROIBIDO REPETIR:
1. É TERMINANTEMENTE PROIBIDO recontar, resumir, reformular, "melhorar" ou reescrever QUALQUER TRECHO que já foi escrito na parte 1. O público JÁ viu isso. Não comece recontando o que aconteceu antes.
2. A CENA 1 desta parte 2 deve começar EXATAMENTE no ponto em que a parte 1 terminou (veja "ULTIMOS ACONTECIMENTOS DA PARTE 1"), nunca antes dele.
3. Traga SOMENTE acontecimentos NOVOS e um arco novo: novo conflito, nova escalada, nova reviravolta e um desfecho novo que feche ESTA parte.
4. Marque a passagem do tempo na primeira cena ("MAIS TARDE...", "NA MANHA SEGUINTE...", "TRES DIAS DEPOIS...") e reative o gancho em 1 segundo.
5. Mantenha rigorosamente a mesma continuidade visual (mesma ficha física dos personagens, mesmo figurino, mesma ambientação e mesmas regras do universo de '${theme}').`
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
   - Em CADA cena, diga explicitamente QUEM FALA pelo NOME e repita a FICHA FÍSICA FIXA COMPLETA dele (nome, idade, altura, porte, tom/textura de pele, cabelo, roupa exata com cores/tecidos, calçados e acessórios), para nunca haver duvida de quem esta falando.
   - Se mais de um personagem falar na cena, identifique na ordem quem fala e para quem responde (QUEM FALA -> QUEM RESPONDE), repetindo a FICHA FÍSICA FIXA COMPLETA nos dois.
   - NUNCA atribua a fala ao personagem errado e nunca deixe um personagem mexendo a boca sem falar.

3. DURACAO DAS FALAS (REGRA DURA - MAXIMO 9 SEGUNDOS POR CENA):
   - FALA INDIVIDUAL: no MAXIMO 18 palavras (ideal 10 a 14). Isso da cerca de 5 a 7 segundos em ritmo natural. É PROIBIDO passar de 18 palavras em uma fala unica.
   - CENA COM DIALOGO (duas pessoas falando): CADA fala com no MAXIMO 10 palavras; a SOMA das duas falas NUNCA passa de 20 palavras (cerca de 8 a 9 segundos).
   - Antes de fechar a cena, CONTE as palavras de cada fala. Se passar do limite, REESCREVA mais curta e guarde apenas a essencia.
   - NUNCA use discursos, monologos, explicacoes ou falas longas. Prefira frases curtas, secas e de impacto (estilo novela): "Voce me mentiu.", "Isso nao vai ficar assim.", "Assina aqui e resolvemos."

================================================================================
DIRETRIZ DE OURO DO ROTEIRO (PADRAO DAS MICRO-NOVELAS QUE VIRALIZAM)
================================================================================
Antes de escrever as cenas, planeje mentalmente (NAO escreva o plano no texto final) uma NOVELINHA DE VERDADE seguindo o esqueleto abaixo. Historias soltas, aleatorias ou sem escalada estao ABSOLUTAMENTE PROIBIDAS.

A) LOGLINE E MOTOR DRAMATICO (defina em uma frase):
   - Protagonista + o que ele QUER + o que o IMPEDE + o SEGREDO/MENTIRA que sustenta a trama (o "pavio" que pode explodir). Sem um querer claro e um obstaculo concreto, NAO existe historia.
   - Escolha uma lane de trope que prende: injustica/humilhacao publica, traicao, identidade oculta, heranca/segredo de familia, amor proibido, vinganca ou reviravolta de poder. Entregue o payoff esperado por um caminho INESPERADO.

B) ESPINHA DRAMATICA EM CAUSA E EFEITO (obrigatoria do inicio ao fim):
   - Cena 1: GANCHO EXPLOSIVO — comece JA no conflito, com uma imagem, acao ou PROVA que para o scroll. Nunca comece pela rotina.
   - Cenas iniciais: ESCALADA — cada cena piora a situacao com um fato NOVO; plante a promessa narrativa que sera cobrada depois.
   - MEIO (cena do meio aproximada): REVIRAVOLTA que RE-PRECIFICA a historia — uma informacao nova que faz tudo o que entendiamos mudar de valor.
   - Cenas finais: ACELERACAO — segredos vem a tona, aliancas mudam, o cerco aperta.
   - Ultima cena: DESFECHO com REVERSAO PUBLICA (a derrota do vilao ou a vitoria do protagonista precisa ser VISTA por outros, na frente de testemunhas) e uma licao/emocao memoravel. Pode deixar um fio aberto para continuar.

C) REGRA DO "UM SO TURNO POR CENA":
   - Cada cena tem EXATAMENTE UM momento que vira o jogo (revelacao, traicao, mudanca de alianca ou decisao). Se tiver duas viradas, divida em duas cenas; se nao tiver NENHUMA, corte a cena.
   - Cada cena termina em MINI-CLIFFHANGER: corte na pergunta/revelacao, NUNCA na resposta. Deixe o espectador querendo a proxima cena.

D) ESCADA DE ROTACAO DOS GANCHOS (nunca repita o mesmo tipo duas seguidas):
   - Identidade (alguem nao e quem dizia ser), Emocao (confissao, ruptura ou recusa suspensa) e Realizacao (tudo o que achavamos estava errado). Alterne esses tres tipos entre as cenas.

E) CICLO VICIANTE (DANO -> ALIVIO -> AMEACA MAIOR):
   - Dano (humilhacao, perda ou ameaca) -> um pequeno alivio verdadeiro -> uma ameaca MAIOR antes que o alivio se assente. Mantenha o publico nesse ciclo.

F) "CHOQUE E PROVA; DOR E DETALHE" (emoção concreta e filmavel):
   - O choque deve ser uma PROVA fisica e especifica (uma mensagem, um documento, uma foto, uma alianca, uma transferencia), nunca uma frase vaga de sentimento.
   - A dor deve ser encenada por OBJETOS e detalhes (o contato ainda salvo como "meu amor ❤️", a alianca ainda no dedo, a musica que nunca mudou). Em 9:16, maos, olhos e objetos comunicam mais que fala.

G) PROIBICOES ABSOLUTAS (erros que deixam a historia ruim):
   - Cenas aleatorias/soltas que nao avancam a causa-e-efeito.
   - Repetir a mesma acao ou a mesma fala de uma cena anterior.
   - Personagem sem desejo/objetivo claro, ou que age sem motivo.
   - Resolver o gancho logo no inicio da cena seguinte (a tensao morre).
   - Explicar demais o cliffhanger (corte dois segundos antes do que parece seguro).
   - Vilao generico sem motivacao real; acoes concretas que nao alteram nada.
   - Mais de um turno por cena ou meio da historia sem forca (sem micro-climax).
   - Final sem pagamento emocional e sem reversao publica.

Distribua esses batimentos pelo numero de cenas pedido: gancho no inicio, escalada no meio, revirada no meio, aceleracao e pagamento no fim. Se o numero de cenas for pequeno, comprima SEM perder nenhum desses batimentos.

================================================================================
REGRA ANTI-CLICHE E TESTE DE LOGICA (OBRIGATORIO)
================================================================================
H) PROIBIDO CLICHE (as tramas mais batidas da internet estao VETADAS):
   - É TERMINANTEMENTE PROIBIDO usar: marido traindo com a empregada, madrasta malvada, heranca disputada, filho que so quer dinheiro, "segredo do passado" generico, casamento cancelado no altar, ex que volta para vingar, vilão que sorri maquiavelico no fim.
   - É TERMINANTEMENTE PROIBIDO dialogo genérico de novela, tipo "Eu sempre te amei", "Voce vai pagar por isso", "Nao acreditava em voce". Cada fala tem que soar como uma pessoa REAL falando AQUELA situacao especifica.
   - PROIBIDO repetir gancho, desfecho ou o tipo de virada entre duas historias diferentes.
   - Toda premissa tem que sair de um PROBLEMA CONCRETO do cotidiano (uma divida, um corte, um exame, uma humilhacao publica, uma mentira contada no grupo da familia, um boleto, um post que viraliza), e nao de um conflito generico.
   - PROIBIDO personagens que agem contra a propria personalidade sem motivo (vilao que vira bonzinho do nada, vitima que perdoa sem razao). Cada virada e consequencia das ESCOLHAS mostradas nas cenas.
   - PROIBIDO reviravolta sem explicacao logica ou "finais de porta" vagos. A revelacao final responde a um fato plantado em uma cena anterior.

I) TESTE DE LOGICA (responda mentalmente ANTES de escrever, nao escreva o texto):
   - Qual e o QUERER concreto do protagonista na primeira cena?
   - Por que a cena 2 acontece por causa da cena 1? Se a resposta for "nao tem ligacao", a cena e aleatoria: reescreva ou corte.
   - O que muda de VALOR no meio da historia (a reviravolta)?
   - A resolucao vem das ESCOLHAS do protagonista, nunca de coincidencia ou milagre.
   - Se qualquer resposta nao existir, a historia esta sem sentido. Refaca antes de escrever as cenas.

================================================================================
REGRA CRÍTICA: DESCRIÇÃO PROFUNDA DOS PERSONAGENS & IDENTIFICAÇÃO DE QUEM VAI FALAR
================================================================================
1. IDENTIFICAÇÃO RIGOROSA E DETALHADA DE QUEM VAI FALAR (SEM DIÁLOGO SUGERIDO - APENAS DIÁLOGO REAL):
   Em TODA e qualquer cena, você DEVE descrever claramente quem vai falar e quem responde:
   - QUEM FALA: Nome + FICHA FÍSICA FIXA COMPLETA do personagem que vai falar (idade exata, altura, porte, tom/textura de pele, cabelo, ROUPA exata com cores/tecidos, CALÇADOS e ACESSÓRIOS) + papel dramático na história + estado emocional daquele momento (olhar marejado de dor, maxilar cerrado pela indignação, respiração entrecortada, sorriso caloroso), postura física e o que ele está fazendo fisicamente ao falar. (Exemplo: "QUEM FALA: Carlos (filho mais velho arrependido, 32 anos, 1,78m, magro, pele morena clara, cabelo preto curto, camisa social branca amassada, calça preta de trabalho, botas gastas e aliança de ouro no dedo, com olhar embargado de lágrimas e mãos calejadas trêmulas)").
   - TOM E INTENÇÃO DA FALA: Descreva o tom de voz, ritmo, respiração, cadência e a intenção dramática subjacente da fala no idioma ${currentLang.langName} (se fala com firmeza comovente, sussurro tenso, indignação reprimida, voz embargada pelo choro ou alívio genuíno).
   - DIÁLOGO REAL: O diálogo REAL, autêntico, vivo e cinematográfico que o personagem fala na cena. NUNCA use "diálogo sugerido", coloque SOMENTE O DIÁLOGO REAL! OBRIGATORIAMENTE entre aspas e com pontuação final. LIMITE DURO DE TEMPO: no máximo 18 palavras por fala (cerca de 5 a 7 segundos); NUNCA ultrapasse 9 segundos e, se houver réplica, cada fala tem no máximo 10 palavras e a soma das duas NUNCA passa de 20 palavras. Conte as palavras antes de fechar a cena.
   - QUEM RESPONDE: Se houver diálogo compartilhado na cena, repita a FICHA FÍSICA FIXA COMPLETA do interlocutor da réplica (idade exata, altura, porte, tom/textura de pele, cabelo, ROUPA exata com cores/tecidos, CALÇADOS e ACESSÓRIOS), seu papel dramático na história, sua reação física imediata e sua expressão emocional ao ouvir a fala. (Exemplo: "QUEM RESPONDE: Dona Laura (mãe idosa, 68 anos, 1,60m, obesa, pele clara enrugada, cabelo grisalho preso, vestido floral azul, chinelos e óculos de leitura pendurados em uma corrente, olhar sereno mas magoado)").
   - RESPOSTA: O diálogo REAL da réplica correspondente, também entre aspas e com pontuação final.

================================================================================
REGRA DE OURO DA FALA: CADA FALA NO SEU DONO E NO SEU MOMENTO (INVIOLAVEL)
================================================================================
1. CADA FALA TEM DONO FIXO: o DIÁLOGO REAL pertence UNICAMENTE ao personagem declarado em QUEM FALA; a RESPOSTA pertence UNICAMENTE ao declarado em QUEM RESPONDE.
2. É TERMINANTEMENTE PROIBIDO colocar na boca de um personagem uma fala que é de outro (ex.: o filho falando a fala da mãe), trocar os papéis no meio da cena, ou fazer um personagem responder ANTES de ouvir a fala anterior.
3. UM TURNO POR CENA, NA ORDEM ESCRITA: no máximo QUEM FALA fala uma vez e QUEM RESPONDE responde uma vez, NESTA ordem. Ninguém mais abre a boca na cena. NUNCA antecipe a fala da cena seguinte nem repita a fala da cena anterior.
4. A FALA COMBINA COM O DONO: vocabulário, conteúdo e tom de cada fala refletem a idade, o papel e a personalidade declarados na FICHA FÍSICA do dono (a avó não fala como o neto, o vilão não fala como a vítima).
5. AUTO-VERIFICAÇÃO ANTES DE ENTREGAR CADA CENA: releia a cena e confirme: (a) QUEM FALA é o dono do DIÁLOGO REAL; (b) QUEM RESPONDE é o dono da RESPOSTA; (c) nenhum outro personagem falou. Se não confirmar, reescreva a cena.

2. DESCRIÇÃO RICA E MINUCIOSA DOS PERSONAGENS (SEM DESCRIÇÕES GENÉRICAS OU SUPERFICIAIS):
   Em TODOS os pontos onde os personagens são citados (no Prompt 00, no QUEM FALA/QUEM RESPONDE, em [Subject & Character Consistency] e [Dialogue & Native Audio] de cada cena e nos Character Model Sheets), repita SEMPRE a FICHA FÍSICA FIXA COMPLETA de cada personagem (idêntica, palavra por palavra, do início ao fim), cobrindo OBRIGATORIAMENTE:
   - Nome e idade exata.
   - ALTURA (em centímetros) e PORTE; biótipo e compleição corporal (magro, forte, alto, baixinho, obeso etc.) e postura.
   - TOM DE PELE (claro, moreno, pardo, negro, oliva) e TEXTURA/realismo da pele (${skinDirective}): microporos, dermo-realismo, linhas de expressão naturais, sem filtros plásticos ou aspecto de IA.
   - Estrutura facial completa: formato do rosto, mandíbula, maçãs do rosto, nariz, boca, formato e cor dos olhos, sobrancelhas e expressão marcante.
   - Cabelo: corte exato, comprimento, textura, cor, brilho e caimento dos fios (e barba/bigode, se houver).
   - ROUPAS COMPLETAS E IMUTÁVEIS: cada peça (parte de cima e de baixo), tecidos específicos (linho cru, algodão desgastado, lã, couro envelhecido), cores primárias e secundárias e CALÇADOS.
   - ACESSÓRIOS: óculos, brincos, colares, relógio, anéis/aliança, boné/chapéu, bolsa, cinto, tatuagens, pintas e marcas visuais — todos os itens que diferenciam o personagem.
   - Características suficientemente distintas para que cada personagem tenha identidade cinematográfica única e inconfundível.
   Esta FICHA é um CONTRATO CANÔNICO: NUNCA mude roupa, cor, cabelo, acessórios, altura, idade ou tom de pele de um personagem entre as cenas ou entre as partes da história.
   TRAVA DE IDENTIDADE VISUAL (VERIFICAÇÃO FINAL ANTES DE ENTREGAR): compare a descrição de CADA personagem em CADA cena com a do PROMPT 00. Nome, idade, altura, tom de pele, cabelo, roupa (peças, tecidos e cores), calçados e acessórios DEVEM ser IDÊNTICOS palavra por palavra. Qualquer diferença = reescreva a cena usando a versão do PROMPT 00.

DIRETRIZES DE ENGENHARIA DE PROMPT PARA SEEDANCE 2.5 E GOOGLE FLOW (BYTEDANCE / FLOW INGREDIENTS / CAPCUT):
Você DEVE estruturar todos os prompts visuais de vídeo seguindo rigorosamente a arquitetura do SEEDANCE 2.5 e GOOGLE FLOW (Director's Brief com seções rotuladas em colchetes). O Seedance 2.5 e o Flow geram vídeo fotorrealista 4K, física gravitacional precisa e ÁUDIO NATIVO com sincronismo labial.

REGRA CRUCIAL ANTI-FUNDO BRANCO (SOBREPOSIÇÃO OBRIGATÓRIA DE CENÁRIO REAL):
Muitos criadores utilizam a imagem do Prompt 00 como "Ingrediente de Personagem" (Character Ingredient) no Google Flow ou como Imagem de Referência no Seedance. Como o Prompt 00 possui fundo branco neutro de estúdio, se o prompt de cena não especificar detalhadamente o ambiente e não der ordem expressa de substituição, o motor de vídeo gera a cena dentro de um vazio branco artificial!
Portanto, em CADA CENA você DEVE OBRIGATORIAMENTE incluir:
1. [Environment & Scene Setting]: Uma descrição riquíssima e ultra-detalhada do cenário 3D realista da história (paredes, pisos com texturas táteis, janelas, móveis, iluminação ambiente, profundidade e objetos de cena).
2. [Background Override]: Ordem explícita em inglês para o motor de IA (Google Flow / Seedance) ignorar e descartar 100% o fundo branco da imagem de ingrediente e ancorar os personagens dentro do cenário 3D real com sombras de contato e reflexos no chão.
3. [Negative Prompt]: Termos negativos para banir fundo branco, cyclorama e estúdio vazio.

CADA PROMPT DE CENA DEVE CONTER AS SEGUINTES SEÇÕES ROTULADAS:
1. [Subject & Character Consistency]: REPETIÇÃO OBRIGATÓRIA da descrição visual física detalhada e figurino exato de cada personagem presente na cena, mantendo 100% de consistência com o Prompt 00: Subject 1 - Nome (idade, cabelo, feições, roupas exatas e cores); Subject 2 - Nome (feições e roupas idênticas ao Prompt 00). NUNCA resuma com termos vagos como "mesmo personagem" ou "personagem anterior". A lista DEVE incluir TODOS os personagens que falam E quem responde (o personagem do QUEM RESPONDE também entra como um Subject numerado, com a FICHA FÍSICA FIXA COMPLETA: altura, tom/textura de pele, roupa completa com peças/cores, calçados e acessórios).
2. [Environment & Scene Setting]: Cenário físico 3D completo, imersivo e realista onde a cena ocorre (ex: cozinha rústica com mesa de madeira envelhecida, luz dourada de janela e cortinas ao fundo; OU hospital movimentado; OU rua chuvosa à noite).
3. [Background Override]: Ordem expressa: "CRITICAL: The reference image/ingredient has a white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Place the characters fully grounded inside the detailed 3D environment described in [Environment & Scene Setting], with accurate contact shadows and floor interaction. Zero white studio void."
4. [Action & First-Frame Blocking]: Posição inicial dos personagens (blocking), movimento físico orgânico com causa antes do efeito, postura corporal e respiração.
5. [Optics & Camera Movement]: Movimento único contínuo de câmera para o take de vídeo (ex: 85mm lens, slow push-in, low-angle tracking dolly, steady handheld, profundidade de campo rasa f/1.4).
   - REGRA DE CÂMERA PARA LIP-SYNC: o enquadramento DEVE manter na barra os DOIS personagens da conversa (two-shot médio, 4K, rosto e boca dos dois visíveis). É PROIBIDO "alternating close-ups", cut à outro ângulo ou close-up em um único personagem durante o diálogo, porque isso quebra o sincronismo labial de quem está fora de foco.
   - REGRA DE COERÊNCIA: a ação descrita aqui TEM que combinar com a fala da cena (se dois personagens conversam frente a frente, eles ESTÃO no mesmo ambiente se olhando - nunca um "ao telefone" enquanto fala pessoalmente com o outro).
6. [Dialogue & Native Audio]: Instrução direta e EXPLÍCITA para a IA gerar áudio e sincronismo labial nativo, nomeando CADA falante pela FICHA FÍSICA FIXA COMPLETA (nome, idade, altura, porte, tom/textura de pele, cabelo, roupa com peças/tecidos/cores, calçados e acessórios).
   - Se SOMENTE UM personagem falar na cena (sem QUEM RESPONDE), escreva: Character [Nome] ([FICHA FÍSICA COMPLETA: idade, altura, porte, tom/textura de pele, cabelo, roupa com cores/tecidos, calçados e acessórios]) speaks directly: "[Diálogo real da cena]" with precision lip-sync and [tom e cadência emocional da fala].
   - Se HOUVER QUEM RESPONDE (dois falantes), é OBRIGATÓRIO nomear OS DOIS, na ordem exata da fala, cada um com a FICHA FÍSICA COMPLETA. Exemplo: FIRST Character [Nome A] ([FICHA FÍSICA COMPLETA A]) speaks: "[Diálogo real]" with precision lip-sync and [tom]; THEN Character [Nome B] ([FICHA FÍSICA COMPLETA B]) responds: "[Resposta real]" with precision lip-sync and [tom].
   - A ORDEM NUNCA muda: o personagem de QUEM FALA SEMPRE fala primeiro; o de QUEM RESPONDE SEMPRE responde depois. Esse bloco tem que reproduzir as MESMAS falas escritas em DIÁLOGO REAL e RESPOSTA, palavra por palavra, em ${currentLang.langName}.
   - REGRA DE LÁBIO: apenas o personagem cuja fala está tocando move a boca/sincroniza os lábios; o outro permanece CALADO, apenas ouvindo e reagindo com expressão. NUNCA deixe o personagem errado mexendo a boca, e nunca sobreponha as vozes. O personagem que responde no QUEM RESPONDE/RESPOSTA DEVE ter a própria fala e o próprio movimento labial identificados aqui.
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

Em seguida, inicie as cenas de vídeo sequenciais no padrão Seedance 2.5 e Google Flow.
(A CENA 1 contém o gancho explosivo, mas o CABEÇALHO e o formato dela são EXATAMENTE IGUAIS aos de todas as outras cenas.)

PROMPT CENA 1 (SEEDANCE 2.5):
QUEM FALA: [Nome + FICHA FÍSICA FIXA COMPLETA (idade exata, altura, porte/biotipo, tom/textura de pele, cabelo/barba, ROUPA exata com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS) + papel dramático detalhado, expressão facial rica, postura corporal e estado emocional minucioso de quem vai falar]
TOM E INTENÇÃO DA FALA: [Tom vocal, cadência, ritmo e respiração exata no idioma ${currentLang.langName}]
DIÁLOGO REAL: "[Diálogo real que o personagem fala na cena OBRIGATORIAMENTE NO IDIOMA ${currentLang.langName.toUpperCase()} entre aspas com pontuação final - NUNCA use diálogo sugerido, coloque apenas o diálogo real]"
QUEM RESPONDE: [Nome + FICHA FÍSICA FIXA COMPLETA (idade exata, altura, porte/biotipo, tom/textura de pele, cabelo/barba, ROUPA exata com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS) + papel dramático, reação física imediata e estado emocional do interlocutor que responde]
RESPOSTA: "[Diálogo real da réplica OBRIGATORIAMENTE NO IDIOMA ${currentLang.langName.toUpperCase()} entre aspas com pontuação final]"
INSTRUÇÕES VISUAIS (PROMPT SEEDANCE 2.5 & GOOGLE FLOW):
[Subject & Character Consistency]: [REPETIÇÃO OBRIGATÓRIA da FICHA FÍSICA FIXA COMPLETA de TODOS os personagens da cena, INCLUINDO quem fala E quem responde: Subject N - Nome (idade exata, ALTURA em cm, porte/biotipo, tom e textura de pele com ${skinDirective}, formato do rosto, cor dos olhos, cabelo/barba, ROUPA completo com peças/tecidos/cores, CALÇADOS e ACESSÓRIOS exatos estabelecidos no Prompt 00). NUNCA resuma e NUNCA use "mesmo personagem" ou "personagem anterior": repita a ficha por extenso para cada um.]
[Environment & Scene Setting]: [DESCRIÇÃO COMPLETA DO CENÁRIO 3D REAL DA CENA: tipo e acabamento do piso, paredes, janelas, móveis de fundo, iluminação do ambiente e profundidade do cômodo, repetindo os elementos arquitetônicos fixos]
[Background Override]: CRITICAL FOR FLOW INGREDIENTS & SEEDANCE: The character reference image/ingredient has a plain white studio background. COMPLETELY DISCARD AND OVERRIDE THE WHITE BACKGROUND. Ground the characters naturally inside the detailed 3D environment described above with contact shadows and environmental ambient lighting. DO NOT render an empty white studio void or blank cyclorama.
[Action & First-Frame Blocking]: [Ação detalhada com causa e efeito, gestos físicos e respiração - os dois personagens da conversa ESTÃO juntos no mesmo ambiente, se olhando; a ação NUNCA contradiz o diálogo (nada de "ao telefone" numa conversa frente a frente)]
[Optics & Camera Movement]: [Two-shot médio contínuo mantendo NA FOTO o rosto e a boca dos DOIS personagens da conversa (lente 50-85mm, f/1.8, slow push-in suave) - PROIBIDO alternating close-ups, corte ou close num único personagem durante o diálogo, para preservar o lip-sync dos dois]
[Dialogue & Native Audio]: [OBRIGATÓRIO nomear CADA falante com a FICHA FÍSICA FIXA COMPLETA (nome, idade, altura, porte, tom/textura de pele, cabelo, roupa com peças/tecidos/cores, calçados e acessórios). Se houver QUEM RESPONDE, nomeie OS DOIS na ordem exata: FIRST Character [Nome A] ([FICHA FÍSICA COMPLETA A]) speaks: "[Diálogo real]" with precision lip-sync and [tom]; THEN Character [Nome B] ([FICHA FÍSICA COMPLETA B]) responds: "[Resposta real]" with precision lip-sync and [tom]. A ORDEM NUNCA INVERTE: o de QUEM FALA fala primeiro. Apenas quem está falando move a boca; o outro permanece calado e reagindo. Nunca sobreponha as vozes. IMPORTANT: keep BOTH characters' faces and mouths in frame during the entire exchange (two-shot); the video engines animate the mouth of whoever's words are playing.]
[Lighting & Atmosphere]: [Motivação e fontes de iluminação volumétrica coerentes com o cenário]
[Audio & Ambience (SFX)]: [Foley e efeitos de som ambiente sincronizados com o local]
[Global Style & Physical Realism]: [Cinematografia 4K fotorrealista, ${skinDirective}, física real, 24fps]
[Negative Prompt]: white background, blank white void, studio cyclorama, plain backdrop, floating characters, artificial studio setup, empty white space

PROMPT CENA 2 (SEEDANCE 2.5):
... até PROMPT CENA ${numScenes} (SEEDANCE 2.5):
(OBRIGATORIO para CADA cena, SEM OMITIR NENHUMA SECAO: QUEM FALA, TOM E INTENCAO DA FALA, DIALOGO REAL, QUEM RESPONDE, RESPOSTA e INSTRUCOES VISUAIS contendo TODAS as secoes entre colchetes: [Subject & Character Consistency], [Environment & Scene Setting], [Background Override], [Action & First-Frame Blocking], [Optics & Camera Movement], [Dialogue & Native Audio], [Lighting & Atmosphere], [Audio & Ambience (SFX)], [Global Style & Physical Realism] e [Negative Prompt]. NUNCA encurte, resuma ou pule essas secoes: cada cena tem que sair COMPLETA, com o mesmo nivel de detalhe da CENA 1.)

================================================================================
REGRA DE PADRAO UNICO (INVIOLAVEL - TODAS AS CENAS IDENTICAS EM FORMATO)
================================================================================
- TODAS as ${numScenes} cenas usam EXATAMENTE o mesmo cabeçalho: "PROMPT CENA N (SEEDANCE 2.5):".
- TODAS as cenas usam EXATAMENTE os mesmos rótulos, na MESMA ordem: QUEM FALA, TOM E INTENÇÃO DA FALA, DIÁLOGO REAL, QUEM RESPONDE, RESPOSTA, INSTRUÇÕES VISUAIS (PROMPT SEEDANCE 2.5 & GOOGLE FLOW) com as 10 seções entre colchetes.
- A UNICA coisa que muda de uma cena para a outra é o NÚMERO da cena e o CONTEÚDO (ação, fala, cenário daquele momento). O formato, os rótulos e a ordem são IDENTICOS em todas.
- É TERMINANTEMENTE PROIBIDO: renomear um rótulo, pular uma seção, trocar a ordem das seções, usar "..." ou "mesmo de antes" para economizar, ou entregar uma cena mais curta que as outras.

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

    const countScenes = (value: string) => (value.match(/PROMPT\s+(?:GANCHO\s+CHAMATIVO\s+)?CENA\s+\d+/gi) || []).length;
    const countDetailed = (value: string) => (value.match(/\[Negative Prompt\]/gi) || []).length;
    const countSubject = (value: string) => (value.match(/\[Subject & Character Consistency\]/gi) || []).length;
    const countDialogue = (value: string) => (value.match(/\[Dialogue & Native Audio\]/gi) || []).length;

    let generatedText = (await generateWithModelFallback(promptInstructions, req.geminiApiKey)).text || '';

    if (!generatedText) {
      throw new Error('Nenhum texto foi gerado pelo modelo.');
    }

    const isComplete =
      countScenes(generatedText) >= numScenes &&
      countDetailed(generatedText) >= numScenes &&
      countSubject(generatedText) >= numScenes &&
      countDialogue(generatedText) >= numScenes;

    if (!isComplete) {
      const retryPrompt = `${promptInstructions}

=======================================================================
CORRECAO OBRIGATORIA
=======================================================================
A resposta anterior veio incompleta ou com cenas faltando secao. Gere a historia COMPLETA novamente com:
- EXATAMENTE ${numScenes} cenas, numeradas de "PROMPT CENA 1" ate "PROMPT CENA ${numScenes}", SEM PULAR numeros e SEM cabeçalhos diferentes (nada de "GANCHO CHAMATIVO CENA 1": use "PROMPT CENA 1 (SEEDANCE 2.5)" igual as demais);
- TODAS as secoes de INSTRUCOES VISUAIS em CADA cena ([Subject & Character Consistency], [Environment & Scene Setting], [Background Override], [Action & First-Frame Blocking], [Optics & Camera Movement], [Dialogue & Native Audio], [Lighting & Atmosphere], [Audio & Ambience (SFX)], [Global Style & Physical Realism], [Negative Prompt]).`;

      const retry = await generateWithModelFallback(retryPrompt, req.geminiApiKey);
      if (
        retry.text &&
        countScenes(retry.text) >= countScenes(generatedText) &&
        countDetailed(retry.text) >= countDetailed(generatedText) &&
        countSubject(retry.text) >= countSubject(generatedText) &&
        countDialogue(retry.text) >= countDialogue(generatedText)
      ) {
        generatedText = retry.text;
      }
    }

    // Normaliza cabeçalhos para um unico padrão e renumera as cenas em sequencia.
    let sceneOrder = 0;
    const normalizedText = generatedText
      .replace(/(PROMPT\s+)GANCHO\s+CHAMATIVO\s+(CENA\s+\d+)/gi, '$1$2')
      .replace(/(PROMPT\s+CENA\s+\d+)(?!\s*\(SEEDANCE)/gi, '$1 (SEEDANCE 2.5)')
      .replace(/(PROMPT\s+CENA\s+)\d+/gi, (_match, prefix) => `${prefix}${++sceneOrder}`);

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
        ? `IMPORTANTE PARA O TEMA FRUTAS: Todos os personagens DEVEM ser FRUTAS HUMANIZADAS / ANTROPOMÓRFICAS (ex: Moranguinha a protagonista romântica com vestido rosa e sementes douradas, Bananão o playboy de terno, Uva Vitória a vilã invejosa de vestido de gala, Maçãzinho o jovem herdeiro, Cereza sedutora, etc.). Crie dilemas novelescos de traição, ciúmes, vingança, romance proibido e superação no mundo das frutas em animação 3D.`
        : '';

    const antiClicheIdeasGuidance =
      theme === 'Gordos'
        ? `
IMPORTANTE — COTIDIANO BRASILEIRO REAL (obrigatório para o tema GORDOS):
- Toda ideia deve nascer de uma situação REAL, reconhecível e do dia a dia do povo brasileiro: periferia, interior, feira, fila do posto de saúde, ônibus lotado, igreja, boteco, salão, grupo da família no WhatsApp, dívida no cartão, bico, programa social, golpe na internet, rede social, briga por dinheiro.
- O contexto social/econômico é o MOTOR da trama. O peso extremo é só a aparência de todos os personagens.
- Humor honesto, crítica leve e emoção verdadeira — NUNCA piada humilhante nem deboche.
- Use detalles concretos e únicos de cada ideia (um objeto, um lugar, uma dívida, uma decisão). Proibido ideias genéricas ou abstratas.
- Exemplos do TIPO de premissa (varie, não repita): família que teve 10 filhos pra ganhar mais Bolsa Família e colapsa quando o benefício é cortado; pobre que mora numa casa caindo aos pedaços e finge ser rico na internet até a farsa ser exposta ao vivo; vizinho do golpe do Pix; tia que vende bolo no sinal; tio das pirâmides; "influencer" de fachada; mãe que faz bico de tudo; fila do INSS; delivery que não paga; agiota do bairro; churrasco que vira briga de família; a loteria que promete tudo.
`
        : '';

    const prompt = `
Você é o principal criador e roteirista de novelinhas curtas ultra-virais para redes sociais (TikTok, Kwai, Reels, YouTube Shorts).
Gere exatamente ${count} ideias curtas, inéditas, dramáticas, viciantes e com ganchos emocionais fortes para o tema '${theme}' ambientado em '${country}'.
${extraThemeGuidance}${antiClicheIdeasGuidance}
REGRA ANTI-CLICHÊ (obrigatória): NUNCA use tramas batidas/genéricas (marido traindo com a empregada, madrasta malvada, herança disputada, "segredo do passado" vazio, vingança de ex, vilão genérico). Cada ideia parte de um PROBLEMA CONCRETO e específico, não de um conflito abstrato.
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
        `Uma família grande que teve 10 filhos para receber mais Bolsa Família entra em colapso quando o benefício é cortado de surpresa.`,
        `Um homem pobre que mora numa casa caindo aos pedaços mantém as redes sociais cheias de vida de luxo até a farsa ser exposta ao vivo.`,
        `Uma mulher que faz bico de tudo descobre que o vizinho do "golpe do Pix" aplicou o golpe nela e no grupo da família.`,
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
