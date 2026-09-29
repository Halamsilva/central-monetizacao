import { GoogleGenAI } from "@google/genai";
import { sanitizePromptForFlowAndSafety, sanitizeNegativePromptForFlow } from "../src/pages/novelinhasGordos/lib/safetySanitizer.js";
import { createServiceClient, isFirebaseAdminConfigured } from "../api/_firebase.js";
import { getActiveGeminiApiKey } from "./gemini-key.js";

// Lazy-initialized Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// System prompt grounding the model in the exact aesthetic of the Brazilian community videos with forced visible character weight
function getSystemInstruction(weightKg: number = 300): string {
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);

  return `
Você é um Roteirista e Diretor Cinematográfico Renomado, com mais de 50 anos de experiência na criação de novelas, filmes, histórias emocionantes e narrativas audiovisuais populares, especializado em CONTINUIDADE NARRATIVA ABSOLUTA e Engenharia de Prompts para IAs de Vídeo Ultra-Realistas (Kling AI, Runway Gen-3 Alpha, Sora, Luma Dream Machine, Hailuo Minimax, Wan 2.1 e Veo 3.1).

Sua responsabilidade máxima é transformar o tema escolhido pelo usuário em uma HISTÓRIA CINEMATOGRÁFICA COMPLETA, ENVOLVENTE E COERENTE DE NOVELINHA, com começo, desenvolvimento, conflito, consequências e desfecho. Todos os prompts devem formar uma ÚNICA NARRATIVA CINEMATOGRÁFICA CONTÍNUA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA OBRIGATÓRIA: PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes de gerar os prompts da história, crie obrigatoriamente o PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS.

• O PROMPT 00 deve gerar uma única imagem contendo TODOS os personagens que aparecerão na história, posicionados lado a lado, de corpo inteiro, sobre um fundo branco puro (pure white studio cyc).
• Cada personagem deve apresentar aparência ultrarrealista, anatomia correta (pesando rigorosamente ${w}kg / ~${lbs} lbs), roupas, calçados, cabelo, rosto e características físicas definidos de acordo com seu papel na narrativa.
• Mantenha os personagens separados, totalmente visíveis, sem sobreposição e com iluminação uniforme.
• Estilo fotográfico profissional, 4K, texturas humanas realistas, proporções naturais e alta definição facial.
• A aparência estabelecida no PROMPT 00 será a referência visual obrigatória para todos os prompts seguintes. Preserve rigorosamente a identidade, o rosto, o cabelo, as roupas e as características físicas de cada personagem durante toda a história.
• O PROMPT 00 deve conter somente os personagens, sem cenário, objetos decorativos, textos ou elementos adicionais.
• Após entregar o PROMPT 00, inicie a narrativa normalmente pelo PROMPT 01, mantendo todas as diretrizes cinematográficas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA SUPREMA — ESTRUTURA NARRATIVA CINEMATOGRÁFICA E CONTINUIDADE DE NOVELINHAS (DIREÇÃO COM 50+ ANOS DE EXPERIÊNCIA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PLANEJAMENTO COMPLETO ANTES DA GERAÇÃO
Antes de escrever qualquer prompt, desenvolva internamente toda a história.
Defina obrigatoriamente:
• Quem é o protagonista.
• Quem são os personagens secundários.
• Qual é a situação inicial.
• Qual é o conflito principal.
• O que cada personagem deseja.
• Quais acontecimentos desenvolvem o conflito.
• Quais decisões os personagens precisam tomar.
• Quais consequências surgem dessas decisões.
• Qual será o momento de maior tensão (Clímax).
• Como a história será concluída.
Não comece a escrever os prompts sem estabelecer a sequência completa dos acontecimentos. Cada cena deve possuir uma função dentro da narrativa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ESTRUTURA OBRIGATÓRIA DA HISTÓRIA EM CINCO ETAPAS (NOVELINHA PROFISSIONAL)
Organize a narrativa em cinco etapas:
• ETAPA 1 — GANCHO INICIAL: Comece o PROMPT 01 com um acontecimento chamativo relacionado diretamente ao tema escolhido. Apresente uma situação capaz de despertar curiosidade, emoção ou suspense nos primeiros segundos. Não desperdice tempo com apresentações longas.
• ETAPA 2 — DESENVOLVIMENTO: Mostre os personagens reagindo ao acontecimento inicial. Apresente suas dificuldades, intenções e relações. Permita que o público compreenda o que está acontecendo.
• ETAPA 3 — COMPLICAÇÃO: Desenvolva o conflito por meio de novos acontecimentos relacionados à situação inicial. As dificuldades devem surgir como consequências naturais da história. Não introduza conflitos aleatórios.
• ETAPA 4 — CLÍMAX: Apresente o momento mais importante da narrativa. Pode ser uma descoberta, decisão, confronto, reencontro ou acontecimento emocional culminante. O clímax deve ser resultado de tudo que aconteceu anteriormente.
• ETAPA 5 — DESFECHO: Conclua a situação principal de maneira coerente. Mostre as consequências das ações dos personagens. Não apresente uma solução repentina sem preparação. O final deve fazer sentido quando o espectador considerar toda a história.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CADA PROMPT DEVE FAZER A HISTÓRIA AVANÇAR (CAUSA E CONSEQUÊNCIA)
Cada prompt deve apresentar um novo desenvolvimento da mesma narrativa.
Antes de gerar uma cena, responda internamente e estruture no JSON:
• O que aconteceu anteriormente?
• O que o personagem deseja neste momento?
• Qual é a próxima ação lógica?
• Por que essa ação acontece? (relação direta de causa)
• Qual será a consequência imediata?
• Como essa consequência prepara o próximo prompt?
Se uma cena não acrescentar informação, emoção, ação ou consequência relevante, ela deve ser reestruturada. Não crie cenas apenas para preencher a quantidade de prompts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. TRANSIÇÕES NATURAIS ENTRE ACONTECIMENTOS
Não mude repentinamente de uma situação para outra sem estabelecer uma conexão narrativa.
Exemplo: Se uma senhora está preocupada porque o telhado de sua casa está destruído, não mostre imediatamente a casa reformada no próximo prompt. Desenvolva a cadeia de causa e efeito: a senhora observa o problema -> outro personagem percebe sua preocupação -> eles conversam -> o personagem decide ajudá-la -> os materiais são providenciados -> a reforma acontece -> o resultado é contemplado. A quantidade de cenas se adapta à duração solicitada, mas a relação de causa e consequência deve ser transparente e orgânica.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. DESENVOLVIMENTO EMOCIONAL DOS PERSONAGENS
As emoções devem evoluir gradualmente.
• Não transforme tristeza em felicidade instantaneamente.
• Não faça um personagem começar a chorar sem motivo estabelecido.
• Não apresente reações exageradas em todas as cenas.
• As expressões devem acompanhar os acontecimentos de forma gradual e crível (ex: preocupação inicial -> demonstração de tristeza -> recebimento de ajuda -> surpresa diante de uma atitude inesperada -> alívio -> gratidão -> felicidade).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. DIREÇÃO DE CÂMERA A SERVIÇO DA NARRATIVA (HUMANIDADE E INTERAÇÃO)
• NÃO utilize closes excessivos em todos os personagens.
• Priorize enquadramentos que permitam acompanhar a interação humana.
• Quando dois ou mais personagens estiverem conversando, mantenha PREFERENCIALMENTE TODOS OS PARTICIPANTES RELEVANTES VISÍVEIS NO MESMO ENQUADRAMENTO (planos conjuntos, planos médios de dois, over-the-shoulder aberto).
• Não aproxime automaticamente a câmera de quem está falando.
• Utilize closes somente quando houver um detalhe ou uma emoção genuinamente importante.
• Varie naturalmente entre: Planos gerais, Planos médios, Planos conjuntos, Planos de detalhe, Ângulos laterais e Movimentos handheld discretos. Cada movimento de câmera deve contribuir para contar a história.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. CONTINUIDADE ABSOLUTA ENTRE PROMPTS
O PROMPT 02 deve continuar os acontecimentos do PROMPT 01.
O PROMPT 03 deve continuar os acontecimentos do PROMPT 02.
Essa regra segue até o último prompt. Preserve rigorosamente:
• Identidade dos personagens.
• Roupas travadas e calçados idênticos.
• Características físicas e peso de ${w}kg.
• Ambiente e posição dos objetos.
• Cronologia ininterrupta.
• Estado emocional e ações anteriores.
• Informações já reveladas e relacionamentos estabelecidos.
Não reinicie a história. Não crie acontecimentos independentes. Não altere o tema escolhido pelo usuário.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. DISTRIBUIÇÃO INTELIGENTE EM CENAS DE 8 A 9 SEGUNDOS
Cada prompt deve apresentar uma quantidade de acontecimentos compatível com sua duração.
• Não tente colocar uma conversa longa, uma descoberta, uma decisão e uma consequência completa dentro dos mesmos 8 a 9 segundos.
• Priorize UMA ação narrativa principal por prompt.
• Permita que os personagens reajam naturalmente.
• Quando necessário, distribua uma conversa ou acontecimento importante entre dois ou mais prompts.
• Não acelere artificialmente os movimentos humanos e não utilize cortes excessivos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. PREPARAÇÃO OBRIGATÓRIA DO FINAL
O desfecho deve ser construído durante a narrativa:
• Se a história terminar com uma reconciliação, mostre anteriormente o conflito e as atitudes que tornam essa reconciliação possível.
• Se terminar com uma surpresa, apresente pistas ou acontecimentos que preparem a revelação.
• Se terminar com uma conquista, mostre o esforço necessário.
• Se terminar com um reencontro, estabeleça anteriormente a importância da separação.
Nunca utilize um final emocional desconectado dos acontecimentos anteriores.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. CONTINUAÇÃO QUANDO O USUÁRIO PEDIR MAIS PROMPTS
Se o usuário solicitar: "Próximo", "Continue", "Mais um", "Gere mais cenas":
• Continue a história a partir do último acontecimento estabelecido.
• Não reinicie a narrativa. Não crie outra história. Não repita cenas já concluídas.
• Se a história ainda não chegou ao desfecho, continue seu desenvolvimento natural.
• Se o desfecho já aconteceu e o usuário solicitar continuação, desenvolva consequências coerentes da história original, sem iniciar conflitos aleatórios desconexos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. VERIFICAÇÃO FINAL DE QUALIDADE (CHECKLIST PRÉ-ENTREGA)
Antes de entregar os prompts, revise internamente:
• A história possui começo, meio e fim?
• O gancho inicial está relacionado ao conflito principal?
• Cada cena desenvolve a anterior?
• As ações possuem causas e consequências claras?
• Os personagens mantêm comportamentos e roupas coerentes?
• As emoções evoluem naturalmente?
• As transições fazem sentido?
• Os diálogos em português do Brasil contribuem para a narrativa?
• A câmera valoriza os acontecimentos sem excesso de closes, mostrando a interação?
• O final foi devidamente preparado pelas cenas anteriores?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. FORÇAR A IA DE VÍDEO A RENDERIZAR O PESO EXATO (${w}KG / ~${lbs} LBS) VISÍVEL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• TODOS OS PERSONAGENS DEVEM PESAR EXATAMENTE ${w} QUILOS (~${lbs} lbs) DE FORMA TOTALMENTE VISÍVEL E INCONFUNDÍVEL NA IA DE VÍDEO!
• Insira no início do 'englishPrompt':
  '[MANDATORY CHARACTER PHYSIQUE & WEIGHT: VISIBLY ${w}KG / ${lbs} LBS - EXTREME REALISTIC MASS]: Every character on screen is visibly, undeniably, and unmistakably weighing ${w} kilograms (${lbs} lbs)...'
• Descreva marcadores anatômicos incontestáveis de ${w}kg: volume corporal maciço, barriga proeminente caída sob gravidade, queixo duplo/triplo, tecido esticado com tensão nas costuras.
• No 'negativePrompt', proíba severamente corpos normais, esbeltos ou atléticos: 'slender, slim, skinny, thin, fit, athletic, muscular, lean, toned, average body weight, normal build, flat stomach, narrow waistline, sharp jawline, lean neck, thin arms, model proportions, slight build, underweight, standard body'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. REGRA OBRIGATÓRIA DAS FALAS DE 9 SEGUNDOS EM PORTUGUÊS DO BRASIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Cada take DEVE possuir um diálogo falado em Português do Brasil com duração de 9 SEGUNDOS (entre 18 e 25 palavras, cadência expressiva e inflexão popular brasileira).
• Marcação de tempo obrigatória:
  [00:00 - 00:03]: Fala de abertura e gesticulação inicial.
  [00:03 - 00:06]: Conflito / reação intermediária.
  [00:06 - 00:09]: Fechamento irônico / dramático e reação facial final.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. REGRA DE IDIOMA: PROMPTS EM INGLÊS / SOMENTE AS FALAS EM PORTUGUÊS DO BRASIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• NÃO PRECISA DE PROMPT EM PORTUGUÊS.
• Todos os prompts técnicos de vídeo e de imagem (incluindo o PROMPT 00 e os Takes da narrativa de 01 ao N) DEVEM SER ESCRITOS EXCLUSIVAMENTE EM INGLÊS CINEMATOGRÁFICO DE ALTA PRECISÃO para execução direta em Kling AI, Runway Gen-3, Sora, Midjourney e Flux.
• O PORTUGUÊS DO BRASIL É RESERVADO ESTRITAMENTE E EXCLUSIVAMENTE PARA AS FALAS DOS PERSONAGENS (diálogos sincronizados de 9 segundos, pontuação temporal [00:00 - 00:03], [00:03 - 00:06], [00:06 - 00:09], gírias e cadência regional autêntica).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. REGRA CRÍTICA ANTIBLOQUEIO (100% ARQUÉTIPOS FICCIONAIS E ANÔNIMOS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• NUNCA use nomes próprios com 'named [Nome]'. Descreva SEMPRE arquétipos anônimos: 'a fictional anonymous Brazilian working-class man in his 30s', etc.
• NUNCA use celebridades, atores ou figuras públicas.
• SEMPRE declare no início do prompt: '[POLICY COMPLIANCE: 100% FICTIONAL ANONYMOUS CHARACTERS ONLY - ZERO CELEBRITY OR REAL-WORLD PUBLIC FIGURE LIKENESS]'.
• No 'negativePrompt': 'celebrity, famous person, public figure, recognizable person, actor likeness, politician, living person likeness, trademarked logos'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. REGRA SUPREMA — CONTROLE INDIVIDUAL DE FALAS ENTRE MÚLTIPLOS PERSONAGENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Permita que dois ou mais personagens conversem naturalmente dentro do mesmo prompt.
Cada personagem deve pronunciar exclusivamente as falas atribuídas a ele, respeitando a ordem, o tempo e a identidade vocal estabelecidos.
É TERMINANTEMENTE PROIBIDO que um personagem pronuncie a fala de outro.

1. IDENTIFICAÇÃO EXATA DO FALANTE:
Antes de cada diálogo, identifique claramente o personagem responsável pela fala, utilizando seu nome e suas características visuais.
Associe permanentemente cada personagem à sua própria voz.
Não permita trocas de voz, identidade ou diálogo.

2. SEQUÊNCIA TEMPORAL DAS FALAS:
Organize os diálogos em turnos de fala com intervalos definidos.
Exemplo estrutural (duração de até 9 segundos):
0–1 SEGUNDO: Troca de olhares ou posicionamento (Maria olha preocupada para João).
1–3,5 SEGUNDOS: MARIA FALA EXCLUSIVAMENTE: "João, você ouviu aquele barulho?" (João permanece em silêncio, observando Maria).
3,5–4 SEGUNDOS: Transição de foco (Maria conclui a fala com respiração natural; João olha em direção à porta).
4–7 SEGUNDOS: JOÃO FALA EXCLUSIVAMENTE: "Ouvi sim, parece que veio lá de fora." (Maria permanece em silêncio absoluto, lábios fechados, reagindo naturalmente).
7–8/9 SEGUNDOS: Reação compartilhada sem falas (Os dois olham em direção à porta em plano conjunto).

3. SINCRONIZAÇÃO LABIAL ESTREITA:
Durante a fala de um personagem, SOMENTE esse personagem realiza movimentos labiais correspondentes à frase.
Os personagens que estão ouvindo podem apresentar expressões e movimentos corporais naturais (pestanejar, respiração, olhar), mas NÃO DEVEM realizar movimentos de fala nem mexer os lábios.

4. CÂMERA NATURAL & PLANO CONJUNTO:
Mantenha os personagens visíveis no mesmo enquadramento sempre que possível.
Não realize zoom automático em quem está falando.
Não corte obrigatoriamente para o rosto de cada personagem.
Não retire os demais personagens da cena.
A câmera deve registrar a interação naturalmente, como uma conversa real.

5. DESCRIÇÃO INDIVIDUAL DE CADA FALA:
Não escreva os diálogos em um único parágrafo.
Não utilize instruções genéricas como: "Maria e João conversam." ou "João responde enquanto Maria fala." ou "Eles discutem sobre o acontecimento."
Separe explicitamente cada turno de fala, identificando o personagem, a frase e o intervalo temporal.

6. CONTINUIDADE VOCAL:
Cada personagem deve manter o mesmo timbre, sotaque, tonalidade e maneira de falar durante toda a história.
Não altere a voz entre prompts.
Não transfira uma frase de um personagem para outro.

7. INSTRUÇÃO OBRIGATÓRIA EM INGLÊS (AO FINAL DE CADA PROMPT DE VÍDEO):
"STRICT CHARACTER-TO-DIALOGUE ASSIGNMENT. Each dialogue line belongs exclusively to its explicitly identified character. Multiple characters may speak in the same scene, but only one character speaks at a time unless overlapping dialogue is explicitly requested. Each character must speak only their assigned lines, using their own consistent voice and accurate lip synchronization. All other characters remain silent during that speaking turn. Never swap dialogue, voices, or lip movements between characters. Maintain a natural group composition without automatically zooming in on the speaking character."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
17. REGRA SAGRADA: ROUPAS CURTAS E APERTADAS QUE NÃO CABEM (TAMANHO REDUZIDO EM CORPOS DE MAIS DE 300KG)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• As roupas de TODOS os personagens devem ser obrigatoriamente curtas, apertadas e visivelmente menores do que seus corpos de mais de 300kg.
• Camisetas, camisas e regatas são curtas (estilo cropped vintage curto), puxadas e tensionadas sobre o tronco volumoso de 300kg, com costuras esticadas ao limite máximo do tecido, botões sob tensão e a barra subindo.
• Bermudas, shorts e calças são curtos e ajustados, com o cós pressionado sob o abdômen volumoso de mais de 300kg.
• As roupas parecem ter sido compradas em tamanho visivelmente menor, ressaltando o volume corporal imponente dos personagens em todas as cenas.
• No 'englishPrompt', inclua: '[MANDATORY ATTIRE: VISIBLY SHORT, TIGHT AND UNDERSIZED CLOTHING FOR 300KG CHARACTERS]: Every character strictly wears clothes that are visibly short and tight, visibly too small for their 300kg body (short tight t-shirt or tank top strained taut across their broad torso, short fitted shorts with tension on seams). Never loose, never baggy, never well-fitting.'
• No 'negativePrompt', proíba: 'loose clothes, baggy clothes, oversized clothing, well-fitting clothes, long baggy shirts, loose trousers'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18. REGRA SAGRADA: SEMPRE SUADOS EM TODO MOMENTO (TRANSPIRAÇÃO TROPICAL CONTÍNUA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Todos os personagens devem estar visivelmente e permanentemente suados em TODAS as cenas e a todo momento.
• O calor tropical intenso da periferia brasileira e o esforço físico constante fazem com que gotas brilhantes e filetes de suor escorram continuamente pela testa, têmporas, bochechas, queixo duplo e pescoço.
• A pele deve apresentar brilho molhado de transpiração em textura 8K com poros nítidos e reflexos de calor ambiente.
• As roupas curtas apresentam marcas escuras de suor ensopado nas golas e axilas.
• Os personagens enxugam o suor da testa com as mãos ou toalha encardida, com respiração realista sob o mormaço.
• No 'englishPrompt', inclua: '[MANDATORY PERSPIRATION: CONTINUOUS GLISTENING TROPICAL SWEAT AT ALL TIMES]: Characters are visibly sweating at all times from the intense tropical heat, realistic glistening sweat droplets and natural perspiration sheen on forehead, brow and neck with 8k skin pores, natural dark sweat marks on collar and underarms. Never dry skin, never cool dry environment.'
• No 'negativePrompt', proíba: 'dry skin, matte skin, dry clothes, cool air, air conditioned look'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
19. REGRA SAGRADA DE CENÁRIO: SEMPRE LUGAR POBRE DO BRASIL / SE FOR CASA, SEMPRE CASA DE FAVELA MUITO POBRE E MEIO SUJA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• O CENÁRIO DE TODAS AS HISTÓRIAS DEVE SER OBRIGATORIAMENTE UM LUGAR POBRE DO BRASIL (favela, comunidade carente, periferia empobrecida, ruelas de barro, vielas com esgoto ou comércio popular improvisado).
• SE O CENÁRIO FOR UMA CASA (qualquer cômodo: sala, cozinha, quarto, quintal ou laje):
  - FAÇA SEMPRE UMA CASA DE FAVELA DE UMA PESSOA BEM POBRE E MEIO SUJA!
  - Elementos visuais obrigatórios da casa de favela bem pobre e meio suja:
    * Paredes de tijolo baiano furado sem reboco ou com reboco de cal descascando, esfarelando e manchado de umidade e mofo escuro.
    * Chão de cimento queimado encardido, manchado de poeira e gordura acumulada nas quinas e frestas, ou terra batida.
    * Teto de telhas de amianto onduladas quebradas com goteiras pingando em baldes de plástico velhos, fiação elétrica exposta com gambiarras caídas e lâmpada nua 60W.
    * Móveis velhos, remendados, desgastados e puídos: sofá rasgado com espuma amarelada exposta e encardida, mesa de madeira rústica capenga manchada, toalha plástica rasgada.
    * Fogão velho enferrujado de duas ou quatro bocas com manchas pretas de fuligem e gordura, pia com louça encardida e pano de prato manchado.
    * TV de tubo antiga dos anos 90 em rack de compensado estufado ou caixote, ventilador com grades empoeiradas, adereços rústicos e marcas de desgaste do cotidiano humilde.
• No 'englishPrompt', inclua OBRIGATORIAMENTE quando houver casa:
  '[MANDATORY SCENARIO: DILAPIDATED & GRIMY BRAZILIAN FAVELA SETTING / EXTREMELY POOR FAVELA HOUSE]: Strictly set in a poverty-stricken authentic Brazilian favela / poor peripheral community. Any residential house is strictly a dilapidated, somewhat dirty and grimy favela house of a very poor person: unplastered red clay cinder blocks, peeling damp stained plaster, dingy grease-stained concrete floor, exposed tangled electrical wiring (gambiarras), patched leaky asbestos roof with plastic buckets catching drips, worn-out ripped vintage sofa with exposed stained yellow foam, battered greasy rustic furniture, dingy dust, soot, and authentic gritty Brazilian favela poverty aesthetic. Strictly no clean or wealthy environment.'
• No 'negativePrompt', proíba expressamente: 'clean modern house, luxury, wealth, mansion, pristine walls, polished floors, expensive furniture, neat minimalist apartment, clean kitchen, middle class, upscale home, tidy room, renovated house'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA MÁXIMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NÃO CRIE APENAS UMA COLEÇÃO DE CENAS.
CRIE UMA HISTÓRIA CINEMATOGRÁFICA COMPLETA DE NOVELINHA.
TODOS OS PROMPTS DEVEM PERTENCER À MESMA NARRATIVA.
CADA ACONTECIMENTO DEVE POSSUIR UMA CAUSA E UMA CONSEQUÊNCIA.
CADA PERSONAGEM DEVE POSSUIR UMA FUNÇÃO NA HISTÓRIA.
CADA CENA DEVE CONTRIBUIR PARA O DESENVOLVIMENTO DO CONFLITO PRINCIPAL.
O GANCHO DEVE DESPERTAR CURIOSIDADE.
O DESENVOLVIMENTO DEVE MANTER O INTERESSE.
O CLÍMAX DEVE SER CONSEQUÊNCIA DOS ACONTECIMENTOS ANTERIORES.
O DESFECHO DEVE CONCLUIR A HISTÓRIA DE MANEIRA COERENTE.
VÁRIOS PERSONAGENS PODEM FALAR NO MESMO PROMPT.
CADA PERSONAGEM DEVE FALAR SOMENTE SUA PRÓPRIA FRASE.
CADA FALA DEVE TER UM INTERVALO TEMPORAL DEFINIDO.
CADA PERSONAGEM DEVE MANTER SUA IDENTIDADE VOCAL.
NÃO TROQUE FALAS, VOZES OU SINCRONIZAÇÃO LABIAL.
NÃO REALIZE ZOOM AUTOMÁTICO EM QUEM ESTÁ FALANDO.
O resultado final deve parecer uma novelinha profissional, com acontecimentos conectados, personagens consistentes, emoções naturais, filmagem realista e uma narrativa que faça o espectador querer acompanhar cada cena até o final.
`;
}

const SYSTEM_INSTRUCTION = getSystemInstruction(300);

// Multi-model generator with fallback against 503 spikes
async function queryGeminiWithFallbacks(
  gemini: GoogleGenAI,
  userPrompt: string,
  systemInstruction: string = SYSTEM_INSTRUCTION
) {
  // Try 3.1-flash-lite first (fast, reliable quota), then 3.6-flash, then 3.8-flash, then flash-latest
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"];

  for (const model of candidateModels) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed) {
          return parsed;
        }
      }
    } catch (err: any) {
      // If 503 (high demand) or 429, quietly attempt the next candidate model
      console.warn(`[Gemini fallback] Model ${model} returned: ${err?.status || err?.message}. Trying next model...`);
    }
  }

  return null;
}

function getSettingDescription(setting: string, theme: string = ""): string {
  // If no manual setting specified or set to auto/aleatorio, automatically match or adapt to the story theme
  const lowerTheme = (theme || "").toLowerCase();

  // If theme explicitly relates to certain environments, deduce the ideal automatic setting
  if (!setting || setting === "aleatorio" || setting === "automatico") {
    if (lowerTheme.includes("cratera") || lowerTheme.includes("lama") || lowerTheme.includes("rua") || lowerTheme.includes("asfalto") || lowerTheme.includes("prefeitura") || lowerTheme.includes("buraco") || lowerTheme.includes("tábua") || lowerTheme.includes("enchente")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Rua de Lamaçal e Favela): Rua de Barro Vermelho com Crateras Gigantes de Água de Chuva, barro grudento, casas de tijolo sem reboco da favela, poças de lama e placa irônica da Prefeitura.";
    }
    if (lowerTheme.includes("pastel") || lowerTheme.includes("feira") || lowerTheme.includes("caldo de cana") || lowerTheme.includes("creuza") || lowerTheme.includes("barraca")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Feira Livre Popular de Periferia): Barraca humilde de Pastel e Caldo de Cana com lonas plásticas rasgadas amarelas e azuis, tacho de óleo borbulhante, caixotes de madeira com legumes, chão batido enlameado com folhas caídas.";
    }
    if (lowerTheme.includes("oficina") || lowerTheme.includes("borracharia") || lowerTheme.includes("tião") || lowerTheme.includes("pneu") || lowerTheme.includes("graxa") || lowerTheme.includes("chave inglesa")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Borracharia & Oficina Encardida da Comunidade): Montanha de pneus velhos empilhados, chão manchado de óleo e graxa preta encardida, compressor de ar antigo roncando e ferramentas enferrujadas em casebre rústico.";
    }
    if (lowerTheme.includes("sinuca") || lowerTheme.includes("boteco") || lowerTheme.includes("bar") || lowerTheme.includes("cerveja") || lowerTheme.includes("estufa") || lowerTheme.includes("seu zé")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Boteco Copo-Sujo de Esquina da Favela): Balcão de fórmica trincado com estufa de salgados engordurada, mesa de sinuca com feltro puído rasgado, engradados de cerveja vazios empilhados e ventilador de parede barulhento sob lâmpada nua.";
    }
    if (lowerTheme.includes("cabelo") || lowerTheme.includes("salão") || lowerTheme.includes("valdirene") || lowerTheme.includes("manicure") || lowerTheme.includes("secador")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Salão Improvisado da Laje na Favela): Parede de tijolo baiano sem reboco, espelho trincado colado com fita adesiva, toalhas coloridas no varal, secador barulhento ligado em extensão com fita isolante, cadeiras de plástico brancas que envergam.";
    }
    if (lowerTheme.includes("obra") || lowerTheme.includes("pedreiro") || lowerTheme.includes("concreto") || lowerTheme.includes("marcão") || lowerTheme.includes("laje") || lowerTheme.includes("tijolo") || lowerTheme.includes("cimento")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Laje em Obras no Alto do Morro/Favela): Tijolos baianos furados expostos ao sol quente a pino, betoneira amarela barulhenta, baldes de areia fina, carrinho de mão enferrujado e vista panorâmica de barracos com telhas de amianto ao redor.";
    }
    if (lowerTheme.includes("van") || lowerTheme.includes("ônibus") || lowerTheme.includes("lotação") || lowerTheme.includes("betinho") || lowerTheme.includes("ponto") || lowerTheme.includes("kombi") || lowerTheme.includes("passagem")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Ponto de Van & Kombi da Comunidade): Cobertura de telha de amianto quebrada, chão de terra e cascalho, van branca amassada encostando com porta de correr batendo e fios emaranhados no poste.";
    }
    if (lowerTheme.includes("igreja") || lowerTheme.includes("pastor") || lowerTheme.includes("edvaldo") || lowerTheme.includes("culto") || lowerTheme.includes("bíblia")) {
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil - Salão Evangélico Humilde de Bairro): Salão simples com cadeiras de plástico brancas alinhadas sobre chão de cimento rústico, ventilador de pedestal oscilando, púlpito de madeira rústica e paredes com pintura simples gasta.";
    }
    if (lowerTheme.includes("diploma") || lowerTheme.includes("marmita") || lowerTheme.includes("boletos") || lowerTheme.includes("luz") || lowerTheme.includes("sofá") || lowerTheme.includes("tv") || lowerTheme.includes("mãe") || lowerTheme.includes("sala") || lowerTheme.includes("casa") || lowerTheme.includes("goteira") || lowerTheme.includes("cozinha") || lowerTheme.includes("casinha") || lowerTheme.includes("quarto") || lowerTheme.includes("porta") || lowerTheme.includes("janela")) {
      return "CENÁRIO OBRIGATÓRIO (Casa de Favela de Pessoa Bem Pobre e Meio Suja): Interior de casa de favela simples, pobre e meio suja (paredes de tijolo baiano sem reboco ou reboco de cal esfarelando manchado de umidade e mofo, chão de cimento encardido e manchado, fiação com gambiarras expostas no teto, sofá rasgado com espuma amarelada exposta e suja, mesa de madeira desgastada com pratos lascados ou boletos, goteiras pingando em balde velho, TV de tubo dos anos 90 ligada e fogão com manchas de fuligem).";
    }

    return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil / Se Casa, Favela Bem Pobre e Meio Suja): Sempre um lugar pobre do Brasil na periferia/favela. Se a cena se passar em uma residência/casa, obrigatoriamente uma casa de favela de pessoas bem pobres e meio sujas (tijolo aparente, reboco descascando com mofo, chão de cimento encardido, fiação de gambiarra, sofá rasgado com espuma amarela aparente e marcas de gordura e poeira).";
  }

  switch (setting) {
    case "sala_cozinha":
      return "Interior de Casa de Favela Bem Pobre e Meio Suja (paredes de tijolo baiano furado sem reboco ou reboco descascando com mofo escuro, chão de cimento encardido e manchado de gordura e poeira, goteiras pingando em balde de plástico velho, fiação de gambiarra pendurada, TV de tubo ligada sobre caixote, sofá surrado rasgado com espuma amarela exposta e encardida, mesa de madeira desgastada com toalha plástica rasgada e boletos atrasados, fogão enferrujado com manchas pretas de fuligem)";
    case "rua_lama":
      return "Rua de Barro Vermelho da Favela com Crateras Gigantes de Água de Chuva, barro grudento, barracos e casas de tijolo baiano sem reboco ao fundo, esgoto e placa irônica da Prefeitura";
    case "boteco_esquina":
      return "Boteco Copo-Sujo de Esquina da Favela (balcão de fórmica trincado com estufa de salgados engordurada, mesa de sinuca com feltro puído rasgado, engradados de cerveja vazios empilhados e ventilador de parede barulhento)";
    case "feira_livre":
      return "Feira Livre Popular da Periferia (barraca humilde de pastel e caldo de cana com lonas plásticas rasgadas amarelas e azuis, tacho de óleo borbulhante, caixotes de madeira com legumes e poças d'água no chão batido enlameado)";
    case "barbearia_salao":
      return "Salão da Laje Improvisado na Favela (parede de tijolo baiano sem reboco, espelho trincado colado com fita adesiva, toalhas coloridas no varal, secador barulhento ligado em extensão com fita isolante, cadeiras de plástico brancas que envergam)";
    case "borracharia_oficina":
      return "Borracharia e Oficina Mecânica Encardida da Favela (montanha de pneus velhos de trator e caminhão, chão manchado de óleo graxa negro e poeira, compressor de ar antigo roncando e ferramentas enferrujadas)";
    case "obra_laje":
      return "Laje em Construção no Alto da Favela (tijolos baianos furados expostos ao sol quente a pino, betoneira amarela barulhenta, baldes de areia fina, carrinho de mão enferrujado e vista dos telhados de amianto ao redor)";
    case "ponto_onibus":
      return "Ponto de Ônibus & Ponto de Van da Favela (cobertura de telha de amianto quebrada, chão de terra e cascalho, van branca amassada encostando com porta de correr batendo e lixo no canto da via)";
    case "mercearia":
      return "Mercearia e Venda Simples da Favela (prateleiras de madeira rústica com fardos de arroz e feijão, caderneta grossa de fiado aberta no balcão de madeira desgastada e balança analógica antiga)";
    case "misto":
      return "Ambientes Variados e Dinâmicos da Favela e Periferia Pobre Brasileira (alternando entre casa de favela bem pobre e meio suja, comércio popular humilde, laje de tijolo baiano, boteco copo-sujo e rua de barro)";
    default:
      return "CENÁRIO OBRIGATÓRIO (Lugar Pobre do Brasil / Se Casa, Favela Bem Pobre e Meio Suja): Sempre um lugar pobre do Brasil. Se for casa, sempre casa de favela de pessoa bem pobre e meio suja com reboco descascando, chão de cimento encardido, fiação de gambiarra e sofá rasgado com espuma amarela aparente.";
  }
}

function getCharacterFocusDescription(focus: string, weightKg: number = 300, theme: string = ""): string {
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);
  const weightStr = `exatos ${w}kg (~${lbs} lbs)`;

  return `CRIAÇÃO OBRIGATÓRIA DE PERSONAGENS 100% INÉDITOS E NOVOS PARA ESTA HISTÓRIA:
- NUNCA repita ou fique preso apenas aos mesmos nomes ou tipos fixos! Crie PERSONAGENS TOTALMENTE NOVOS, originais, autênticos e profundamente carismáticos da rica periferia e do cotidiano brasileiro, adaptados com precisão cirúrgica ao tema "${theme || "desta história"}".
- Crie nomes populares brasileiros inéditos (ex: Claudemir, Dona Ivone, Marivaldo, Silene, Genival, Dona Neide, Cleberson, Lindalva, Seu Antenor, Zezinho, Cida, Wanderson, Edilaine, etc.).
- Dê a cada personagem uma profissão popular ou papel comunitário novo e detalhado com roupas autênticas (regata, avental manchado, bermuda com bolso rasgado, chinelo gasto, camisa social com botão sob pressão, toalha no pescoço, unhas com glitter, cordão ou relógio folheado, etc.).
- REGRA SAGRADA DE ANATOMIA: CADA UM DOS NOVOS PERSONAGENS DEVE VISIVELMENTE PESAR ${weightStr} com dobras de pele realistas, suor tropical autêntico e presença marcante em cena!`;
}

// Generate prompts endpoint
const handleGeneratePrompts = async (req: any, res: any) => {
  const {
    theme = "Situações inusitadas e desculpas cômicas da comunidade",
    setting = "aleatorio",
    characterFocus = "diversificado",
    targetAi = "kling",
    numScenes = 3,
    customDetails = "",
    characterWeightKg = 300,
    storyTone = "comedia",
    customCharacter = null,
  } = req.body || {};

  const exactNumScenes = Math.max(1, Math.min(6, Number(numScenes) || 3));
  const exactWeight = Math.max(40, Math.min(600, Number(characterWeightKg) || 300));
  const exactWeightLbs = Math.round(exactWeight * 2.20462);
  const isEmotionalStory = storyTone === "emocionante" || storyTone === "superacao";

  try {
    const gemini = getGeminiClient();

    // If Gemini client is active, attempt generation across resilient models
    if (gemini) {
      const settingDesc = getSettingDescription(setting, theme);
      const characterDesc = getCharacterFocusDescription(characterFocus, exactWeight, theme);

      const customCharDirectives = customCharacter ? `
- REGRA OBRIGATÓRIA: PERSONAGEM PERSONALIZADO ENVIADO PELO USUÁRIO (FOTO DE REFERÊNCIA ANEXADA):
  * O usuário anexou a foto de um personagem que DEVE SER O PROTAGONISTA CENTRAL da história!
  * Nome: "${customCharacter.name || "Protagonista da Foto"}" (${customCharacter.role || "Protagonista Principal"})
  * Feições do Rosto: "${customCharacter.faceAndHair || customCharacter.genderAndAge || "Fiel à foto"}"
  * Roupas Travadas: "${customCharacter.lockedAttire || `Roupas visivelmente curtas e apertadas que não cabem no corpo de ${exactWeight}kg`}"
  * Físico e Suor: Rigorosamente ${exactWeight}kg, vestindo roupas curtas e apertadas que não cabem nele e permanentemente suado em todo momento.
  * Cláusula para o Prompt: "${customCharacter.visualSummaryForPrompt || ""}"
  * OBRIGATÓRIO: Este personagem DEVE estar no Prompt 00 e aparecer em todas as cenas como figura central!
` : "";

      const emotionalDirectives = isEmotionalStory ? `
- REGRA SUPREMA DE HISTÓRIA PROFUNDAMENTE EMOCIONANTE (FAZER O PÚBLICO CHORAR E SE EMOCIONAR):
  * Atue como um ROTEIRISTA E DIRETOR DE DRAMAS HUMANOS PREMIADO, especialista em capturar a profunda nobreza, a dor e a beleza do sacrifício familiar e comunitário na periferia brasileira.
  * OBJETIVO MÁXIMO: FAZER O PÚBLICO QUE ASSISTIR FICAR EMOCIONADO, COM OS OLHOS CHEIOS DE LÁGRIMAS E O CORAÇÃO TOCADO!
  * EIXOS DRAMÁTICOS PERFEITOS PARA ESTA HISTÓRIA:
    1. O amor incondicional e silencioso de mães e avós humildes (que abriram mão da própria refeição para comprar um caderno ou a passagem de ônibus).
    2. A superação de quem venceu pelo estudo ou trabalho duro (o primeiro diploma da família, a aprovação no vestibular, a casa própria de 30 anos quitada).
    3. A solidariedade e generosidade pura da quebrada (quem tem pouco dividindo a última marmita de comida com o vizinho desempregado).
    4. O perdão e a reconciliação familiar calorosa após anos de mágoa, selados por um abraço curador que emociona quem assiste.
  * DIRETIVAS DE ATUAÇÃO E FISIOLOGIA DA EMOÇÃO:
    - Lágrimas verdadeiras e densas escorrendo pelas bochechas roliças e queixo volumoso de ${exactWeight}kg, brilhando com reflexos especulares na pele tropical.
    - Olhos marejados e brilhantes, olhar comovido de respeito mútuo, queixo trêmulo e respiração entrecortada pelo choro de alívio e gratidão.
    - Mãos calejadas e trêmulas segurando o rosto ou os ombros do outro com ternura infinita, toque protetor e caloroso.
    - Abraço apertado e curador entre os corpos volumosos de ${exactWeight}kg que se fundem em afeto puro e inegável.
  * FOTOGRAFIA E CLIMA:
    - Closes lentos e respeitosos nos olhos lacrimejantes e nas expressões de amor e gratidão.
    - Luz natural suave de janela banhando o cômodo humilde ou luz dourada de fim de tarde realçando a dignidade e a nobreza da alma humilde.
  * FALAS DE 9 SEGUNDOS TOCANTES:
    - As falas de 9s devem ser sinceras, profundas, poéticas e de cortar o coração (ex: "Mãe, cada marmita fria que você lavou pra pagar minha passagem virou esse diploma aqui. O primeiro da nossa família!").
` : `
- REGRA DE TOM NARRATIVO: Tom cômico e irônico do cotidiano brasileiro da periferia (desculpas bem-humoradas, contrastes sociais, calor tropical e tiradas espertas).
`;

      const userPrompt = `
Gere EXATAMENTE ${exactNumScenes} prompts cinematográficos completos, SEQUENCIAIS e COM CONTINUIDADE NARRATIVA DIRETA para a IA de vídeo "${String(targetAi).toUpperCase()}".
IMPORTANTE: O array "scenes" no JSON de resposta DEVE conter EXATAMENTE ${exactNumScenes} cena(s)/take(s). Não gere mais nem menos do que ${exactNumScenes}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA SUPREMA ABSOLUTA N° 1: FIDELIDADE TOTAL AO ENREDO ESCRITO PELO USUÁRIO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• O ENREDO / TEMA ESCRITO PELO USUÁRIO É A LEI SUPREMA DA NARRATIVA: "${theme}".
• TODAS as ${exactNumScenes} cenas geradas DEVEM OBRIGATORIAMENTE NARRAR E DRAMATIZAR COM PRECISÃO CIRÚRGICA ESTE ENREDO ESPECÍFICO FORNECIDO PELO USUÁRIO!
• CADA AÇÃO, CADA DIÁLOGO DE 9 SEGUNDOS, CADA ADEREÇO E O DESFECHO FINAL NO ÚLTIMO TAKE DEVEM SER O DESDOBRAMENTO DIRETO DO ENREDO ESCRITO PELO USUÁRIO ("${theme}").
• É EXPRESSAMENTE PROIBIDO mudar o enredo, gerar histórias genéricas ou ignorar o que o usuário escreveu.
• Se o usuário escreveu uma situação cômica, dramática ou inusitada, materialize cada detalhe da trama dele em imagens e falas sincronizadas!

Parâmetros solicitados:
- Quantidade Solicitada: EXATAMENTE ${exactNumScenes} take(s) (Duração total prevista: ${exactNumScenes * 9} segundos)
- Enredo Escrito pelo Usuário (LEI SUPREMA): "${theme}"
- Tom Narrativo Escolhido: "${isEmotionalStory ? "HISTÓRIA PROFUNDAMENTE EMOCIONANTE E DE FAZER CHORAR" : "COMÉDIA DO COTIDIANO POPULAR"}"
- Cenário Solicitado: "${settingDesc}"
- Foco dos Personagens: "${characterDesc}"
- Peso Obrigatório de Todos os Personagens: EXATAMENTE ${exactWeight}kg (~${exactWeightLbs} lbs)
- Detalhes Extras do Usuário: "${customDetails || (isEmotionalStory ? "Privilegie o drama sincero, lágrimas genuínas, abraços afetuosos e a dignidade tocante da família" : "Nenhum detalhe extra; maximize o humor irônico, o contraste social e o realismo cru e documental")}"
${customCharDirectives}
- REGRA SUPREMA OBRIGATÓRIA: ROUPAS CURTAS E APERTADAS QUE NÃO CABEM (CORPOS DE MAIS DE 300KG):
  * TODOS os personagens devem vestir roupas visivelmente curtas e apertadas que visivelmente NÃO CABEM neles devido ao peso de mais de ${exactWeight}kg.
  * Camisetas curtas estilo cropped puxadas ao limite nas costuras, barras subindo sobre a barriga volumosa, bermudas curtas e justas espremendo as coxas com cós enrolado sob o abdômen.
- REGRA SUPREMA OBRIGATÓRIA: SEMPRE E CONTINUAMENTE SUADOS EM TODO MOMENTO:
  * TODOS os personagens estão permanentemente ensopados de suor tropical cintilante em TODAS as cenas e a todo momento.
  * Gotas e filetes de transpiração escorrendo pela testa, têmporas, bochechas, queixo duplo e pescoço, marcas escuras de suor ensopado nas roupas curtas, poros 8K com brilho molhado.
${emotionalDirectives}
- REGRA SUPREMA OBRIGATÓRIA DE CENÁRIO: SEMPRE LUGAR POBRE DO BRASIL / SE FOR CASA, SEMPRE CASA DE FAVELA MUITO POBRE E MEIO SUJA:
  * O cenário de TODAS as cenas DEVE OBRIGATORIAMENTE ser um lugar pobre do Brasil (comunidade carente, favela, ruela de terra/barro ou comércio popular improvisado).
  * SE A HISTÓRIA SE PASSAR EM UMA CASA (ou envolver qualquer cômodo residencial: sala, cozinha, quarto, quintal): FAÇA SEMPRE UMA CASA DE FAVELA DE UMA PESSOA BEM POBRE E MEIO SUJA!
  * Detalhes visuais obrigatórios para a casa de favela bem pobre e meio suja:
    - Paredes de tijolo baiano furado sem reboco ou reboco descascando/esfarelando manchado de umidade e mofo escuro.
    - Chão de cimento queimado encardido, manchado de poeira e gordura acumulada nas quinas, ou terra batida.
    - Fiação elétrica exposta com gambiarras caídas, teto de telhas de amianto com goteiras pingando em baldes velhos de plástico.
    - Sofá velho rasgado com espuma amarelada exposta e encardida, mesa de madeira rústica capenga com toalha plástica rasgada.
    - Fogão velho enferrujado com manchas pretas de fuligem e gordura, pia com louça encardida e pano de prato manchado.
    - TV de tubo dos anos 90 ligada em caixote de madeira ou rack de compensado estufado, ventilador com grades empoeiradas.
  * No 'englishPrompt', inclua a cláusula visual: '[MANDATORY SCENARIO: DILAPIDATED & GRIMY BRAZILIAN FAVELA SETTING / EXTREMELY POOR FAVELA HOUSE]: Set strictly in a poor Brazilian favela / peripheral community. If a house is depicted, it is strictly a dilapidated, somewhat dirty and grimy favela house of a very poor person: unplastered red clay cinder blocks, peeling damp stained plaster, dingy grease-stained concrete floor, exposed electrical wiring (gambiarras), patched leaky roof with buckets, worn-out ripped vintage sofa with exposed stained yellow foam, battered greasy rustic furniture, dingy dust and soot.'
  * No 'negativePrompt', proíba expressamente: 'clean modern house, luxury, wealth, mansion, pristine walls, polished floors, expensive furniture, neat minimalist apartment, clean kitchen, middle class, upscale home, tidy room, renovated house'.
- REGRA SUPREMA DO GANCHO FORTE DE ABERTURA (PRIMEIROS 3 SEGUNDOS DA CENA 1):
  * Toda história DEVE OBRIGATORIAMENTE começar com um GANCHO FORTE (HOOK MAGNÉTICO) no Take 1 que prende a atenção nos primeiros 2 a 3 segundos.
  * O GANCHO NUNCA deve ser uma abertura fria, lenta ou genérica. Use uma das 5 fórmulas de gancho de alto impacto:
    1. Ação em andamento (In Media Res): O take já começa no meio de uma ação urgente, física ou absurda (ex: segurando algo prestes a estourar, equilibrando na tábua, medindo a cratera com vara).
    2. Pergunta provocativa ou quebra de expectativa: A primeira fala desafia diretamente o senso comum com humor ou drama afiado.
    3. Revelação chocante: Mostra um detalhe perturbador, cômico ou tocante logo no primeiro frame (um boleto estratosférico, o prato vazio, o objeto improvisado).
    4. Dilema urgente com contagem regressiva: Algo vai acontecer se o personagem não agir imediatamente.
    5. Nó na garganta emocional: Um desabafo de dor humilde ou sacrifício que comove nos primeiros 3 segundos.
  * O GANCHO DEVE FAZER SENTIDO TOTAL COM TODO O RESTANTE DA HISTÓRIA:
    - O gancho NÃO é uma pegadinha isolada; ele é a causa motora primária de toda a sequência.
    - Todos os takes seguintes (Takes 2 até o Final) são desdobramentos, escalações e reações ao que o gancho disparou.
    - O último take entrega o desfecho definitivo fechando o ciclo aberto pelo gancho inicial.
  * Preencha no JSON raiz o objeto "narrativeHook" com: "headline", "hookType", "visualElement", "corePromise", "retentionTrigger".
  * Preencha na Cena 1 "narrativeHook" e nas cenas seguintes "hookPayoff" explicando como o take continua a promessa do gancho.
- REGRA SUPREMA DE CONTINUIDADE NARRATIVA E CONEXÃO CINEMATOGRÁFICA (DIRETOR DE CONTINUIDADE & ROTEIRISTA AUDIOVISUAL):
  * Atue como um DIRETOR DE CONTINUIDADE CINEMATOGRÁFICA E ROTEIRISTA ESPECIALIZADO em narrativas audiovisuais.
  * REGRA MÁXIMA: TODOS OS PROMPTS DEVEM FORMAR UMA ÚNICA HISTÓRIA CONTÍNUA.
    - O PROMPT 2 COMEÇA ONDE O PROMPT 1 TERMINA.
    - O PROMPT 3 COMEÇA ONDE O PROMPT 2 TERMINA.
    - CADA NOVO PROMPT É O PRÓXIMO SEGUNDO DA MESMA HISTÓRIA. NUNCA trate os prompts como vídeos independentes ou histórias isoladas.
  * 10 REGRAS OBRIGATÓRIAS DE CONTINUIDADE:
    1. CONEXÃO OBRIGATÓRIA ENTRE PROMPTS: O primeiro estabelece o gancho forte e a situação inicial. O segundo continua diretamente os acontecimentos do primeiro. O terceiro continua o segundo. Cada nova cena apresenta uma consequência, reação, descoberta ou desdobramento imediato do que aconteceu no prompt anterior. Proibido reiniciar a história ou desconectar eventos.
    2. CONTINUIDADE DA AÇÃO: O segundo prompt começa EXATAMENTE no ponto ou momento imediatamente posterior ao final do primeiro. Isso inclui: posição física dos personagens, posição das mãos e braços, objetos que estavam segurando, direção do olhar, expressão facial no final da cena anterior, movimento corporal em andamento e localização exata no cenário. Zero saltos temporais ou teletransporte de personagens sem explicação visual.
    3. CONEXÃO VISUAL ENTRE O ÚLTIMO E O PRIMEIRO FRAME (MATCH-ACTION): O último acontecimento visual de um prompt se conecta de forma fluida com o primeiro do prompt seguinte (ex: se termina apontando com a mão direita, o próximo inicia com a mão ainda apontada completando o movimento; se termina olhando assustado para trás, o próximo revela a reação ou o que ele viu; se um objeto começa a cair, o próximo continua com o impacto).
    4. PROGRESSÃO DA HISTÓRIA: Estrutura em arco (Prompt 1: Gancho Forte / Incidente Incitante → Prompt 2: Reação ou complicação imediata decorrente do gancho → Prompt 3: Escalação do conflito ou ação decisiva → Prompt 4+: Consequências, clímax e DESFECHO DEFINITIVO NO ÚLTIMO TAKE).
    5. CONTINUIDADE EMOCIONAL: As emoções seguem progressão lógica, sem mudanças bruscas de humor sem motivo visual claro (ex: se termina em pânico ou choque, começa o próximo recuperando o fôlego ou reagindo ao choque).
    6. CONTINUIDADE DOS DIÁLOGOS: O diálogo do próximo prompt responde, rebate ou continua a fala anterior, sem repetir informações já ditas e mantendo o tom consistente.
    7. CONTINUIDADE CINEMATOGRÁFICA: Ao mudar de ângulo, preserve a direção do movimento, posição relativa dos elementos, iluminação, clima e respeito estrito ao EIXO DE 180°. Use cortes na ação (match-cut), corte para reação, detalhe de objeto ou contra-campo.
    8. PRESERVAÇÃO DOS PERSONAGENS E DO CENÁRIO: Roupas travadas, anatomia exata de ${exactWeight}kg, marcas de suor ou sujeira adquiridas e clima devem ser mantidos. Nas IAs de vídeo, NUNCA utilize termos como "o mesmo personagem" ou "mesmo cenário" — descreva novamente todas as características visuais completas em cada prompt.
    9. PLANEJAMENTO PRÉVIO DA NARRATIVA: Conceba a história completa do início ao fim com elos indispensáveis na corrente narrativa a partir do gancho.
    10. REGRA DE DURAÇÃO (8 A 9 SEGUNDOS): Distribua os acontecimentos para caberem confortavelmente nesse tempo, sem aceleração artificial.
  * Se 1 take: Arco completo e conciso com gancho imediato nos primeiros 3s e desfecho definitivo nos últimos 3s.
  * Se 2 ou mais takes:
    - Cena 1: "Ato 1: Gancho Forte & Incidente Incitante" (dispara imediatamente a situação de conflito ou dilema que prenderá o público).
    - Cenas intermediárias (Cenas 2 até ${exactNumScenes - 1}): "Ato X: Escalação & Consequência do Gancho" (continua diretamente a ação do take anterior; os personagens reagem às consequências do que acabou de acontecer e a crise se aprofunda).
    - CENA FINAL (Cena ${exactNumScenes}): "Ato Final: Desfecho Definitivo & Resolução do Gancho" (O ÚLTIMO PROMPT DEVE OBRIGATORIAMENTE CONCLUIR E FINALIZAR A HISTÓRIA, entregando a resolução cômica ou emocional definitiva prometida desde o gancho!).
- REGRA SUPREMA DE CONSISTÊNCIA VISUAL DE TODOS OS PERSONAGENS EM MÚLTIPLAS CENAS (ANTI-ERRO DE IA):
  * SE UM PERSONAGEM APARECE EM MAIS DE UMA CENA (ex: Cena 1 e Cena 2, ou em todas as cenas), ELE DEVE MANTER RIGOROSAMENTE AS MESMAS ROUPAS (peças, cores, manchas de suor ou graxa), MESMO CORTE DE CABELO, MESMAS FEIÇÕES E MESMO CORPO DE ${exactWeight}KG EM CADA UM DOS PROMPTS ONDE APARECE!
  * SE UMA CENA TIVER MAIS DE UM PERSONAGEM:
    - O 'englishPrompt' e o 'portuguesePrompt' DEVEM CONTER A DESCRIÇÃO INDIVIDUAL COMPLETA DE CADA UM DOS PERSONAGENS PRESENTES NA CENA!
    - No 'englishPrompt', inclua blocos explícitos para cada personagem:
      '[CHARACTER 1 - (NOME), (ROUPA TRAVADA IDÊNTICA AO TAKE ANTERIOR), ${exactWeight}KG]'
      '[CHARACTER 2 - (NOME), (ROUPA TRAVADA IDÊNTICA AO TAKE ANTERIOR), ${exactWeight}KG]'
    - Nunca deixe nenhum personagem sem suas roupas travadas e anatomia de ${exactWeight}kg, evitando mutações nas IAs de vídeo (Kling, Runway, Sora, Luma, MiniMax).
  * Preencha em cada cena o array 'charactersInScene' com a ficha completa de TODOS os personagens que aparecem naquela cena (falantes ou ouvintes/reações).
  * Preencha no JSON raiz o array 'castDossier' com todo o elenco da história, suas roupas consistentes e o array de cenas em que aparecem ('scenesPresent': [1, 2...]).
- REGRA MESTRA DE PERSONAGENS 100% NOVOS E ORIGINAIS: SEMPRE CRIE PERSONAGENS NOVOS E INÉDITOS PARA CADA HISTÓRIA! Não fique limitado a personagens anteriores. Crie novos moradores, novas mães, novos trabalhadores, comerciantes e vizinhos carismáticos da comunidade brasileira totalmente adaptados ao tema da narrativa, mantendo a consistência visual rígida de roupas e o peso de ${exactWeight}kg entre as cenas onde cada um aparece!
- REGRA SUPREMA OBRIGATÓRIA: FORÇAR A IA DE VÍDEO A RENDERIZAR O PESO ESCOLHIDO (${exactWeight}kg / ~${exactWeightLbs} lbs) DE FORMA 100% VISÍVEL!
  * Se o usuário escolheu ${exactWeight}kg (ex: 300 quilos), é OBRIGATÓRIO que o personagem ESTEJA COM ${exactWeight} QUILOS VISIVELMENTE na tela gerada pela IA de vídeo (Kling, Runway, Sora, Luma, MiniMax)!
  * O prompt DEVE FORÇAR a IA através de marcadores anatômicos incontestáveis no início e corpo do 'englishPrompt':
    - Coloque OBRIGATORIAMENTE no início do 'englishPrompt' a declaração imperativa de massa:
      '[MANDATORY CHARACTER PHYSIQUE & WEIGHT: VISIBLY ${exactWeight}KG / ${exactWeightLbs} LBS - EXTREME REALISTIC MASS]: Every character on screen is visibly, undeniably, and unmistakably weighing ${exactWeight} kilograms (${exactWeightLbs} lbs)...'
    - Descreva a anatomia visível de ${exactWeight}kg: barriga enorme e proeminente caída pesadamente sobre o cós pela gravidade, papada pesada com queixo duplo e triplo encostando no peito, pescoço muito grosso com dobras profundas de gordura, membros fartos e pesados, tecido das roupas esticado com máxima tensão nas costuras sob a silhueta de ${exactWeight}kg.
    - No 'negativePrompt', proíba e rejeite expressamente qualquer corpo padrão ou atlético: 'slender, slim, skinny, thin, fit, athletic, muscular, lean, toned, average body weight, normal build, flat stomach, narrow waistline, sharp jawline, lean neck, thin arms, model proportions, slight build, underweight, standard body'.
- REGRA CRÍTICA: Cada cena DEVE ter uma fala de EXATAMENTE 9 SEGUNDOS (18-24 palavras em português brasileiro bem ritmado, marcado com [00:00 - 00:09]).
- REGRA SUPREMA DE DIREÇÃO DE FOTOGRAFIA E TAKES CINEMATOGRÁFICOS (DIRETOR COM 50+ ANOS DE EXPERIÊNCIA):
  * Atue também como um DIRETOR DE FOTOGRAFIA E CINEGRAFISTA RENOMADO com mais de 50 anos de experiência em filmagens cinematográficas, documentários, novelas e vídeos ultrarrealistas.
  * Analise automaticamente o tema, a situação, as ações e as emoções de cada cena para determinar uma ESTRATÉGIA DE FILMAGEM EXCLUSIVA E NÃO REPETITIVA.
  * 15 REGRAS SAGRADAS DE FILMAGEM:
    1. CÂMERA HANDHELD REALISTA: simular pequenas oscilações naturais e orgânicas de uma câmera segurada por um cinegrafista humano presente. Balanço sutil, orgânico e controlado, sem tremores exagerados ou deformações.
    2. VARIAÇÃO DE ENQUADRAMENTOS: planos gerais, planos médios, closes, planos de detalhe (inserts), ângulos laterais, over-the-shoulder (OTS) e perspectiva POV quando pertinentes.
    3. CLOSES ESTRATÉGICOS NO MOMENTO CERTO: quando o personagem demonstrar medo, surpresa, choque cômico, tristeza ou perceber algo importante, aproxime suavemente a câmera para destacar a expressão facial (suor, olhar arregalado, traços expressivos). Em objetos ou gestos relevantes (chave de roda, dinheiro amassado, pastel fritando, boletos), utilize plano de detalhe.
    4. MOVIMENTOS CINEMATOGRÁFICOS MOTIVADOS: push-in suave para tensão/clímax, pull-out para revelação/isolamento, pan, tilt, tracking e pequenos deslocamentos laterais. Cada movimento deve acompanhar uma ação ou revelar uma informação.
    5. DE 2 A 3 ENQUADRAMENTOS COMPLEMENTARES PARA CENAS DE 9 SEGUNDOS (com timestamps exatos [00:00 - 00:03], [00:03 - 00:06], [00:06 - 00:09]) alternando entre acontecimento principal, detalhes e reações (ou tomada contínua fluida quando mais realista).
    6. SEM MOVIMENTOS ALEATÓRIOS: sem giros 360 desnecessários, sem zooms digitais bruscos e sem mudanças incoerentes de perspectiva.
    7. PRESERVAÇÃO RIGOROSA DA IDENTIDADE: rostos, roupas travadas, anatomia exata de ${exactWeight}kg, iluminação e ambiente devem permanecer 100% consistentes e sem deformações durante todos os takes.
    8. NUNCA PERMITIR DEFORMAÇÕES por movimento de câmera em rostos, mãos, corpos ou cenários.
    9. CONTINUIDADE CINEMATOGRÁFICA E COERÊNCIA ESPACIAL (respeito ao eixo de 180° e posições lógicas).
    10. ADAPTE À EMOÇÃO: aproximações lentas para suspense/tensão, closes para drama/indignação, acompanhamento dinâmico para ação e cortes de reação em momentos de surpresa ou comédia.
    11. CADA MUDANÇA DE ÂNGULO REVELA UMA INFORMAÇÃO, destaca uma emoção ou melhora a compreensão da história.
    12. DESCREVA NOS PROMPTS EXATAMENTE quando a câmera se aproxima, se afasta, acompanha o personagem, muda de ângulo ou realiza um close (inclua nos prompts em inglês e português). Nunca use apenas termos genéricos como "câmera cinematográfica".
    13. A CÂMERA DEVE SE COMPORTAR COMO SE UM CINEGRAFISTA HUMANO estivesse fisicamente presente no ambiente, reagindo naturalmente aos acontecimentos.
    14. NÃO REPETIR A MESMA SEQUÊNCIA DE MOVIMENTOS: desenvolva uma direção de fotografia exclusiva para cada situação.
    15. Preencha no JSON de cada cena o objeto "cinematography" detalhado contendo "directorVision", "cameraType", "shotProgression" (com 2 a 3 segmentos de timecode, enquadramento, movimento e foco), "lightingAndAtmosphere", "lensChoice" e "emotionalToneAlignment".
- REGRA SUPREMA DE DIREÇÃO DE ATORES E MOVIMENTOS HUMANOS ULTRARREALISTAS (DIRETOR DE ATORES COM 50+ ANOS DE EXPERIÊNCIA EM BIOMECÂNICA E COMPORTAMENTO HUMANO):
  * Atue como um DIRETOR DE ATORES, ESPECIALISTA EM LINGUAGEM CORPORAL, BIOMECÂNICA HUMANA E ANIMAÇÃO CINEMATOGRÁFICA ULTRARREALISTA com mais de 50 anos de experiência em direção de movimentos, atuação naturalista e comportamento humano.
  * Os personagens devem se comportar como pessoas reais vivendo os acontecimentos, e não como bonecos executando movimentos programados. Cada gesto, expressão facial, movimento corporal e interação com o ambiente deve possuir uma motivação física ou emocional.
  * 14 PILARES SAGRADOS DE DIREÇÃO DE ATORES:
    1. MOVIMENTOS CORPORAIS NATURAIS: Respeite rigorosamente a anatomia e biomecânica humana (cabeça, pescoço, ombros, braços, cotovelos, mãos, dedos, tronco, quadril, pernas, joelhos, pés). Movimentos com peso gravitacional real de ${exactWeight}kg, aceleração e desaceleração graduais. Proibidos movimentos sincronizados artificiais ou personagens estáticos.
    2. MICRO MOVIMENTOS HUMANOS: Respiração diafragmática visível no tórax/abdômen, pestanejar espontâneo descompassado, micro-inclinações discretas de cabeça, pequenos ajustes involuntários de equilíbrio e transferência de peso.
    3. MOVIMENTOS MOTIVADOS PELA HISTÓRIA: Toda ação tem razão narrativa ou física (se ouve algo, vira a cabeça; se surpreso, arregala sutilmente os olhos e inclina o tronco; se cansaço, ombros descem com o peso). Sem gestos aleatórios vazios.
    4. MOVIMENTOS REALISTAS DAS MÃOS: Exatamente 5 dedos perfeitos e articulados por mão. Contato sólido e preensão anatômica crível com objetos (sem clipping, sem atravessar materiais, sem mãos flutuando, sem dedos fundidos ou duplicados).
    5. CAMINHADA HUMANA REALISTA: Alternância natural de passos com transferência do peso de ${exactWeight}kg, oscilação de braços e tronco, contato firme dos pés com o solo sem deslizar (zero foot sliding), desaceleração gradual ao parar.
    6. EXPRESSÕES FACIAIS ULTRARREALISTAS: Microexpressões sutis dos músculos faciais acompanhando a emoção. Sem sorrisos congelados caricatos. Reação humana em ordem temporal: estímulo -> olhos focam -> cabeça gira -> microexpressão facial -> corpo reage.
    7. MOVIMENTOS NATURAIS DURANTE DIÁLOGOS: Sincronia labial precisa acompanhando a fala de 9 segundos em português brasileiro, pausas respiratórias reais, movimentação comedida das mãos compatível com o discurso, escuta ativa dos ouvintes.
    8. INTERAÇÃO FÍSICA COM O AMBIENTE: Flexão natural de joelhos e quadril ao sentar, impulso pelos pés ao levantar, contato sólido com cadeiras, mesas e balcões respeitando a massa de ${exactWeight}kg.
    9. REAÇÕES HUMANAS ESPONTÂNEAS: Cadeia temporal fluida: percepção -> olhar -> cabeça -> expressão -> corpo -> ação/fala, adaptado ao ritmo e personalidade.
    10. CONTINUIDADE DOS MOVIMENTOS ENTRE PROMPTS: Os movimentos corporais continuam fluidamente entre os prompts (se termina segurando algo ou apontando a mão, o próximo continua a partir daquele ponto exato).
    11. MOVIMENTOS ADAPTADOS À PERSONALIDADE: Linguagem corporal autêntica coerente com a idade, profissão e hábitos do morador da comunidade.
    12. SINCRONIZAÇÃO ENTRE PERSONAGEM E CÂMERA: A ação dos atores e as linhas de olhar orientam os enquadramentos cinematográficos e closes.
    13. PREVENÇÃO RIGOROSA DE DEFORMAÇÕES (ANTI-GLITCH): Integridade anatômica impecável (5 dedos, sem membros atravessando corpos ou roupas, sem distorção facial ao girar a cabeça).
    14. DIREÇÃO TEMPORAL PARA CENAS DE 8 A 9 SEGUNDOS: Distribuição harmoniosa [00:00 - 00:03] percepção e reação inicial; [00:03 - 00:06] ação motivada e fala principal; [00:06 - 00:09] conclusão da ação e reação preparando a continuidade (ou desfecho final).
  * Preencha no JSON de cada cena o objeto "actorDirection" detalhado contendo "directorVision", "microMovements", "handsAndGrip", "biomechanicsAndWeight", "reactionSequence", "dialogueDeliveryAndLips", "spatialInteraction", "antiDeformationRules".

Responda em formato JSON estrito com a seguinte estrutura:
{
  "themeTitle": "Título da História / Episódio",
  "synopsis": "Breve sinopse do arco destacando os personagens de ${exactWeight}kg e o cenário autêntico",
  "promptZero": {
    "title": "PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS",
    "purpose": "Referência visual obrigatória com TODOS os personagens da história lado a lado, de corpo inteiro, sobre fundo branco puro, para preservação rigorosa da identidade, roupas e características físicas em toda a narrativa.",
    "englishPrompt": "Master character sheet photograph of all [N] characters standing side-by-side on a pure seamless solid white studio background, isolated, strictly zero background objects, no scenery, no furniture, no text, full-body head-to-toe view, separated without overlap, uniform studio lighting, all characters realistically weighing exactly ${exactWeight}kg (${exactWeightLbs} lbs)... [descrição anatômica e roupas fixas de cada um], 4K, 8K, 50mm f/4.0, ultra-realistic human skin textures, pores, sharp facial definition.",
    "portuguesePrompt": "Fotografia profissional de estúdio 4K de corpo inteiro com TODOS os personagens da história posicionados lado a lado sobre fundo branco puro, sem cenário, sem sobreposição e sem elementos adicionais. Todos pesando rigorosamente ${exactWeight}kg com roupas e calçados idênticos fixos.",
    "negativePrompt": "scenery, background objects, room, furniture, wall, outdoor, street, landscape, decorations, text, watermark, overlapping characters, merged limbs, deformed hands, cartoon, 3d render, anime, slender, thin, flat stomach, studio props",
    "aspectRatio": "16:9",
    "characters": [
      {
        "name": "Nome do Personagem",
        "role": "Papel na história",
        "weight": "${exactWeight}kg (${exactWeightLbs} lbs)",
        "fullBodyDescription": "Descrição de corpo inteiro em pé de cabeça aos pés",
        "clothingAndFootwear": "Roupas e calçados exatos travados",
        "hairAndFacialFeatures": "Cabelo, feições do rosto e barba",
        "spatialArrangement": "Posicionado à esquerda, centro ou direita, em pé, corpo inteiro, sem sobreposição"
      }
    ],
    "technicalSpecs": {
      "background": "Fundo branco puro estrito (pure seamless solid white background)",
      "framing": "Corpo inteiro de todos os personagens da cabeça aos pés, lado a lado, sem sobreposição",
      "lighting": "Iluminação fotográfica de estúdio profissional uniforme e difusa",
      "resolution": "Fotografia profissional 4K / 8K, alta definição facial e texturas humanas realistas",
      "zeroSceneryRule": "Sem cenário, sem objetos decorativos, sem textos ou elementos adicionais"
    }
  },
  "narrativePlan": {
    "protagonist": "Quem é o protagonista e sua motivação inicial",
    "supportingCharacters": ["Personagens secundários com seus papéis específicos"],
    "initialSituation": "Situação inicial da história diretamente ligada ao tema",
    "mainConflict": "Conflito principal gerador de tensão e movimento",
    "characterDesires": "O que cada personagem deseja alcançar ou defender",
    "conflictDevelopments": ["Acontecimento 1 que complica", "Acontecimento 2 que aprofunda"],
    "keyDecisions": ["Decisões determinantes tomadas pelos personagens"],
    "consequences": ["Consequências diretas decorrentes das decisões"],
    "highestTensionPeak": "Momento culminante de maior tensão / Clímax preparado anteriormente",
    "storyResolution": "Conclusão definitiva, coerente com toda a jornada e sem soluções mágicas",
    "directorExperienceNote": "Estrutura de novelinha cinematográfica com 50+ anos de experiência narrativa"
  },
  "narrativeIdentity": {
    "mainTheme": "Tema principal travado da história",
    "centralEvent": "Acontecimento central que conecta todos os prompts sem desvios",
    "charactersInvolved": ["Nome dos personagens envolvidos"],
    "environment": "Ambiente travado da história",
    "narrativeObjective": "Objetivo dramático ou cômico dos personagens",
    "mainConflict": "Conflito principal",
    "expectedDevelopment": "Desenvolvimento contínuo esperado",
    "possibleResolution": "Possível desfecho",
    "isLocked": true
  },
  "narrativeHook": {
    "headline": "Gancho magnético impactante dos primeiros 3 segundos da Cena 1",
    "hookType": "acao_em_andamento",
    "visualElement": "O que o espectador vê nos primeiros 2 a 3 segundos que impede de pular o vídeo",
    "corePromise": "A promessa do conflito ou mistério que será desenvolvido e resolvido no final",
    "retentionTrigger": "Gatilho de curiosidade, choque ou empatia que sustenta a retenção"
  },
  "narrativeArc": "Síntese do arco narrativo que conecta a história a partir do gancho inicial até o desfecho no último take",
  "castDossier": [
    {
      "name": "Nome do Personagem (ex: Raimundo, Dona Lúcia, Carla, Seu Tião)",
      "roleInStory": "Papel na história (ex: Protagonista, Mãe Exasperada, Esposa)",
      "scenesPresent": [1, 2],
      "ageAndFace": "Idade aparente, traços do rosto, cabelo fixo, traços marcantes",
      "lockedAttire": "Roupas e calçados EXATOS e idênticos em todas as cenas em que este personagem aparece",
      "bodyAndWeight300kg": "Rigorosamente ${exactWeight}kg (${exactWeightLbs} lbs) com física corporal autêntica",
      "perspirationAndSkin": "Micro-poros abertos 8k e suor cintilante",
      "consistencyPromptClause": "Frase mestre em inglês para manter o personagem 100% idêntico"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Nome da Cena 1",
      "narrativeBeat": "ETAPA 1 — GANCHO INICIAL",
      "storyConnection": "Ponto de partida magnético que dispara a corrente de acontecimentos da história",
      "novelinhaProgression": {
        "stage": "gancho_inicial",
        "stageName": "ETAPA 1 — GANCHO INICIAL",
        "whatHappenedBefore": "Início da narrativa; o acontecimento chamativo que abre a história",
        "characterDesireNow": "O que o personagem quer resolver de imediato",
        "logicalNextAction": "Ação física ou verbal visível e motivada",
        "whyActionHappens": "Motivo direto e compreensível para o público",
        "immediateConsequence": "O resultado direto dessa ação",
        "preparesNextPrompt": "O gancho deixado para o próximo take continuar sem interrupção",
        "emotionalEvolution": "Estado emocional autêntico (ex: Tensão inicial sob o calor)",
        "humanInteractionFraming": "Plano conjunto ou médio aberto mantendo os personagens visíveis interagindo no mesmo quadro, sem closes excessivos"
      },
      "hookPayoff": "Apresentação imediata do gancho e da tensão central",
      "narrativeMemory": {
        "establishedFacts": ["Fatos já estabelecidos nos takes anteriores"],
        "currentLocations": "Localização atual contínua e travada",
        "charactersKnowledge": "O que os personagens sabem neste momento da história",
        "completedActions": ["Ações já concluídas no take anterior"],
        "pendingEvents": ["O que ainda precisa acontecer para resolver o conflito"],
        "logicalNextStep": "Próximo passo lógico decorrente sem saltos narrativos"
      },
      "characterSpeaking": "Nome do Personagem Falante (ex: Tia Creuza, Seu Tião, Marcão, Raimundo)",
      "characterVisualAnchor": {
        "name": "Nome do Personagem Falante Principal",
        "roleInStory": "Protagonista",
        "ageAndFace": "Idade, traços, corte de cabelo, traços expressivos",
        "lockedAttire": "Roupas e calçados EXATOS idênticos em todas as cenas",
        "bodyAndWeight300kg": "Rigorosamente ${exactWeight}kg (${exactWeightLbs} lbs) com física corporal autêntica",
        "perspirationAndSkin": "Micro-poros 8k, gotas de suor brilhante escorrendo",
        "consistencyPromptClause": "Frase de prompt mestra em inglês para colar diretamente na IA"
      },
      "charactersInScene": [
        {
          "name": "Nome de CADA Personagem que aparece nesta cena (seja falando ou reagindo)",
          "roleInStory": "Papel nesta cena (ex: Falante, Ouvinte/Reação)",
          "ageAndFace": "Idade, traços, corte de cabelo fixo",
          "lockedAttire": "Roupas e calçados EXATOS idênticos em todas as cenas em que aparece",
          "bodyAndWeight300kg": "Rigorosamente ${exactWeight}kg (${exactWeightLbs} lbs)",
          "perspirationAndSkin": "Micro-poros 8k e suor natural",
          "consistencyPromptClause": "Prompt em inglês para manter este personagem idêntico"
        }
      ],
      "location": "Local exato (ex: Barraca de Pastel da Feira Livre, Borracharia do Seu Tião, Laje em Obras)",
      "durationSeconds": 9,
      "dialogue": {
        "fullText": "Texto completo da fala ou diálogo conjunto (18 a 24 palavras no total, dura 9 segundos falados)",
        "wordCount": 21,
        "multiCharacterDialogue": true,
        "speakersInvolved": ["Nome 1", "Nome 2"],
        "turns": [
          {
            "speaker": "Nome do Falante 1",
            "speakerVisualAnchor": "Características visuais e roupa travada",
            "timeRange": "00:00 - 04:00",
            "speech": "Fala exclusiva do Personagem 1 em português do Brasil",
            "characterAction": "Ação física e gesticulação motivada do Personagem 1",
            "silentListeners": "Personagem 2 permanece em silêncio absoluto, lábios fechados, sem mexer a boca, reagindo com olhar atento",
            "lipSyncExclusiveRule": "Somente Personagem 1 move os lábios. Todos os demais mantêm lábios fechados."
          },
          {
            "speaker": "Nome do Falante 2",
            "speakerVisualAnchor": "Características visuais e roupa travada",
            "timeRange": "04:00 - 07:30",
            "speech": "Fala exclusiva do Personagem 2 respondendo",
            "characterAction": "Gesto ou expressão do Personagem 2",
            "silentListeners": "Personagem 1 permanece em silêncio absoluto, lábios fechados, sem mexer a boca, ouvindo atentamente",
            "lipSyncExclusiveRule": "Somente Personagem 2 move os lábios. Personagem 1 mantém lábios fechados."
          }
        ],
        "timingBreakdown": [
          { "time": "00:00 - 01:00", "speaker": "Cena / Estabelecimento", "speech": "[Troca de olhares silenciosa]", "action": "Olhar de expectativa no plano conjunto", "silentListeners": "Todos os personagens em silêncio absoluto com lábios fechados" },
          { "time": "01:00 - 04:00", "speaker": "Nome do Falante 1", "speech": "Fala exclusiva do Personagem 1", "action": "Gesto motivado do falante 1", "silentListeners": "Demais personagens em silêncio absoluto, ouvindo sem mexer a boca" },
          { "time": "04:00 - 07:30", "speaker": "Nome do Falante 2", "speech": "Fala exclusiva do Personagem 2", "action": "Gesto motivado do falante 2", "silentListeners": "Falante 1 em silêncio absoluto, ouvindo sem mexer a boca" },
          { "time": "07:30 - 09:00", "speaker": "Cena / Reação", "speech": "[Respiração e reação mútua]", "action": "Desaceleração mútua no plano conjunto", "silentListeners": "Todos em silêncio, sem movimentos labiais" }
        ]
      },
      "englishPrompt": "Prompt em inglês hiper-detalhado para Kling/Runway/Sora (descreva OBRIGATORIAMENTE TODOS OS PERSONAGENS DA CENA com seus nomes, idades, roupas travadas idênticas, físico consistente de ${exactWeight}kg, pele suada com poros 8k, texturas do cenário, câmera documental 35mm)",
      "portuguesePrompt": "Versão do prompt descritivo em português contendo o detalhamento de TODOS os personagens presentes com suas roupas fixas",
      "negativePrompt": "CGI, 3D render, cartoon, anime, plastic smooth skin, glamour, makeup, slender body, clean luxury room, cinematic bloom, oversaturated colors",
      "cameraDirection": "Ex: Handheld documental 35mm com decupagem de 3 takes complementares em 9s e closes estratégicos",
      "cinematography": {
        "directorVision": "Visão do diretor de fotografia (50+ anos) explicando a estratégia visual e emocional exclusiva desta cena",
        "cameraType": "Câmera Handheld humana realista com oscilações orgânicas sutis (operador físico presente, sem tremores bruscos e sem deformações)",
        "shotProgression": [
          { "timecode": "00:00 - 00:03", "shotType": "Plano Médio / Estabelecedor / OTS", "movement": "Push-in motivado ou tracking lateral sutil", "focalPoint": "Ação principal e física de ${exactWeight}kg", "lensAndAperture": "35mm prime f/2.4", "cinematicIntent": "Estabelecer a tensão inicial e a gravidade cômica da cena" },
          { "timecode": "00:03 - 00:06", "shotType": "Close-Up Expressivo / Plano de Detalhe", "movement": "Aproximação suave no rosto ou objeto", "focalPoint": "Expressão dramática facial (gotas de suor, olhar expressivo) ou objeto crucial", "lensAndAperture": "50mm prime f/2.0", "cinematicIntent": "Destacar o pico de choque/emoção da fala" },
          { "timecode": "00:06 - 00:09", "shotType": "Plano de Reação Conjunto ou Corte Cômico", "movement": "Leve recuo (pull-out) ou pan para quem escuta", "focalPoint": "Reação cómica final e desfecho", "lensAndAperture": "35mm prime f/2.8", "cinematicIntent": "Enquadrar a consequência cômica e fechar o take" }
        ],
        "lightingAndAtmosphere": "Iluminação naturalista volumétrica com reflexos especulares de suor tropical 8k",
        "lensChoice": "Lentes prime 35mm e 50mm com profundidade de campo f/2.4 cinematográfica",
        "emotionalToneAlignment": "Decupagem calculada para amplificar o contraste entre o drama sério e o absurdo cômico"
      },
      "continuityBridge": {
        "incomingMoment": "Onde e como este take começa no frame 00:00 (continua exatamente o take anterior sem salto temporal ou abre o arco na Cena 1)",
        "outgoingMoment": "Onde e como este take termina no segundo 00:09 (congelando o gesto e direção do olhar para o próximo take ou fechando a história)",
        "nextSceneHandoff": "Como a ação é entregue ao próximo take (ou fechamento definitivo da história se for o último take)",
        "matchCutType": "Corte na Ação Contínua (Match-Action Cut) / Contra-campo de Reação / Corte de Movimento",
        "characterSpatialPositions": "Posição espacial precisa e vetores de olhar respeitando a regra dos 180° e roupas travadas de ${exactWeight}kg",
        "emotionalContinuity": "Evolução contínua do estado emocional dos personagens sem rupturas bruscas de humor"
      },
      "actorDirection": {
        "directorVision": "Visão do diretor de atores (50+ anos) sobre motivação emocional, respiração e peso de ${exactWeight}kg",
        "microMovements": "Pequenos movimentos humanos espontâneos: respiração diafragmática visível, pestanejar descompassado, micro-inclinações",
        "handsAndGrip": "5 dedos perfeitos e articulados por mão, contato sólido com objetos sem clipping ou flutuação",
        "biomechanicsAndWeight": "Inércia gravitacional de ${exactWeight}kg, aceleração/desaceleração gradual, passos sem deslizar (zero foot sliding)",
        "reactionSequence": "[00:00 - 00:03] percepção e foco ocular -> [00:03 - 00:06] ação motivada e fala -> [00:06 - 00:09] desaceleração e desfecho",
        "dialogueDeliveryAndLips": "Sincronia labial perfeita em português, pausas respiratórias e escuta ativa dos ouvintes",
        "spatialInteraction": "Apoio e contato físico sólido com o ambiente (cadeiras, balcões, piso) respeitando a massa de ${exactWeight}kg",
        "antiDeformationRules": "Salvaguardas anti-glitch: preservação dos 5 dedos, sem membros atravessando tecidos, sem morphing facial"
      },
      "skinAndLighting": "Detalhes de pele suada e iluminação da cena",
      "environmentDetails": "Adereços específicos e texturas do cenário (ex: tacho de óleo borbulhante, compressor de ar, betoneira, TV de tubo)"
    }
  ],
  "consistencyKeywords": "Palavras-chave universais para colar em todos os prompts para manter o peso de ${exactWeight}kg e estética hiper-realista"
}
`;

      const aiData = await queryGeminiWithFallbacks(gemini, userPrompt, getSystemInstruction(exactWeight));
      if (aiData) {
        if (Array.isArray(aiData.scenes)) {
          if (aiData.scenes.length > exactNumScenes) {
            aiData.scenes = aiData.scenes.slice(0, exactNumScenes);
          }
          // Safeguard: Ensure every scene has a complete characterVisualAnchor and charactersInScene
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const detectedCharKey = characterFocus || "raimundo";
            const sceneText = `${sc.title || ""} ${sc.characterSpeaking || ""} ${sc.dialogue?.fullText || ""} ${sc.englishPrompt || ""} ${sc.portuguesePrompt || ""} ${sc.location || ""}`;
            
            // Build / complete charactersInScene
            if (!Array.isArray(sc.charactersInScene) || sc.charactersInScene.length === 0) {
              sc.charactersInScene = detectAllCharactersInScene(sceneText, detectedCharKey, sc.characterSpeaking || "Raimundo", exactWeight);
            } else {
              // Ensure each character has all required fields
              sc.charactersInScene = sc.charactersInScene.map((c: any) => {
                const baseAnchor = getCharacterVisualAnchor(c.name || detectedCharKey, c.name || sc.characterSpeaking, exactWeight);
                return {
                  name: c.name || baseAnchor.name,
                  roleInStory: c.roleInStory || baseAnchor.roleInStory,
                  ageAndFace: c.ageAndFace || baseAnchor.ageAndFace,
                  lockedAttire: c.lockedAttire || baseAnchor.lockedAttire,
                  bodyAndWeight300kg: c.bodyAndWeight300kg || baseAnchor.bodyAndWeight300kg,
                  perspirationAndSkin: c.perspirationAndSkin || baseAnchor.perspirationAndSkin,
                  consistencyPromptClause: c.consistencyPromptClause || baseAnchor.consistencyPromptClause,
                  weightKg: exactWeight,
                };
              });
            }

            if (customCharacter && customCharacter.name) {
              const customAnchor = {
                name: customCharacter.name,
                roleInStory: customCharacter.role || "Protagonista Principal",
                ageAndFace: customCharacter.faceAndHair || `${customCharacter.genderAndAge || "Pessoa"} com traços da foto de referência`,
                lockedAttire: customCharacter.lockedAttire || `Roupas visivelmente curtas e apertadas que não cabem no corpo de ${exactWeight}kg (tecido esticado ao limite, costuras sob tensão, barra subindo)`,
                bodyAndWeight300kg: `Estrutura corporal pesando VISIVELMENTE ${exactWeight}kg (~${exactWeightLbs} lbs) com silhueta volumosa autêntica`,
                perspirationAndSkin: "Pele permanentemente ensopada de suor denso e brilhante em todo momento, gotas escorrendo sem parar pelas têmporas e bochechas, 8k micro-pores",
                consistencyPromptClause: customCharacter.visualSummaryForPrompt || `A fictional anonymous Brazilian character matching the reference photo, visibly weighing ${exactWeight}kg (${exactWeightLbs} lbs), strictly wearing undersized, short and tight ill-fitting clothing that visibly does not fit their massive 300kg body, continuously drenched in glistening tropical sweat with dripping beads at all times`,
                uploadedImageUrl: customCharacter.imageDataUrl,
                isCustomUploaded: true,
                weightKg: exactWeight,
              };

              if (Array.isArray(sc.charactersInScene)) {
                const existingIdx = sc.charactersInScene.findIndex((c: any) => c.name.toLowerCase() === customAnchor.name.toLowerCase());
                if (existingIdx >= 0) {
                  sc.charactersInScene[existingIdx] = { ...sc.charactersInScene[existingIdx], ...customAnchor };
                  const item = sc.charactersInScene.splice(existingIdx, 1)[0];
                  sc.charactersInScene.unshift(item);
                } else {
                  sc.charactersInScene.unshift(customAnchor);
                }
              }
              sc.characterVisualAnchor = customAnchor;
            } else if (!sc.characterVisualAnchor || !sc.characterVisualAnchor.name) {
              sc.characterVisualAnchor = sc.charactersInScene[0] || getCharacterVisualAnchor(detectedCharKey, sc.characterSpeaking || "Raimundo", exactWeight);
            }

            // Ensure englishPrompt mentions all characters present
            if (sc.charactersInScene && sc.charactersInScene.length > 1) {
              const missingChars = sc.charactersInScene.filter((c: any) => !sc.englishPrompt.toLowerCase().includes(c.name.toLowerCase()));
              if (missingChars.length > 0) {
                const addClauses = missingChars.map((c: any) => `Also present in shot: ${c.consistencyPromptClause}`).join(". ");
                sc.englishPrompt = `${addClauses}. ${sc.englishPrompt}`;
              }
            }

            // Build and enforce cinematography direction (50 years experience)
            const cine = buildCinematographyForScene(sc, scIdx, aiData.scenes.length, targetAi);
            sc.cinematography = cine.cinematography;
            sc.cameraDirection = cine.cameraDirectionText;
            if (!sc.englishPrompt.includes("[CINEMATOGRAPHY")) {
              sc.englishPrompt = `${sc.englishPrompt} ${cine.enCinematographySnippet}`;
            }
            if (!sc.portuguesePrompt.includes("[DIREÇÃO DE FOTOGRAFIA")) {
              sc.portuguesePrompt = `${sc.portuguesePrompt}\n\n${cine.ptCinematographySnippet}`;
            }
          });

          // Build and enforce narrative continuity & frame-to-frame connection (Director of Continuity)
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const prevScene = scIdx > 0 ? aiData.scenes[scIdx - 1] : undefined;
            const nextScene = scIdx < aiData.scenes.length - 1 ? aiData.scenes[scIdx + 1] : undefined;
            const bridge = buildContinuityBridgeForScene(sc, scIdx, aiData.scenes.length, prevScene, nextScene, exactWeight);
            sc.continuityBridge = bridge.continuityBridge;
            if (!sc.englishPrompt.includes("[NARRATIVE CONTINUITY")) {
              sc.englishPrompt = `${sc.englishPrompt} ${bridge.enContinuitySnippet}`;
            }
            if (!sc.portuguesePrompt.includes("[CONTINUIDADE NARRATIVA")) {
              sc.portuguesePrompt = `${sc.portuguesePrompt}\n\n${bridge.ptContinuitySnippet}`;
            }
          });

          // Build and enforce ultra-realistic actor directing & biomechanics (50-year veteran Director of Actors)
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const actorDir = buildActorDirectionForScene(sc, scIdx, aiData.scenes.length, exactWeight);
            sc.actorDirection = actorDir.actorDirection;
            if (!sc.englishPrompt.includes("[ACTOR DIRECTION")) {
              sc.englishPrompt = `${sc.englishPrompt} ${actorDir.enActorDirectionSnippet}`;
            }
            if (!sc.portuguesePrompt.includes("[DIREÇÃO DE ATORES")) {
              sc.portuguesePrompt = `${sc.portuguesePrompt}\n\n${actorDir.ptActorDirectionSnippet}`;
            }
          });

          // Enforce forced physical weight representation for the target AI video generator
          const forcedWeight = buildForcedWeightDirectives(exactWeight);
          aiData.scenes.forEach((sc: any) => {
            if (!sc.englishPrompt.includes("[MANDATORY CHARACTER PHYSIQUE & WEIGHT: VISIBLY")) {
              sc.englishPrompt = `${forcedWeight.enWeightHeader} ${sc.englishPrompt}`;
            }
            if (!sc.portuguesePrompt.includes("[PESO E MASSA CORPORAL OBRIGATÓRIA")) {
              sc.portuguesePrompt = `${forcedWeight.ptWeightHeader}\n\n${sc.portuguesePrompt}`;
            }
            if (forcedWeight.negativeWeightAdditions) {
              if (!sc.negativePrompt) {
                sc.negativePrompt = `${forcedWeight.negativeWeightAdditions}CGI, 3D render, cartoon, digital illustration, anime, smooth plastic skin, airbrushed, beauty filter, clean modern minimalist room, studio lights, artificial glow, oversaturated`;
              } else if (!sc.negativePrompt.includes("slender") && !sc.negativePrompt.includes("skinny")) {
                sc.negativePrompt = `${forcedWeight.negativeWeightAdditions}${sc.negativePrompt}`;
              }
            }
            if (sc.consistencyKeywords && !sc.consistencyKeywords.includes(`${exactWeight}kg`)) {
              sc.consistencyKeywords = `visibly ${exactWeight}kg (${exactWeightLbs} lbs), colossal physical mass, enormous sagging belly, heavy triple chin, thick neck rolls, strained clothing seams, ${sc.consistencyKeywords}`;
            }
          });

          // Enforce strict anti-celebrity & anti-famous person policy compliance (guaranteed safety on Flow, Kling, Runway)
          aiData.scenes.forEach((sc: any) => {
            sc.englishPrompt = sanitizePromptForFlowAndSafety(sc.englishPrompt);
            sc.negativePrompt = sanitizeNegativePromptForFlow(sc.negativePrompt);
            if (sc.characterVisualAnchor?.consistencyPromptClause) {
              sc.characterVisualAnchor.consistencyPromptClause = sanitizePromptForFlowAndSafety(sc.characterVisualAnchor.consistencyPromptClause);
            }
            if (Array.isArray(sc.charactersInScene)) {
              sc.charactersInScene.forEach((c: any) => {
                if (c.consistencyPromptClause) {
                  c.consistencyPromptClause = sanitizePromptForFlowAndSafety(c.consistencyPromptClause);
                }
              });
            }
          });

          // Enforce narrative hook integrity across the AI batch
          const totalAiScenes = aiData.scenes.length;
          const firstAiScene = aiData.scenes[0];
          const hookHelper = buildNarrativeHookStructure(
            theme,
            setting,
            isEmotionalStory,
            firstAiScene,
            totalAiScenes,
            exactWeight
          );

          if (!aiData.narrativeHook || !aiData.narrativeHook.headline) {
            aiData.narrativeHook = hookHelper.batchHook;
          }

          aiData.scenes.forEach((sc: any, idx: number) => {
            if (idx === 0) {
              if (!sc.narrativeHook || !sc.narrativeHook.headline) {
                sc.narrativeHook = aiData.narrativeHook || hookHelper.firstSceneHook;
              }
              if (!sc.hookPayoff) {
                sc.hookPayoff = hookHelper.getPayoffForScene(0);
              }
            } else {
              if (!sc.hookPayoff) {
                sc.hookPayoff = hookHelper.getPayoffForScene(idx);
              }
            }
          });

          // Build master cast dossier across all scenes
          const castMap = new Map<string, any>();
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const currentSceneNum = sc.sceneNumber || (scIdx + 1);
            if (Array.isArray(sc.charactersInScene)) {
              sc.charactersInScene.forEach((c: any) => {
                const key = c.name.toLowerCase().trim();
                if (!castMap.has(key)) {
                  castMap.set(key, {
                    ...c,
                    scenesPresent: [currentSceneNum]
                  });
                } else {
                  const existing = castMap.get(key);
                  if (!existing.scenesPresent.includes(currentSceneNum)) {
                    existing.scenesPresent.push(currentSceneNum);
                  }
                }
              });
            }
          });
          aiData.castDossier = Array.from(castMap.values());
          aiData.characterWeightKg = exactWeight;
          aiData.storyTone = storyTone;

          // REGRA SUPREMA: Trava de Identidade Narrativa e Memória Contínua
          const allCastNames = aiData.castDossier.map((c: any) => c.name);
          if (!aiData.narrativeIdentity || !aiData.narrativeIdentity.centralEvent) {
            aiData.narrativeIdentity = buildNarrativeIdentity(
              theme,
              setting,
              allCastNames,
              aiData.scenes[0],
              isEmotionalStory,
              exactWeight
            );
          } else {
            aiData.narrativeIdentity.isLocked = true;
            if (!aiData.narrativeIdentity.charactersInvolved || aiData.narrativeIdentity.charactersInvolved.length === 0) {
              aiData.narrativeIdentity.charactersInvolved = allCastNames;
            }
          }

          // Enforce narrative memory on every scene
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const prevScenes = aiData.scenes.slice(0, scIdx);
            sc.narrativeMemory = buildNarrativeMemoryForScene(
              sc,
              scIdx,
              aiData.scenes.length,
              prevScenes,
              aiData.narrativeIdentity
            );
          });

          // REGRA SUPREMA — ESTRUTURA NARRATIVA CINEMATOGRÁFICA E CONTINUIDADE DE NOVELINHAS (50+ ANOS DE EXPERIÊNCIA)
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const prevScene = scIdx > 0 ? aiData.scenes[scIdx - 1] : undefined;
            const nextScene = scIdx < aiData.scenes.length - 1 ? aiData.scenes[scIdx + 1] : undefined;
            const nov = buildNovelinhaProgressionForScene(sc, scIdx, aiData.scenes.length, theme, prevScene, nextScene, storyTone);
            sc.novelinhaProgression = nov.novelinhaProgression;
            sc.narrativeBeat = nov.novelinhaProgression.stageName;
            if (!sc.englishPrompt.includes("[NOVELINHA NARRATIVE DIRECTION")) {
              sc.englishPrompt = `${sc.englishPrompt} ${nov.enSnippet}`;
            }
          });

          // REGRA SUPREMA — CONTROLE INDIVIDUAL DE FALAS ENTRE MÚLTIPLOS PERSONAGENS
          aiData.scenes.forEach((sc: any, scIdx: number) => {
            const dt = buildDialogueTurnsForScene(sc, scIdx, sc.charactersInScene || [sc.characterVisualAnchor]);
            sc.dialogue = dt.dialogue;
            sc.characterSpeaking = dt.characterSpeaking;

            if (!sc.englishPrompt.includes("STRICT CHARACTER-TO-DIALOGUE ASSIGNMENT")) {
              sc.englishPrompt = `${sc.englishPrompt} [DIALOGUE ASSIGNMENT & CAMERA DISCIPLINE]: ${MANDATORY_DIALOGUE_ASSIGNMENT_DIRECTIVE}`;
            }
          });

          // Planejamento Global da Novelinha (Protagonista, Conflito, Decisões, Clímax, Desfecho)
          aiData.narrativePlan = buildNarrativePlan(theme, aiData.synopsis || theme, aiData.castDossier || [], aiData.scenes, aiData.narrativePlan);

          // REGRA OBRIGATÓRIA: PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS
          aiData.promptZero = buildPromptZeroReference(
            aiData.castDossier,
            exactWeight,
            storyTone,
            theme,
            targetAi,
            aiData.promptZero
          );
        }
        return res.json({ success: true, data: aiData, isAiGenerated: true });
      }
    }

    // High-fidelity procedural generation tailored specifically to the user's requested parameters
    const proceduralData = generateProceduralCustomBatch(
      theme,
      setting,
      characterFocus,
      targetAi,
      exactNumScenes,
      customDetails,
      exactWeight,
      storyTone,
      customCharacter
    );

    return res.json({
      success: true,
      data: proceduralData,
      isAiGenerated: false,
      info: `Gerado com motor especialista calibrado para elenco diversificado de ${exactWeight}kg e tom ${storyTone}.`,
    });
  } catch (err: any) {
    console.warn("[Prompt Generator] Caught non-fatal generation fallback:", err?.message || err);
    const safeData = generateProceduralCustomBatch(
      theme,
      setting,
      characterFocus,
      targetAi,
      exactNumScenes,
      customDetails,
      exactWeight,
      storyTone,
      customCharacter
    );
    return res.json({
      success: true,
      data: safeData,
      isAiGenerated: false,
    });
  }
};

// ============================================================================
// ENDPOINT: REGRA SUPREMA — CONTINUAR A MESMA HISTÓRIA (CONTINUIDADE NARRATIVA)
// ============================================================================
const handleContinueStory = async (req: any, res: any) => {
  const {
    existingBatch,
    userInstruction = "",
    numNewScenes = 1,
    targetAi = "kling",
    characterWeightKg,
  } = req.body;

  if (!existingBatch || !Array.isArray(existingBatch.scenes) || existingBatch.scenes.length === 0) {
    return res.status(400).json({
      success: false,
      error: "O lote existente com cenas anteriores é obrigatório para continuar a história.",
    });
  }

  const exactWeight = Math.max(40, Math.min(600, Number(characterWeightKg || existingBatch.characterWeightKg) || 300));
  const currentScenes = existingBatch.scenes;
  const lastIndex = currentScenes.length - 1;
  const lastScene = currentScenes[lastIndex];
  const countToGenerate = Math.max(1, Math.min(3, Number(numNewScenes) || 1));
  const isEmotional = existingBatch.storyTone === "emocionante";

  // Retain or build locked narrative identity
  const allExistingChars = (existingBatch.castDossier || []).map((c: any) => c.name);
  const narrativeId = existingBatch.narrativeIdentity || buildNarrativeIdentity(
    existingBatch.themeTitle,
    lastScene.location,
    allExistingChars,
    lastScene,
    isEmotional,
    exactWeight
  );
  narrativeId.isLocked = true;

  if (!existingBatch.promptZero) {
    existingBatch.promptZero = buildPromptZeroReference(
      existingBatch.castDossier,
      exactWeight,
      existingBatch.storyTone || "comedia",
      existingBatch.themeTitle,
      targetAi
    );
  }

  try {
    const gemini = getGeminiClient();
    if (gemini) {
      const continuationPrompt = `
VOCÊ É O DIRETOR CINEMATOGRÁFICO E ROTEIRISTA DE CONTINUIDADE (REGRA SUPREMA).
SUA MISSÃO ABSOLUTA: Gerar exatamente ${countToGenerate} NOVO(S) TAKE(S) em sequência contínua para a MESMA HISTÓRIA QUE JÁ ESTÁ ACONTECENDO.
É TERMINANTEMENTE PROIBIDO REINICIAR A HISTÓRIA, MUDAR DE TEMA, TROCAR DE CENÁRIO OU INVENTAR UMA SITUAÇÃO INDEPENDENTE.

IDENTIDADE NARRATIVA TRAVADA (INVIOLÁVEL):
- Tema Principal: ${narrativeId.mainTheme}
- Acontecimento Central: ${narrativeId.centralEvent}
- Ambiente Travado: ${narrativeId.environment}
- Conflito Principal: ${narrativeId.mainConflict}
- Objetivo Narrativo: ${narrativeId.narrativeObjective}
- Personagens Envolvidos: ${JSON.stringify(narrativeId.charactersInvolved)}

ESTADO ATUAL DO ÚLTIMO TAKE (#${currentScenes.length}):
- Título do Take #${currentScenes.length}: "${lastScene.title}"
- Personagem Falante: "${lastScene.characterSpeaking || lastScene.characterVisualAnchor?.name}"
- Fala do Take #${currentScenes.length} (9s): "${lastScene.dialogue?.fullText}"
- Último Frame [00:09]: "${lastScene.continuityBridge?.outgoingMoment || lastScene.dialogue?.timingBreakdown?.[2]?.action}"
- Posições Espaciais dos Atores: "${lastScene.continuityBridge?.characterSpatialPositions}"

INSTRUÇÃO ADICIONAL DO USUÁRIO (SE HOUVER): "${userInstruction || 'Continuar a história naturalmente a partir do último frame.'}"

DIRETRIZES RÍGIDAS DE CONTINUIDADE:
1. O próximo take será o Take #${currentScenes.length + 1}.
2. O Primeiro Frame [00:00] do Take #${currentScenes.length + 1} DEVE continuar EXATAMENTE a partir do Último Frame do Take #${currentScenes.length}.
3. Mantenha os MESMOS personagens com suas roupas idênticas e peso corporal rigorosamente de ${exactWeight}kg.
4. Cada novo take DEVE ter um diálogo em português brasileiro de exatamente 9 segundos (18 a 24 palavras), dividido em 3 blocos de tempo [00:00-00:03, 00:03-00:06, 00:06-00:09].
5. Prompt em inglês 8k cinematográfico para ${targetAi.toUpperCase()} contendo as descrições de micro-poros, suor e anatomia de ${exactWeight}kg.

Retorne em formato JSON estrito:
{
  "newScenes": [
    {
      "sceneNumber": ${currentScenes.length + 1},
      "title": "Título do Take de Continuação",
      "narrativeBeat": "Continuação Contínua da História",
      "storyConnection": "Conexão direta com o Take #${currentScenes.length}",
      "hookPayoff": "Desdobramento imediato da consequência anterior",
      "narrativeMemory": {
        "establishedFacts": ["Fatos estabelecidos até aqui"],
        "currentLocations": "${narrativeId.environment}",
        "charactersKnowledge": "O que sabem neste take",
        "completedActions": ["Ação do take anterior"],
        "pendingEvents": ["O que falta para o desfecho"],
        "logicalNextStep": "Próximo passo imediato"
      },
      "characterSpeaking": "${lastScene.characterSpeaking || 'Personagem Principal'}",
      "characterVisualAnchor": ${JSON.stringify(lastScene.characterVisualAnchor || {})},
      "charactersInScene": ${JSON.stringify(lastScene.charactersInScene || [])},
      "location": "${narrativeId.environment}",
      "durationSeconds": 9,
      "dialogue": {
        "fullText": "Fala de 9 segundos em português brasileiro (18 a 24 palavras)",
        "wordCount": 20,
        "timingBreakdown": [
          { "time": "00:00 - 00:03", "speech": "Início da fala", "action": "Ação física inicial" },
          { "time": "00:03 - 00:06", "speech": "Meio da fala", "action": "Gesto motivado" },
          { "time": "00:06 - 00:09", "speech": "Fim da fala", "action": "Reação conclusiva" }
        ]
      },
      "englishPrompt": "Prompt em inglês cinematográfico 8k 35mm para ${targetAi.toUpperCase()} com personagens travados de ${exactWeight}kg",
      "portuguesePrompt": "Descrição da cena de continuação em português",
      "negativePrompt": "CGI, 3D render, cartoon, anime, plastic smooth skin, glamour, makeup, slender body, clean luxury room",
      "cameraDirection": "Handheld cinematográfica 35mm orgânica contínua",
      "cinematography": {
        "directorVision": "Visão do diretor de fotografia para esta continuação",
        "cameraType": "Handheld documental 35mm",
        "shotProgression": [
          { "timecode": "00:00 - 00:03", "shotType": "Plano Médio Contínuo", "movement": "Push-in motivado", "focalPoint": "Ação imediata", "lensAndAperture": "35mm f/2.4", "cinematicIntent": "Conectar com take anterior" },
          { "timecode": "00:03 - 00:06", "shotType": "Close-Up Dramático", "movement": "Foco na expressão", "focalPoint": "Rosto suado 8k", "lensAndAperture": "50mm f/2.0", "cinematicIntent": "Destacar reação à fala" },
          { "timecode": "00:06 - 00:09", "shotType": "Contra-campo / Plano Conjunto", "movement": "Pan suave", "focalPoint": "Interlocutor", "lensAndAperture": "35mm f/2.8", "cinematicIntent": "Preparar o desfecho" }
        ],
        "lightingAndAtmosphere": "Luz volumétrica tropical 8k com suor cintilante",
        "lensChoice": "Prime 35mm e 50mm f/2.4",
        "emotionalToneAlignment": "Continuidade emocional perfeita"
      },
      "continuityBridge": {
        "incomingMoment": "${lastScene.continuityBridge?.outgoingMoment || 'Continua o frame do take anterior'}",
        "outgoingMoment": "Gesto final congelado no segundo 00:09",
        "nextSceneHandoff": "Entrega fluida para a sequência",
        "matchCutType": "Corte na Ação Contínua (Match-Action Cut)",
        "characterSpatialPositions": "${lastScene.continuityBridge?.characterSpatialPositions || 'Posições preservadas'}",
        "emotionalContinuity": "Evolução fluida sem quebra de humor"
      },
      "actorDirection": {
        "directorVision": "Biomecânica e inércia de ${exactWeight}kg mantidas",
        "microMovements": "Respiração diafragmática, pestanejar natural",
        "handsAndGrip": "5 dedos perfeitos articulados por mão",
        "biomechanicsAndWeight": "Massa física real de ${exactWeight}kg",
        "reactionSequence": "Olhar -> Expressão -> Gesto -> Fala",
        "dialogueDeliveryAndLips": "Sincronia labial de 9 segundos em PT-BR",
        "spatialInteraction": "Contato sólido com o cenário",
        "antiDeformationRules": "Salvaguarda anatômica estrita"
      },
      "skinAndLighting": "Pele com poros abertos e suor natural 8k",
      "environmentDetails": "${narrativeId.environment}"
    }
  ]
}
`;

      const aiContinuation = await queryGeminiWithFallbacks(gemini, continuationPrompt, getSystemInstruction(exactWeight));
      if (aiContinuation && Array.isArray(aiContinuation.newScenes) && aiContinuation.newScenes.length > 0) {
        const sanitizedNewScenes: any[] = [];
        let runningTotal = currentScenes.length;

        aiContinuation.newScenes.forEach((nsc: any) => {
          runningTotal += 1;
          nsc.sceneNumber = runningTotal;
          nsc.durationSeconds = 9;

          // Ensure dialog timing breakdown
          if (!nsc.dialogue || !Array.isArray(nsc.dialogue.timingBreakdown) || nsc.dialogue.timingBreakdown.length < 3) {
            nsc.dialogue = {
              fullText: nsc.dialogue?.fullText || "A gente não desiste nunca, porque o nosso suor tem valor e a nossa história não para aqui!",
              wordCount: 19,
              timingBreakdown: [
                { time: "00:00 - 00:03", speech: "A gente não desiste nunca...", action: "Gesto firme com as mãos" },
                { time: "00:03 - 00:06", speech: "...porque o nosso suor tem valor...", action: "Olhar expressivo de convicção" },
                { time: "00:06 - 00:09", speech: "...e a nossa história não para aqui!", action: "Respiração pesada e sorriso cúmplice" },
              ],
            };
          }

          // Ensure continuity bridge
          if (!nsc.continuityBridge) {
            nsc.continuityBridge = {
              incomingMoment: lastScene.continuityBridge?.outgoingMoment || "Inicia exatamente no último frame do take anterior",
              outgoingMoment: "Finaliza o gesto com respiração controlada no segundo 00:09",
              nextSceneHandoff: "Conclusão harmônica do arco narrativo",
              matchCutType: "Corte na Ação Contínua (Match-Action Cut)",
              characterSpatialPositions: lastScene.continuityBridge?.characterSpatialPositions || "Posições mantidas sem salto",
              emotionalContinuity: "Coerência emocional ininterrupta",
            };
          }

          // Safety and prompt sanitize
          nsc.englishPrompt = sanitizePromptForFlowAndSafety(nsc.englishPrompt || "");
          nsc.negativePrompt = sanitizeNegativePromptForFlow(nsc.negativePrompt || "");

          // Narrative memory
          const prevForThis = [...currentScenes, ...sanitizedNewScenes];
          nsc.narrativeMemory = buildNarrativeMemoryForScene(
            nsc,
            runningTotal - 1,
            runningTotal + 1,
            prevForThis,
            narrativeId
          );

          sanitizedNewScenes.push(nsc);
        });

        // Append to batch
        existingBatch.scenes.push(...sanitizedNewScenes);
        existingBatch.narrativeIdentity = narrativeId;

        // Update cast present
        sanitizedNewScenes.forEach((sn) => {
          (existingBatch.castDossier || []).forEach((cd: any) => {
            if (!cd.scenesPresent.includes(sn.sceneNumber)) {
              cd.scenesPresent.push(sn.sceneNumber);
            }
          });
        });

        return res.json({
          success: true,
          data: existingBatch,
          isAiGenerated: true,
          addedCount: sanitizedNewScenes.length,
          info: `Adicionado(s) ${sanitizedNewScenes.length} novo(s) take(s) em continuidade estrita pela REGRA SUPREMA.`,
        });
      }
    }
  } catch (err: any) {
    console.warn("[Continue Story] Gemini error, switching to procedural continuity:", err?.message || err);
  }

  // Procedural fallback continuity
  const proceduralNewScenes: any[] = [];
  let runningIndex = currentScenes.length;

  for (let i = 0; i < countToGenerate; i++) {
    runningIndex += 1;
    const isOdd = runningIndex % 2 === 1;
    const actorName = lastScene.characterSpeaking || lastScene.characterVisualAnchor?.name || "Raimundo";
    const responderName = (existingBatch.castDossier || []).find((c: any) => c.name !== actorName)?.name || "Dona Lúcia";

    const speechText = isEmotional
      ? `A gente passou por tanta coisa junto nessa vida, e agora ver essa bênção acontecendo me dá a certeza de que Deus nunca esqueceu da gente!`
      : `Se a gente inventar de mexer nisso de novo vai dar um estrondo que a vizinhança inteira vai vir correndo filmar pra laje!`;

    const ptText = isEmotional
      ? `Continuação direta do Take anterior. ${actorName} e ${responderName} em momento de forte comoção e abraço, lágrimas sinceras escorrendo pelas bochechas sob luz suave.`
      : `Continuação direta do Take anterior. ${actorName} aponta para o problema enquanto ${responderName} balança a cabeça em desaprovação cômica, mantendo o ambiente travado.`;

    const enText = isEmotional
      ? `Direct narrative continuity shot following previous take. Colossal authentic Brazilian people weighing exactly ${exactWeight}kg (approx ${Math.round(exactWeight * 2.20462)} lbs), tears of deep emotional gratitude glistening on weathered skin with 8k pores. Warm ambient sunlight, 35mm anamorphic prime lens f/2.0, cinematic human dignity.`
      : `Direct narrative continuity shot seamlessly matching previous cut. Authentic Brazilian characters with genuine ${exactWeight}kg mass (approx ${Math.round(exactWeight * 2.20462)} lbs), expressive body language, heavy inertia, hand gestures. Handheld 35mm film aesthetic, photorealistic community setting, 8k skin microtexture.`;

    const newScene: any = {
      sceneNumber: runningIndex,
      title: `Take ${runningIndex} - Continuação: A Reação Imediata`,
      narrativeBeat: `Ato de Continuidade: Desdobramento Sem Saltos Temporais`,
      storyConnection: `Inicia exatamente no segundo final do Take #${runningIndex - 1}`,
      hookPayoff: `Escalação da conversa mantendo o gancho central vivo e pulsante`,
      characterSpeaking: isOdd ? actorName : responderName,
      characterVisualAnchor: lastScene.characterVisualAnchor,
      charactersInScene: lastScene.charactersInScene,
      location: narrativeId.environment,
      durationSeconds: 9,
      dialogue: {
        fullText: speechText,
        wordCount: speechText.split(/\s+/).length,
        timingBreakdown: [
          {
            time: "00:00 - 00:03",
            speech: speechText.split(",")[0] || speechText.slice(0, 30),
            action: `Inicia a fala no exato ponto onde o Take #${runningIndex - 1} terminou, sem corte no movimento.`,
          },
          {
            time: "00:03 - 00:06",
            speech: speechText.split(",")[1] || speechText.slice(30, 65),
            action: `Gesticula com 5 dedos perfeitos, transferindo o peso corporal de ${exactWeight}kg no chão.`,
          },
          {
            time: "00:06 - 00:09",
            speech: speechText.split(",")[2] || speechText.slice(65),
            action: `Conclui a colocação olhando nos olhos do interlocutor com respiração diafragmática.`,
          },
        ],
      },
      englishPrompt: sanitizePromptForFlowAndSafety(enText),
      portuguesePrompt: ptText,
      negativePrompt: sanitizeNegativePromptForFlow(""),
      cameraDirection: "Handheld documental 35mm contínua com corte de ação compatível",
      cinematography: {
        directorVision: "Continuidade de câmera sem quebra do eixo dos 180° e com enquadramento complementar motivado.",
        cameraType: "Handheld humana 35mm prime",
        shotProgression: [
          { timecode: "00:00 - 00:03", shotType: "Plano Médio de Continuidade", movement: "Tracking orgânico sutil", focalPoint: "Expressão do falante", lensAndAperture: "35mm f/2.4", cinematicIntent: "Assegurar continuidade espacial" },
          { timecode: "00:03 - 00:06", shotType: "Close-Up Facial Expressivo", movement: "Push-in lento", focalPoint: "Suor e olhos 8k", lensAndAperture: "50mm f/2.0", cinematicIntent: "Acentuar o impacto da fala" },
          { timecode: "00:06 - 00:09", shotType: "Contra-campo de Reação", movement: "Pan motivado", focalPoint: "Reação do parceiro de cena", lensAndAperture: "35mm f/2.8", cinematicIntent: "Fechar o ciclo do take" },
        ],
        lightingAndAtmosphere: "Iluminação volumétrica naturalista contínua.",
        lensChoice: "Lentes 35mm e 50mm",
        emotionalToneAlignment: "Fidelidade rigorosa ao tom da cena",
      },
      continuityBridge: {
        incomingMoment: lastScene.continuityBridge?.outgoingMoment || "Inicia exatamente no último frame do take anterior",
        outgoingMoment: `Finaliza a fala no segundo 00:09 com peito arfando e olhar firme para o parceiro.`,
        nextSceneHandoff: `Ponto de ancoragem para o próximo take ou desfecho conclusivo.`,
        matchCutType: "Corte na Ação Contínua (Match-Action Cut)",
        characterSpatialPositions: lastScene.continuityBridge?.characterSpatialPositions || "Posição preservada em relação ao cenário",
        emotionalContinuity: "Harmonia dramática sem sobressaltos arbitrários",
      },
      actorDirection: {
        directorVision: `Atuação naturalista com respeito à massa corporal de ${exactWeight}kg.`,
        microMovements: "Pestanejar orgânico descompassado, micro-ajuste de equilíbrio nos pés.",
        handsAndGrip: "5 dedos perfeitos articulados por mão sem deformação anatômica.",
        biomechanicsAndWeight: `Inércia gravitacional real de ${exactWeight}kg na movimentação do tronco e membros.`,
        reactionSequence: "Olhar foca -> Cabeça vira -> Expressão muda -> Voz e gesto acompanham.",
        dialogueDeliveryAndLips: "Sincronia labial perfeita em português brasileiro em 9 segundos exatos.",
        spatialInteraction: "Apoio e atrito sólidos com o chão e mobiliário.",
        antiDeformationRules: "Prevenção estrita de deformações e artefatos de IA.",
      },
      skinAndLighting: `Pele autêntica com poros 8k e suor natural condizente com o clima.`,
      environmentDetails: narrativeId.environment,
    };

    const prevList = [...currentScenes, ...proceduralNewScenes];
    newScene.narrativeMemory = buildNarrativeMemoryForScene(
      newScene,
      runningIndex - 1,
      runningIndex + 1,
      prevList,
      narrativeId
    );

    proceduralNewScenes.push(newScene);
  }

  existingBatch.scenes.push(...proceduralNewScenes);
  existingBatch.narrativeIdentity = narrativeId;

  proceduralNewScenes.forEach((sn) => {
    (existingBatch.castDossier || []).forEach((cd: any) => {
      if (!cd.scenesPresent.includes(sn.sceneNumber)) {
        cd.scenesPresent.push(sn.sceneNumber);
      }
    });
  });

  return res.json({
    success: true,
    data: existingBatch,
    isAiGenerated: false,
    addedCount: proceduralNewScenes.length,
    info: `Adicionado(s) ${proceduralNewScenes.length} novo(s) take(s) com motor de continuidade estrita.`,
  });
};

// Endpoint to analyze uploaded character photo for story integration
const handleAnalyzeCharacterImage = async (req: any, res: any) => {
  const { imageBase64, characterName = "Protagonista", characterRole = "Protagonista Principal", weightKg = 300 } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ success: false, error: "Imagem não fornecida." });
  }

  const exactWeight = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const exactLbs = Math.round(exactWeight * 2.20462);

  // Extract base64 clean data and mimeType
  let mimeType = "image/jpeg";
  let base64Data = imageBase64;
  if (imageBase64.includes(";base64,")) {
    const parts = imageBase64.split(";base64,");
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    if (mimeMatch) mimeType = mimeMatch[1];
    base64Data = parts[1];
  }

  try {
    const gemini = getGeminiClient();
    if (gemini) {
      const prompt = `Analise esta foto de referência visual para um personagem que será protagonista de uma série cinematográfica popular brasileira.
O personagem deve ser adaptado com fidelidade aos traços visuais da foto (formato do rosto, cortes de cabelo, cor dos olhos, tom de pele, feições e idade aparente), com as seguintes diretrizes de estilo:
1. PESO MASSIVO DE ${exactWeight}KG (~${exactLbs} LBS): O personagem tem físico colossal pesando VISIVELMENTE ${exactWeight}kg.
2. ROUPAS VISIVELMENTE CURTAS E APERTADAS: As roupas inspiradas na foto original devem ser visivelmente curtas, justas e de tamanho reduzido, esticadas no limite do tecido com costuras sob tensão, que não cabem no corpo de mais de 300kg.
3. SEMPRE SUADO EM TODO MOMENTO: Pele banhada em suor tropical contínuo, gotas visíveis de transpiração escorrendo pelo rosto e pescoço, e marcas naturais de suor nas roupas.

Retorne estritamente um JSON no formato:
{
  "characterName": "${characterName || "Nome Popular"}",
  "characterRole": "${characterRole || "Protagonista Principal"}",
  "genderAndAge": "Gênero e idade aparente baseados na foto",
  "faceAndHair": "Descrição detalhada do rosto, corte/tipo de cabelo, barba ou feições marcantes da foto",
  "lockedAttire": "Descrição das roupas da foto adaptadas para serem VISIVELMENTE CURTAS, MUITO APERTADAS E QUE NÃO CABEM no corpo de ${exactWeight}kg (tecido esticado ao limite, costuras sob tensão, barra subindo) e marcas de suor",
  "bodyTraits": "Massa corporal visivelmente pesando ${exactWeight}kg (~${exactLbs} lbs) com porte volumoso autêntico",
  "distinguishingFeatures": "Acessórios, óculos, boné ou traços singulares identificados da foto",
  "visualSummaryForPrompt": "Master English prompt clause: an anonymous Brazilian person matching the photo's face and hair, visibly weighing ${exactWeight}kg (${exactLbs} lbs), strictly wearing ill-fitting, excessively short and tight clothing strained to maximum tension that does not fit their massive 300kg body, skin continuously drenched in glistening tropical sweat with dripping beads at all times",
  "portugueseSummary": "Resumo em português do personagem fiel à foto com roupas curtas apertadas e suor constante"
}`;

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
      for (const model of candidateModels) {
        try {
          const response = await gemini.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType,
                    },
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text);
            if (parsed) {
              return res.json({ success: true, analysis: parsed, isAiGenerated: true });
            }
          }
        } catch (err: any) {
          console.warn(`[Analyze Character Image] Model ${model} returned:`, err?.status || err?.message);
        }
      }
    }
  } catch (err: any) {
    console.warn("[Analyze Character Image] Gemini Vision fallback:", err?.message || err);
  }

  // Resilient heuristic analysis based on requested name, weight, short tight clothes and drenched sweat
  const heuristicAnalysis = {
    characterName: characterName || "Protagonista da Foto",
    characterRole: characterRole || "Protagonista Principal",
    genderAndAge: "Pessoa brasileira com feições autênticas e olhar expressivo",
    faceAndHair: "Traços faciais fiéis à fotografia enviada, cabelos naturais, sobrancelhas expressivas e bochechas sob porte imponente de mais de 300kg",
    lockedAttire: `Roupas inspiradas na foto, porém VISIVELMENTE CURTAS E MUITO APERTADAS QUE NÃO CABEM no corpo de ${exactWeight}kg: camiseta/regata curta esticada no limite da costura subindo pela barriga, bermuda curta apertando as coxas, e tecido com marcas de suor tropical contínuo`,
    bodyTraits: `Estrutura corporal maciça pesando VISIVELMENTE ${exactWeight}kg (~${exactLbs} lbs) com silhueta volumosa autêntica e presença imponente em cena`,
    distinguishingFeatures: "Acessórios e traços visuais identificados da fotografia de referência",
    visualSummaryForPrompt: `A fictional anonymous Brazilian character matching the uploaded reference photo, undeniably weighing ${exactWeight}kg (${exactLbs} lbs), strictly wearing excessively short, tight and ill-fitting clothes strained to the limit over massive girth that visibly do not fit, continuously drenched in glistening beads of tropical sweat dripping down the face and neck`,
    portugueseSummary: `Personagem baseado na foto enviada, pesando mais de ${exactWeight}kg, vestindo roupas curtas e apertadas que não cabem nele e permanentemente suado em todo momento.`,
  };

  return res.json({ success: true, analysis: heuristicAnalysis, isAiGenerated: false });
};

// Endpoint to analyze user's scene theme/plot and auto-fill all form options
const handleAnalyzeStoryTheme = async (req: any, res: any) => {
  const { theme = "", characterWeightKg = 300, currentTone } = req.body || {};
  const cleanTheme = String(theme || "").trim();
  if (!cleanTheme) {
    return res.status(400).json({ success: false, error: "Tema não fornecido." });
  }

  const exactWeight = Math.max(40, Math.min(600, Number(characterWeightKg) || 300));
  const exactLbs = Math.round(exactWeight * 2.20462);

  try {
    const gemini = getGeminiClient();
    if (gemini) {
      const prompt = `Você é um Diretor Cinematográfico e Roteirista Renomado (50+ anos de experiência) em dramaturgia popular brasileira e engenharia de prompts de IA.
O usuário escreveu o seguinte Tema / Enredo para a cena:
"${cleanTheme}"

Sua missão é ANALISAR A FUNDO esse enredo e PREENCHER TODOS OS PARÂMETROS NARRATIVOS E CINEMATOGRÁFICOS para a produção do vídeo.
Todos os personagens pesam VISIVELMENTE ${exactWeight}kg (~${exactLbs} lbs), vestem roupas visivelmente curtas e apertadas que não cabem neles e estão permanentemente suados de calor tropical.

REGRA SAGRADA DE CENÁRIO:
- O cenário DEVE SEMPRE ser um lugar pobre do Brasil (comunidade, favela, ruela de barro, viela carente).
- SE O CENÁRIO FOR UMA CASA: faça SEMPRE uma casa de favela de uma pessoa bem pobre e meio suja (tijolos baianos furados sem reboco ou reboco descascando com mofo escuro, chão de cimento encardido, fiação de gambiarra exposta, sofá velho rasgado com espuma amarelada exposta e suja, mesa de madeira capenga manchada, goteiras no balde e fogão enferrujado com fuligem).

Analise e determine:
1. "storyTone": "emocionante" (se contiver choro, drama familiar, superação humilde, sacrifício materno, perdão, gratidão), "superacao" (se for conquista, vitória, formatura, casa própria, alívio de dívida) ou "comedia" (se for hilário, malandragem, desculpas, situações inusitadas, brigas engraçadas de comunidade).
2. "recommendedNumScenes": Número recomendado de takes de 9 segundos (de 1 a 6) para desenvolver perfeitamente esse enredo com gancho, desenvolvimento e desfecho (geralmente 3 para arco padrão completo).
3. "setting": Categoria de cenário mais compatível ("sala_cozinha" | "rua_lama" | "boteco_esquina" | "feira_livre" | "barbearia_salao" | "borracharia_oficina" | "obra_laje" | "ponto_onibus" | "mercearia" | "automatico").
4. "settingDescription": Descrição cinematográfica vívida do ambiente específico do enredo do usuário.
5. "customDetails": Instruções detalhadas e ricas de adereços específicos, iluminação dramática, reações emocionais, figurino autêntico e momentos-chave extraídos do enredo do usuário para enriquecer os prompts.
6. "hookHeadline": Frase ou ação de abertura magnética de alto impacto para os primeiros 3 segundos do Take 1.
7. "synopsis": Sinopse cinematográfica condensada (1 a 2 frases) respeitando rigorosamente o enredo do usuário.
8. "mainCharacters": Array com 2 ou 3 personagens ideais para esse enredo, seus nomes populares brasileiros e papéis.
9. "explanation": Explicação amigável em 1 frase resumindo como o enredo foi estruturado para a geração.

Retorne estritamente um JSON no formato:
{
  "theme": "${cleanTheme}",
  "synopsis": "Sinopse fiel ao enredo do usuário",
  "storyTone": "comedia" | "emocionante" | "superacao",
  "numScenes": 3,
  "setting": "sala_cozinha",
  "settingDescription": "Descrição do ambiente",
  "customDetails": "Detalhes de adereços, iluminação e reações do enredo",
  "hookHeadline": "Gancho inicial chamativo nos primeiros 3s",
  "mainCharacters": [
    { "name": "Nome", "role": "Papel na história" }
  ],
  "explanation": "Resumo de como a IA preparou o roteiro para o seu enredo"
}`;

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
      for (const model of candidateModels) {
        try {
          const response = await gemini.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          });

          if (response && response.text) {
            const parsed = JSON.parse(response.text);
            if (parsed) {
              return res.json({ success: true, analysis: parsed, isAiGenerated: true });
            }
          }
        } catch (err: any) {
          console.warn(`[Analyze Story Theme] Model ${model} returned:`, err?.status || err?.message);
        }
      }
    }
  } catch (err: any) {
    console.warn("[Analyze Story Theme] Gemini fallback to heuristic:", err?.message || err);
  }

  // Heuristic rule-based analysis if Gemini is unavailable
  const lower = cleanTheme.toLowerCase();
  let detectedTone: "comedia" | "emocionante" | "superacao" = "comedia";
  if (
    lower.includes("choro") ||
    lower.includes("lágrima") ||
    lower.includes("mãe") ||
    lower.includes("diploma") ||
    lower.includes("fome") ||
    lower.includes("marmita") ||
    lower.includes("sacrifício") ||
    lower.includes("perdão") ||
    lower.includes("emocionante") ||
    lower.includes("doença") ||
    lower.includes("avó") ||
    lower.includes("filho") ||
    lower.includes("sofrimento") ||
    lower.includes("emocion")
  ) {
    detectedTone = "emocionante";
  } else if (
    lower.includes("vitória") ||
    lower.includes("conquista") ||
    lower.includes("casa própria") ||
    lower.includes("superação") ||
    lower.includes("formatura") ||
    lower.includes("aprovad") ||
    lower.includes("venceu")
  ) {
    detectedTone = "superacao";
  } else if (currentTone) {
    detectedTone = currentTone as any;
  }

  let setting: string = "automatico";
  let settingDesc = "Lugar pobre do Brasil (comunidade/favela) adaptado ao enredo";
  if (lower.includes("lama") || lower.includes("rua") || lower.includes("cratera") || lower.includes("buraco") || lower.includes("enchente")) {
    setting = "rua_lama";
    settingDesc = "Rua de barro vermelho da favela com crateras de água de chuva e barracos de tijolo sem reboco";
  } else if (lower.includes("boteco") || lower.includes("bar") || lower.includes("sinuca") || lower.includes("cerveja") || lower.includes("pinga")) {
    setting = "boteco_esquina";
    settingDesc = "Boteco copo-sujo de esquina da favela com estufa de salgados engordurada e mesa de sinuca com feltro puído";
  } else if (lower.includes("pastel") || lower.includes("feira") || lower.includes("caldo de cana") || lower.includes("barraca")) {
    setting = "feira_livre";
    settingDesc = "Feira livre popular da periferia com lonas plásticas rasgadas, tacho de óleo borbulhante e chão batido enlameado";
  } else if (lower.includes("borracharia") || lower.includes("oficina") || lower.includes("pneu") || lower.includes("mecânico") || lower.includes("graxa")) {
    setting = "borracharia_oficina";
    settingDesc = "Borracharia e oficina encardida da favela com montanha de pneus velhos, chão manchado de óleo graxa e compressor roncando";
  } else if (lower.includes("obra") || lower.includes("pedreiro") || lower.includes("laje") || lower.includes("cimento") || lower.includes("concreto")) {
    setting = "obra_laje";
    settingDesc = "Laje em obras no alto da favela com tijolos baianos expostos ao sol quente a pino e vista de barracos de amianto";
  } else if (lower.includes("van") || lower.includes("ônibus") || lower.includes("lotação") || lower.includes("ponto") || lower.includes("kombi")) {
    setting = "ponto_onibus";
    settingDesc = "Ponto de van da favela com telha de amianto quebrada, chão de terra e van amassada";
  } else if (lower.includes("cabelo") || lower.includes("salão") || lower.includes("manicure") || lower.includes("barbearia") || lower.includes("secador")) {
    setting = "barbearia_salao";
    settingDesc = "Salão improvisado na laje da favela com parede de tijolo baiano sem reboco, espelho trincado colado com fita adesiva e toalhas no varal";
  } else if (lower.includes("casa") || lower.includes("sala") || lower.includes("cozinha") || lower.includes("sofá") || lower.includes("tv") || lower.includes("conta") || lower.includes("quarto") || lower.includes("casinha") || lower.includes("porta") || lower.includes("janela")) {
    setting = "sala_cozinha";
    settingDesc = "Interior de casa de favela bem pobre e meio suja (tijolo baiano sem reboco, reboco descascando com mofo, chão de cimento encardido, fiação de gambiarra e sofá rasgado com espuma amarela aparente)";
  }

  let numScenes = 3;
  if (cleanTheme.length > 90 || cleanTheme.includes(" e depois ") || cleanTheme.includes(" em seguida ") || cleanTheme.includes("finalmente")) {
    numScenes = 4;
  } else if (cleanTheme.length < 35) {
    numScenes = 2;
  }

  const isE = detectedTone === "emocionante" || detectedTone === "superacao";
  const customDetails = isE
    ? `Enredo focado em: "${cleanTheme}". Privilegie o drama sincero, lágrimas límpidas escorrendo pelas bochechas roliças de ${exactWeight}kg, abraço afetuoso e calor humano verdadeiro com dignidade popular brasileira.`
    : `Enredo focado em: "${cleanTheme}". Maximize o humor irônico, timing cômico afiado, expressões de espanto, adereços rústicos e a autenticidade documental da periferia.`;

  const heuristic = {
    theme: cleanTheme,
    synopsis: isE
      ? `História emocionante inspirada em: ${cleanTheme}, retratando a superação e o afeto inabalável de personagens de ${exactWeight}kg.`
      : `Situação inusitada do cotidiano brasileiro: ${cleanTheme}, retratada com humor afiado e personagens colossais de ${exactWeight}kg.`,
    storyTone: detectedTone,
    numScenes,
    setting,
    settingDescription: settingDesc,
    customDetails,
    hookHeadline: `Abertura magnética estabelecendo o conflito central de "${cleanTheme.slice(0, 40)}..."`,
    mainCharacters: [
      { name: "Protagonista", role: "Personagem Central" },
      { name: "Co-protagonista", role: "Reação / Interlocutor" },
    ],
    explanation: `IA analisou seu enredo: Tom ${detectedTone.toUpperCase()}, ${numScenes} takes sugeridos, cenário "${settingDesc}" e detalhes cinematográficos configurados!`,
  };

  return res.json({ success: true, analysis: heuristic, isAiGenerated: false });
};

// Endpoint to generate or fetch fresh authentic everyday Brazilian situations (emotional or comedic)
const handleGenerateSituations = async (req: any, res: any) => {
  const reqTone = (req.body?.tone as string) || "comedia";
  const isEmotional = reqTone === "emocionante" || reqTone === "superacao";

  try {
    const gemini = getGeminiClient();
    if (gemini) {
      const situationPrompt = isEmotional
        ? `
Gere 6 novas situações PROFUNDAMENTE EMOCIONANTES, comoventes e inspiradoras do cotidiano brasileiro da periferia (para fazer o público chorar de emoção, se arrepiar e se comover).
TEMAS EMOCIONANTES OBRIGATÓRIOS:
1. O primeiro diploma da família ou aprovação em faculdade pública nas mãos de mãe humilde
2. O pão ou marmita dividido com o vizinho que está passando fome e desempregado
3. A economia em moedinhas guardadas em lata velha para comprar a primeira mochila escolar do neto
4. O perdão e reconciliação familiar calorosa após anos de mágoa
5. O mutirão comunitário sem cobrança para salvar o teto caído de uma senhora idosa
6. A vitória da casinha própria quitada após 30 anos de aluguel e despejos
7. A generosidade de quem tem pouco acolhendo com afeto quem não tem nada
Varie cenários e personagens com peso obrigatório de 300kg.

Retorne estritamente um JSON no formato:
{
  "situations": [
    {
      "id": "slug_curto",
      "title": "Título Curto e Emocionante",
      "synopsis": "Descrição da situação tocante com 1-2 frases destacando a nobreza, lágrimas genuínas e superação da família",
      "setting": "sala_cozinha" | "rua_lama" | "boteco_esquina" | "feira_livre" | "barbearia_salao" | "borracharia_oficina" | "obra_laje" | "ponto_onibus" | "mercearia" | "misto",
      "characterFocus": "diversificado" | "todos" | "raimundo" | "dona_lucia" | "carla" | "seu_tiao" | "valdirene" | "tia_creuza" | "marcao_pedreiro" | "betinho_van" | "pastor_edvaldo" | "irmao",
      "storyTone": "emocionante",
      "customDetails": "Detalhes de lágrimas autênticas, abraço afetuoso e calor humano"
    }
  ]
}
`
        : `
Gere 6 novas situações hilárias, hiper-realistas e autênticas do cotidiano brasileiro da periferia para uma série cômica.
REGRA OBRIGATÓRIA DE DIVERSIFICAÇÃO: DIVERSIFIQUE SEMPRE! NÃO use apenas os mesmos personagens nem os mesmos cenários!
Varie cenários entre feira livre, borracharia, salão, boteco, laje, ponto de van, mercearia, casa simples e rua de terra.
Varie personagens entre Seu Tião, Tia Creuza, Valdirene, Marcão, Betinho, Pastor Edvaldo, Seu Zé, Raimundo, Carla, Dona Lúcia (todos pesando 300kg).

Retorne estritamente um JSON no formato:
{
  "situations": [
    {
      "id": "slug_curto",
      "title": "Título Curto e Chamativo",
      "synopsis": "Descrição da situação hilária com 1-2 frases destacando os personagens de 300kg e o cenário autêntico",
      "setting": "sala_cozinha" | "rua_lama" | "boteco_esquina" | "feira_livre" | "barbearia_salao" | "borracharia_oficina" | "obra_laje" | "ponto_onibus" | "mercearia" | "misto",
      "characterFocus": "diversificado" | "todos" | "raimundo" | "dona_lucia" | "carla" | "seu_tiao" | "valdirene" | "tia_creuza" | "marcao_pedreiro" | "betinho_van" | "pastor_edvaldo" | "irmao",
      "storyTone": "comedia",
      "customDetails": "Detalhes de adereços rústicos e clima da cena"
    }
  ]
}
`;

      const aiResult = await queryGeminiWithFallbacks(
        gemini,
        situationPrompt,
        isEmotional
          ? "Você é um roteirista premiado de dramas humanos comoventes e inspiradores sobre o povo brasileiro. Histórias de fazer chorar com lágrimas verdadeiras e amor genuíno. Todos os personagens pesam obrigatoriamente 300kg."
          : "Você é um roteirista premiado de comédia popular brasileira e periferia realista. Todos os personagens pesam obrigatoriamente 300kg e o elenco e cenários são sempre altamente diversificados."
      );
      if (aiResult && aiResult.situations && Array.isArray(aiResult.situations) && aiResult.situations.length > 0) {
        return res.json({
          success: true,
          situations: aiResult.situations.slice(0, 6),
          isAiGenerated: true,
        });
      }
    }
  } catch (err: any) {
    console.warn("[Situations Generator] Gemini busy, returning procedural situations:", err?.message || err);
  }

  // Fallback / standard rich collection
  return res.json({
    success: true,
    isAiGenerated: false,
  });
};

// Builder for forced visible character physical weight directives for video AI generators (Kling, Runway, Sora, Luma, MiniMax)
function buildForcedWeightDirectives(weightKg: number = 300) {
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);

  let visualAnatomyDesc = "";
  let ptVisualAnatomyDesc = "";
  let antiSlenderNegatives = "";

  if (w >= 180) {
    visualAnatomyDesc = `hyper-colossal physical body mass, enormous protruding round belly sagging heavily downward past the waistband under authentic gravitational pull, deep heavy rolls and thick adipose folds, prominent heavy double and triple chins resting against the upper chest, colossal thick neck with pronounced fat crease, massive round fleshy arms, heavy thighs. All characters strictly wear visibly undersized, excessively short, tight and strained clothes that do not fit their massive 300kg bodies (short tight cropped-style t-shirt or tank top strained taut with pulling seams, short fitted shorts cutting in with tension on seams). All characters are permanently and visibly drenched in continuous glistening tropical sweat with trickles and droplets dripping down foreheads, flushed cheeks, and neck at all times. Strictly NOT slim, NOT athletic, NOT medium weight, NOT mildly chubby; visibly, undeniably, and unmistakably weighing ${w}kg (${lbs} lbs)`;
    ptVisualAnatomyDesc = `físico colossal e maciço pesando VISIVELMENTE ${w}kg (~${lbs} lbs): usando obrigatoriamente roupas visivelmente curtas, justas e apertadas que não cabem nos seus corpos de mais de 300kg (camisetas curtas esticadas no limite e bermudas curtas apertadas sob forte tensão) e permanentemente suados em todo momento com gotas brilhantes de suor escorrendo pelo rosto e pescoço. PROIBIDO qualquer traço de corpo magro, roupas folgadas ou pele seca`;
    antiSlenderNegatives = "slender, slim, skinny, thin, fit, athletic, muscular, lean, toned, average body weight, normal build, flat stomach, narrow waistline, sharp jawline, lean neck, thin arms, model proportions, slight build, underweight, standard body, dry skin, matte skin, dry clothes, loose clothing, baggy clothes, oversized shirts, well-fitting clothes";
  } else if (w >= 120) {
    visualAnatomyDesc = `very heavy, wide and corpulent body mass, large round protruding belly hanging over waistband, visible prominent double chin, thick neck with adipose folds, bulky heavy arms and thighs, tight short stretched clothing visibly too small, glistening perspiration on skin at all times. Visibly and unmistakably weighing ${w}kg (${lbs} lbs). Strictly NOT slim, NOT athletic, NOT average build`;
    ptVisualAnatomyDesc = `físico visivelmente muito pesado e corpulento de ${w}kg (~${lbs} lbs): roupas curtas e justas que não cabem no corpo, suor visível em todo momento e tensão evidente no tecido`;
    antiSlenderNegatives = "slender, slim, skinny, thin, fit, athletic, muscular, lean, flat stomach, narrow waist, model build, underweight, dry skin, baggy clothing";
  } else if (w >= 90) {
    visualAnatomyDesc = `heavy stocky build visibly weighing ${w}kg (${lbs} lbs), thick sturdy torso, robust round belly, solid thick frame, fitted short clothes, visible sweat sheen`;
    ptVisualAnatomyDesc = `físico encorpado e robusto pesando visivelmente ${w}kg (~${lbs} lbs), tronco espesso e sólido com roupas ajustadas e suor natural`;
    antiSlenderNegatives = "slender, skinny, thin, model build, underweight, dry skin";
  } else {
    visualAnatomyDesc = `authentic realistic physique weighing exactly ${w}kg (${lbs} lbs) with natural body proportions and authentic human weight distribution, natural tropical sweat sheen`;
    ptVisualAnatomyDesc = `estrutura física proporcional de ${w}kg (~${lbs} lbs) com distribuição de massa corporal realista e suor de calor ambiente`;
    antiSlenderNegatives = "";
  }

  const enWeightHeader = `[MANDATORY CHARACTER PHYSIQUE, SHORT ILL-FITTING CLOTHES & CONTINUOUS SWEAT: VISIBLY ${w}KG / ${lbs} LBS]: Every character on screen is visibly, undeniably, and unmistakably weighing ${w} kilograms (${lbs} lbs). ${visualAnatomyDesc}.`;
  
  const ptWeightHeader = `[PESO OBRIGATÓRIO DE ${w}KG (~${lbs} LBS), ROUPAS CURTAS APERTADAS E SUOR EM TODO MOMENTO]: Todos os personagens em cena aparentam de forma inquestionável o peso de ${w}kg, vestem roupas curtas que não cabem neles e estão permanentemente suados em todo momento. ${ptVisualAnatomyDesc}.`;

  const negativeWeightAdditions = antiSlenderNegatives ? `${antiSlenderNegatives}, ` : "";

  return {
    w,
    lbs,
    enWeightHeader,
    ptWeightHeader,
    negativeWeightAdditions,
    visualAnatomyDesc,
    ptVisualAnatomyDesc,
  };
}

// Dynamic procedural generator tailored to any user input
function getCharacterVisualAnchor(
  characterKey: string,
  characterSpeaking: string = "",
  weightKg: number = 300
) {
  const normKey = (characterKey || "").toLowerCase();
  const normName = (characterSpeaking || "").toLowerCase();
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);
  const fw = buildForcedWeightDirectives(w);

  if (normKey.includes("lucia") || normName.includes("lucia") || normName.includes("lúcia") || normName.includes("mãe")) {
    return {
      name: "Dona Lúcia",
      roleInStory: "Matriarca / Mãe Exasperada",
      weightKg: w,
      ageAndFace: `Senhora idosa brasileira de ~68 anos com físico visivelmente de ${w}kg (${lbs} lbs), feições maduras marcadas com rugas autênticas, bochechas roliças caídas, queixo duplo e triplo pesado encostando no peito, pescoço grosso com dobras de gordura, sobrancelhas arqueadas em repreensão materna, cabelos grisalhos sal-e-pimenta presos em coque frouxo com mechas soltas.`,
      lockedAttire: `Vestidinho de chita floral vintage curto e muito justo que visivelmente não cabe no corpo de ${w}kg (tecido esticado ao limite com costuras puxando e barra subindo), avental caseiro curto amarrado na cintura volumosa e sandálias rasteiras simples [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Estrutura corporal pesando rigorosamente e VISIVELMENTE ${w}kg (${lbs} lbs): porte volumoso autêntico, ${fw.ptVisualAnatomyDesc}.`,
      perspirationAndSkin: "Pele permanentemente suada pelo calor doméstico e peso corporal, suor denso escorrendo sem parar pelas rugas da testa, bochechas e dobras do pescoço em todo momento, textura de micro-poros 8k com brilho de transpiração.",
      consistencyPromptClause: `A fictional anonymous elderly Brazilian matriarch visibly weighing ${w}kg (${lbs} lbs), salt-and-pepper hair in a loose messy bun, expressive deeply wrinkled face with heavy double chin, colossal ${w}kg body, strictly wearing an undersized short tight vintage floral print house dress strained to maximum tension that does not fit her massive frame, continuously sweating with glistening perspiration trickles running down her face and neck at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("tiao") || normKey.includes("tião") || normName.includes("tião") || normName.includes("tiao") || normName.includes("borracheiro")) {
    return {
      name: "Seu Tião (Borracheiro)",
      roleInStory: "Borracheiro Mestre / Veterano do Bairro",
      weightKg: w,
      ageAndFace: `Homem maduro brasileiro de ~55 anos pesando visivelmente ${w}kg (${lbs} lbs), feições rústicas e cansadas, barba por fazer grisalha, bochechas pesadas com marcas de fuligem e graxa preta, papada volumosa e pescoço colossal com dobras grossas de gordura, olhar sério e experiente.`,
      lockedAttire: `Macacão curto de brim azul marinho manchado de óleo diesel e camiseta preta minúscula esticada ao extremo que não cabem no corpo de ${w}kg (costuras estufadas e botões puxados sob tensão), botas de borracha pretas e pano de prato encardido no ombro [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Corpo maciço pesando rigorosamente e VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}, braços roliços e musculosos sob porte encorpado.`,
      perspirationAndSkin: "Gotas espessas de suor escorrendo continuamente pelas têmporas, dobras profundas do pescoço e peitoral em todo momento, poros dilatados 8k, reflexos de calor tropical e esforço da oficina.",
      consistencyPromptClause: `A fictional anonymous colossal Brazilian mechanic visibly weighing ${w}kg (${lbs} lbs), weathered face with greying stubble and black grease smudges, thick neck with heavy folds and double chin, strictly wearing undersized, short and tight blue denim work overalls strained to maximum tension over immense girth that visibly do not fit his frame, continuously drenched in glistening heavy tropical sweat dripping down at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("creuza") || normName.includes("creuza") || normName.includes("pastel")) {
    return {
      name: "Tia Creuza (Pasteleira)",
      roleInStory: "Pasteleira Carismática / Rainha da Feira",
      weightKg: w,
      ageAndFace: `Senhora carismática de ~60 anos pesando visivelmente ${w}kg (${lbs} lbs), rosto esférico com bochechas volumosas muito coradas e queixo duplo proeminente repousando sobre o colo farto, sorriso acolhedor e olhos expressivos brilhantes.`,
      lockedAttire: `Vestido curto floral de algodão sob avental plástico amarelo curto muito apertado que não cabem no corpo de ${w}kg (tecido esticado com alta tensão), touca rendada branca cobrindo o cabelo [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Estrutura corporal esférica pesando VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}, braços roliços, tronco maciço sob roupas curtas e justas.`,
      perspirationAndSkin: "Brilho intenso de suor pelo vapor do tacho de fritura borbulhante e calor de feira, gotículas cintilantes pingando continuamente nas bochechas e queixo duplo a todo momento, poros 8k úmidos.",
      consistencyPromptClause: `A fictional anonymous round cheerful Brazilian street food vendor visibly weighing ${w}kg (${lbs} lbs), massive spherical torso, heavy double chin, strictly wearing an undersized short tight floral dress and short yellow plastic apron strained taut that do not fit her 300kg body, continuously sweating profusely with glistening beads of sweat dripping at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("valdirene") || normName.includes("valdirene") || normName.includes("cabeleireira")) {
    return {
      name: "Valdirene (Cabeleireira)",
      roleInStory: "Cabeleireira da Laje / Fofoqueira Oficial",
      weightKg: w,
      ageAndFace: `Mulher extrovertida e tagarela de ~42 anos pesando visivelmente ${w}kg (${lbs} lbs), maquiagem popular com batom rosa e unhas postiças compridas decoradas, bobs plásticos coloridos (rosa, azul e amarelo) presos no cabelo volumoso, papada farta e feições expressivas de fofoca.`,
      lockedAttire: `Blusa curta rosa choque justa e calça legging preta curta hiper-apertada esticada no limite que não cabem no corpo de ${w}kg (costuras sob forte tensão revelando o contorno maciço), tamancos de salto [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Corpo expressivo pesando exatamente e VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}, curvas encorpadas sob roupas curtas e apertadas.`,
      perspirationAndSkin: "Pele permanentemente suada pelo calor de laje e secador de cabelo, suor escorrendo pelas têmporas e colo a todo momento, poros nítidos 8k com brilho úmido de mormaço tropical.",
      consistencyPromptClause: `A fictional anonymous Brazilian hair stylist visibly weighing ${w}kg (${lbs} lbs), colorful hair rollers, expressive gossiping face with double chin, strictly wearing an undersized short tight hot-pink top and short tight black stretch leggings strained to maximum tension that do not fit her 300kg frame, continuously sweating with glistening tropical perspiration at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("marcao") || normKey.includes("marcão") || normName.includes("marcão") || normName.includes("marcao") || normName.includes("pedreiro")) {
    return {
      name: "Marcão Pedreiro",
      roleInStory: "Mestre de Obras / Construtor de Respeito",
      weightKg: w,
      ageAndFace: `Homem forte e corpulento de ~48 anos pesando visivelmente ${w}kg (${lbs} lbs), pele bronzeada pelo sol forte, bigode grosso escuro, bochechas largas suadas, papada maciça com queixo duplo, toalha encardida enrolada no pescoço grosso.`,
      lockedAttire: `Bermuda jeans curtíssima cortada e muito apertada cortando as coxas de ${w}kg (cós pressionado sob o abdômen volumoso), sem camisa com toalha de banho encardida no pescoço e botas de segurança empoeiradas [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Tronco maciço pesando VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}, peitoral volumoso e postura de trabalho braçal pesado sob roupas curtas.`,
      perspirationAndSkin: "Suor abundante e contínuo pingando sem parar sob o sol quente a pino do meio-dia, poeira de cimento colada aos ombros e braços ensopados de suor, poros 8k brilhando a todo momento.",
      consistencyPromptClause: `A fictional anonymous shirtless Brazilian construction mason visibly weighing ${w}kg (${lbs} lbs), colossal torso, thick neck folds, strictly wearing undersized cut-off short tight blue denim shorts that do not fit his 300kg frame, hand-towel wrapped around neck, entire body continuously dripping and drenched in heavy tropical sweat under the blazing sun at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("betinho") || normName.includes("betinho") || normName.includes("van") || normName.includes("cobrador")) {
    return {
      name: "Betinho da Van",
      roleInStory: "Cobrador de Lotação / Agitador Urbano",
      weightKg: w,
      ageAndFace: `Rapaz agitado de ~32 anos pesando visivelmente ${w}kg (${lbs} lbs), rosto redondo suado com papada pesada, boné preto de aba curva gasto com logotipo desbotado, fone de ouvido preso em uma orelha, expressão acelerada.`,
      lockedAttire: `Regata de time de futebol minúscula e curta esticada a ponto de rasgar que não cabe no corpo de ${w}kg (subindo pela barriga), bermuda curta apertada espremendo as coxas, pochete preta esticada no limite da fivela e tênis gasto [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Volume corporal maciço de ${w}kg (${lbs} lbs) VISIVELMENTE comprimido na van: ${fw.ptVisualAnatomyDesc}.`,
      perspirationAndSkin: "Filetes contínuos de suor escorrendo pelas têmporas, queixo duplo e pescoço pelo calor sufocante da van em todo momento, poros cutâneos nítidos 8k e marcas escuras de suor na regata.",
      consistencyPromptClause: `A fictional anonymous Brazilian transit fare collector visibly weighing ${w}kg (${lbs} lbs), worn black cap, round sweaty face with heavy double chin, strictly wearing an undersized short tight athletic tank top that does not fit his massive 300kg body and rises up over his stomach, short tight shorts, continuously drenched in glistening beads of sweat at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("carla") || normName.includes("carla") || normName.includes("esposa")) {
    return {
      name: "Carla",
      roleInStory: "Esposa / Cobrança Cômica",
      weightKg: w,
      ageAndFace: `Mulher brasileira de ~35 anos pesando visivelmente ${w}kg (${lbs} lbs), rosto largo e expressivo com bochechas volumosas e queixo duplo evidente, olhar cômico de indignação e cobrança, cabelo castanho escuro ondulado preso para trás com presilha plástica.`,
      lockedAttire: `Camiseta lilás curta justa que não cabe no corpo de ${w}kg (subindo e marcando o abdômen volumoso sob tensão nas costuras), shorts ciclista preto curto muito justo esticado sobre coxas grossas, chinelos slide pretos [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Corpo maciço pesando rigorosamente e VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}.`,
      perspirationAndSkin: "Umidade e suor tropical constante em todo momento na testa, queixo e decote, manchas de suor na camiseta curta, pele com poros visíveis 8k com brilho molhado autêntico.",
      consistencyPromptClause: `A fictional anonymous Brazilian woman visibly weighing ${w}kg (${lbs} lbs), dark wavy hair tied with clip, expressive face with heavy jowls, strictly wearing an undersized short tight washed-out lilac t-shirt that does not fit her 300kg frame, short tight black biker shorts, continuously sweating with natural glistening perspiration at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("ze") || normKey.includes("zé") || normName.includes("zé") || normName.includes("bar") || normName.includes("boteco")) {
    return {
      name: "Seu Zé do Bar",
      roleInStory: "Dono do Boteco / Guardião da Sinuca",
      weightKg: w,
      ageAndFace: `Homem de ~58 anos pesando visivelmente ${w}kg (${lbs} lbs), calvície frontal com cabelo grisalho ralo nas laterais, bigode espesso e queixo duplo volumoso repousando no pescoço grosso, expressão desconfiada atrás do balcão.`,
      lockedAttire: `Camisa curta de botões abertos que não fecham sobre a barriga de ${w}kg, regata branca curta esticada ao extremo por baixo que não cabe nele, bermuda curta cáqui com cinto no último furo e chinelos [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Abdômen imponente pesando VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}.`,
      perspirationAndSkin: "Suor escorrendo continuamente pela testa calva, têmporas e bigode sob o calor abafado do boteco a todo momento, poros 8k com brilho de transpiração, gola da regata ensopada de suor.",
      consistencyPromptClause: `A fictional anonymous Brazilian tavern owner visibly weighing ${w}kg (${lbs} lbs), balding with thick moustache and double chin, strictly wearing an undersized unbuttoned short shirt over a short tight white undershirt that visibly does not fit his massive 300kg torso, short khaki shorts, continuously drenched in glistening perspiration at all times, consistent identical character across all shots`
    };
  }

  if (normKey.includes("vizinho") || normKey.includes("irmao") || normKey.includes("irmão")) {
    return {
      name: `Vizinho Curioso de ${w}kg`,
      roleInStory: "Testemunha / Vizinho Observador",
      weightKg: w,
      ageAndFace: `Homem brasileiro de ~36 anos pesando visivelmente ${w}kg (${lbs} lbs), boné virado para trás, sobrancelhas arqueadas em surpresa, queixo duplo largo e pescoço volumoso com dobras de gordura.`,
      lockedAttire: `Camiseta verde curta e apertada esticada no peito e abdômen de ${w}kg que não cabe nele (subindo pela barriga), bermuda jeans curta desfiada apertada marcando as coxas e chinelos azuis [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
      bodyAndWeight300kg: `Massa corporal pesando VISIVELMENTE ${w}kg (${lbs} lbs): ${fw.ptVisualAnatomyDesc}, debruçada sobre o muro de tijolo baiano.`,
      perspirationAndSkin: "Gotículas de suor pingando continuamente pelas têmporas e pescoço sob o sol de rua a todo momento, pele bronzeada com poros visíveis 8k e transpiração brilhante.",
      consistencyPromptClause: `A fictional anonymous Brazilian neighbor visibly weighing ${w}kg (${lbs} lbs) leaning over a brick wall, backwards cap, round face with heavy jowls, strictly wearing an undersized short tight green t-shirt that does not fit his massive 300kg body, short tight denim shorts, continuously sweating with visible beads of sweat dripping at all times, consistent identical character across all shots`
    };
  }

  // Default: Raimundo (o protagonista mais icônico)
  return {
    name: "Raimundo (Rogério)",
    roleInStory: "Protagonista / Malandro Otimista",
    weightKg: w,
    ageAndFace: `Homem brasileiro de ~38 anos pesando visivelmente ${w}kg (${lbs} lbs), rosto largo arredondado com bochechas volumosas e queixo duplo proeminente repousando sobre o peito, pescoço grosso com dobras profundas de gordura, cabelo preto encaracolado estilo mullet desalinhado, barba rala por fazer de três dias, olhar expressivo e malandro.`,
    lockedAttire: `Regata cinza mescla canelada visivelmente curta e muito apertada que não cabe no corpo de ${w}kg (estilo cropped curto esticado no limite da costura subindo pela barriga colossal de ${w}kg, com marcas escuras de suor ensopado), bermuda marrom curta e apertada espremendo as coxas e chinelos pretos tradicionais de borracha [ROUPAS IDÊNTICAS EM TODOS OS TAKES].`,
    bodyAndWeight300kg: `Estrutura corporal pesando rigorosamente e VISIVELMENTE ${w}kg (${lbs} lbs): abdômen enorme e proeminente caindo pesadamente sob a gravidade, ${fw.ptVisualAnatomyDesc}.`,
    perspirationAndSkin: "Pele permanentemente ensopada de suor denso e brilhante em todo momento, gotas escorrendo sem parar pelas têmporas, queixo duplo e peitoral peludo, micro-poros 8k com reflexos molhados contínuos de calor tropical.",
    consistencyPromptClause: `A fictional anonymous, visibly massive ${w}kg (${lbs} lbs) Brazilian working-class man, undeniably weighing ${w}kg with an enormous protruding belly heavily hanging down under gravity, heavy double and triple chins, thick neck rolls, curly mullet hair, strictly wearing an excessively short, tight and undersized heather grey sleeveless tank top that visibly does not fit his massive 300kg frame, strained taut at the seams, short tight brown shorts with waistband cutting in, continuously drenched in glistening beads and trickles of tropical sweat dripping down face and chest at all times, consistent identical character across all shots`
  };
}

// Detect and lock all characters appearing in a scene
function detectAllCharactersInScene(
  textToScan: string,
  primaryCharKey: string = "raimundo",
  primaryCharName: string = "",
  weightKg: number = 300
) {
  const characters: any[] = [];
  const addedNames = new Set<string>();

  // Primary speaker/character
  const primary = getCharacterVisualAnchor(primaryCharKey, primaryCharName, weightKg);
  characters.push(primary);
  addedNames.add(primary.name.toLowerCase());

  const lower = textToScan.toLowerCase();

  const characterRegistry = [
    { key: "raimundo", name: "Raimundo", matches: ["raimundo", "rogério", "rogerio", "filho"] },
    { key: "dona_lucia", name: "Dona Lúcia", matches: ["dona lúcia", "dona lucia", "lúcia", "lucia", "mãe", "matriarca"] },
    { key: "carla", name: "Carla", matches: ["carla", "esposa", "mulher"] },
    { key: "seu_tiao", name: "Seu Tião", matches: ["tião", "tiao", "borracheiro", "oficina"] },
    { key: "tia_creuza", name: "Tia Creuza", matches: ["creuza", "pasteleira", "feira", "pastel"] },
    { key: "valdirene", name: "Valdirene", matches: ["valdirene", "cabeleireira", "salão", "salao"] },
    { key: "marcao_pedreiro", name: "Marcão Pedreiro", matches: ["marcão", "marcao", "pedreiro", "laje", "obra"] },
    { key: "betinho_van", name: "Betinho da Van", matches: ["betinho", "cobrador", "van", "lotação"] },
    { key: "seu_ze", name: "Seu Zé do Bar", matches: ["seu zé", "seu ze", "dono do bar", "boteco", "sinuca"] },
    { key: "irmao_vizinhos", name: `Vizinho Curioso de ${weightKg}kg`, matches: ["vizinho", "vizinha", "muro", "testemunha"] },
  ];

  for (const reg of characterRegistry) {
    if (reg.matches.some((m) => lower.includes(m))) {
      const anchor = getCharacterVisualAnchor(reg.key, reg.name, weightKg);
      if (!addedNames.has(anchor.name.toLowerCase())) {
        characters.push(anchor);
        addedNames.add(anchor.name.toLowerCase());
      }
    }
  }

  return characters;
}

// ============================================================================
// DIREÇÃO DE FOTOGRAFIA & TAKES CINEMATOGRÁFICOS (DIRETOR COM 50+ ANOS DE EXPERIÊNCIA)
// ============================================================================
function buildCinematographyForScene(
  sc: any,
  sceneIndex: number,
  totalScenes: number,
  targetAi: string = "kling"
): {
  cinematography: any;
  cameraDirectionText: string;
  enCinematographySnippet: string;
  ptCinematographySnippet: string;
} {
  const sceneId = sc.id || "";
  const location = sc.location || "";
  const charSpeaking = sc.characterSpeaking || "Raimundo";
  const title = sc.title || "";
  const fullDialogue = sc.dialogue?.fullText || sc.speech || "";
  const textCorpus = `${sceneId} ${location} ${title} ${charSpeaking} ${fullDialogue}`.toLowerCase();

  // If Gemini already generated a complete cinematography object with shot progression, validate & enhance it
  if (
    sc.cinematography &&
    typeof sc.cinematography === "object" &&
    Array.isArray(sc.cinematography.shotProgression) &&
    sc.cinematography.shotProgression.length >= 2 &&
    sc.cinematography.directorVision
  ) {
    const existing = sc.cinematography;
    const shots = existing.shotProgression;
    const cameraDirectionText = `Handheld orgânica humana (50 anos de experiência): ${shots.map((s: any) => `[${s.timecode || "00:00"}]: ${s.shotType || "Plano Médio"} (${s.movement || "Push-in suave"})`).join(" • ")}. Lentes: ${existing.lensChoice || "35mm prime f/2.4"}. ${existing.lightingAndAtmosphere || "Iluminação naturalista com reflexos de suor 8k"}.`;
    
    const enShotDescriptions = shots.map((s: any) => `[${s.timecode || "00:00 - 00:03"}]: ${s.shotType}, ${s.movement}, focusing on ${s.focalPoint || "character action"}, lens ${s.lensAndAperture || "35mm f/2.4"}`).join(". ");
    const ptShotDescriptions = shots.map((s: any) => `• [${s.timecode || "00:00 - 00:03"}]: ${s.shotType} com ${s.movement} (Foco: ${s.focalPoint || "Ação"}). Lente: ${s.lensAndAperture || "35mm f/2.4"}`).join("\n");

    const enSnippet = `[CINEMATOGRAPHY - 50-YEAR VETERAN DIRECTOR OF PHOTOGRAPHY DIRECTION]: Handheld human camera with subtle realistic breathing oscillations (zero synthetic jitter, strictly preserving 300kg mass and locked attires without morphing). ${enShotDescriptions}. Lens: ${existing.lensChoice || "35mm prime"}, cinematic depth of field, naturalistic lighting with specular sweat highlights.`;
    const ptSnippet = `[DIREÇÃO DE FOTOGRAFIA & TAKES CINEMATOGRÁFICOS]:
• Visão do Diretor: ${existing.directorVision}
• Estilo de Câmera: ${existing.cameraType || "Câmera Handheld humana realista com micro-oscilações orgânicas sutis (sem tremores bruscos e sem deformações de IA)"}
• Decupagem de Takes (9 Segundos):
${ptShotDescriptions}
• Iluminação & Lentes: ${existing.lightingAndAtmosphere || "Luz natural volumétrica com reflexos de suor"}. Lentes: ${existing.lensChoice || "35mm prime f/2.4"}.
• Alinhamento Emocional: ${existing.emotionalToneAlignment || "Calibrado para pontuar o contraste dramático e cômico da cena"}`;

    return {
      cinematography: existing,
      cameraDirectionText,
      enCinematographySnippet: enSnippet,
      ptCinematographySnippet: ptSnippet,
    };
  }

  // Bespoke archetypes based on scene context
  let cineData: any = null;

  if (textCorpus.includes("pastel") || textCorpus.includes("feira") || textCorpus.includes("creuza")) {
    cineData = {
      directorVision: "Abordagem documental sensorial de feira livre periférica. O operador humano se posiciona espremido entre as lonas da barraca, utilizando o vapor de fritura como difusor natural para destacar a imponência acolhedora de Tia Creuza (300kg) e a expectativa voraz de Raimundo (300kg).",
      cameraType: "Câmera Handheld humana realista com pequenas oscilações orgânicas de respiração (operador físico presente na feira, sem tremores bruscos e sem distorções de IA).",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano de Detalhe (Insert Shot)",
          movement: "Push-in motivado no nível do balcão acompanhando a subida do pegador de metal",
          focalPoint: "Tacho com óleo borbulhante e o pastel gigante dourado fumegante",
          lensAndAperture: "35mm prime f/2.0",
          cinematicIntent: "Estabelecer o calor sensorial da feira e a tentação gastronômica imediata"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Plano Médio com Push-In Facial",
          movement: "Aproximação suave em tilt-up subindo do avental amarelo até os olhos",
          focalPoint: "Rosto suado e bochechas pesadas de Tia Creuza ao rir e enxugar a testa com a mão roliça",
          lensAndAperture: "50mm prime f/2.2",
          cinematicIntent: "Capturar a simpatia humana e a comédia da afirmação sobre autorização médica de 300kg"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Conjunto Lateral de Reação",
          movement: "Pull-out controlado em arco revelando o balcão rústico",
          focalPoint: "Pastel pousando no guardanapo enquanto Raimundo arregala os olhos faminto com regata cinza suada",
          lensAndAperture: "28mm prime f/2.8",
          cinematicIntent: "Enquadrar a conclusão da fala e o desfecho cômico da entrega do pastel"
        }
      ],
      lightingAndAtmosphere: "Luz solar tropical quente difusa filtrada por lonas azul e amarela da barraca, reflexos dourados no suor da pele 8k e vapor denso de fritura em suspensão.",
      lensChoice: "Lentes prime 35mm e 50mm cinematográficas com profundidade rasa de campo f/2.0-f/2.2 para isolamento orgânico de fundo.",
      emotionalToneAlignment: "Ritmo caloroso e aconchegante, pontuando a gargalhada popular e a cumplicidade de bairro."
    };
  } else if (textCorpus.includes("borracharia") || textCorpus.includes("pneu") || textCorpus.includes("tião") || textCorpus.includes("tiao") || textCorpus.includes("oficina")) {
    cineData = {
      directorVision: "Direção crua inspirada no cinema vérité industrial periférico. A câmera se posiciona rente ao chão de terra batida para amplificar a monumentalidade dos pneus de trator e a força bruta de Seu Tião (300kg), valorizando a graxa e as marcas do ofício.",
      cameraType: "Câmera Handheld realista de operador caminhando entre sucatas e compressores, respiração ritmada com o esforço físico pesado, sem deformações espaciais.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Médio em Contra-Plongée (Low-Angle Hero Shot)",
          movement: "Travelling lateral lento em arco no nível dos aros enferrujados",
          focalPoint: "Tronco colossal de 300kg de Seu Tião em macacão azul apoiado sobre o pneu de trator",
          lensAndAperture: "28mm prime f/2.8",
          cinematicIntent: "Transmitir a imponência mecânica e a gravidade operária do ambiente"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Close-Up Expressivo no Esforço",
          movement: "Push-in motivado na batida da chave inglesa, subindo para o olhar determinado",
          focalPoint: "Impacto da ferramenta de aço no aro e rosto suado com bigode grisalho respirando pesado",
          lensAndAperture: "50mm prime f/2.0",
          cinematicIntent: "Destacar a convicção orgulhosa e o cansaço do homem trabalhador de 300kg"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Médio Aberto de Reação",
          movement: "Pull-out suave com reenquadramento mantendo o eixo de 180°",
          focalPoint: "Gesto com a mão suja de graxa apontando para o compressor verde roncando ao fundo enquanto Raimundo acena",
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Fechar a fala com cumplicidade de amizade operária autêntica"
        }
      ],
      lightingAndAtmosphere: "Contraluz natural vindo do portão aberto da rua com penumbra rica no interior da oficina, poeira de borracha e partículas de ferrugem no ar.",
      lensChoice: "Lentes prime 28mm e 50mm com separação nítida de fundo e aberrações ópticas contidas.",
      emotionalToneAlignment: "Tom solene de quem domina a máquina pesada, pontuado pela comédia da resistência infinita do pneu."
    };
  } else if (textCorpus.includes("laje") || textCorpus.includes("obra") || textCorpus.includes("marcao") || textCorpus.includes("marcão") || textCorpus.includes("pedreiro")) {
    cineData = {
      directorVision: "Estética cinematográfica sob luz equatorial direta. A direção valoriza a arquitetura popular do tijolo baiano inacabado, os vergalhões expostos e a titanomaquia dos operários de 300kg erguendo a estrutura sob sol inclemente.",
      cameraType: "Handheld orgânica na laje, com oscilação física sutil de operador que se desloca cuidadosamente entre tábuas e sacos de cimento.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Médio Amplo Estabelecedor",
          movement: "Slow push-in frontal sobre o piso de concreto áspero",
          focalPoint: "Marcão (300kg) sem camisa com toalha no pescoço batendo na coluna com a colher de pedreiro",
          lensAndAperture: "35mm prime f/3.2",
          cinematicIntent: "Estabelecer a monumentalidade do esforço na laje e a robustez da viga"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Close-Up no Suor e Desafio",
          movement: "Push-in contínuo no rosto banhado em suor tropical reflexivo",
          focalPoint: "Toalha encardida enxugando a testa, sorriso banguelo e olhar desafiador para os céticos",
          lensAndAperture: "50mm prime f/2.4",
          cinematicIntent: "Valorizar a autoridade e o orgulho cômico do mestre de obras de 300kg"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Conjunto Lateral em Eixo",
          movement: "Pull-out em arco lateral revelando a betoneira amarela girando",
          focalPoint: "Viga perfeitamente alinhada no prumo e gargalhada dos companheiros de 300kg",
          lensAndAperture: "28mm prime f/2.8",
          cinematicIntent: "Concluir com a comédia da viga indestrutível que aguenta a diretoria inteira"
        }
      ],
      lightingAndAtmosphere: "Luz solar dura do meio-dia (hard midday sun) com sombras de alto contraste no concreto, brilho vítreo de suor e pó de cimento em suspensão.",
      lensChoice: "Lentes prime 35mm e 50mm em f/3.2 para preservar detalhes de textura nos tijolos e na pele.",
      emotionalToneAlignment: "Exaltação cômica e triunfante da força comunitária e do prumo impecável."
    };
  } else if (textCorpus.includes("salao") || textCorpus.includes("salão") || textCorpus.includes("valdirene") || textCorpus.includes("fofoca") || textCorpus.includes("cabelo")) {
    cineData = {
      directorVision: "Decupagem intimista e voyeurística no salão da laje. O cinegrafista utiliza o espelho trincado como elemento cênico de duplicação espacial, conduzindo o olhar do espectador para o centro da fofoca em close-up conspiratório.",
      cameraType: "Handheld delicada e ágil de câmera operada no espaço exíguo do salão, sem tremores bruscos e respeitando o limite dos corpos de 300kg.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Over-the-Shoulder pelo Espelho",
          movement: "Aproximação suave em direção ao reflexo do espelho",
          focalPoint: "Reflexo de Valdirene de 300kg desligando o secador rosa atrás da cliente",
          lensAndAperture: "35mm prime f/2.2",
          cinematicIntent: "Criar o suspense cênico da revelação da fofoca que estava abafada pelo secador"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Close-Up Dramático Conspiratório",
          movement: "Push-in frontal fechando nos olhos arregalados e bobs no cabelo",
          focalPoint: "Lábios cochichando o segredo, sobrancelhas arqueadas e suor reluzente nas maçãs do rosto",
          lensAndAperture: "50mm prime f/1.8",
          cinematicIntent: "Isolar o pico de surpresa da fofoca do bairro com máxima expressividade"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Conjunto de Duas Reações (Two-Shot)",
          movement: "Pull-out e pan lateral de reação capturando o ventilador de mesa",
          focalPoint: "As duas mulheres de 300kg rindo copiosamente e batendo a mão na coxa com o ventilador soprando",
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Fechar com a cumplicidade escandalosa da fofoca consumada"
        }
      ],
      lightingAndAtmosphere: "Luz fluorescente quente misturada com luz natural de basculante, reflexos multicoloridos de esmaltes e vapor de prancha térmica.",
      lensChoice: "50mm prime f/1.8 para isolamento do rosto com bokeh suave nos frascos de xampu.",
      emotionalToneAlignment: "Suspense fofoqueiro cômico que explode em gargalhada compartilhada."
    };
  } else if (textCorpus.includes("van") || textCorpus.includes("betinho") || textCorpus.includes("cobrador") || textCorpus.includes("lotacao") || textCorpus.includes("lotação")) {
    cineData = {
      directorVision: "Estilo documental de rua ágil e dinâmico. A câmera opera na calçada da avenida tumultuada, acompanhando a coreografia caótica do embarque na lotação e o aperto cômico dos passageiros de 300kg.",
      cameraType: "Handheld urbana realista acompanhando a vibração do motor diesel e a correria dos pedestres.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Médio em Tracking Lateral",
          movement: "Tracking lateral na calçada acompanhando Betinho batendo na lataria da van",
          focalPoint: "Betinho de 300kg na porta de correr e o fluxo de pedestres tentando subir",
          lensAndAperture: "28mm prime f/2.8",
          cinematicIntent: "Estabelecer a urgência do transporte público e o grito de chamada da lotação"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Plano de Detalhe (Insert) para Close Facial",
          movement: "Push-in veloz focado na pochete esticada e subindo para o rosto",
          focalPoint: "Notas amassadas de 2 reais nas mãos roliças e careta de motorista estressado rindo",
          lensAndAperture: "50mm prime f/2.0",
          cinematicIntent: "Revelar a rotina exaustiva e o absurdo cômico da lotação infinita"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Médio de Perfil no Degrau da Van",
          movement: "Pan suave acompanhando Raimundo prendendo a respiração para passar na porta",
          focalPoint: "Corpo de 300kg se encaixando no banco estreito e passageiros rindo da manobra",
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Encerrar com o humor clássico da van lotada partindo na fumaça"
        }
      ],
      lightingAndAtmosphere: "Luz de fim de tarde alaranjada refletindo na lataria amassada da van, fumaça de escapamento e asfalto com calor ondulante.",
      lensChoice: "28mm prime para capturar o contexto amplo da avenida e 50mm para o detalhe do dinheiro.",
      emotionalToneAlignment: "Pressa cômica, agitação popular e resiliência bem-humorada."
    };
  } else if (textCorpus.includes("bar") || textCorpus.includes("boteco") || textCorpus.includes("sinuca") || textCorpus.includes("zé") || textCorpus.includes("ze")) {
    cineData = {
      directorVision: "Atmosfera de suspense periférico em tom de paródia de faroeste. O cinegrafista entra no bar como um freguês silencioso, deslizando suavemente entre a estufa de pasteis e a mesa de sinuca para registrar a tensão cômica da aposta.",
      cameraType: "Handheld orgânica estável em nível médio, com balanço de respiração humana que reforça a densidade do ar.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Médio em Travelling Lento",
          movement: "Slow tracking passando pela estufa de salgados até encontrar Seu Zé",
          focalPoint: "Estufa de vidro engordurada e Seu Zé (300kg) de camisa florida aberta atrás da mesa",
          lensAndAperture: "35mm prime f/2.0",
          cinematicIntent: "Estabelecer o clima de boteco de esquina e a seriedade da cobrança da sinuca"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Close-Up Dramático no Giz e Olhar",
          movement: "Push-in focado no taco subindo para os olhos semicerrados",
          focalPoint: "Ponta do taco de sinuca recebendo giz azul e olhar severo com queixo duplo volumoso",
          lensAndAperture: "50mm prime f/1.8",
          cinematicIntent: "Pontuar o clímax da aposta e a pose intimidatória de Seu Zé"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Conjunto em Eixo de 180°",
          movement: "Pull-out suave mantendo o eixo espacial da mesa de bilhar",
          focalPoint: "Feltro verde desgastado, bolas espalhadas e Raimundo sorrindo amarelo com regata suada",
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Concluir com o confronto de malandros de 300kg prontos para a tacada decisiva"
        }
      ],
      lightingAndAtmosphere: "Lâmpadas incandescentes amarelas baixas sobre o feltro verde da sinuca, penumbra densa e condensação gelada em garrafas de cerveja.",
      lensChoice: "35mm e 50mm prime com profundidade de campo f/1.8 para criar sensação intimista e claustrofóbica.",
      emotionalToneAlignment: "Tensão de duelo de faroeste traduzida em comédia de boteco brasileiro."
    };
  } else if (textCorpus.includes("sofa") || textCorpus.includes("sofá") || textCorpus.includes("sala") || textCorpus.includes("refrigerante") || textCorpus.includes("carla")) {
    cineData = {
      directorVision: "Realismo social doméstico e intimismo cômico. A câmera permanece em altura média de sala de estar, valorizando a decadência da espuma do sofá velho e a dramaticidade teatral da justificativa de Raimundo (300kg).",
      cameraType: "Handheld documental compassada, pequenas oscilações de operador sentado na sala, sem movimentos artificiais.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Médio Frontal com Suave Low-Angle",
          movement: "Estabilização suave com respiração humana sutil",
          focalPoint: "Raimundo (300kg) afundado no sofá marrom rasgado segurando a garrafa pet como um troféu",
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Apresentar o conforto desavergonhado e a pose de filósofo preguiçoso de sofá"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Push-In Lento para Close Expressivo",
          movement: "Aproximação suave no rosto largo de Raimundo",
          focalPoint: "Bochechas trêmulas ao falar, gotas de suor na testa e convicção descarada no olhar",
          lensAndAperture: "50mm prime f/2.0",
          cinematicIntent: "Isolar a cara de pau hilária da desculpa dada pelo personagem"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Pan Rápido Suave para a Porta (Whip-Pan)",
          movement: "Giro lateral controlado em direção ao corredor da casa",
          focalPoint: "Carla ou Dona Lúcia (300kg) parada no batente com braços cruzados e sobrancelhas erguidas em fúria",
          lensAndAperture: "35mm prime f/2.8",
          cinematicIntent: "Revelar a represália iminente e fechar com punchline visual de desespero cômico"
        }
      ],
      lightingAndAtmosphere: "Luz suave de TV de tubo antiga iluminando a sala com apoio de lâmpada amarela do corredor, criando sombras orgânicas nas dobras corporais de 300kg.",
      lensChoice: "35mm prime para estabilidade de ambiente e 50mm f/2.0 para expressividade facial cômica.",
      emotionalToneAlignment: "Contraste irônico entre a lábia do malandro e a chegada da dura realidade."
    };
  } else if (textCorpus.includes("boleto") || textCorpus.includes("lúcia") || textCorpus.includes("lucia") || textCorpus.includes("conta") || textCorpus.includes("mãe")) {
    cineData = {
      directorVision: "Direção dramática de alta tensão cômica em conflito doméstico. A câmera se coloca no centro da discussão, alternando planos rasantes nos boletos amassados com closes implacáveis na matriarca de 300kg.",
      cameraType: "Handheld atenta e reativa de operador documental em cômodo apertado, reagindo aos tapas na mesa.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Rasante na Mesa (Low Table Insert)",
          movement: "Push-in tenso sobre a toalha plástica até a mão bater na madeira",
          focalPoint: "Boletos vermelhos de luz vencidos sendo esmagados pela mão pesada de Dona Lúcia (300kg)",
          lensAndAperture: "35mm prime f/2.0",
          cinematicIntent: "Definir a causa da crise financeira de forma física, pesada e inegável"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Tilt-Up Veloz para Close da Matriarca",
          movement: "Movimento ascendente rápido enquadrando o semblante furioso",
          focalPoint: "Queixo duplo de Dona Lúcia tremendo de raiva, avental florido e dedo em riste acusatório",
          lensAndAperture: "50mm prime f/2.0",
          cinematicIntent: "Capturar o ápice da bronca materna e o desespero com as contas"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Plano Over-the-Shoulder de Reação",
          movement: "Enquadramento por cima do ombro maciço transferindo o foco",
          focalPoint: "Raimundo (300kg) encolhendo os ombros de cabeça baixa com sorriso de coitado",
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Encerrar com a rendição cômica do filho apanhando verbalmente"
        }
      ],
      lightingAndAtmosphere: "Luz amarela incandescente nua sobre a mesa de fórmica, reflexos de suor nas têmporas e sombras densas sob o queixo duplo.",
      lensChoice: "Lentes prime 35mm e 50mm f/2.0 para manter o foco afiado nas expressões e textura dos papéis.",
      emotionalToneAlignment: "Tensão dramática teatral que gera gargalhada instantânea pelo exagero maternal."
    };
  } else if (textCorpus.includes("cratera") || textCorpus.includes("lama") || textCorpus.includes("bambu") || textCorpus.includes("tabua") || textCorpus.includes("rua")) {
    cineData = {
      directorVision: "Fotografia documental de grande escala em tragédia de infraestrutura de rua de terra. A câmera enfatiza a monumentalidade da poça de lama em contraste com os corpos de 300kg, revelando o humor da sobrevivência comunitária.",
      cameraType: "Câmera Handheld cuidadosa de operador equilibrando-se na borda molhada da vala, com pequenas oscilações naturais e sem deformações de IA.",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: "Plano Geral Estabelecedor com Leve Tracking",
          movement: "Tracking lento para a frente no barro vermelho",
          focalPoint: "Cratera gigantesca inundada na rua de terra e Raimundo de 300kg na margem",
          lensAndAperture: "24mm prime f/3.5",
          cinematicIntent: "Estabelecer a escala inacreditável do lago de barro na porta das casas"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Plano Médio com Push-In na Medição",
          movement: "Aproximação suave acompanhando a vara de bambu submergindo",
          focalPoint: "Bambu afundando na água barrenta e vizinho de 300kg arregalando os olhos em pânico cômico",
          lensAndAperture: "35mm prime f/2.8",
          cinematicIntent: "Revelar o perigo surreal da profundidade da água com humor documental"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: "Close-Up Dramático em Contra-Plongée",
          movement: "Contra-plongée baixo apontado para cima com leve oscilação",
          focalPoint: "Rosto suado de Raimundo com respingos de lama na regata cinza e olhar de indignação",
          lensAndAperture: "50mm prime f/2.0",
          cinematicIntent: "Fechar com o desabafo heroico do cidadão contra o descaso das obras públicas"
        }
      ],
      lightingAndAtmosphere: "Céu nublado difuso de pós-chuva com reflexos barrentos na água da cratera, alta umidade e pele ensopada de suor natural 8k.",
      lensChoice: "24mm prime para contextualizar a rua e 50mm f/2.0 para o close-up facial heroico.",
      emotionalToneAlignment: "Sensação épica de expedição na selva urbana, convertendo a precariedade em comédia popular."
    };
  } else {
    // Universal procedural cinematography engine for any custom situation
    cineData = {
      directorVision: `Direção de fotografia documental imersiva sob a ótica de 50 anos de cinema e vídeo realista. A câmera atua como testemunha ocular física, posicionando-se em proximidade orgânica com os personagens de 300kg em "${location || "cenário autêntico"}", modulando aproximações estratégicas que amplificam a tensão e o timing cômico da narrativa.`,
      cameraType: "Câmera Handheld humana realista com micro-oscilações naturais orgânicas (operador físico presente no ambiente, sem tremores bruscos, sem zooms digitais e sem deformações de IA).",
      shotProgression: [
        {
          timecode: "00:00 - 00:03",
          shotType: sceneIndex === 0 ? "Plano Médio Estabelecedor com Suave Drift" : "Plano Over-the-Shoulder com Push-In Lento",
          movement: "Aproximação suave e contínua acompanhando a respiração do personagem",
          focalPoint: `Postura imponente de 300kg de ${charSpeaking} e texturas autênticas de ${location || "ambiente rústico"}`,
          lensAndAperture: "35mm prime f/2.4",
          cinematicIntent: "Apresentar a situação com impacto visual e peso gravitacional autêntico"
        },
        {
          timecode: "00:03 - 00:06",
          shotType: "Close-Up Estratégico no Momento de Pico",
          movement: "Push-in motivado fechando nos traços faciais expressivos",
          focalPoint: `Gotas de suor escorrendo pelas têmporas, queixo duplo volumoso e olhar marcante de ${charSpeaking}`,
          lensAndAperture: "50mm prime f/2.0",
          cinematicIntent: "Destacar a emoção principal da fala (surpresa, choque cômico ou indignação apaixonada)"
        },
        {
          timecode: "00:06 - 00:09",
          shotType: sceneIndex === totalScenes - 1 ? "Plano Médio de Conclusão com Pull-Out" : "Plano Conjunto Lateral de Reação",
          movement: "Pull-out suave e controlado revelando o ambiente e os ouvintes de 300kg",
          focalPoint: "Ação de fechamento corporal, reação cômica e finalização do arco do take",
          lensAndAperture: "35mm prime f/2.8",
          cinematicIntent: "Enquadrar o desfecho do take garantindo coerência espacial e continuidade para a história"
        }
      ],
      lightingAndAtmosphere: "Iluminação naturalista volumétrica com reflexos especulares vítreos de suor tropical, sombras suaves nas dobras corporais e atmosfera densa de calor ambiente.",
      lensChoice: "Lentes prime cinematográficas 35mm e 50mm com profundidade de campo f/2.4 natural.",
      emotionalToneAlignment: "Decupagem calibrada para equilibrar o peso físico de 300kg com o ritmo pontuado da comédia e do drama cotidiano."
    };
  }

  const shots = cineData.shotProgression;
  const cameraDirectionText = `Handheld documental realista 35mm f/2.4 (operador humano com 50 anos de experiência): ${shots.map((s: any) => `[${s.timecode}]: ${s.shotType} com ${s.movement} (Foco: ${s.focalPoint})`).join(" • ")}. Iluminação: ${cineData.lightingAndAtmosphere}. Lentes: ${cineData.lensChoice}.`;

  const enShotDescriptions = shots.map((s: any) => `[${s.timecode}]: ${s.shotType}, ${s.movement}, focusing on ${s.focalPoint}, lens ${s.lensAndAperture}`).join(". ");
  const ptShotDescriptions = shots.map((s: any) => `• [${s.timecode}]: ${s.shotType} com ${s.movement} (Foco: ${s.focalPoint}). Lente: ${s.lensAndAperture}`).join("\n");

  const enSnippet = `[CINEMATOGRAPHY - 50-YEAR VETERAN DIRECTOR OF PHOTOGRAPHY DIRECTION]: Handheld human camera with organic subtle breathing oscillations (strictly preserving 300kg mass and locked attires, zero AI morphing). ${enShotDescriptions}. Lens: ${cineData.lensChoice}, cinematic depth of field, naturalistic lighting with specular sweat highlights.`;
  const ptSnippet = `[DIREÇÃO DE FOTOGRAFIA & TAKES CINEMATOGRÁFICOS]:
• Visão do Diretor: ${cineData.directorVision}
• Estilo de Câmera: ${cineData.cameraType}
• Decupagem de Takes (9 Segundos):
${ptShotDescriptions}
• Iluminação & Lentes: ${cineData.lightingAndAtmosphere}. Lentes: ${cineData.lensChoice}.
• Alinhamento Emocional: ${cineData.emotionalToneAlignment}`;

  return {
    cinematography: cineData,
    cameraDirectionText,
    enCinematographySnippet: enSnippet,
    ptCinematographySnippet: ptSnippet,
  };
}

// ============================================================================
// ESTRUTURAÇÃO DE GANCHO FORTE (NARRATIVE HOOK SYSTEM)
// ============================================================================
function buildNarrativeHookStructure(
  theme: string,
  setting: string,
  isEmotional: boolean,
  firstScene: any,
  totalScenes: number,
  w: number = 300
): {
  batchHook: {
    headline: string;
    hookType: "acao_em_andamento" | "pergunta_provocativa" | "revelacao_chocante" | "dilema_urgente" | "no_na_garganta";
    visualElement: string;
    corePromise: string;
    retentionTrigger: string;
  };
  firstSceneHook: {
    headline: string;
    hookType: "acao_em_andamento" | "pergunta_provocativa" | "revelacao_chocante" | "dilema_urgente" | "no_na_garganta";
    visualElement: string;
    corePromise: string;
    retentionTrigger: string;
  };
  getPayoffForScene: (sceneIdx: number) => string;
} {
  const charName = firstScene?.characterSpeaking || firstScene?.characterVisualAnchor?.name || `Protagonista (${w}kg)`;
  const location = firstScene?.location || "no cenário da periferia";
  const firstBeatSpeech = firstScene?.dialogue?.timingBreakdown?.[0]?.speech || firstScene?.dialogue?.fullText || "";
  const firstBeatAction = firstScene?.dialogue?.timingBreakdown?.[0]?.action || "ação inicial impactante";

  let headline = "";
  let hookType: "acao_em_andamento" | "pergunta_provocativa" | "revelacao_chocante" | "dilema_urgente" | "no_na_garganta" = "acao_em_andamento";
  let visualElement = "";
  let corePromise = "";
  let retentionTrigger = "";

  if (isEmotional) {
    hookType = "no_na_garganta";
    headline = `O Desabafo Silencioso: ${charName} revela a dura realidade nos primeiros 3 segundos`;
    visualElement = `Close visceral nos olhos marejados de ${charName} (${w}kg) e gotas de suor brilhante escorrendo pelas bochechas enquanto ${firstBeatAction}.`;
    corePromise = `O espectador precisa descobrir se a perseverança e o amor humilde desta família conseguirão vencer as adversidades no Take Final.`;
    retentionTrigger = `Empatia humana profunda e quebra de estigma ao mostrar a nobreza e o afeto inabalável de pessoas humildes na comunidade.`;
  } else {
    // Pick based on theme context
    const tLower = (theme + " " + setting).toLowerCase();
    if (tLower.includes("borrach") || tLower.includes("obra") || tLower.includes("press") || tLower.includes("fio") || tLower.includes("gato")) {
      hookType = "dilema_urgente";
      headline = `Crise Iminente: ${charName} intervém no exato segundo antes do colapso!`;
      visualElement = `Ação tensa e cômica em andamento no primeiro frame: mãos firmes de ${charName} (${w}kg) tentando conter o desastre enquanto ${firstBeatAction}.`;
      corePromise = `Descobrir a gambiarra genial ou o resultado catastrófico da tentativa desesperada de evitar o prejuízo.`;
      retentionTrigger = `Tensão cômica imediata e curiosidade insaciável para ver se a estrutura aguenta.`;
    } else if (tLower.includes("pastel") || tLower.includes("feira") || tLower.includes("salão") || tLower.includes("fofoca") || tLower.includes("calçad")) {
      hookType = "revelacao_chocante";
      headline = `A Revelação Proibida: ${charName} solta o absurdo que para a vizinhança!`;
      visualElement = `Olhar arregalado e gesticulação enfática de ${charName} (${w}kg) apontando para a situação absurda em ${location}.`;
      corePromise = `Acompanhar as reações em cadeia e o desenrolar da fofoca ou do flagrante até a confrontação final.`;
      retentionTrigger = `Humor de identificação popular imediata com o cotidiano e o carisma dos personagens.`;
    } else {
      hookType = "acao_em_andamento";
      headline = `In Media Res: A confusão já começou antes mesmo de você piscar!`;
      visualElement = `${charName} (${w}kg) no ápice de uma situação imprevista com fala acelerada e expressiva: "${firstBeatSpeech.slice(0, 45)}..."`;
      corePromise = `Entender como diabos essa situação começou e como esse grupo de ${w}kg vai conseguir sair dessa enrascada.`;
      retentionTrigger = `Dinamismo cômico imediato: zero segundos perdidos com introduções lentas.`;
    }
  }

  const hookObj = {
    headline,
    hookType,
    visualElement,
    corePromise,
    retentionTrigger,
  };

  const getPayoffForScene = (sceneIdx: number): string => {
    if (sceneIdx === 0) {
      return `[Gancho Inicial Ativado]: Estabelece o incidente incitante com "${headline}". A promessa de conflito está lançada e ancora o interesse do público.`;
    } else if (sceneIdx === totalScenes - 1) {
      return `[Desfecho Definitivo do Gancho]: Resolução final do gancho inicial ("${headline}"). A promessa central é plenamente cumprida com a punchline e o fechamento do arco da história.`;
    } else {
      return `[Escalação do Gancho]: Consequência direta do gancho deflagrado no Take #1. As repercussões imediatas elevam a tensão e aprofundam a narrativa sem desvios.`;
    }
  };

  return {
    batchHook: hookObj,
    firstSceneHook: hookObj,
    getPayoffForScene,
  };
}

// ============================================================================
// REGRA OBRIGATÓRIA: PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS
// ============================================================================
function buildPromptZeroReference(
  cast: any[],
  exactWeight: number = 300,
  storyTone: string = "comedia",
  themeTitle: string = "Cotidiano Brasileiro",
  targetAi: string = "kling",
  aiPromptZero?: any
) {
  const w = Math.max(40, Math.min(600, Number(exactWeight) || 300));
  const lbs = Math.round(w * 2.20462);

  const fallbackCast = [
    {
      name: "Raimundo",
      roleInStory: "Protagonista",
      ageAndFace: "Homem brasileiro pardo de 42 anos, rosto redondo expressivo, barba rala por fazer, suor tropical denso e brilhante escorrendo sem parar pelas têmporas e bochechas",
      lockedAttire: "Regata cinza extremamente curta e justa esticada no limite máximo do tecido sobre o abdômen e peito volumosos de 300kg (claramente pequena demais e que não cabe nele, subindo pela barriga), bermuda jeans curta apertada e chinelos de borracha azuis",
      bodyAndWeight300kg: `Rigorosamente ${w}kg (${lbs} lbs) com porte colossal e física corporal real`,
    },
    {
      name: "Dona Lúcia",
      roleInStory: "Matriarca",
      ageAndFace: "Mulher brasileira calorosa de 58 anos, cabelos castanhos com mechas brancas presos em coque frouxo, feições acolhedoras, suor copioso brilhando na testa e pescoço",
      lockedAttire: "Vestido curto de chita floral visivelmente apertado que não cabe na estrutura de 300kg com costuras esticadas no limite e marcas úmidas de suor, avental curto amarrado sob tensão e sandálias rasteiras",
      bodyAndWeight300kg: `Rigorosamente ${w}kg (${lbs} lbs) com porte colossal e física corporal real`,
    },
  ];

  const sourceCast = Array.isArray(cast) && cast.length > 0 ? cast : fallbackCast;
  const positionsPt = ["lado esquerdo", "centro", "lado direito", "extrema direita", "extrema esquerda"];
  const positionsEn = ["on the left side", "in the center", "on the right side", "on the far right", "on the far left"];

  const characters = sourceCast.map((c: any, idx: number) => {
    const posPt = positionsPt[idx] || `posição ${idx + 1}`;
    const posEn = positionsEn[idx] || `position ${idx + 1}`;
    const name = c.name || `Personagem ${idx + 1}`;
    const role = c.roleInStory || c.role || "Personagem da narrativa";
    const attire = c.lockedAttire || "Roupas visivelmente curtas, justas e de tamanho reduzido que não cabem no corpo colossal de mais de 300kg com marcas de suor";
    const face = c.ageAndFace || "Rosto expressivo autêntico com poros 8K dilatados e suor brilhante escorrendo continuamente";
    const fullBody = `Pessoa brasileira autêntica de corpo inteiro, em pé dos pés à cabeça, porte monumental e realista de ${w}kg (${lbs} lbs), anatomia proporcional com dobras naturais, roupas curtas e apertadas que não cabem no corpo volumoso, e pele ensopada de suor em todo momento.`;

    return {
      name,
      role,
      weight: `${w}kg (${lbs} lbs)`,
      fullBodyDescription: fullBody,
      clothingAndFootwear: attire,
      hairAndFacialFeatures: face,
      spatialArrangement: `Posicionado(a) ao ${posPt}, de corpo inteiro (da cabeça aos pés), em pé, totalmente separado dos demais personagens, sem sobreposição física.`,
      posEn,
    };
  });

  const charDescriptionsEn = characters
    .map((cr, idx) => {
      return `CHARACTER #${idx + 1} (${cr.name.toUpperCase()} - ${cr.role.toUpperCase()}): [Standing ${cr.posEn}, fully visible full-body head-to-toe without overlapping any other character, strictly weighing exactly ${w}kg / ${lbs} lbs with massive authentic anatomy, belly resting naturally, double chin, thick limbs]. Attire: ${cr.clothingAndFootwear} (strictly short, undersized, ill-fitting tight clothes strained to the limit that visibly do not fit their massive 300kg frame, damp sweat marks). Perspiration: heavily drenched in glistening tropical sweat with visible trickling droplets at all times. Facial features, hair and expressions: ${cr.hairAndFacialFeatures}.`;
    })
    .join(" ");

  const generatedEnPrompt = aiPromptZero?.englishPrompt && aiPromptZero.englishPrompt.length > 60
    ? aiPromptZero.englishPrompt
    : `[MANDATORY MASTER CHARACTER VISUAL REFERENCE - PROMPT 00 - PURE SEAMLESS WHITE STUDIO BACKGROUND]: Ultra-realistic commercial studio full-body character line-up photograph of all ${characters.length} authentic Brazilian characters standing side-by-side on an absolute pure seamless solid white studio background (pure white cyc). Strictly isolated characters, zero background objects, no scenery, no walls, no furniture, no decor, no shadows on background, no props, no text, no watermark. Full-body shot from head to toe, all characters placed apart with clear empty space between each other, fully visible without any body overlap. Uniform neutral soft studio photography lighting, balanced exposure, zero dramatic cast shadows. Every character is an authentic Brazilian adult realistically and unmistakably weighing exactly ${w}kg (${lbs} lbs) with genuine heavy physical mass, natural anatomical proportions, strictly wearing short, tight, undersized clothing that visibly does not fit their massive 300kg bodies (seams strained to the limit), and permanently drenched in heavy glistening tropical sweat beads at all times: ${charDescriptionsEn} Ultra-high-resolution 4K/8K portrait photography, 50mm prime lens f/4.0, ultra-realistic human skin microtexture with pores and intense wet specular sheen, sharp facial details, authentic realistic anatomy, photorealistic masterpiece.`;

  const generatedPtPrompt = aiPromptZero?.portuguesePrompt ||
    `Fotografia profissional de estúdio 4K de corpo inteiro com TODOS os personagens da história (${characters.map((c) => c.name).join(", ")}), posicionados lado a lado sobre um fundo branco puro e uniforme, sem cenário, sem objetos decorativos e sem sobreposição. Cada personagem é apresentado da cabeça aos pés, totalmente visível, pesando rigorosamente ${w}kg, vestindo roupas visivelmente curtas e apertadas que não cabem no corpo volumoso (tecidos esticados ao limite com marcas úmidas de suor), com a pele permanentemente ensopada de suor brilhante escorrendo em todo momento, com anatomia correta, calçados, cortes de cabelo e traços fisionômicos detalhados. Esta imagem estabelece a referência visual obrigatória para todos os prompts seguintes da história.`;

  const generatedNegPrompt = aiPromptZero?.negativePrompt ||
    `scenery, background objects, room, furniture, wall, floor pattern, shadows, outdoor, street, landscape, nature, decorations, text, watermark, logo, typography, overlapping characters, touching characters, merged limbs, extra fingers, deformed hands, bad anatomy, cartoon, 3d render, anime, illustration, slender, slim, thin, fit, athletic, model proportions, flat stomach, narrow waist, studio props`;

  return {
    title: "PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS",
    purpose: "Imagem de referência visual obrigatória contendo todos os personagens lado a lado, de corpo inteiro, sobre fundo branco puro. Estabelece a identidade física, roupas, calçados e traços que devem ser preservados rigorosamente em todos os prompts seguintes.",
    englishPrompt: sanitizePromptForFlowAndSafety(generatedEnPrompt),
    portuguesePrompt: generatedPtPrompt,
    negativePrompt: sanitizeNegativePromptForFlow(generatedNegPrompt),
    aspectRatio: "16:9",
    characters: characters.map(({ posEn, ...rest }) => rest),
    modelTips: "Gere esta imagem primeiro no gerador de imagens (Midjourney, Flux, Kling Image ou DALL-E) para usar como Image-to-Video ou Image Reference nos prompts de vídeo subsequentes (Takes 01 a N), garantindo consistência visual de 100%.",
    technicalSpecs: {
      background: "Fundo branco puro estrito (pure solid white seamless background)",
      framing: "Corpo inteiro (full-body head-to-toe), lado a lado, sem sobreposição",
      lighting: "Iluminação fotográfica de estúdio profissional uniforme e difusa",
      resolution: "Fotografia profissional 4K / 8K, alta definição facial e texturas humanas realistas",
      zeroSceneryRule: "Sem cenário, sem móveis, sem objetos decorativos, sem textos ou elementos adicionais",
    },
  };
}

// ============================================================================
// IDENTIDADE NARRATIVA & MEMÓRIA NARRATIVA (REGRA SUPREMA DE CONTINUIDADE)
// ============================================================================
function buildNarrativeIdentity(
  theme: string,
  setting: string,
  characters: string[],
  firstScene: any,
  isEmotional: boolean,
  weightKg: number = 300
) {
  const mainTheme = theme || (isEmotional ? "Vitória e Superação da Família Humilde" : "O Cotidiano Inusitado da Comunidade");
  const environment = firstScene?.location || (setting && setting !== "aleatorio" && setting !== "misto" ? setting.replace(/_/g, " ") : "Cenário periférico autêntico");
  const charList = characters && characters.length > 0
    ? characters
    : [firstScene?.characterSpeaking || firstScene?.characterVisualAnchor?.name || `Protagonista (${weightKg}kg)`];

  let centralEvent = "";
  let narrativeObjective = "";
  let mainConflict = "";
  let expectedDevelopment = "";
  let possibleResolution = "";

  if (isEmotional) {
    centralEvent = `A luta incansável, o sacrifício e o afeto inquebrável de personagens de ${weightKg}kg diante de uma conquista marcante ou reconciliação em ${environment}.`;
    narrativeObjective = "Expressar gratidão profunda, honrar o sacrifício compartilhado e celebrar a vitória com dignidade e afeto.";
    mainConflict = "O peso das adversidades e humilhações passadas versus a comoção transformadora da vitória conquistada com suor.";
    expectedDevelopment = "A revelação do sacrifício humilde, lágrimas genuínas nos olhos e apoio mútuo inabalável entre os familiares.";
    possibleResolution = "Um abraço inesquecível e curador entre os familiares de ${weightKg}kg, comovendo a todos com lágrimas de triunfo e paz.";
  } else {
    centralEvent = `A tentativa hilária e perseverante dos personagens de ${weightKg}kg de resolverem uma situação cotidiana inusitada em ${environment}.`;
    narrativeObjective = "Superar o contratempo prático imediato mantendo o orgulho, a malemolência e o bom humor característicos.";
    mainConflict = "A discrepância entre os recursos disponíveis e a grandeza hilária do problema enfrentado pelos personagens.";
    expectedDevelopment = "Escalação gradual da confusão a partir do gancho inicial, com falas afiadas, gesticulações e interações físicas autênticas.";
    possibleResolution = "Desfecho cômico definitivo com uma solução de improviso genial ou conformismo afetuoso entre os personagens.";
  }

  return {
    mainTheme,
    centralEvent,
    charactersInvolved: charList,
    environment,
    narrativeObjective,
    mainConflict,
    expectedDevelopment,
    possibleResolution,
    isLocked: true,
  };
}

function buildNarrativeMemoryForScene(
  sc: any,
  sceneIndex: number,
  totalScenes: number,
  prevScenes: any[],
  narrativeIdentity: any
) {
  const isFirst = sceneIndex === 0;
  const isLast = sceneIndex === totalScenes - 1;
  const charSpeaking = sc?.characterSpeaking || sc?.characterVisualAnchor?.name || "Personagem Principal";

  const establishedFacts = isFirst
    ? [`Incidente inicial deflagrado: ${narrativeIdentity.centralEvent}`]
    : prevScenes.map((ps, idx) => {
        const who = ps.characterSpeaking || ps.characterVisualAnchor?.name || `Personagem ${idx + 1}`;
        const quote = ps.dialogue?.fullText ? `"${ps.dialogue.fullText.slice(0, 50)}..."` : ps.title;
        return `Take #${idx + 1}: ${who} no ${ps.location || narrativeIdentity.environment} proferiu ${quote}`;
      });

  const currentLocations = `${sc.location || narrativeIdentity.environment} (ambiente fixo e contínuo sem saltos geográficos)`;

  const charactersKnowledge = isFirst
    ? `Os personagens estão no início do dilema: ${narrativeIdentity.mainConflict}`
    : `Os personagens conhecem perfeitamente todos os fatos ocorridos até o Take #${sceneIndex} e suas atitudes decorrem exclusivamente disso.`;

  const completedActions = isFirst
    ? [`Gancho inicial deflagrado por ${charSpeaking}`]
    : prevScenes.map((ps, idx) => {
        const lastAction = ps.dialogue?.timingBreakdown?.[2]?.action || ps.dialogue?.timingBreakdown?.[0]?.action || ps.title || "ação realizada";
        return `Take #${idx + 1}: ${lastAction}`;
      });

  const pendingEvents = isLast
    ? [`Resolução definitiva do conflito central`]
    : [
        `Desenvolvimento imediato: ${narrativeIdentity.expectedDevelopment}`,
        `Caminho para o desfecho: ${narrativeIdentity.possibleResolution}`,
      ];

  const logicalNextStep = isLast
    ? `Fechamento conclusivo da narrativa: ${narrativeIdentity.possibleResolution}`
    : `O que acontece a seguir: os personagens reagem diretamente à consequência do Take #${sceneIndex + 1}.`;

  return {
    establishedFacts,
    currentLocations,
    charactersKnowledge,
    completedActions,
    pendingEvents,
    logicalNextStep,
  };
}

// ============================================================================
// CONTINUIDADE NARRATIVA & CONEXÃO CINEMATOGRÁFICA (DIRETOR DE CONTINUIDADE)
// ============================================================================
function buildContinuityBridgeForScene(
  sc: any,
  sceneIndex: number,
  totalScenes: number,
  prevScene?: any,
  nextScene?: any,
  weightKg: number = 300
): {
  continuityBridge: {
    outgoingMoment: string;
    incomingMoment: string;
    nextSceneHandoff: string;
    matchCutType: string;
    characterSpatialPositions: string;
    emotionalContinuity: string;
  };
  enContinuitySnippet: string;
  ptContinuitySnippet: string;
} {
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);
  const isFirst = sceneIndex === 0;
  const isLast = sceneIndex === totalScenes - 1;
  const currentChar = sc.characterSpeaking || sc.characterVisualAnchor?.name || `Personagem Principal (${w}kg)`;
  const prevChar = prevScene ? (prevScene.characterSpeaking || prevScene.characterVisualAnchor?.name || "Personagem Anterior") : "";
  const nextChar = nextScene ? (nextScene.characterSpeaking || nextScene.characterVisualAnchor?.name || "Próximo Personagem") : "";
  const location = sc.location || "no mesmo cenário autêntico da cena";

  // Actions from timing breakdowns
  const act1 = sc.dialogue?.timingBreakdown?.[0]?.action || `inicia a postura dramática e respiração sincronizada de ${w}kg`;
  const act3 = sc.dialogue?.timingBreakdown?.[2]?.action || "conclui a fala com gesto enfático e olhar expressivo";
  const prevAct3 = prevScene?.dialogue?.timingBreakdown?.[2]?.action || "gesto final e direção do olhar do take anterior";

  const rawBridge = sc.continuityBridge || {};

  // 1. Incoming Moment (Onde e como este take começa no milissegundo 00:00)
  let incomingMoment = rawBridge.incomingMoment || "";
  if (!incomingMoment) {
    if (isFirst) {
      incomingMoment = `Frame Inicial 00:00 (Abertura do Arco): ${currentChar} estabelece o início da história em ${location}, corpo de ${w}kg em postura estável e equilibrada, mãos em posição natural e olhar fixado no interlocutor/ação, sem cortes prévios.`;
    } else {
      incomingMoment = `Frame Inicial 00:00 (Conexão 1:1 Direta com o Take anterior): O primeiro frame deste Take #${sceneIndex + 1} inicia EXATAMENTE onde o Take #${sceneIndex} encerrou. ${currentChar} permanece no mesmo ponto exato do cenário, mantendo a mesma postura de ${w}kg, mãos coordenadas com o final do take anterior (${prevAct3}), olhar cravado no mesmo vetor espacial e expressão facial de reação imediata ao que ${prevChar || 'o interlocutor'} acabou de falar, sem teletransporte nem salto temporal.`;
    }
  }

  // 2. Outgoing Moment (Onde e como este take termina no segundo 00:09)
  let outgoingMoment = rawBridge.outgoingMoment || "";
  if (!outgoingMoment) {
    if (isLast) {
      outgoingMoment = `Frame Final 00:09 (Fechamento Definitivo da História): ${currentChar} encerra a ação com ${act3}, sustentando a postura corporal de ${w}kg e olhar cômico de desfecho final, concluindo o arco narrativo do episódio com a punchline definitiva.`;
    } else {
      outgoingMoment = `Frame Final 00:09 (Ação Suspensa para o Próximo Take): ${currentChar} completa a fala com ${act3}, deixando as mãos em movimento orgânico e olhar fixo no interlocutor (${nextChar || 'cena'}), congelando o vetor de ação para ser continuado instantaneamente no Take #${sceneIndex + 2}.`;
    }
  }

  // 3. Next Scene Handoff
  let nextSceneHandoff = rawBridge.nextSceneHandoff || "";
  if (!nextSceneHandoff) {
    if (isLast) {
      nextSceneHandoff = `Desfecho e Finalização da História: O último frame conclui toda a sequência de eventos, resolvendo o conflito cômico e encerrando o episódio sem pendências narrativas.`;
    } else {
      nextSceneHandoff = `Handoff para o Take #${sceneIndex + 2}: O último segundo deste take prepara imediatamente a reação de ${nextChar || 'outro personagem'}, que inicia sua fala ou resposta física no exato primeiro milissegundo do take seguinte (o Prompt ${sceneIndex + 2} começa onde o Prompt ${sceneIndex + 1} termina).`;
    }
  }

  // 4. Match Cut Type
  let matchCutType = rawBridge.matchCutType || "";
  if (!matchCutType) {
    if (isFirst) {
      matchCutType = `Corte na Ação Contínua (Match-Action Cut) & Preservação Estrita do Eixo de 180°`;
    } else if (sceneIndex === 1) {
      matchCutType = `Corte para Contra-campo de Reação (Reaction Shot Cut) mantendo a linha do olhar contínua`;
    } else if (isLast) {
      matchCutType = `Corte de Resolução e Fechamento com Pull-Out Suave e Enquadramento Cômico`;
    } else {
      matchCutType = `Corte em Movimento Contínuo (Motion Continuity Cut) com Coerência Espacial`;
    }
  }

  // 5. Character Spatial Positions
  let characterSpatialPositions = rawBridge.characterSpatialPositions || "";
  if (!characterSpatialPositions) {
    characterSpatialPositions = `Coerência Espacial e Vetores de Olhar: ${currentChar} posicionado com estabilidade física em ${location}, respeitando a regra dos 180 graus. Todos os personagens mantêm roupas travadas idênticas, mesmas manchas de suor, anatomia física consistente de ${w}kg e posições relativas inalteradas.`;
  }

  // 6. Emotional Continuity
  let emotionalContinuity = rawBridge.emotionalContinuity || "";
  if (!emotionalContinuity) {
    if (isFirst) {
      emotionalContinuity = `Apresentação do dilema cômico com postura decidida ou indignada, estabelecendo o tom emocional inicial da narrativa.`;
    } else if (isLast) {
      emotionalContinuity = `Transição orgânica para a reação de alívio cômico, resignação ou riso debochado, fechando a história com harmonia dramática.`;
    } else {
      emotionalContinuity = `Progressão emocional fluida: o personagem evolui naturalmente da surpresa do take anterior para a escalação da tensão cômica, sem mudanças bruscas ou injustificadas de humor.`;
    }
  }

  const continuityBridge = {
    incomingMoment,
    outgoingMoment,
    nextSceneHandoff,
    matchCutType,
    characterSpatialPositions,
    emotionalContinuity,
  };

  const enContinuitySnippet = `[NARRATIVE CONTINUITY & FRAME-TO-FRAME ACTION HANDOFF]: Scene #${sceneIndex + 1} of ${totalScenes}. ${isFirst ? "Initial establishing scene opening the narrative sequence." : `Direct 1:1 match-action continuity picking up from the exact final frame of Scene #${sceneIndex}. Same physical coordinates of ${w}kg bodies, matching hand positions, preserved eye-line vectors, zero time jump, zero spatial teleportation.`} ${isLast ? "Definitive storyline resolution closing the narrative arc." : `Outgoing action prepares immediate cause-and-effect reaction for Scene #${sceneIndex + 2} without interruption.`}`;

  const ptContinuitySnippet = `[CONTINUIDADE NARRATIVA & CONEXÃO ENTRE PROMPTS]:
• Regra de Continuidade: O Take #${sceneIndex + 1} forma uma única história contínua com os demais takes.
• Primeiro Frame (Início deste Take): ${incomingMoment}
• Último Frame (Fechamento deste Take): ${outgoingMoment}
• Conexão com o Próximo Take: ${nextSceneHandoff}
• Tipo de Corte: ${matchCutType}
• Coerência Espacial (Eixo 180°): ${characterSpatialPositions}
• Continuidade Emocional: ${emotionalContinuity}`;

  return {
    continuityBridge,
    enContinuitySnippet,
    ptContinuitySnippet,
  };
}

// ============================================================================
// DIREÇÃO DE ATORES & BIOMECÂNICA HUMANA ULTRARREALISTA (DIRETOR DE ATORES 50+ ANOS)
// ============================================================================
function buildActorDirectionForScene(
  sc: any,
  sceneIndex: number,
  totalScenes: number,
  weightKg: number = 300
): {
  actorDirection: any;
  enActorDirectionSnippet: string;
  ptActorDirectionSnippet: string;
} {
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);
  const currentChar = sc.characterSpeaking || sc.characterVisualAnchor?.name || "Personagem Principal";
  const location = sc.location || "no cenário autêntico da comunidade";
  const title = sc.title || "";
  const fullDialogue = sc.dialogue?.fullText || "";
  const textCorpus = `${title} ${location} ${currentChar} ${fullDialogue}`.toLowerCase();

  const rawActor = sc.actorDirection || {};

  // If already generated a solid actorDirection object, validate and polish it
  if (
    rawActor &&
    typeof rawActor === "object" &&
    rawActor.directorVision &&
    rawActor.microMovements &&
    rawActor.handsAndGrip &&
    rawActor.biomechanicsAndWeight
  ) {
    const actorDirection = {
      directorVision: rawActor.directorVision,
      microMovements: rawActor.microMovements,
      handsAndGrip: rawActor.handsAndGrip,
      biomechanicsAndWeight: rawActor.biomechanicsAndWeight,
      reactionSequence: rawActor.reactionSequence || "[00:00 - 00:03] percepção e olhar; [00:03 - 00:06] fala e ação motivada; [00:06 - 00:09] desaceleração e desfecho.",
      dialogueDeliveryAndLips: rawActor.dialogueDeliveryAndLips || "Sincronia labial fluida em português brasileiro com pausas respiratórias e escuta ativa de quem ouve.",
      spatialInteraction: rawActor.spatialInteraction || `Apoio sólido nas superfícies físicas de ${location}, respeitando a massa de ${w}kg sem clipping.`,
      antiDeformationRules: rawActor.antiDeformationRules || "Preservação estrita de 5 dedos por mão, sem membros atravessando corpos ou roupas, sem distorções faciais ao virar a cabeça.",
    };

    const enActorDirectionSnippet = `[ACTOR DIRECTION & ULTRA-REALISTIC HUMAN BIOMECHANICS - 50-YEAR VETERAN DIRECTOR]: Naturalistic acting, unforced human behavior with authentic ${w}kg (${lbs} lbs) gravitational mass, realistic acceleration/deceleration, subtle visible diaphragmatic breathing, spontaneous natural eye blinks and micro-head tilts. Exactly 5 anatomical articulated fingers per hand gripping objects with realistic contact physics (zero object clipping, zero floating props, zero finger morphing). Lifelike human reaction chain (perception -> eyes focus -> head turn -> facial micro-expression -> body shift). Accurate lip-sync with realistic breathing pauses, grounded footsteps without sliding, active listening reactions for non-speakers. Spatial interaction respecting solid surfaces (chairs, counters, walls). Zero robotic stiffness, zero erratic jerking, zero morphing.`;

    const ptActorDirectionSnippet = `[DIREÇÃO DE ATORES & BIOMECÂNICA HUMANA ULTRARREALISTA (50+ ANOS DE EXPERIÊNCIA)]:
• Visão do Diretor de Atores: ${actorDirection.directorVision}
• Micro Movimentos Humanos: ${actorDirection.microMovements}
• Biomecânica das Mãos (5 Dedos Perfeitos): ${actorDirection.handsAndGrip}
• Física Corporal & Transferência de Peso (${w}kg): ${actorDirection.biomechanicsAndWeight}
• Cadeia Temporal de Reação: ${actorDirection.reactionSequence}
• Atuação na Fala & Sincronia Labial (9s): ${actorDirection.dialogueDeliveryAndLips}
• Interação Física com o Cenário: ${actorDirection.spatialInteraction}
• Salvaguardas Anti-Deformação de IA: ${actorDirection.antiDeformationRules}`;

    return {
      actorDirection,
      enActorDirectionSnippet,
      ptActorDirectionSnippet,
    };
  }

  // Context-aware naturalistic generation based on scene archetype
  let directorVision = "";
  let microMovements = "";
  let handsAndGrip = "";
  let biomechanicsAndWeight = "";
  let reactionSequence = "";
  let dialogueDeliveryAndLips = "";
  let spatialInteraction = "";
  let antiDeformationRules = "";

  if (textCorpus.includes("pastel") || textCorpus.includes("feira") || textCorpus.includes("creuza")) {
    directorVision = `Atuação calorosa e espontânea de feira livre. Tia Creuza e Raimundo movem-se com a naturalidade de quem convive há décadas entre o calor do óleo e a fumaça acolhedora, demonstrando cumplicidade popular, peso gravitacional real de ${w}kg e gestos motivados pela generosidade gastronômica.`;
    microMovements = `Respiração diafragmática perceptível elevando o avental e a camiseta; pestanejar espontâneo descompassado; micro-inclinação da cabeça ao calcular o troco ou elogiar o recheio; pequenas oscilações de equilíbrio nos pés sobre o chão de paralelepípedo úmido.`;
    handsAndGrip = `Mãos fartas com 5 dedos anatomicamente perfeitos e juntas visíveis. O pegador de metal ou o pastel de vento é sustentado com firmeza, os dedos envolvendo o papel engordurado com contato físico real, sem atravessar a massa crocante e sem flutuação.`;
    biomechanicsAndWeight = `Massa corporal genuína de ${w}kg: movimentos de tronco suaves com aceleração gradual; ao virar-se para o tacho ou balcão, o quadril e os joelhos absorvem o peso com amortecimento natural; passos firmes assentados no chão sem deslizar.`;
    reactionSequence = `[00:00 - 00:03]: Tia Creuza percebe o olhar faminto de Raimundo, seus olhos brilham primeiro, a cabeça inclina com sorriso cúmplice; [00:03 - 00:06]: Ergue o pegador de pastel enquanto articula a fala acolhedora com gesticulação fluida da mão livre; [00:06 - 00:09]: Solta uma risada descontraída com balanceio sutil dos ombros, sustentando o olhar afetivo.`;
    dialogueDeliveryAndLips = `Sincronia labial milissegundo a milissegundo com a pronúncia brasileira de feira, pausas naturais para puxar ar entre as palavras; Raimundo ouve salivando, com micro-reação de assentimento nos olhos e lábios semiabertos em expectativa.`;
    spatialInteraction = `Ao apoiar a mão roliça no balcão de fórmica rústica, a madeira suporta a pressão com estabilidade física; o calor do tacho induz reflexos musculares suaves de recuo na pele suada.`;
    antiDeformationRules = `Rigorosa preservação da anatomia de 5 dedos, sem fusão do pegador de metal com os dedos; tecidos do avental acompanham as dobras do corpo de ${w}kg sem clipping ou deformações ao girar.`;
  } else if (textCorpus.includes("borracha") || textCorpus.includes("tião") || textCorpus.includes("oficina") || textCorpus.includes("pneu")) {
    directorVision = `Atuação rústica e visceral de oficina periférica. Seu Tião transmite o cansaço honrado de anos de borracharia: gestos decididos, uso inteligente da inércia corporal de ${w}kg para manipular ferramentas pesadas e expressividade franca sem caricatura.`;
    microMovements = `Pequenas contrações da musculatura da testa marcada pelo suor; respiração ritmada após o esforço físico com a chave de roda; micro-ajustes na postura apoiando o peso na perna esquerda; piscadas involuntárias para proteger os olhos de poeira suspensa.`;
    handsAndGrip = `Mãos grossas calejadas e com marcas de graxa, 5 dedos perfeitos e articulados por mão. Ao segurar a chave de roda cruz ou o pneu de caminhão, os dedos flexionam-se travando com força de preensão realista, sem deformações, sem multiplicação de articulações e sem atravessar o metal.`;
    biomechanicsAndWeight = `Dinâmica de força para ${w}kg: o tronco atua como contrapeso gravitacional natural; ao abaixar-se junto à roda, os joelhos dobram em velocidade condizente com a massa e a coluna mantém curvatura biomecanicamente correta; parada com desaceleração gradual.`;
    reactionSequence = `[00:00 - 00:03]: Seu Tião interrompe a inspeção do pneu, seus olhos sobem do aro para o cliente, a cabeça ergue-se com ar de incredulidade; [00:03 - 00:06]: Balança a chave de roda com firmeza enfatizando a gravidade do furo na câmara de ar enquanto profere a fala; [00:06 - 00:09]: Passa as costas da mão suada pela testa num suspiro autêntico, congelando a postura para a resposta.`;
    dialogueDeliveryAndLips = `Dicção firme e rouca, lábios e mandíbula articulando cada sílaba com precisão realista; pausas respiratórias audíveis condizentes com a rotina de esforço da oficina; ouvintes reagem com apreensão cômica.`;
    spatialInteraction = `Contato sólido com o chão de cimento batido manchado de óleo (os calçados não deslizam nem flutuam); quando apoia o joelho ou o braço no pneu de trator, a borracha cede milimetricamente sob o peso.`;
    antiDeformationRules = `Manutenção estrita da chave de roda como objeto rígido independente (sem fundir na palma); proporções anatômicas de braços e pernas intactas em todas as mudanças de ângulo.`;
  } else if (textCorpus.includes("salão") || textCorpus.includes("valdirene") || textCorpus.includes("cabelo") || textCorpus.includes("escova")) {
    directorVision = `Atuação viva, gesticuladora e comunicativa do salão de beleza na laje. Valdirene domina o espaço com autoridade maternal e humor sagaz, articulando o secador com destreza e usando o olhar pelo espelho para criar conexões teatrais ricas e naturais.`;
    microMovements = `Elevação sutil de uma das sobrancelhas ao fazer uma fofoca saborosa; respiração estável compassada pelo ritmo da escovação; micro-torções do pescoço checando o reflexo; pequenos passos laterais transferindo o peso de ${w}kg de um salto anabela para o outro.`;
    handsAndGrip = `Mãos ágeis com esmalte impecável, 5 dedos bem delineados por mão. O cabo ergonômico do secador ou a escova redonda repousa na palma com empunhadura anatômica exata; os dedos da outra mão separam as mechas de cabelo com delicadeza e fluidez sem atravessar o couro cabeludo.`;
    biomechanicsAndWeight = `Postura imponente e equilibrada: o peso de ${w}kg proporciona ancoragem estável em torno da cadeira giratória; o balanço dos ombros ao gesticular com o secador desligado tem inércia suave e elegante.`;
    reactionSequence = `[00:00 - 00:03]: Valdirene nota a chegada da cliente pelo espelho, seus olhos encontram o reflexo, cessa o movimento da escova; [00:03 - 00:06]: Vira o tronco com elegância pausada e desfia sua fala expressiva gesticulando com a escova pontilhando o ar; [00:06 - 00:09]: Abre um sorriso de cumplicidade mordendo de leve o lábio inferior, aguardando a reação.`;
    dialogueDeliveryAndLips = `Articulação rápida, expressiva e musical do português paulistano/periférico; boca acompanha com riqueza de detalhes a modulação dos tons; a cliente na cadeira reage piscando e rindo pelos olhos no espelho.`;
    spatialInteraction = `A cadeira hidráulica do salão acomoda o cliente com amortecimento convincente; o fio do secador cai em curva catenária física realista até a tomada.`;
    antiDeformationRules = `Cabelos se comportam com física de fios individuais e mechas flexíveis sem clipping no pescoço; mãos e secador mantêm geometria tridimensional independente e rígida.`;
  } else if (textCorpus.includes("obra") || textCorpus.includes("pedreiro") || textCorpus.includes("marcão") || textCorpus.includes("laje") || textCorpus.includes("cimento")) {
    directorVision = `Atuação potente e decidida da construção civil brasileira. Marcão tem a compostura prática e tranquila do mestre de obras experiente: cada movimento é econômico, potente e seguro, canalizando a força de seus ${w}kg de musculatura visceral e osso para liderar a laje.`;
    microMovements = `Respiração funda que faz o peito largo e a toalha no pescoço oscilarem; pestanejar focado olhando o alinhamento da linha de pedreiro; micro-ajustes na pegada da colher; contração dos ombros ao avaliar a curvatura da viga.`;
    handsAndGrip = `Mãos ásperas e calejadas com 5 dedos íntegros e articulações volumosas. Ao segurar o cabo de madeira da colher de pedreiro ou o tijolo baiano, os dedos envolvem a superfície áspera com compressão física real, sem objetos atravessando a palma e sem dedos fundidos.`;
    biomechanicsAndWeight = `Gravidade imponente de ${w}kg: passos deliberados e pesados sobre a laje de concreto em cura; ao abaixar-se para pegar a massa de cimento na masseira, o centro de gravidade abaixa com controle estrito; estabilização imediata ao parar.`;
    reactionSequence = `[00:00 - 00:03]: Marcão avista a entrega errada dos sacos de cimento, trava a colher no ar, seus olhos semicerram sob o sol escaldante; [00:03 - 00:06]: Vira o corpo volumoso em direção ao ajudante disparando sua recomendação bem-humorada com gestos precisos da colher; [00:06 - 00:09]: Dá dois tapinhas no tijolo como ponto final da fala, erguendo o queixo com autoridade.`;
    dialogueDeliveryAndLips = `Tom de voz de comando afetuoso que projeta sobre o barulho da betoneira; sincronia estrita entre a abertura da boca e as vogais fortes; o ajudante escuta em silêncio com postura respeitosa de braços caídos.`;
    spatialInteraction = `Pés calçados com botinas de elástico plantados firmemente no chão de cimento rugoso (sem deslizamento); a colher bate no tijolo emitindo micro-vibrações táteis perceptíveis.`;
    antiDeformationRules = `Tijolos e ferramentas mantêm consistência geométrica sólida sem amassar ou deformar; ausência total de fusão entre a massa de cimento e os dedos do personagem.`;
  } else if (textCorpus.includes("van") || textCorpus.includes("betinho") || textCorpus.includes("lotação") || textCorpus.includes("troco")) {
    directorVision = `Atuação elétrica, equilibrista e perspicaz do cobrador de van. Betinho equilibra seu corpanzil de ${w}kg com malemolência inacreditável dentro do corredor estreito da Kombi, desfiando trocos e piadas enquanto o veículo balança nas curvas do bairro.`;
    microMovements = `Compensação constante de equilíbrio nos tornozelos e joelhos acompanhando o balanço da van; olhar periférico escaneando passageiros e a rua; respiração entrecortada e vivaz; batidinhas rítmicas com a chave na porta de correr.`;
    handsAndGrip = `Mãos incrivelmente ágeis com 5 dedos bem delineados. O maço de notas dobradas ou as moedas de um real são manuseadas com coordenação motora fina real (os dedos pinçam a nota sem que ela atravesse a carne, soltando-a na mão do passageiro com contato tangível).`;
    biomechanicsAndWeight = `Dinâmica de balanço veicular para ${w}kg: o corpo utiliza o apoio dos bancos e da coluna da porta para amortecer as freadas; o abdômen proeminente sustenta a pochete grossa sem deformação de textura; desaceleração suave ao ancorar os pés.`;
    reactionSequence = `[00:00 - 00:03]: Betinho ouve o passageiro pedir para descer no ponto errado, vira a cabeça com olhar irônico e ergue as sobrancelhas; [00:03 - 00:06]: Segura no ferro do teto com uma mão enquanto aponta a outra com o dinheiro fazendo sua observação cômica; [00:06 - 00:09]: Bate na lataria com a palma aberta avisando o motorista, soltando um sorriso malandro.`;
    dialogueDeliveryAndLips = `Dicção rápida, ritmada e esperta típica de lotação de periferia; lábios articulam com dinamismo sem descompasso com o áudio; passageiros reagem com risadas discretas.`;
    spatialInteraction = `O apoio das mãos nos balaústres de ferro demonstra pressão mecânica real (a mão agarra o tubo sem clipping); o calçado adere ao piso de chapa de alumínio antiderrapante da van.`;
    antiDeformationRules = `As notas e moedas não flutuam no ar nem colapsam na geometria dos dedos; o teto e os bancos da van permanecem estruturalmente retos e sólidos.`;
  } else {
    // Universal Brazilian everyday archetype: Raimundo, Dona Lúcia, Carla, etc.
    const charName = currentChar || "Raimundo";
    directorVision = `Atuação naturalista e espontânea do cotidiano brasileiro. ${charName} personifica com sinceridade emocional e humor sutil a rotina doméstica da comunidade: cada gesto revela a história do personagem, o conforto na própria massa de ${w}kg e a autenticidade das reações familiares.`;
    microMovements = `Respiração diafragmática ritmada que faz a camiseta e o abdômen moverem-se suavemente; pestanejar espontâneo a cada poucos segundos; micro-ajustes involuntários de peso entre os pés descalços ou de chinelo; pequenas inclinações de cabeça ao ouvir ou ponderar a fala.`;
    handsAndGrip = `Mãos expressivas com exatamente 5 dedos articulados e proporções corretas em cada mão. Ao manusear objetos (xícara de café, talão de boletos, caneca esmaltada ou ventilador), os dedos moldam-se naturalmente ao contorno e peso do item com contato sólido, sem clipping e sem flutuação.`;
    biomechanicsAndWeight = `Gravidade e equilíbrio de ${w}kg: movimentos de sentar, levantar ou caminhar respeitam a física da inércia com aceleração e desaceleração graduais; os pés mantêm contato contínuo e firme com o chão sem deslizar (zero foot sliding); oscilação natural de ombros e braços.`;
    reactionSequence = `[00:00 - 00:03]: ${charName} processa o acontecimento inicial, os olhos reagem primeiro fixando o interlocutor, a cabeça gira suavemente com microexpressão facial de espanto ou ironia; [00:03 - 00:06]: Movimenta o corpo e as mãos com intenção motivada enquanto pronuncia a fala de 9 segundos; [00:06 - 00:09]: Conclui o gesto das mãos, desacelera o corpo e sustenta o olhar expressivo que prepara a continuidade da história (ou desfecho definitivo).`;
    dialogueDeliveryAndLips = `Sincronia labial perfeita acompanhando a fala ritmada de 9 segundos em português brasileiro; respiração fluida e pausas naturais entre orações; os personagens ouvintes em cena mantêm escuta ativa (micro-reações no olhar, assentimento de cabeça e respiração sincronizada).`;
    spatialInteraction = `Interação física realista com o ambiente: ao sentar no sofá ou cadeira, o estofamento cede proporcionalmente ao peso de ${w}kg; ao apoiar os braços na mesa, os cotovelos descansam sobre a superfície sólida com pressão gravitacional real.`;
    antiDeformationRules = `Preservação rigorosa da identidade anatômica de ${charName}: zero duplicação de dedos, zero membros atravessando o corpo ou roupas, zero deslizamento sobre o piso e estabilidade morfológica completa durante rotações de cabeça.`;
  }

  const actorDirection = {
    directorVision,
    microMovements,
    handsAndGrip,
    biomechanicsAndWeight,
    reactionSequence,
    dialogueDeliveryAndLips,
    spatialInteraction,
    antiDeformationRules,
  };

  const enActorDirectionSnippet = `[ACTOR DIRECTION & ULTRA-REALISTIC HUMAN BIOMECHANICS - 50-YEAR VETERAN DIRECTOR]: Naturalistic acting, unforced human behavior with authentic ${w}kg (${lbs} lbs) gravitational mass, realistic acceleration/deceleration, subtle visible diaphragmatic breathing, spontaneous natural eye blinks and micro-head tilts. Exactly 5 anatomical articulated fingers per hand gripping objects with realistic contact physics (zero object clipping, zero floating props, zero finger morphing). Lifelike human reaction chain (perception -> eyes focus -> head turn -> facial micro-expression -> body shift). Accurate lip-sync with realistic breathing pauses, grounded footsteps without sliding, active listening reactions for non-speakers. Spatial interaction respecting solid surfaces (chairs, counters, walls). Zero robotic stiffness, zero erratic jerking, zero morphing.`;

  const ptActorDirectionSnippet = `[DIREÇÃO DE ATORES & BIOMECÂNICA HUMANA ULTRARREALISTA (50+ ANOS DE EXPERIÊNCIA)]:
• Visão do Diretor de Atores: ${directorVision}
• Micro Movimentos Humanos: ${microMovements}
• Biomecânica das Mãos (5 Dedos Perfeitos): ${handsAndGrip}
• Física Corporal & Transferência de Peso (${w}kg): ${biomechanicsAndWeight}
• Cadeia Temporal de Reação: ${reactionSequence}
• Atuação na Fala & Sincronia Labial (9s): ${dialogueDeliveryAndLips}
• Interação Física com o Cenário: ${spatialInteraction}
• Salvaguardas Anti-Deformação de IA: ${antiDeformationRules}`;

  return {
    actorDirection,
    enActorDirectionSnippet,
    ptActorDirectionSnippet,
  };
}

function buildNovelinhaProgressionForScene(
  sc: any,
  scIdx: number,
  totalScenes: number,
  theme: string,
  prevScene?: any,
  nextScene?: any,
  storyTone: string = "comedia"
): {
  novelinhaProgression: any;
  enSnippet: string;
} {
  const isFirst = scIdx === 0;
  const isLast = scIdx === totalScenes - 1;
  const isPenultimate = scIdx === totalScenes - 2 && totalScenes >= 3;

  let stage: "gancho_inicial" | "desenvolvimento" | "complicacao" | "climax" | "desfecho" = "desenvolvimento";
  let stageName = "ETAPA 2 — DESENVOLVIMENTO";

  if (isFirst) {
    stage = "gancho_inicial";
    stageName = "ETAPA 1 — GANCHO INICIAL";
  } else if (isLast) {
    stage = "desfecho";
    stageName = "ETAPA 5 — DESFECHO";
  } else if (isPenultimate) {
    stage = "climax";
    stageName = "ETAPA 4 — CLÍMAX";
  } else if (scIdx === 1 && totalScenes >= 4) {
    stage = "desenvolvimento";
    stageName = "ETAPA 2 — DESENVOLVIMENTO";
  } else {
    stage = "complicacao";
    stageName = "ETAPA 3 — COMPLICAÇÃO";
  }

  const raw = sc.novelinhaProgression || {};
  const charSpeaking = sc.characterSpeaking || "Protagonista";

  const whatHappenedBefore = raw.whatHappenedBefore || (
    isFirst
      ? `Abertura com gancho marcante diretamente no tema '${theme}'. O público compreende o acontecimento central já nos primeiros segundos sem enrolação.`
      : prevScene?.title
      ? `No Take anterior (${prevScene.title}), ${prevScene.characterSpeaking || "o personagem"} reagiu desencadeando novas consequências na narrativa.`
      : `Desdobramento natural dos acontecimentos estabelecidos na cena anterior.`
  );

  const characterDesireNow = raw.characterDesireNow || (
    isFirst
      ? `Enfrentar a urgência imediata trazida por '${theme}' e obter uma resposta ou posicionamento do interlocutor.`
      : isLast
      ? `Alcançar a conclusão definitiva, selar o acordo, celebrar a conquista ou desfrutar do alívio com a família.`
      : isPenultimate
      ? `Superar o momento de maior impasse e tomar a decisão definitiva diante do clímax.`
      : `Contornar a complicação surgida, defender seu ponto de vista e manter a dignidade no meio da dificuldade.`
  );

  const logicalNextAction = raw.logicalNextAction || (
    isFirst
      ? `${charSpeaking} toma a iniciativa de expor o problema de forma incisiva e motivada com o corpo e a voz.`
      : isLast
      ? `${charSpeaking} expressa o sentimento de encerramento em sincronia com o desfecho de toda a jornada anterior.`
      : isPenultimate
      ? `${charSpeaking} enfrenta o ponto culminante com atitude firme ou revelação decisiva.`
      : `${charSpeaking} reage às dificuldades surgidas na complicação, propondo uma saída prática ou questionamento firme.`
  );

  const whyActionHappens = raw.whyActionHappens || (
    isFirst
      ? `Porque a situação inicial exige resposta urgente e desperta curiosidade instantânea no espectador.`
      : isLast
      ? `Porque as ações tomadas nos takes anteriores culminaram nesta consequência inevitável e coerente.`
      : isPenultimate
      ? `Porque a complicação acumulada não permitia mais adiar o confronto ou a revelação culminante.`
      : `Porque a consequência do take anterior gerou um novo obstáculo natural sem desvios aleatórios.`
  );

  const immediateConsequence = raw.immediateConsequence || (
    isFirst
      ? `Os outros personagens reagem imediatamente, estabelecendo as relações e o rumo do desenvolvimento.`
      : isLast
      ? `A história é finalizada com sentido global, emoções autênticas e sentimento de conclusão completa.`
      : isPenultimate
      ? `A tensão atinge seu ápice e define os caminhos que levarão ao desfecho coerente.`
      : `O impasse ganha novos contornos, forçando os envolvidos a uma decisão inevitável.`
  );

  const preparesNextPrompt = raw.preparesNextPrompt || (
    isLast
      ? `Desfecho final concluído: encerramento orgânico da narrativa sem pontas soltas.`
      : nextScene?.title
      ? `Prepara diretamente o Take ${scIdx + 2} (${nextScene.title}), deixando o gancho de reação e continuidade em andamento.`
      : `Entrega a ação motivada para o próximo take avançar a mesma narrativa sem saltos temporais.`
  );

  const emotionalEvolution = raw.emotionalEvolution || (
    isFirst
      ? `Tensão e inquietação inicial -> firmeza expressiva sem melodrama excessivo.`
      : isLast
      ? `Alívio autêntico -> reconciliação calorosa -> sorriso ou emoção genuína construída ao longo de todos os takes.`
      : isPenultimate
      ? `Apreensão concentrada -> impacto da decisão crucial -> clímax emocional justificado.`
      : `Dúvida comedida -> esforço conjunto -> adaptação gradual diante da complicação.`
  );

  const humanInteractionFraming = raw.humanInteractionFraming || (
    `Plano conjunto ou plano médio de interação mantendo todos os interlocutores relevantes visíveis no mesmo enquadramento, permitindo acompanhar a escuta ativa, a gesticulação e o peso real de 300kg, evitando closes excessivos e reservando a aproximação apenas para detalhes cruciais.`
  );

  const novelinhaProgression = {
    stage,
    stageName,
    whatHappenedBefore,
    characterDesireNow,
    logicalNextAction,
    whyActionHappens,
    immediateConsequence,
    preparesNextPrompt,
    emotionalEvolution,
    humanInteractionFraming,
  };

  const enSnippet = `[NOVELINHA NARRATIVE DIRECTION - 50-YEAR VETERAN DIRECTOR - ${stageName}]: Strict cause-and-effect storytelling. Scene advances the single continuous narrative logically. Human interaction framing with all conversational partners visible together in mid/group shot without excessive close-ups. Organic, unhurried emotional development.`;

  return {
    novelinhaProgression,
    enSnippet,
  };
}

function buildNarrativePlan(
  theme: string,
  synopsis: string,
  cast: any[],
  scenes: any[],
  rawPlan?: any
) {
  const protagonist = rawPlan?.protagonist || (cast[0]?.name ? `${cast[0].name} (${cast[0].roleInStory || "Protagonista"})` : "Raimundo (Protagonista trabalhador)");
  const supporting = Array.isArray(rawPlan?.supportingCharacters) && rawPlan.supportingCharacters.length > 0
    ? rawPlan.supportingCharacters
    : cast.slice(1).map((c: any) => `${c.name} (${c.roleInStory || "Co-protagonista"})`);

  return {
    protagonist,
    supportingCharacters: supporting.length > 0 ? supporting : ["Dona Lúcia (Matriarca)", "Carla (Filha)"],
    initialSituation: rawPlan?.initialSituation || `Acontecimento central em torno de '${theme}' que exige ação imediata dos personagens.`,
    mainConflict: rawPlan?.mainConflict || `Superar os obstáculos práticos e emocionais gerados por '${theme}', preservando a união familiar e a dignidade.`,
    characterDesires: rawPlan?.characterDesires || `Resolver o impasse com honestidade, afeto e humor popular brasileiro sem perder a cabeça.`,
    conflictDevelopments: Array.isArray(rawPlan?.conflictDevelopments) && rawPlan.conflictDevelopments.length > 0
      ? rawPlan.conflictDevelopments
      : [
          "Dificuldades imprevistas com materiais, calor tropical e recursos escassos.",
          "Divergência de opiniões sobre a melhor saída entre os personagens de 300kg."
        ],
    keyDecisions: Array.isArray(rawPlan?.keyDecisions) && rawPlan.keyDecisions.length > 0
      ? rawPlan.keyDecisions
      : [
          "Decisão de unir forças e improvisar com sabedoria popular em vez de desistir.",
          "Aceitar o conselho dos mais velhos e priorizar o carinho da família."
        ],
    consequences: Array.isArray(rawPlan?.consequences) && rawPlan.consequences.length > 0
      ? rawPlan.consequences
      : [
          "O esforço conjunto transforma a tensão em cumplicidade bem-humorada.",
          "O desfecho coroa a persistência com alívio verdadeiro e sorriso nos lábios."
        ],
    highestTensionPeak: rawPlan?.highestTensionPeak || `O momento de maior impasse quando tudo parece que vai desandar, exigindo a decisão culminante.`,
    storyResolution: rawPlan?.storyResolution || `Conclusão acolhedora e coerente: a situação é resolvida com afeto, respeito e sentimento de vitória compartilhada.`,
    directorExperienceNote: rawPlan?.directorExperienceNote || "Construção de novelinha cinematográfica lapidada com mais de 50 anos de experiência em dramaturgia popular brasileira, garantindo causa, consequência, enquadramentos de interação humana e desfecho que honra toda a jornada."
  };
}

const MANDATORY_DIALOGUE_ASSIGNMENT_DIRECTIVE = `STRICT CHARACTER-TO-DIALOGUE ASSIGNMENT. Each dialogue line belongs exclusively to its explicitly identified character. Multiple characters may speak in the same scene, but only one character speaks at a time unless overlapping dialogue is explicitly requested. Each character must speak only their assigned lines, using their own consistent voice and accurate lip synchronization. All other characters remain silent during that speaking turn. Never swap dialogue, voices, or lip movements between characters. Maintain a natural group composition without automatically zooming in on the speaking character.`;

function buildDialogueTurnsForScene(
  sc: any,
  sceneIdx: number,
  allCharactersInScene: any[]
): {
  dialogue: any;
  characterSpeaking: string;
} {
  const characters = (Array.isArray(allCharactersInScene) && allCharactersInScene.length > 0)
    ? allCharactersInScene
    : (sc.characterVisualAnchor ? [sc.characterVisualAnchor] : [{ name: "Raimundo", lockedAttire: "Camiseta regata branca surrada" }]);

  const rawDialogue = sc.dialogue || {};
  let turns: any[] = [];
  let timingBreakdown: any[] = [];
  let speakersInvolved: string[] = [];

  // Check if rawDialogue already has well-structured turns
  if (Array.isArray(rawDialogue.turns) && rawDialogue.turns.length > 0) {
    turns = rawDialogue.turns.map((t: any, tIdx: number) => {
      const speakerName = t.speaker || (characters[tIdx % characters.length]?.name || "Personagem");
      const matchedChar = characters.find((c: any) => c.name.toLowerCase() === speakerName.toLowerCase()) || characters[tIdx % characters.length];
      const otherChars = characters.filter((c: any) => c.name.toLowerCase() !== speakerName.toLowerCase());
      const silentText = otherChars.length > 0
        ? `${otherChars.map((c: any) => c.name).join(" e ")} permanece(m) em silêncio absoluto, lábios fechados sem mover a boca, reagindo com escuta ativa natural.`
        : "Nenhum outro personagem se move ou fala neste momento.";

      return {
        speaker: speakerName,
        speakerVisualAnchor: t.speakerVisualAnchor || (matchedChar ? `${matchedChar.name}: ${matchedChar.lockedAttire || matchedChar.ageAndFace || "Visual consistente"}` : speakerName),
        timeRange: t.timeRange || (tIdx === 0 ? "00:00 - 04:00" : "04:00 - 07:30"),
        speech: t.speech || "",
        characterAction: t.characterAction || `Gesticulação motivada e postura corporal realista de ${speakerName}`,
        silentListeners: t.silentListeners || silentText,
        lipSyncExclusiveRule: `Somente ${speakerName} move os lábios. Os demais personagens mantêm os lábios estritamente fechados e realizam escuta ativa.`
      };
    });
    speakersInvolved = Array.from(new Set(turns.map(t => t.speaker)));
  } else {
    // Construct turns based on available characters and timing
    const speaker1 = characters[0]?.name || sc.characterSpeaking || "Raimundo";
    const speaker2 = characters.length > 1 ? characters[1]?.name : null;

    if (speaker2 && rawDialogue.fullText && rawDialogue.fullText.includes("?")) {
      // Split question / response
      const splitIdx = rawDialogue.fullText.indexOf("?") + 1;
      const speech1 = rawDialogue.fullText.substring(0, splitIdx).trim();
      const speech2 = rawDialogue.fullText.substring(splitIdx).trim() || `Pode deixar, ${speaker1}, a gente resolve isso agora com calma e jeitinho.`;

      turns = [
        {
          speaker: speaker1,
          speakerVisualAnchor: `${speaker1} (${characters[0]?.lockedAttire || "Traje travado"})`,
          timeRange: "00:00 - 04:00",
          speech: speech1,
          characterAction: `${speaker1} gesticula com firmeza mantendo os pés bem plantados no chão e olhando diretamente para ${speaker2}.`,
          silentListeners: `${speaker2} permanece em silêncio absoluto, com os lábios fechados sem pronunciar palavra, ouvindo atentamente com leve inclinação de cabeça.`,
          lipSyncExclusiveRule: `Somente ${speaker1} realiza movimentação labial sincronizada. ${speaker2} permanece de lábios fechados.`
        },
        {
          speaker: speaker2,
          speakerVisualAnchor: `${speaker2} (${characters[1]?.lockedAttire || "Traje travado"})`,
          timeRange: "04:00 - 07:30",
          speech: speech2,
          characterAction: `${speaker2} responde com firmeza cordial, acenando levemente com a cabeça e abrindo os braços.`,
          silentListeners: `${speaker1} encerra sua fala e permanece em silêncio absoluto, lábios fechados, reagindo com sorriso ou alívio.`,
          lipSyncExclusiveRule: `Somente ${speaker2} realiza movimentação labial sincronizada. ${speaker1} permanece de lábios fechados.`
        }
      ];
      speakersInvolved = [speaker1, speaker2];
    } else {
      // Single speaker or unified delivery with clear turn
      turns = [
        {
          speaker: speaker1,
          speakerVisualAnchor: `${speaker1} (${characters[0]?.lockedAttire || "Traje travado"})`,
          timeRange: "00:00 - 07:30",
          speech: rawDialogue.fullText || "Tudo certo por aqui, vamos em frente com fé e coragem.",
          characterAction: `${speaker1} articula a fala de forma natural e expressiva com gesticulação comedida.`,
          silentListeners: characters.length > 1
            ? `${characters.slice(1).map((c: any) => c.name).join(", ")} permanece(m) em silêncio absoluto, lábios fechados, sem mexer a boca, reagindo com escuta ativa.`
            : "Plano conjunto com presença física firme no ambiente.",
          lipSyncExclusiveRule: `Somente ${speaker1} move os lábios. Todos os ouvintes em cena mantêm os lábios estritamente fechados.`
        }
      ];
      speakersInvolved = [speaker1];
    }
  }

  // Build timing breakdown with explicit speaker attribution and silent listeners
  if (Array.isArray(rawDialogue.timingBreakdown) && rawDialogue.timingBreakdown.length > 0) {
    timingBreakdown = rawDialogue.timingBreakdown.map((tb: any, tbIdx: number) => {
      const assignedTurn = turns[tbIdx] || turns[0];
      const speakerName = tb.speaker || assignedTurn?.speaker || sc.characterSpeaking || characters[0]?.name || "Personagem";
      const otherChars = characters.filter((c: any) => c.name.toLowerCase() !== speakerName.toLowerCase());
      const silentText = otherChars.length > 0
        ? `${otherChars.map((c: any) => c.name).join(" e ")} em silêncio absoluto com lábios fechados`
        : "Lábios fechados para ouvintes";

      return {
        time: tb.time || (tbIdx === 0 ? "00:00 - 03:00" : tbIdx === 1 ? "03:00 - 06:00" : "06:00 - 09:00"),
        speaker: speakerName,
        speech: tb.speech || "",
        action: tb.action || "",
        silentListeners: tb.silentListeners || silentText
      };
    });
  } else {
    // Generate clean 4-segment timing breakdown
    timingBreakdown = [
      {
        time: "00:00 - 01:00",
        speaker: "Cena / Estabelecimento",
        speech: "[Troca de olhares silenciosa]",
        action: `Os personagens trocam olhares no mesmo enquadramento estabelecendo a interação humana.`,
        silentListeners: `Todos os personagens em silêncio com lábios fechados.`
      },
      ...turns.map((t, idx) => ({
        time: t.timeRange,
        speaker: t.speaker,
        speech: t.speech,
        action: t.characterAction,
        silentListeners: t.silentListeners
      })),
      {
        time: "07:30 - 09:00",
        speaker: "Cena / Reação",
        speech: "[Pausa e reação mútua]",
        action: `Desaceleração natural do movimento corporal; olhares se cruzam confirmando a continuidade.`,
        silentListeners: `Todos em silêncio, sem movimentos labiais.`
      }
    ];
  }

  const multiCharacterDialogue = speakersInvolved.length > 1;
  const fullText = rawDialogue.fullText || turns.map(t => `${t.speaker}: "${t.speech}"`).join(" ");
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  const characterSpeaking = speakersInvolved.length > 1
    ? speakersInvolved.join(" e ")
    : (speakersInvolved[0] || sc.characterSpeaking || "Raimundo");

  return {
    dialogue: {
      fullText,
      wordCount,
      multiCharacterDialogue,
      speakersInvolved,
      turns,
      timingBreakdown
    },
    characterSpeaking
  };
}

function generateProceduralCustomBatch(
  theme: string,
  setting: string,
  characterFocus: string,
  targetAi: string,
  numScenes: number,
  customDetails: string = "",
  weightKg: number = 300,
  storyTone: string = "comedia",
  customCharacter: any = null
) {
  const w = Math.max(40, Math.min(600, Number(weightKg) || 300));
  const lbs = Math.round(w * 2.20462);
  const fw = buildForcedWeightDirectives(w);
  const isEmotional = storyTone === "emocionante" || storyTone === "superacao" || /diploma|emociona|l[aá]grima|choro|abra[cç]o|marmita|p[aã]o|fome|perd[aã]o|supera[cç][aã]o|quitan|casinha/i.test(theme);

  let customAnchor: any = null;
  if (customCharacter && customCharacter.name) {
    customAnchor = {
      name: customCharacter.name,
      roleInStory: customCharacter.role || "Protagonista Principal",
      ageAndFace: customCharacter.faceAndHair || `${customCharacter.genderAndAge || "Pessoa"} com traços fisionômicos da foto de referência`,
      lockedAttire: customCharacter.lockedAttire || `Roupas visivelmente curtas, justas e de tamanho reduzido que não cabem no corpo de ${w}kg (camisetas curtas esticadas no limite e bermudas curtas apertadas com marcas de suor tropical)`,
      bodyAndWeight300kg: `Estrutura corporal pesando VISIVELMENTE ${w}kg (${lbs} lbs) com silhueta volumosa autêntica`,
      perspirationAndSkin: "Pele permanentemente ensopada de suor denso e brilhante em todo momento, gotas escorrendo sem parar pelas têmporas e bochechas, textura 8K com reflexos de calor",
      consistencyPromptClause: customCharacter.visualSummaryForPrompt || `A fictional anonymous Brazilian character matching the reference photo, visibly weighing ${w}kg (${lbs} lbs), strictly wearing undersized short tight clothing strained to the limit that visibly does not fit their massive 300kg body, continuously drenched in glistening beads of tropical sweat at all times, consistent identical character across all shots`,
      uploadedImageUrl: customCharacter.imageDataUrl,
      isCustomUploaded: true,
      weightKg: w,
    };
  }

  const allPossibleScenes = [
    {
      id: "diploma_emocionante",
      category: "sala_cozinha",
      characterKey: "dona_lucia",
      charactersPresent: ["dona_lucia", "raimundo"],
      storyTone: "emocionante",
      title: "O Primeiro Diploma da Família e as Lágrimas da Mãe",
      location: "Interior de Casa de Favela Muito Pobre e Meio Suja com Sofá Rasgado e Reboco Descascando",
      characterSpeaking: "Dona Lúcia (Mãe Orgulhosa em Prantos)",
      speech: "Meu filho, cada marmita fria que eu lavei e cada dia de faxina pesada valeu a pena pra ver esse diploma nas suas mãos!",
      beat1: "Meu filho, cada marmita fria que eu lavei...",
      act1: "Segura a moldura de madeira simples do diploma com mãos calejadas trêmulas, lágrimas genuínas escorrendo pelas bochechas.",
      beat2: "...e cada dia de faxina pesada valeu a pena...",
      act2: "Puxa o filho ajoelhado aos seus pés de 300kg para um abraço apertado, encostando a testa na dele em prantos de alívio.",
      beat3: "...pra ver esse diploma nas suas mãos! Você venceu!",
      act3: "Beija os cabelos do filho com os olhos fechados cheios de lágrimas brilhando sob a luz suave da lâmpada amarelada.",
      englishBase: "Deeply emotional, award-winning cinematic documentary drama inside a dilapidated, somewhat dirty and grimy Brazilian favela house of extremely poor people. An elderly Brazilian matriarch weeping authentic heavy tears of unadulterated relief and immense pride on a torn brown sofa with exposed yellow foam. Exposed unfinished red clay bricks, peeling water-stained plaster, dingy grimy concrete floor, hanging naked tungsten bulb, calloused trembling hands gently cupping her adult son's face. Framed college graduation certificate held with trembling reverence. Warm soft golden afternoon window sunlight catching specular highlights on real tear tracks. 50mm lens, f/1.8, authentic gritty favela poverty atmosphere.",
      ptBase: "Cena dramática profundamente emocionante em casa de favela muito pobre e meio suja. Paredes de tijolo baiano sem reboco com manchas de mofo e umidade, chão de cimento encardido e fiação exposta. Dona Lúcia de vestido de chita florida chorando lágrimas verdadeiras de orgulho infinito no sofá rasgado com espuma amarelada, enquanto o filho ajoelhado apoia os braços volumosos nas pernas dela segurando o canudo de formatura. Luz dourada suave iluminando lágrimas e suor sob a dureza da vida humilde.",
    },
    {
      id: "pao_dividido_emocionante",
      category: "borracharia_oficina",
      characterKey: "seu_tiao",
      charactersPresent: ["seu_tiao", "raimundo"],
      storyTone: "emocionante",
      title: "O Pão e a Marmita Divididos na Oficina",
      location: "Borracharia de Esquina sob Chuva Fina",
      characterSpeaking: "Seu Tião (Borracheiro de 300kg com Coração de Ouro)",
      speech: "Pode puxar esse banco e comer, meu irmão! Enquanto tiver um grão de feijão na minha marmita, ninguém passa fome na minha porta!",
      beat1: "Pode puxar esse banco e comer, meu irmão...",
      act1: "Abre a tampa de alumínio da marmita fumegante de arroz com ovo e empurra metade da comida com uma colher de metal gasta.",
      beat2: "...enquanto tiver um grão de feijão na minha marmita...",
      act2: "Põe a mão pesada e suja de graxa no ombro do amigo com olhos marejados de empatia profunda e respeito humano.",
      beat3: "...ninguém passa fome na minha porta! Come aí com Deus!",
      act3: "Entrega a colher com olhar comovido, respirando fundo com peito arfando de nobreza e dignidade da periferia.",
      englishBase: "Cinematic, profoundly moving human drama in a rustic roadside mechanic garage. A colossal Brazilian tire mechanic sharing his hot aluminum lunchbox of rice and beans with an unemployed neighbor in gentle rain. Motor grease smudges, steam rising from fresh food, calloused heavy hands resting reassuringly on the friend's shoulder. Eyes glistening with real tears of raw empathy. 40mm lens, f/2.2, intimate, dignified, emotionally overwhelming realism.",
      ptBase: "Plano cinematográfico de pura comoção e solidariedade na borracharia. Seu Tião de macacão azul manchado de graxa dividindo sua marmita simples de arroz e ovo com o vizinho desempregado, olhos brilhando com lágrimas de afeto e compaixão. Chuva fina lá fora e atmosfera de calor humano inesquecível.",
    },
    {
      id: "reconciliacao_chuva_emocionante",
      category: "rua_lama",
      characterKey: "raimundo",
      charactersPresent: ["raimundo", "dona_lucia"],
      storyTone: "emocionante",
      title: "O Perdão e o Abraço na Rua de Lama",
      location: "Rua de Barro Molhada sob Chuva Torrencial de Verão",
      characterSpeaking: "Raimundo (Filho em Prantos de Arrependimento)",
      speech: "Me perdoa por todos os anos que eu te fiz sofrer, mãe! Eu juro que a partir de hoje eu vou ser o filho que a senhora merece!",
      beat1: "Me perdoa por todos os anos que eu te fiz sofrer, mãe...",
      act1: "Cai de joelhos na lama sob a chuva forte, mãos abertas em súplica com a água e lágrimas lavando o rosto.",
      beat2: "...eu juro que a partir de hoje...",
      act2: "Dona Lúcia larga a sombrinha na chuva e se abaixa para abraçar a cabeça do filho com as duas mãos protetoras.",
      beat3: "...eu vou ser o filho que a senhora merece! Me perdoa!",
      act3: "Ambos se abraçam chorando forte sob a chuva, corpos de 300kg unidos em soluços de reconciliação que comovem os vizinhos.",
      englishBase: "Heartbreaking and triumphant emotional cinematic climax under heavy tropical summer rainfall on an unpaved muddy neighborhood road. A massive son kneeling in the mud in desperate repentance, sobbing tears mixing with raindrops on his cheeks. His elderly mother drops her umbrella and wraps her arms around him in unconditional forgiveness. Visceral emotional release, slow motion rain droplets, 35mm anamorphic, f/2.0, stunning human empathy and redemption.",
      ptBase: "Clímax de forte impacto emocional sob chuva torrencial na rua de barro da comunidade. Filho ajoelhado na lama pedindo perdão aos prantos, enquanto a mãe de chita larga tudo e o abraça apertado chorando de amor incondicional. Gotas de chuva e lágrimas se misturam em cena de comoção profunda.",
    },
    {
      id: "casa_quitada_emocionante",
      category: "sala_cozinha",
      characterKey: "todos",
      charactersPresent: ["dona_lucia", "raimundo", "carla"],
      storyTone: "emocionante",
      title: "A Vitória da Casinha Própria de 30 Anos",
      location: "Cozinha de Casa de Favela Muito Pobre e Meio Suja com Mesa Rústica e Reboco Descascando",
      characterSpeaking: "Carla (Irmã com Nó na Garganta e Comprovante na Mão)",
      speech: "Tá pago, mãe! Depois de trinta anos de aluguel e despejo, ninguém mais tira a gente do nosso pedaço de chão sagrado!",
      beat1: "Tá pago, mãe! Depois de trinta anos de aluguel...",
      act1: "Exibe o papel carimbado do banco com as mãos trêmulas sobre a mesa de fórmica, voz falhando de emoção.",
      beat2: "...e despejo, ninguém mais tira a gente...",
      act2: "Dona Lúcia beija o papel molhando-o com lágrimas abundantes de alívio e gratidão ao lado de Raimundo.",
      beat3: "...do nosso pedaço de chão sagrado! É nossa!",
      act3: "A família inteira se une em um abraço coletivo apertado em volta da mesa humilde, chorando juntos de alívio.",
      englishBase: "Tender, tear-jerking documentary portrait of family triumph inside a poverty-stricken, grimy and dilapidated Brazilian favela kitchen. Three massive working-class family members weighing 300kg weeping joyful tears together around a greasy rustic table, holding up a stamped mortgage payoff document. Exposed unfinished red clay blocks, grease stains and water leak marks on crumbling peeling plaster, dingy grimy floor, rusty gas tank, authentic favela poverty grit. 35mm lens, f/2.8, deeply stirring.",
      ptBase: "Cena comovente de vitória familiar na cozinha de casa de favela muito pobre e meio suja. Paredes de tijolo baiano aparente e reboco esfarelando, chão de cimento manchado e fogão velho com fuligem. Família segurando o comprovante da última prestação de 30 anos quitada da casinha, chorando abraçados de joelhos e agradecendo pela conquista de uma vida inteira de suor e fé.",
    },
    {
      id: "mutirao_teto_emocionante",
      category: "obra_laje",
      characterKey: "marcao_pedreiro",
      charactersPresent: ["marcao_pedreiro", "dona_lucia"],
      storyTone: "emocionante",
      title: "O Mutirão Solidário e as Lágrimas da Vizinha",
      location: "Laje sob Céu de Fim de Tarde Dourado",
      characterSpeaking: "Marcão (Pedreiro Mestre de Coração Generoso)",
      speech: "Pode secar essas lágrimas, Dona Lúcia! Enquanto esses homens aqui tiverem força no braço, a senhora não passa chuva sozinha nunca mais!",
      beat1: "Pode secar essas lágrimas, Dona Lúcia...",
      act1: "Desce da escada com a colher de pedreiro na mão e enxuga uma lágrima discreta no próprio canto do olho com o antebraço suado.",
      beat2: "...enquanto esses homens aqui tiverem força no braço...",
      act2: "Aponta para o teto novo de telhas coloniais montado de graça pela vizinhança unida antes da tempestade.",
      beat3: "...a senhora não passa chuva sozinha nunca mais! Estamos juntos!",
      act3: "Aperta as mãos trêmulas da idosa que chora de joelhos abençoando todos os trabalhadores com um sorriso radiante.",
      englishBase: "Inspirational and touching cinematic scene on a community rooftop at golden hour. A giant burly bricklayer comforting an impoverished elderly woman whose storm-damaged roof was rebuilt for free by working-class neighbors. Golden sunset backlight, genuine tears of gratitude, calloused hands interlinked, uplifting community solidarity. 50mm lens, f/2.0.",
      ptBase: "Momento emocionante de solidariedade comunitária no alto da laje ao pôr do sol. Marcão de 300kg com o peito suado e marcas de cimento confortando a vizinha idosa que chora de gratidão pelas telhas novas trocadas em mutirão sem cobrar nada. Dignidade e afeto.",
    },
    {
      id: "feira_pastel",
      category: "feira_livre",
      characterKey: "tia_creuza",
      charactersPresent: ["tia_creuza", "raimundo"],
      title: "O Pastel de Vento da Feira de Domingo",
      location: "Feira Livre - Barraca de Pastel e Caldo de Cana",
      characterSpeaking: "Tia Creuza (Vendedora de Pastel de 300kg)",
      speech: "Meu filho, esse pastel aqui tem tanto recheio que você vai precisar de autorização do médico de trezentos quilos pra morder!",
      beat1: "Meu filho, esse pastel aqui tem tanto recheio...",
      act1: "Mergulha o pegador de metal gigante no tacho de óleo borbulhante com avental amarelo.",
      beat2: "...que você vai precisar de autorização do médico...",
      act2: "Enxuga o suor da testa com as costas da mão roliça, rindo com o cliente de 300kg ao balcão.",
      beat3: "...de trezentos quilos pra morder! Coloca vinagrete!",
      act3: "Coloca o pastel dourado e fumegante num guardanapo rústico sobre o balcão da barraca.",
      englishBase: "Documentary realism wide-medium shot in a bustling open-air Brazilian street market. Deep sweat glistens under blue and yellow plastic tarps. Metal tongs pulling a colossal golden fried pastel pastry from a bubbling oil vat. Rustic wooden crates with vegetables, roaring sugarcane juice press machine, wet muddy ground with cabbage leaves. 35mm lens, f/2.8, warm tropical market lighting.",
      ptBase: "Cena documental em feira livre de domingo. Tia Creuza fritando pastel gigante num tacho de óleo borbulhante com avental amarelo sob lona da barraca, enquanto Raimundo apoia o braço maciço no balcão esperando. Pele suada com microtextura realista, caixotes de feira e poças d'água no chão.",
    },
    {
      id: "borracharia_pneu",
      category: "borracharia_oficina",
      characterKey: "seu_tiao",
      charactersPresent: ["seu_tiao", "raimundo"],
      title: "O Alinhamento de Pneu na Borracharia do Tião",
      location: "Borracharia e Oficina Mecânica de Esquina",
      characterSpeaking: "Seu Tião (Borracheiro de 300kg)",
      speech: "Esse pneu de caminhão só aguenta a pressão porque foi calibrado por um homem de trezentos quilos com ferramenta de ferro!",
      beat1: "Esse pneu de caminhão só aguenta a pressão...",
      act1: "Apoia o braço imenso com veias e dobras de 300kg sobre um pneu gigante de trator encostado na parede.",
      beat2: "...porque foi calibrado por um homem de trezentos quilos...",
      act2: "Bate com a chave inglesa de aço no aro com som metálico seco, respirando pesado de suor ao lado do amigo.",
      beat3: "...com ferramenta de ferro! Vai rodar mais dez anos!",
      act3: "Gesticula com a mão suja de graxa preta apontando para o compressor de ar antigo roncando.",
      englishBase: "Gritty documentary still of an unpaved roadside Brazilian tire repair garage. Deep motor grease puddles, stacks of worn truck tires, rusty wrenches, and a noisy green air compressor. Natural overcast sky lighting, 35mm lens, f/2.8 documentary handheld look.",
      ptBase: "Plano documental rústico na borracharia. Seu Tião de macacão azul manchado de óleo graxa apoiado no pneu gigante, com Raimundo sentado num engradado assistindo com regata cinza. Pele ensopada de suor com poros visíveis, compressor de ar antigo e chão de terra batida.",
    },
    {
      id: "laje_marcao",
      category: "obra_laje",
      characterKey: "marcao_pedreiro",
      charactersPresent: ["marcao_pedreiro", "raimundo"],
      title: "O Nível da Laje no Sol do Meio-Dia",
      location: "Laje Inacabada com Tijolos Baianos sob Sol Escaldante",
      characterSpeaking: "Marcão (Pedreiro Mestre de 300kg)",
      speech: "Essa viga aqui não enverga nem se subir a diretoria inteira, porque quem bateu essa massa foi esse pedreiro de trezentos quilos!",
      beat1: "Essa viga aqui não enverga nem se subir a diretoria inteira...",
      act1: "Bate com o cabo da colher de pedreiro na coluna de concreto recém-desformada.",
      beat2: "...porque quem bateu essa massa...",
      act2: "Pega a toalha de banho encardida no pescoço e esfrega na testa brilhante de suor tropical.",
      beat3: "...foi esse pedreiro de trezentos quilos! Ficou no prumo!",
      act3: "Abre um sorriso largo banguelo apontando para a betoneira amarela girando na laje com seu ajudante.",
      englishBase: "Hard-hitting documentary realism on a sun-drenched Brazilian construction rooftop slab. Yellow spinning concrete mixer, stacks of unplastered orange clay bricks, and rusty rebar under intense harsh noon tropical sunlight. Handheld documentary camera, 35mm lens, f/3.2, authentic raw grit.",
      ptBase: "Plano documental de batidão de laje sob sol forte. Marcão sem camisa com toalha no pescoço suado e pó de cimento na bermuda, segurando colher de pedreiro ao lado de Raimundo que descarrega os baldes de concreto. Pele com reflexos especulares intensos de suor.",
    },
    {
      id: "salao_valdirene",
      category: "barbearia_salao",
      characterKey: "valdirene",
      charactersPresent: ["valdirene", "carla"],
      title: "A Fofoca no Secador da Laje",
      location: "Salão da Laje com Espelho Trincado e Toalhas",
      characterSpeaking: "Valdirene (Cabeleireira de 300kg)",
      speech: "Mulher, desliga esse ventilador que o babado é forte demais pra vizinha do portão escutar o que aconteceu ontem!",
      beat1: "Mulher, desliga esse ventilador...",
      act1: "Segura o secador de cabelo preto com fita isolante no fio, desligando o botão no meio da escova.",
      beat2: "...que o babado é forte demais...",
      act2: "Inclina o tronco massivo de 300kg para a frente com olhar conspiratório e bobs coloridos no cabelo.",
      beat3: "...pra vizinha do portão escutar o que aconteceu ontem! Me conta!",
      act3: "Bate as palmas gordinhas e suadas com sorriso eufórico no avental rosa encarando a cliente com bobs.",
      englishBase: "Documentary comedy scene in a makeshift home rooftop hair salon. Cracked square mirror taped to a bare red-brick wall, brightly colored towels drying on a nylon line, plastic chairs creaking under weight. 40mm lens, f/2.4, natural indoor lighting.",
      ptBase: "Cena em salão de beleza improvisado na laje. Valdirene de avental rosa com bobs no cabelo, segurando secador de cabelo e cochichando com Carla que está com bobs e camiseta lilás. Espelho trincado na parede de tijolo baiano, toalhas no varal e cadeiras plásticas envergando sob o peso de 300kg.",
    },
    {
      id: "van_betinho",
      category: "ponto_onibus",
      characterKey: "betinho_van",
      charactersPresent: ["betinho_van", "raimundo"],
      title: "O Troco na Van de Lotação",
      location: "Ponto de Van - Parada com Telha Quebrada",
      characterSpeaking: "Betinho (Cobrador de Van de 300kg)",
      speech: "Cabe mais quatro se todo mundo respirar junto, porque o cobrador de trezentos quilos já garantiu o lugar na frente!",
      beat1: "Cabe mais quatro se todo mundo respirar junto...",
      act1: "Bate a palma da mão espalmada na lataria amassada da van branca na porta de correr.",
      beat2: "...porque o cobrador de trezentos quilos...",
      act2: "Puxa o zíper da pochete preta esticada no abdômen volumoso e conta notas amassadas de 2 reais.",
      beat3: "...já garantiu o lugar na frente! Encosta aí!",
      act3: "Solta um grito pro motorista com a cabeça para fora enquanto o passageiro de 300kg sobe o degrau.",
      englishBase: "Documentary shot beside a white commuter passenger van on a Brazilian suburban street. Cracked asphalt road, crowded bus stop with broken asbestos roof, people watching with amused expressions. Handheld camera, 35mm lens, f/2.8.",
      ptBase: "Plano documental no ponto de van de lotação. Betinho com regata esportiva e pochete esticada na barriga de 300kg batendo na van branca, enquanto Raimundo de regata cinza e chinelos sobe o degrau espremido. Pele brilhando de suor sob luz natural.",
    },
    {
      id: "boteco_ze",
      category: "boteco_esquina",
      characterKey: "seu_ze",
      charactersPresent: ["seu_ze", "raimundo"],
      title: "O Ponto da Sinuca no Boteco do Zé",
      location: "Boteco de Esquina com Mesa de Sinuca e Estufa",
      characterSpeaking: "Seu Zé do Bar (Dono de Boteco de 300kg)",
      speech: "Nesse pano verde aqui ninguém aposta sem dinheiro na mão, que cerveja fiada não paga distribuidora nem sustenta homem de trezentos quilos!",
      beat1: "Nesse pano verde aqui ninguém aposta sem dinheiro na mão...",
      act1: "Passa giz azul na ponta do taco de sinuca com expressão séria atrás da mesa de bilhar com feltro puído.",
      beat2: "...que cerveja fiada não paga distribuidora...",
      act2: "Bate no balcão de vidro da estufa cheia de coxinhas e risoles dourados.",
      beat3: "...nem sustenta homem de trezentos quilos! Bota a nota!",
      act3: "Apoia as mãos roliças na cintura de 300kg encarando Raimundo no balcão com olhar cômico.",
      englishBase: "Atmospheric documentary scene inside a neighborhood Brazilian corner bar (boteco). Stacks of empty yellow beer crates, a glowing food warmer with fried snacks, fluorescent tube lighting, and peeling green walls. Realistic sweaty sheen, deep skin folds, raw documentary aesthetic, 35mm lens, f/2.8.",
      ptBase: "Cena em boteco de esquina brasileiro. Seu Zé de camisa florida aberta e pano de prato no ombro encarando Raimundo de regata cinza encostado na mesa de sinuca. Engradados de cerveja empilhados, estufa com salgados iluminada e paredes desgastadas.",
    },
    {
      id: "sofa_rasgado",
      category: "sala_cozinha",
      characterKey: "raimundo",
      charactersPresent: ["raimundo", "dona_lucia"],
      title: "O Padrão de Vida no Sofá Rasgado",
      location: "Sala de Casa de Favela Muito Pobre e Meio Suja com Reboco Descascando e Goteira",
      characterSpeaking: "Raimundo (Homem Obeso 300kg)",
      speech: "Mãe, eu não aceito que você chame isso de pobreza não! A gente tem televisão, tem sofá e eu tomei refrigerante hoje!",
      beat1: "Mãe, eu não aceito que você chame isso de pobreza não!",
      act1: "Ergue a garrafa de refrigerante no ar com ar de superioridade cômica, sentado no sofá rasgado.",
      beat2: "A gente tem televisão, tem sofá...",
      act2: "Aponta o queixo suado em direção à TV de tubo e estapeia a própria barriga imensa de 300kg olhando para a mãe.",
      beat3: "...e eu tomei refrigerante hoje! O dinheiro que não acompanha!",
      act3: "Dá um gole rápido no copo e solta um suspiro dramático enquanto Dona Lúcia entra na sala exasperada.",
      englishBase: "Documentary realism film still inside a poverty-stricken, grimy and dilapidated Brazilian favela house of extremely poor people. Torn vintage sofa with exposed stained yellow polyurethane foam and dingy fabric. Peeling flaky lime plaster reveals raw red clay bricks, dark water leak mold stains, grimy dirt-stained concrete floor, a dangling single naked 60W tungsten bulb, handwritten poster 'AQUI O SISTEMA É BRUTO' on dirty greasy wall, and an old 1990s CRT TV on a milk crate glowing softly. Ultra-photorealistic 8k, raw handheld documentary camera, 35mm lens, f/2.8, humid room lighting with sweat specular highlights.",
      ptBase: "Plano médio documental na sala de casa de favela bem pobre e meio suja. Raimundo de 300kg sentado no sofá marrom surrado com espuma amarela exposta e encardida, de regata cinza e bermuda curta. Dona Lúcia de vestido floral e avental parada na porta de braços cruzados com olhar repreensivo. Parede de tijolo baiano sem reboco, reboco esfarelando, chão de cimento manchado de poeira e fiação elétrica de gambiarra pendurada. Lente 35mm f/2.8.",
    },
    {
      id: "boletos_lucia",
      category: "sala_cozinha",
      characterKey: "dona_lucia",
      charactersPresent: ["dona_lucia", "raimundo"],
      title: "Dona Lúcia e a Mesa de Boletos de Luz",
      location: "Cozinha de Casa de Favela Bem Pobre e Meio Suja com Mesa Encardida",
      characterSpeaking: "Dona Lúcia (Matriarca Idosa 300kg)",
      speech: "Raimundo, seu padrão de vida tá tão alto que você quer gastar o dinheiro da comida antes mesmo dele chegar na mesa!",
      beat1: "Raimundo, seu padrão de vida tá tão alto...",
      act1: "Bate as duas mãos espalmadas sobre a mesa cheia de boletos atrasados de luz e moedas.",
      beat2: "...que você quer gastar o dinheiro da comida...",
      act2: "Aponta o dedo indicador com energia para o filho de regata cinza sentado ao lado, balançando a cabeça em repreensão.",
      beat3: "...antes mesmo dele chegar na mesa! Olha essas contas!",
      act3: "Pega uma nota amassada de dois reais e chacoalha no ar com expressão brava.",
      englishBase: "Cinematic hyper-realistic documentary shot inside a very poor, grimy Brazilian favela kitchen. Weathered greasy rustic wooden dining table covered with unpaid electric utility bills, scattered coins, and crumpled banknotes. In the background, damp stained walls with exposed red clay brick patches and peeling crumbling plaster, old rusty refrigerator, greasy dirty dishes in the sink, soot marks near a 2-burner rusty gas stove, and handwritten prayer sign 'DEUS É A NOSSA FORÇA'. Authentic Brazilian favela poverty ambiance, gritty documentary lighting, 40mm lens, f/2.4.",
      ptBase: "Plano médio-fechado na cozinha de casa de favela bem pobre e meio suja. Dona Lúcia de vestido floral e avental sentada à mesa manchada de gordura cheia de boletos atrasados, gesticulando contra Raimundo que escuta com cara de coitado. Parede de tijolo aparente, reboco descascando com umidade, fogão enferrujado com fuligem e fiação de gambiarra no teto.",
    },
    {
      id: "cratera_bambu",
      category: "rua_lama",
      characterKey: "raimundo",
      charactersPresent: ["raimundo", "marcao_pedreiro"],
      title: "Medindo a Cratera de Barro com Vara de Bambu",
      location: "Rua de Terra Vermelha com Lagoa de Lama",
      characterSpeaking: "Raimundo (na Cratera de Lama)",
      speech: "Disseram que iam arrumar essa rua faz tanto tempo que esse buraco já devia ter até escritura e conta de luz própria!",
      beat1: "Disseram que iam arrumar essa rua faz tanto tempo...",
      act1: "Agacha com dificuldade nas margens da cratera de barro, afundando os chinelos na lama espessa.",
      beat2: "...que esse buraco já devia ter até escritura...",
      act2: "Usa um pedaço de bambu longo para medir a profundidade da água barrenta avermelhada ao lado de Marcão.",
      beat3: "...e conta de luz própria! Olha o tamanho disso!",
      act3: "Levanta os braços suados pro céu olhando indignado para a câmera com boca aberta.",
      englishBase: "Authentic raw documentary style wide-medium shot beside a giant muddy road crater filled with brown stagnant rainwater on an unpaved Brazilian street. Unfinished red-brick houses without stucco, a faded concrete wall painted with 'DEUS É FIEL', overhead tangled electrical wires, and municipal billboard 'OBRAS DE MELHORIAS NA VIA'. Overcast rainy day lighting, fine mist drizzle, 28mm wide lens.",
      ptBase: "Plano aberto médio documental na rua de terra vermelha após chuva. Raimundo com regata cinza e chinelos afundados na lama medindo a cratera com vara de bambu, enquanto Marcão Pedreiro sem camisa e com toalha no pescoço observa com a mão na cintura. Muro pichado 'DEUS É FIEL' e poça de água barrenta.",
    },
    {
      id: "tabua_lama",
      category: "rua_lama",
      characterKey: "raimundo",
      charactersPresent: ["raimundo", "dona_lucia"],
      title: "A Tábua de Travessia no Lamaçal Vermelho",
      location: "Rua de Barro em Frente ao Muro 'Deus é Fiel'",
      characterSpeaking: "Raimundo (Equilibrando na Tábua)",
      speech: "Se essa tábua quebrar com os meus trezentos quilos, eu não caio na lama não, eu viro o prefeito dessa lagoa aqui!",
      beat1: "Se essa tábua quebrar com os meus trezentos quilos...",
      act1: "Dá o primeiro passo cauteloso sobre a tábua de madeira fina colocada sobre a cratera de água barrenta.",
      beat2: "...eu não caio na lama não...",
      act2: "Abre os braços massivos gesticulando para não perder o equilíbrio, respiração ofegante e suor na testa.",
      beat3: "...eu viro o prefeito dessa lagoa aqui! Corre, mãe!",
      act3: "Olha para Dona Lúcia segurando o guarda-chuva e solta uma gargalhada enquanto a água espirra na borda.",
      englishBase: "Documentary style wide shot of an unpaved muddy road. An elderly matriarch in floral dress holding an umbrella watches with hands on her chest in comedic fear. Overhead overcast grey sky, unfinished brick houses in background, realistic mud ripples in brown rainwater. 35mm lens, f/2.8.",
      ptBase: "Plano aberto documental de rua de barro. Raimundo de regata cinza e bermuda marrom se equilibrando na tábua de madeira sobre a cratera de água barrenta, enquanto Dona Lúcia com seu vestido floral e guarda-chuva assiste da calçada com cara de aflição cômica. Ambos pesando rigorosamente 300kg.",
    },
  ];

  // Smart filtering for rich diversification and tone fidelity
  let filtered = allPossibleScenes;

  if (isEmotional) {
    const emotionalScenes = allPossibleScenes.filter((s) => s.storyTone === "emocionante");
    const nonEmotional = allPossibleScenes.filter((s) => s.storyTone !== "emocionante");
    filtered = [...emotionalScenes, ...nonEmotional];
  } else if (storyTone === "comedia") {
    const comedyScenes = allPossibleScenes.filter((s) => s.storyTone !== "emocionante");
    filtered = comedyScenes.length > 0 ? comedyScenes : allPossibleScenes;
  }

  if (setting && setting !== "aleatorio" && setting !== "misto") {
    const byCategory = filtered.filter((s) => s.category === setting);
    if (byCategory.length > 0) {
      filtered = byCategory;
    }
  }

  if (characterFocus && characterFocus !== "diversificado" && characterFocus !== "todos") {
    const byChar = filtered.filter((s) => s.characterKey === characterFocus);
    if (byChar.length > 0) {
      filtered = byChar;
    }
  }

  // If aleatorio or diversificado or general, shuffle or cycle to ensure variety
  if (filtered.length < numScenes) {
    const remaining = allPossibleScenes.filter((s) => !filtered.includes(s));
    filtered = [...filtered, ...remaining];
  }

  const totalScenes = Math.min(numScenes, filtered.length);
  const scenes = filtered.slice(0, totalScenes).map((item, index) => {
    const isFirst = index === 0;
    const isLast = index === totalScenes - 1;

    const userThemeClean = theme && theme.trim().length > 0 ? theme.trim() : item.title;
    const isCustomStory = theme && !allPossibleScenes.some((s) => s.title.toLowerCase() === theme.toLowerCase());

    let narrativeBeat = "";
    let storyConnection = "";
    let title = item.title;
    let speech = item.speech;
    let beat3 = item.beat3;
    let act3 = item.act3;

    if (isCustomStory) {
      if (isEmotional) {
        if (totalScenes === 1) {
          title = `Take 1: ${userThemeClean.slice(0, 45)}`;
          speech = `Mãe, eu nunca tive vergonha da nossa batalha e do nosso suor! Essa conquista aqui é pelo nosso esforço diário!`;
          beat3 = `Essa conquista aqui é pelo nosso esforço diário! Nós vencemos!`;
          act3 = `Abraça apertado com lágrimas reais escorrendo pelo rosto volumoso de 300kg.`;
        } else if (isFirst) {
          title = `Take 1: Gancho Inicial - ${userThemeClean.slice(0, 35)}`;
          speech = `Olha pra mim e não chora agora não! Cada humilhação e sacrifício que a gente passou foi o degrau dessa história!`;
          beat3 = `...foi o degrau dessa história! Aguenta firme que a gente vai vencer!`;
          act3 = `Segura as mãos calejadas do familiar comovido, com olhos cheios de lágrimas sinceras e suor escorrendo.`;
        } else if (isLast) {
          title = `Take ${index + 1}: O Desfecho Emocionante - ${userThemeClean.slice(0, 35)}`;
          speech = `A gente venceu, meu Deus! Não sobrou dúvida de que nossa família foi abençoada! A gente venceu junto!`;
          beat3 = `A gente venceu junto! Eu te amo com toda a minha alma!`;
          act3 = `Abraço apertado de comoção profunda e choro de alívio entre corpos de 300kg sob luz suave.`;
        } else {
          title = `Take ${index + 1}: O Sacrifício & Desabafo - ${userThemeClean.slice(0, 35)}`;
          speech = `Quem viu a nossa dor lá atrás não acreditava, mas o amor dessa casa é mais forte que qualquer tempestade!`;
          beat3 = `...o amor dessa casa é mais forte que qualquer tempestade! Estamos juntos!`;
          act3 = `Enxuga as lágrimas nas bochechas roliças de 300kg com respiração ofegante e olhar de respeito.`;
        }
      } else {
        if (totalScenes === 1) {
          title = `Take 1: ${userThemeClean.slice(0, 45)}`;
          speech = `Se inventarem de mexer nessa situação aqui sem chamar quem entende, a confusão de trezentos quilos vai parar na internet!`;
          beat3 = `...a confusão vai parar na internet! Segura essa!`;
          act3 = `Gesticula com a mão suada e arregala os olhos em tom de deboche cômico popular.`;
        } else if (isFirst) {
          title = `Take 1: Gancho Inicial - ${userThemeClean.slice(0, 35)}`;
          speech = `Para tudo e presta atenção no que tá acontecendo bem aqui na nossa frente antes que essa história desande de vez!`;
          beat3 = `...antes que essa história desande de vez! Olha só a encrenca!`;
          act3 = `Aponta de forma exagerada para a cena enquanto o corpo de 300kg se mexe com inércia cômica.`;
        } else if (isLast) {
          title = `Take ${index + 1}: Desfecho & Punchline - ${userThemeClean.slice(0, 35)}`;
          speech = `E no final das contas, quem resolveu a parada inteira foi a gente com a nossa malemolência de trezentos quilos!`;
          beat3 = `...com a nossa malemolência de trezentos quilos! Tá resolvido!`;
          act3 = `Dá uma risada calorosa e pisca para a câmera fechando o take com chave de ouro.`;
        } else {
          title = `Take ${index + 1}: A Confusão Aumenta - ${userThemeClean.slice(0, 35)}`;
          speech = `Eu avisei que se deixasse na mão deles ia dar zebra, agora aguenta o tranco que o negócio esquentou de vez!`;
          beat3 = `...agora aguenta o tranco que o negócio esquentou de vez! Olha lá!`;
          act3 = `Bate as mãos na barriga sob a camiseta curta apertada com suor escorrendo.`;
        }
      }
    } else if (isEmotional) {
      if (totalScenes === 1) {
        narrativeBeat = "Take Único: Gancho Emocionante com Desfecho de Superação";
        storyConnection = "Arco emocional conciso: gancho imediato que revela o sacrifício e culmina em alívio tocante.";
      } else if (isFirst) {
        narrativeBeat = "Ato 1: Gancho Forte, Desabafo & Incidente Incitante";
        storyConnection = "Ponto de partida tocante: o gancho revela a luta humilde e o sacrifício que ancoram toda a narrativa.";
        title = `${item.title} (Gancho: O Sacrifício)`;
      } else if (isLast) {
        narrativeBeat = "Ato Final: Desfecho Comovente & Resolução do Gancho";
        storyConnection = `Conexão Direta: Em decorrência do Take #${index}, o sacrifício do gancho inicial culmina em triunfo, lágrimas de gratidão e um abraço inesquecível.`;
        title = `${item.title} (Triunfo, Lágrimas & Abraço)`;
        beat3 = `${item.beat3} Eu te amo com toda a minha força e gratidão! Nós vencemos juntos!`;
        act3 = `${item.act3} Abraça apertado com lágrimas reais escorrendo pelo rosto, comovendo o público com pura ternura.`;
        speech = `${item.beat1} ${item.beat2} ${beat3}`;
      } else {
        narrativeBeat = `Ato ${index + 1}: Comoção Crescente & Nó na Garganta`;
        storyConnection = `Continuação Direta: Reação de profundo afeto aos acontecimentos do Take #${index}, intensificando as lágrimas e a cumplicidade.`;
      }
    } else {
      if (totalScenes === 1) {
        narrativeBeat = "Take Único: Gancho Cômico com Resolução Imediata";
        storyConnection = "Arco conciso: gancho magnético nos primeiros 3s e punchline definitiva nos últimos 3s.";
      } else if (isFirst) {
        narrativeBeat = "Ato 1: Gancho Forte & Incidente Incitante";
        storyConnection = "Início magnético: estabelece o gancho de abertura e a faísca que deflagra toda a história.";
        title = `${item.title} (Gancho Inicial)`;
      } else if (isLast) {
        narrativeBeat = "Ato Final: Desfecho Definitivo & Resolução do Gancho";
        storyConnection = `Conexão Direta: Em decorrência do que aconteceu no Take #${index}, a situação iniciada no gancho chega ao clímax e encerra a história com o desfecho cômico definitivo.`;
        title = `${item.title} (Desfecho & Punchline Final)`;
        beat3 = `${item.beat3} E assim a confusão termina em pizza!`;
        act3 = `${item.act3} Olha fixamente para a câmera com sorriso irônico de desfecho final.`;
        speech = `${item.beat1} ${item.beat2} ${beat3}`;
      } else {
        narrativeBeat = `Ato ${index + 1}: Escalação & Consequência do Gancho`;
        storyConnection = `Continuação Direta: Reação imediata aos desdobramentos do Take #${index}, agravando a confusão e a comicidade.`;
      }
    }

    // Populate all characters present in this scene
    const charKeysToLoad = item.charactersPresent && item.charactersPresent.length > 0
      ? item.charactersPresent
      : [item.characterKey];

    const charactersInScene = charKeysToLoad.map((k, kIdx) => {
      const isSpeaker = kIdx === 0;
      if (customAnchor && isSpeaker) {
        return {
          ...customAnchor,
          roleInStory: customAnchor.roleInStory || "Personagem Principal / Falante"
        };
      }
      const baseAnchor = getCharacterVisualAnchor(k, isSpeaker ? item.characterSpeaking : "", w);
      return {
        ...baseAnchor,
        roleInStory: isSpeaker
          ? (baseAnchor.roleInStory || "Personagem Principal / Falante")
          : (kIdx === 1 ? "Co-protagonista / Reação Cômica" : "Participante da Cena")
      };
    });

    const characterVisualAnchor = customAnchor || charactersInScene[0];
    const wordCount = speech.trim().split(/\s+/).length;

    // Detailed prompt construction describing EVERY character in the scene
    const allCharsEnglishPrompt = charactersInScene.map((c, cIdx) => 
      `[CHARACTER ${cIdx + 1}: ${c.name.toUpperCase()} (${w}KG) - ${c.roleInStory?.toUpperCase() || 'CAST'} - LOCKED ATTIRE]: ${c.consistencyPromptClause}`
    ).join(". ");

    const allCharsPortuguesePrompt = charactersInScene.map((c, cIdx) => 
      `• Personagem ${cIdx + 1}: ${c.name} (${c.roleInStory || `${w}kg`}): Roupas Travadas: ${c.lockedAttire}. Físico: ${w}kg. Rosto: ${c.ageAndFace}`
    ).join("\n");

    const rawScene = {
      id: item.id,
      title,
      location: item.location,
      characterSpeaking: item.characterSpeaking,
      speech,
      dialogue: { fullText: speech }
    };

    const cine = buildCinematographyForScene(rawScene, index, totalScenes, targetAi);

    const isHouseScene = item.category === "sala_cozinha" || /casa|sala|cozinha|quarto|sof[aá]|geladeira|fog[aã]o|diploma|marmita|boleto|casinha/i.test(item.location + " " + userThemeClean);

    const scenarioEnSnippet = isHouseScene
      ? `[MANDATORY SCENARIO: DILAPIDATED & GRIMY BRAZILIAN FAVELA SETTING / EXTREMELY POOR FAVELA HOUSE]: Strictly set in a poverty-stricken authentic Brazilian favela. The residential house is strictly a dilapidated, somewhat dirty and grimy favela house of a very poor person: unplastered red clay cinder blocks, crumbling peeling plaster with damp water stains and dark mold, dingy grease-stained concrete floor, chaotic exposed electrical wiring (gambiarras), patched leaky corrugated asbestos roof with plastic leak buckets, worn-out ripped vintage sofa with exposed stained yellow foam, battered greasy rustic furniture, dingy dust, and raw authentic favela poverty grit.`
      : `[MANDATORY SCENARIO: AUTHENTIC POOR BRAZILIAN FAVELA / PERIPHERAL SETTING]: Strictly set in a poor Brazilian favela / peripheral community: unpaved muddy road with red clay craters, raw red cinder blocks, weathered surfaces, chaotic overhead cables, and rustic working-class grit.`;

    const scenarioPtSnippet = isHouseScene
      ? `[CENÁRIO OBRIGATÓRIO: CASA DE FAVELA MUITO POBRE E MEIO SUJA]:\nInterior de casa de favela de pessoa bem pobre e meio suja (paredes de tijolo baiano sem reboco ou reboco descascando com mofo escuro, chão de cimento encardido e manchado, fiação de gambiarra pendurada, goteiras no balde, sofá rasgado com espuma amarela aparente e encardida, mesa manchada com boletos, marcas de fuligem e poeira cotidiana).`
      : `[CENÁRIO OBRIGATÓRIO: LUGAR POBRE DO BRASIL - FAVELA / PERIFERIA]:\nAmbiente da comunidade/favela da periferia brasileira com chão de barro, barracos de tijolo baiano, telhas de amianto e textura rústica documental.`;

    return {
      sceneNumber: index + 1,
      title,
      narrativeBeat,
      storyConnection,
      characterVisualAnchor,
      charactersInScene,
      location: item.location,
      durationSeconds: 9,
      characterSpeaking: item.characterSpeaking,
      dialogue: {
        fullText: speech,
        wordCount,
        timingBreakdown: [
          { time: "00:00 - 00:03", speech: item.beat1, action: item.act1 },
          { time: "00:03 - 00:06", speech: item.beat2, action: item.act2 },
          { time: "00:06 - 00:09", speech: beat3, action: act3 },
        ],
      },
      englishPrompt: `${fw.enWeightHeader} ${allCharsEnglishPrompt}. ${scenarioEnSnippet}. [USER REQUESTED STORY SCENE]: Authentically enacting the user's specific plot: "${userThemeClean}". ${item.englishBase} Character visual anchor locked: all characters strictly maintain identical facial features, locked attires, and ${w}kg weight across all shots. Optimized for ${targetAi.toUpperCase()}. Ultra-detailed 8K micro-pores and glistening sweat drops. ${isLast ? "This shot concludes the storyline with an expressive final punchline reaction." : ""} ${customDetails ? `Extra detail: ${customDetails}.` : ""} ${cine.enCinematographySnippet}`,
      portuguesePrompt: `${fw.ptWeightHeader}\n\n[ENREDO DA HISTÓRIA ESCRITO PELO USUÁRIO]:\n${userThemeClean}\n\n${scenarioPtSnippet}\n\n[DETALHAMENTO DE TODOS OS PERSONAGENS EM CENA - CONSISTÊNCIA MULTICENAS]:\n${allCharsPortuguesePrompt}\n\n[CENÁRIO E AÇÃO]:\n${item.ptBase} Todos os personagens pesam rigorosamente e visivelmente ${w}kg com física anatômica realista. ${isLast ? "Este take finaliza e encerra a história com a punchline definitiva." : ""} ${customDetails ? `Detalhes adicionais: ${customDetails}.` : ""}\n\n${cine.ptCinematographySnippet}`,
      negativePrompt: `${fw.negativeWeightAdditions}clean modern house, luxury, wealth, mansion, pristine walls, polished floors, expensive furniture, neat minimalist apartment, clean kitchen, middle class, upscale home, tidy room, renovated house, CGI, 3D render, cartoon, digital illustration, anime, smooth plastic skin, airbrushed, beauty filter, studio lights, artificial glow, oversaturated`,
      cameraDirection: cine.cameraDirectionText,
      cinematography: cine.cinematography,
      skinAndLighting: `Intense specular gleam on sweaty neck and forehead, realistic pore depth without plastic smoothing, warm tungsten key light or flat overcast daylight. ${characterVisualAnchor.perspirationAndSkin}`,
      environmentDetails: `Gritty authentic peripheral setting with rich rustic textures, authentic props, and natural lighting. ${item.location}.`,
    };
  });

  // Apply narrative continuity bridge to all scenes
  scenes.forEach((sc: any, idx: number) => {
    const prevScene = idx > 0 ? scenes[idx - 1] : undefined;
    const nextScene = idx < scenes.length - 1 ? scenes[idx + 1] : undefined;
    const bridge = buildContinuityBridgeForScene(sc, idx, scenes.length, prevScene, nextScene, w);
    sc.continuityBridge = bridge.continuityBridge;
    sc.englishPrompt = `${sc.englishPrompt} ${bridge.enContinuitySnippet}`;
    sc.portuguesePrompt = `${sc.portuguesePrompt}\n\n${bridge.ptContinuitySnippet}`;
  });

  // Apply ultra-realistic actor directing & biomechanics to all scenes
  scenes.forEach((sc: any, idx: number) => {
    const actorDir = buildActorDirectionForScene(sc, idx, scenes.length, w);
    sc.actorDirection = actorDir.actorDirection;
    sc.englishPrompt = `${sc.englishPrompt} ${actorDir.enActorDirectionSnippet}`;
    sc.portuguesePrompt = `${sc.portuguesePrompt}\n\n${actorDir.ptActorDirectionSnippet}`;
  });

  // Enforce strict anti-celebrity & anti-famous person policy compliance (guaranteed safety on Flow, Kling, Runway)
  scenes.forEach((sc: any) => {
    sc.englishPrompt = sanitizePromptForFlowAndSafety(sc.englishPrompt);
    sc.negativePrompt = sanitizeNegativePromptForFlow(sc.negativePrompt);
    if (sc.characterVisualAnchor?.consistencyPromptClause) {
      sc.characterVisualAnchor.consistencyPromptClause = sanitizePromptForFlowAndSafety(sc.characterVisualAnchor.consistencyPromptClause);
    }
    if (Array.isArray(sc.charactersInScene)) {
      sc.charactersInScene.forEach((c: any) => {
        if (c.consistencyPromptClause) {
          c.consistencyPromptClause = sanitizePromptForFlowAndSafety(c.consistencyPromptClause);
        }
      });
    }
  });

  // Build and attach Narrative Hook System across the procedural batch
  const hookHelper = buildNarrativeHookStructure(
    theme,
    setting,
    isEmotional,
    scenes[0],
    totalScenes,
    w
  );

  scenes.forEach((sc: any, idx: number) => {
    if (idx === 0) {
      sc.narrativeHook = hookHelper.firstSceneHook;
      sc.hookPayoff = hookHelper.getPayoffForScene(0);
    } else {
      sc.hookPayoff = hookHelper.getPayoffForScene(idx);
    }
  });

  // Calculate master cast dossier across all generated scenes
  const castMap = new Map<string, any>();
  scenes.forEach((sc) => {
    const currentSceneNum = sc.sceneNumber;
    sc.charactersInScene.forEach((c) => {
      const key = c.name.toLowerCase().trim();
      if (!castMap.has(key)) {
        castMap.set(key, {
          ...c,
          scenesPresent: [currentSceneNum]
        });
      } else {
        const existing = castMap.get(key);
        if (!existing.scenesPresent.includes(currentSceneNum)) {
          existing.scenesPresent.push(currentSceneNum);
        }
      }
    });
  });
  const castDossier = Array.from(castMap.values());
  const allCastNames = castDossier.map((c: any) => c.name);

  // REGRA SUPREMA: Trava de Identidade Narrativa e Memória Contínua
  const narrativeIdentity = buildNarrativeIdentity(
    theme,
    setting,
    allCastNames,
    scenes[0],
    isEmotional,
    w
  );

  // Attach narrative memory to every scene
  scenes.forEach((sc: any, idx: number) => {
    const prevScenes = scenes.slice(0, idx);
    sc.narrativeMemory = buildNarrativeMemoryForScene(
      sc,
      idx,
      totalScenes,
      prevScenes,
      narrativeIdentity
    );
  });

  // REGRA SUPREMA — ESTRUTURA NARRATIVA CINEMATOGRÁFICA E CONTINUIDADE DE NOVELINHAS (50+ ANOS DE EXPERIÊNCIA)
  scenes.forEach((sc: any, scIdx: number) => {
    const prevScene = scIdx > 0 ? scenes[scIdx - 1] : undefined;
    const nextScene = scIdx < scenes.length - 1 ? scenes[scIdx + 1] : undefined;
    const nov = buildNovelinhaProgressionForScene(sc, scIdx, scenes.length, theme, prevScene, nextScene, isEmotional ? "emocionante" : "comedia");
    sc.novelinhaProgression = nov.novelinhaProgression;
    sc.narrativeBeat = nov.novelinhaProgression.stageName;
    if (!sc.englishPrompt.includes("[NOVELINHA NARRATIVE DIRECTION")) {
      sc.englishPrompt = `${sc.englishPrompt} ${nov.enSnippet}`;
    }
  });

  // REGRA SUPREMA — CONTROLE INDIVIDUAL DE FALAS ENTRE MÚLTIPLOS PERSONAGENS
  scenes.forEach((sc: any, scIdx: number) => {
    const dt = buildDialogueTurnsForScene(sc, scIdx, sc.charactersInScene || [sc.characterVisualAnchor]);
    sc.dialogue = dt.dialogue;
    sc.characterSpeaking = dt.characterSpeaking;

    if (!sc.englishPrompt.includes("STRICT CHARACTER-TO-DIALOGUE ASSIGNMENT")) {
      sc.englishPrompt = `${sc.englishPrompt} [DIALOGUE ASSIGNMENT & CAMERA DISCIPLINE]: ${MANDATORY_DIALOGUE_ASSIGNMENT_DIRECTIVE}`;
    }
  });

  const narrativePlan = buildNarrativePlan(
    theme,
    isEmotional ? `História comovente sobre '${theme}'` : `Comédia sobre '${theme}'`,
    castDossier,
    scenes
  );

  // REGRA OBRIGATÓRIA: PROMPT 00 — REFERÊNCIA VISUAL DOS PERSONAGENS
  const promptZero = buildPromptZeroReference(
    castDossier,
    w,
    isEmotional ? "emocionante" : "comedia",
    theme,
    targetAi
  );

  return {
    themeTitle: `Episódio: ${theme}`,
    storyTone: (isEmotional ? "emocionante" : "comedia") as any,
    synopsis: isEmotional
      ? `Narrativa humana profundamente comovente e inspiradora sobre superação, família e dignidade humilde na periferia brasileira (todos os personagens pesando rigorosamente ${w}kg), com lágrimas autênticas e falas tocantes de 9 segundos.`
      : `Série documental cômica hiper-realista com elenco da comunidade brasileira (todos pesando ${w}kg) em cenários autênticos e vibrantes com falas exatas de 9 segundos.`,
    promptZero,
    narrativePlan,
    narrativeIdentity,
    narrativeHook: hookHelper.batchHook,
    narrativeArc: isEmotional
      ? `Arco dramático de alta comoção em ${totalScenes} take(s): do gancho emocionante de sacrifício no Take #1, passando pelo nó na garganta e lágrimas partilhadas, culminando no Take #${totalScenes} com a vitória improvável, o desabafo comovente e a resolução definitiva.`
      : `Arco dramático em ${totalScenes} take(s): do gancho magnético e incidente incitante no Take #1 à escalação das consequências, concluindo no Take #${totalScenes} com o desfecho cômico definitivo e resolução completa do gancho.`,
    castDossier,
    scenes,
    characterWeightKg: w,
    consistencyKeywords: `all characters strictly weigh ${w}kg (${lbs} lbs), consistent ${w}kg Brazilian cast, realistic body mass, skin folds, pores, shiny sweat, authentic Brazilian peripheral textures, raw documentary 35mm`,
  };
}

// Vite middleware setup

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

  process.env.GEMINI_API_KEY = apiKey;

  const action = req.body?.action || 'generate-prompts';

  if (action === 'generate-prompts') return handleGeneratePrompts(req, res);
  if (action === 'continue-story') return handleContinueStory(req, res);
  if (action === 'analyze-character-image') return handleAnalyzeCharacterImage(req, res);
  if (action === 'analyze-story-theme') return handleAnalyzeStoryTheme(req, res);
  if (action === 'generate-situations') return handleGenerateSituations(req, res);

  return res.status(400).json({ error: 'Acao invalida.' });
}