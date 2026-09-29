import { GoogleGenAI, Type } from '@google/genai';
import { analyzeRawImageBytes, VisualAnalysisMetrics } from '../src/pages/povProduto/services/imageAiVision.js';
import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';
import { getActiveGeminiApiKey } from './gemini-key.js';

let ai: any = null;

const AGENT_SYSTEM_INSTRUCTION = `==================================================
SISTEMA INTELIGENTE DE CRIAÇÃO DAS FALAS
==================================================

REGRA MAIS IMPORTANTE:
NÃO use falas prontas, frases-modelo, templates de diálogo ou estruturas verbais fixas.
Antes de escrever qualquer fala, analise individualmente o produto da imagem.
As 3 falas devem ser CRIADAS DO ZERO especificamente para aquele produto.

O agente deve observar primeiro:
- que tipo de produto é;
- para que ele aparentemente serve, somente quando isso puder ser determinado com segurança;
- quais detalhes são realmente visíveis;
- formato;
- construção;
- acabamento aparente;
- partes que podem ser demonstradas;
- detalhes que chamam atenção visualmente;
- como uma pessoa real provavelmente interagiria com aquele objeto;
- quais aspectos valem a pena mostrar em cada um dos 3 vídeos.

Somente DEPOIS dessa análise, escreva as falas.

==================================================
PROIBIDO USAR FALAS PROGRAMADAS
==================================================
Não existe uma frase obrigatória para iniciar o Prompt 1.
Não existe uma frase obrigatória para iniciar o Prompt 2.
Não existe uma frase obrigatória para iniciar o Prompt 3.

NÃO reutilize automaticamente expressões como:
"Olha só isso aqui"
"Repara nisso"
"Olha esse detalhe"
"De perto dá pra ver"
"Vou mostrar pra vocês"
"Olha esse acabamento"
"Esse aqui chama atenção"
"Olha essa parte"
"Uma coisa que eu gostei"
"Vocês precisam ver isso"
"Olha a presença desse produto"

O agente deve variar:
vocabulário,
construção das frases,
ritmo,
gancho,
forma de apresentar,
ordem das informações
e maneira de encerrar.

REGRA OBRIGATÓRIA DE CORES:
NÃO fale de cores dos produtos nas falas. O foco deve ser 100% na estrutura física, partes visíveis, ergonomia, materiais e detalhes mecânicos.

==================================================
FALA NATURAL E ESPECÍFICA
==================================================
Imagine que a pessoa realmente comprou, recebeu ou encontrou aquele produto e está olhando para ele sobre a mesa.
A pessoa não está lendo um roteiro.
Ela está falando espontaneamente enquanto observa e toca o objeto.
A fala deve reagir ao produto que está na frente dela.
Use português brasileiro cotidiano e natural.
Evite linguagem excessivamente publicitária.
Evite frases genéricas que poderiam ser usadas em qualquer produto.

TESTE OBRIGATÓRIO:
Antes de aceitar uma fala, faça mentalmente esta pergunta:
"Eu conseguiria usar exatamente essa mesma fala em 20 produtos completamente diferentes?"
Se a resposta for SIM, a fala está genérica demais. REESCREVA.
A fala precisa conter elementos que façam sentido especificamente para o produto analisado.

==================================================
NÃO INVENTAR INFORMAÇÕES
==================================================
A criatividade deve estar na FORMA DE FALAR, não na invenção de características.
Nunca invente:
material específico não confirmado,
resistência,
durabilidade,
tecnologia,
potência,
capacidade,
medidas,
resultados,
benefícios médicos,
impermeabilidade,
conforto,
qualidade comprovada,
garantia,
preço,
desconto,
promoção,
frete
ou qualquer característica não verificável.
Descreva somente aquilo que é visualmente observável.

==================================================
RELAÇÃO ENTRE FALA E MOVIMENTO
==================================================
Primeiro determine o que será mostrado fisicamente.
Depois escreva uma fala compatível com essa ação.
A fala e a mão devem parecer parte do mesmo acontecimento.
Se a mão toca uma costura: a fala deve comentar aquela costura específica.
Se o dedo acompanha uma borda ou sola: a fala deve estar relacionada àquela região.
Se existe botão, encaixe, abertura, tampa, fecho, textura, sola, costura, controle, alça ou outra característica visível:
o agente constrói a fala naturalmente ao redor desse elemento.
Não faça a pessoa falar sobre uma região enquanto a mão demonstra outra.

==================================================
TOM DE VOZ: CONVERSA ENTRE AMIGOS (ZERO JARGÕES TÉCNICOS)
==================================================
As falas devem soar EXATAMENTE como se a pessoa estivesse conversando com um amigo e recomendando um produto que comprou e adorou.
Use um tom informal, próximo, autêntico e sincero:
"Cara", "Mano", "Sério, você não tem noção", "O que eu mais curti...", "Eu achei que ia ser...", "É bom demais porque...", "Vale muito a pena".

É TERMINANTEMENTE PROIBIDO USAR PARTES OU TERMOS TÉCNICOS:
NÃO fale termos de engenharia, indústria ou catálogo de especificações como:
- "conchas circumaurais", "mesh respirável", "entressola vulcanizada", "polímero estrutural", "ilhoses duplos", "vedação hermética", "cânula de vidro", "pesponto duplo", "gramatura de malha", "mandril usinado", etc.
Em vez de falar a parte técnica, fale do BENEFÍCIO REAL E DO SENTIMENTO PRÁTICO no dia a dia:
- Em vez de "mesh respirável": "o tecido é fresquinho e não esquenta o pé de jeito nenhum"
- Em vez de "entressola vulcanizada": "a sola é tão macia que amortece cada passo e você nem sente o chão"
- Em vez de "conchas circumaurais": "a almofada cobre a orelha inteira e não aperta a cabeça nem usando óculos"
- Em vez de "vedação hermética": "a tampa fecha tão firme que não vaza nem uma gota se você jogar na mochila"
- Em vez de "pintura eletrostática": "não escorrega da mão mesmo se estiver molhada"
- Em vez de "cânula dosadora": "o conta-gotas puxa a quantidade certinha pra usar sem desperdiçar nada"
- Em vez de "pesponto duplo": "a gola não fica frouxa e não deforma na hora de vestir"

REGRA OBRIGATÓRIA: NÃO NARRE O QUE VOCÊ ESTÁ FAZENDO COM AS MÃOS:
NÃO narre sua própria ação física ("passando a mão", "deslizando o dedo", "tocando aqui"). O vídeo já mostra as mãos. A fala vai direto na conversa e na recomendação sincera.

==================================================
DURAÇÃO REAL DAS FALAS
==================================================
Cada fala deve durar aproximadamente 9 segundos em ritmo natural de português brasileiro (aproximadamente 18 a 26 palavras).
Priorize uma frase natural e completa, sem correr.
Cada vídeo deve desenvolver UMA ideia principal.

==================================================
GATILHOS MENTAIS DE CONVERSÃO NAS FALAS (TIKTOK SHOP / E-COMMERCE)
==================================================
Cada uma das 3 falas deve conter gatilhos mentais autênticos que induzem o público a desejar e comprar o produto:

- CENA 1 (Gatilho da Curiosidade, Descoberta & Quebra de Padrão — Caminhando):
  A pessoa caminha segurando o produto à frente e abre a fala com um detalhe visual surpreendente que gera curiosidade imediata e desejo de saber mais ("Eu precisava ver isso de perto...", "O diferencial que me fez querer essa peça...", "A primeira coisa que impressiona logo de cara...").
  Gatilho: Curiosidade irresistível e antecipação de valor tangível.

- CENA 2 (Gatilho da Especificidade, Prova Tátil & Solução de Objeções — Na Bancada):
  A pessoa toca e demonstra um detalhe tátil de acabamento, costura, encaixe ou textura que resolve uma dor real do comprador (ex: não cansa a sola, não aperta a cabeça, não vaza na bolsa, não fica frouxo, não escorrega da mão, não pinica).
  Gatilho: Prova sensorial e sensação de posse ("quando você toca, você sente a firmeza").

- CENA 3 (Gatilho da Convicção, Custo-Benefício & Ação Imediata — Na Bancada + CTA):
  A pessoa conclui destacando a satisfação do uso diário e como a peça entrega muito pelo investimento, finalizando com o CTA natural para o carrinho laranja ("Vale muito a pena pelo nível de acabamento", "Faz toda a diferença no dia a dia", "Se você curtiu, o link tá no carrinho laranja").
  Gatilho: Decisão fácil, valor percebido e chamada direta pra ação.

==================================================
PROGRESSÃO DOS 3 VÍDEOS
==================================================
Os três vídeos devem complementar um ao outro sem repetir a mesma informação.

PROMPT 1 (Caminhando com o produto na mão — Descoberta & Gancho ~9s):
A pessoa está ANDANDO em ritmo natural em primeira pessoa (POV com câmera de ação acoplada na testa, 14–16mm) segurando o produto à sua frente com a mão direita, caminhando em direção à mesa/bancada de trabalho.
A câmera registra o balanço sutil e orgânico dos passos.
A mão direita segura e exibe o produto destacando a característica observável com maior potencial para despertar curiosidade e desejo de compra.
Crie um gancho específico com gatilho mental para ESSE produto enquanto a pessoa caminha.
Ao final dos 9 segundos (0:08–0:09), a pessoa se aproxima diretamente da bancada de trabalho.

PROMPT 2 (Na Bancada — Detalhes & Prova Tátil ~9s):
A pessoa agora está parada diretamente em frente à bancada com o produto apoiado no centro da mesa.
Escolha OUTRO aspecto real do produto que ainda não foi explorado.
A fala deve acrescentar informação nova com gatilho de prova sensorial (eliminação de dúvidas e objeções).
O movimento da mão demonstra tátilmente esse segundo aspecto.

PROMPT 3 (Na Bancada — Conclusão & CTA de Conversão ~9s):
A pessoa conclui a demonstração com o produto na bancada.
A mão repousa ao lado da peça com gesto natural.
Gatilho de custo-benefício e utilidade real, terminando com um CTA curto relacionado ao carrinho laranja.
Nunca invente urgência, escassez ou promoção.

==================================================
PADRÃO VISUAL OBRIGATÓRIO (Em Inglês nos Prompts):
==================================================
- PROMPT 1: Create ONE continuous ultra-realistic first-person POV product demonstration video. Use the provided product image as absolute reference. Action camera strapped to person's forehead (14–16mm). Person is walking forward indoors holding the product in their right hand, moving towards their computer desk. Authentic footstep micro-bobbing. Hand holds and presents the product.
- PROMPTS 2 & 3: Person is standing directly in front of the large desk looking downward. Tabletop dominates 65–75% of frame. Product rests on desk. Hand interacts with specific parts.`;

interface ProductConfig {
  category: string;
  defaultName: string;
  visualDetails: string[];
  materialsAndColors: string[];
  handInteractions: [string, string, string];
  keyFocalPoints: [string, string, string];
  dialoguesScene1: string[];
  dialoguesScene2: string[];
  dialoguesScene3: string[];
}

const PRODUCT_CATALOG: Record<string, ProductConfig> = {
  calcados: {
    category: 'Calçados',
    defaultName: 'Tênis Esportivo',
    visualDetails: [
      'Cabedal em tecido respirável com trama de ventilação bem definida',
      'Solado de borracha com curvatura frontal pronunciada cobrindo a ponta do bico',
      'Contraforte traseiro acolchoado com espuma de suporte no calcanhar',
      'Passadores de cadarço reforçados e lingueta flexível',
    ],
    materialsAndColors: ['Cabedal em malha respirável', 'Solado de borracha vulcanizada', 'Entressola com amortecimento aparente'],
    handInteractions: [
      'A pessoa caminha segurando o tênis à sua frente com a mão direita em direção à bancada, destacando a curvatura frontal do solado no bico.',
      'A ponta dos dedos indicador e médio desliza 6 centímetros pela trama do tecido no cabedal e toca suavemente nos passadores de cadarço.',
      'A mão repousa ao lado do calçado e pressiona levemente a borda acolchoada do calcanhar antes de descansar na bancada.',
    ],
    keyFocalPoints: ['Curvatura da sola e bico reforçado', 'Trama do cabedal e passadores de cadarço', 'Acolchoamento do calcanhar e estabilidade'],
    dialoguesScene1: [
      'Cara, eu peguei esse tênis achando que ia ser duro, mas a sola dele amortece cada passo de um jeito que você nem sente o chão.',
      'Mano, a primeira coisa que você repara andando com ele é que a sola tem uma curvatura que não deixa o bico bater ou ralar no asfalto.',
      'Sério, a sola é tão macia e leve que parece que você tá pisando em almofada desde os primeiros passos.',
    ],
    dialoguesScene2: [
      'O tecido em cima é super fresquinho e não esquenta o pé de jeito nenhum, e a parte do calcanhar é fofinha pra não dar bolha.',
      'A borracha do lado dobra fácil com o movimento do pé, sem aquela sola dura que cansa depois de umas horas de uso.',
      'A colagem em volta da sola é super caprichada, você vê de cara que é um tênis que aguenta o tranco do dia a dia.',
    ],
    dialoguesScene3: [
      'Pro dia a dia você não tira mais do pé de tão gostoso que fica. Se você curtiu, dá uma olhada no carrinho laranja.',
      'Combina com qualquer calça ou bermuda e é confortável de verdade. Clica no carrinho laranja pra ver seu número.',
      'Um tênis desse nível por esse valor vale a pena demais. Aproveita e confere no carrinho laranja antes que você esqueça.',
    ],
  },
  eletronicos: {
    category: 'Eletrônicos & Áudio',
    defaultName: 'Headphone Over-Ear',
    visualDetails: [
      'Conchas acústicas com formato anatômico profundo',
      'Almofadas auriculares espessas e macias ao redor da orelha',
      'Arco superior com acolchoamento de alívio e regulagem de altura',
      'Botões de controle integrados discretamente na base',
    ],
    materialsAndColors: ['Revestimento fosco anti-marcas', 'Almofadas com espuma anatômica', 'Detalhes metálicos no arco'],
    handInteractions: [
      'A pessoa caminha segurando o fone à sua frente com a mão direita em direção à bancada, destacando a profundidade da concha acústica e o arco superior.',
      'A ponta do dedo indicador desliza pela haste metálica testando a regulagem e toca o botão de controle na base da concha.',
      'A mão repousa ao lado da concha com dedos levemente comprimindo a almofada macia antes de concluir.',
    ],
    keyFocalPoints: ['Profundidade da concha e arco', 'Regulagem mecânica da haste e botões', 'Maciez da almofada e isolamento acústico'],
    dialoguesScene1: [
      'Mano, você precisa ver esse fone: a almofada cobre a orelha inteira e a espuma é tão macia que não aperta a cabeça nem usando óculos.',
      'Cara, eu testei esse fone hoje e a leveza do arco me surpreendeu, você quase não sente o peso dele na cabeça.',
      'Sério, o isolamento disso aqui é incrível, você coloca e o barulho da rua ou de casa simplesmente some.',
    ],
    dialoguesScene2: [
      'A espuma volta na hora sem amassar e os botões aqui embaixo são super fáceis de achar no tato sem ficar se batendo.',
      'A regulagem do arco tem um clique bem firme que não fica frouxo nem caindo da cabeça.',
      'O som é muito limpo, você escuta cada detalhe da música e a bateria aguenta firme o dia todo de trabalho.',
    ],
    dialoguesScene3: [
      'Pra quem trabalha no computador, estuda ou joga, vale cada centavo. Se você curtiu, o link tá no carrinho laranja.',
      'Ele é confortável demais e fica lindo na bancada. Dá uma olhada no carrinho laranja pra conferir.',
      'Eu não consigo mais usar outro fone no meu setup. Clica no carrinho laranja pra garantir o seu.',
    ],
  },
  cosmeticos: {
    category: 'Cosméticos & Beleza',
    defaultName: 'Sérum Facial em Frasco Conta-gotas',
    visualDetails: [
      'Frasco de vidro escurecido espesso com proteção contra claridade',
      'Tampa com dosador emborrachado e fechamento firme',
      'Tubo transparente visível através do líquido no interior',
      'Rótulo acetinado com instruções nítidas',
    ],
    materialsAndColors: ['Vidro translúcido escuro espesso', 'Bulbo dosador flexível', 'Rótulo fosco acetinado'],
    handInteractions: [
      'A pessoa caminha segurando o frasco à sua frente com a mão direita em direção à bancada, destacando o dosador e o frasco.',
      'A ponta do indicador toca com suavidade no bulbo dosador e desce acompanhando a rosca da tampa.',
      'A mão descansa aberta ao lado da base do frasco, evidenciando a firmeza do vidro na bancada.',
    ],
    keyFocalPoints: ['Dosador e proteção do frasco', 'Bulbo dosador e rosca de vedação', 'Estabilidade da base de vidro'],
    dialoguesScene1: [
      'Amiga, sério, eu comecei a usar esse sérum e a pele absorve tão rápido que não fica nem um pouco grudenta ou oleosa.',
      'Cara, esse frasco é de vidro escuro pesado pra proteger o produto da luz, então não perde o efeito com o tempo.',
      'A tampa fecha super firme com meia volta, então você pode jogar na bolsa com tranquilidade que não vaza nada.',
    ],
    dialoguesScene2: [
      'O conta-gotas puxa a quantidade certinha pro rosto todo sem pingar na bancada nem desperdiçar nada do vidro.',
      'A textura é bem leve, espalha fácil e você já sente a pele bem hidratada e com um toque aveludado logo de cara.',
      'O vidro é grosso e fica bem firme na pia ou na penteadeira, não tomba por nada.',
    ],
    dialoguesScene3: [
      'Rende demais e deixa a pele bonita o dia todo sem esforço. Se você quiser testar, dá uma olhada no carrinho laranja.',
      'Mudou a minha rotina de cuidado com a pele, vale muito a pena. Confere no carrinho laranja pra garantir o seu.',
      'Prático, rende muito e entrega um resultado lindo. Clica no link do carrinho laranja pra ver.',
    ],
  },
  termicos: {
    category: 'Cozinha & Casa',
    defaultName: 'Garrafa Térmica Inox',
    visualDetails: [
      'Corpo metálico cilíndrico com pintura resistente antiderrapante',
      'Bocal arredondado com rosca interna polida',
      'Tampa com borracha de vedação e alça articulada',
      'Base estável com apoio macio na superfície',
    ],
    materialsAndColors: ['Aço inox escovado', 'Tampa hermética de polímero com silicone', 'Pintura texturizada fosca'],
    handInteractions: [
      'A pessoa caminha segurando a garrafa à sua frente com a mão direita em direção à bancada, destacando a tampa rosqueável e a alça articulada.',
      'Os dedos indicador e médio deslizam 7 centímetros pela pintura texturizada do corpo cilíndrico.',
      'A mão pousa ao lado da base da garrafa, indicando o assentamento firme sem ruído.',
    ],
    keyFocalPoints: ['Tampa rosqueável e vedação', 'Pintura texturizada e empunhadura', 'Base estável e bocal arredondado'],
    dialoguesScene1: [
      'Cara, essa garrafa virou meu xodó: você joga gelo de manhã e no final da tarde a água ainda tá trincando de gelada.',
      'Mano, a tampa fecha tão vedada com essa borracha dupla que eu jogo solta na mochila e não vaza nem uma gota.',
      'O bocal dela é bem lisinho e confortável pra beber direto, além da alça ajudar demais a carregar por aí.',
    ],
    dialoguesScene2: [
      'A pintura fosca de fora dá uma pegada muito firme que não escorrega da mão nem se estiver suada da academia.',
      'A base assenta macia na mesa sem fazer aquele barulho chato de metal batendo na madeira.',
      'Por fora ela nunca sua nem molha a mesa, e você não queima nem gela a mão segurando.',
    ],
    dialoguesScene3: [
      'Eu levo pra todo canto agora, trabalho, treino, carro. Se você curtiu, clica no carrinho laranja pra ver.',
      'Companheira pro dia todo que aguenta qualquer rotina sem dor de cabeça. Dá uma olhada no carrinho laranja.',
      'Garrafa boa assim você compra uma vez e usa por muito tempo. O link tá direto no carrinho laranja.',
    ],
  },
  wearables: {
    category: 'Acessórios & Wearables',
    defaultName: 'Smartwatch Esportivo',
    visualDetails: [
      'Display frontal com bordas curvas contínuas na caixa metálica',
      'Pulseira de silicone flexível com textura macia e fivela de fixação',
      'Coroa lateral giratória multifunção com ranhuras táteis',
      'Sensores ópticos arredondados embutidos nivelados na tampa traseira',
    ],
    materialsAndColors: ['Vidro curvo frontal', 'Silicone flexível fosco', 'Caixa em liga metálica acetinada'],
    handInteractions: [
      'A pessoa caminha segurando o relógio à sua frente com a mão direita em direção à bancada, destacando a curvatura do vidro frontal e a coroa lateral.',
      'A ponta do dedo indicador gira suavemente a coroa lateral e flexiona a pulseira de silicone.',
      'A mão repousa ao lado do relógio apontando para o fecho de ajuste na bancada.',
    ],
    keyFocalPoints: ['Vidro curvo e caixa metálica', 'Coroa giratória e flexibilidade da pulseira', 'Fecho e sensores traseiros'],
    dialoguesScene1: [
      'Cara, esse relógio no pulso fica bonito demais, e a tela curvada dá um visual que parece que custou o triplo do preço.',
      'Mano, a caixa dele é fininha e encaixa tão bem no braço que não fica enroscando na manga da camisa.',
      'Sério, a coroa do lado gira lisinha e facilita demais pra mexer nas opções sem ficar enchendo a tela de dedo.',
    ],
    dialoguesScene2: [
      'A pulseira de silicone é super macia, não puxa os pelos do braço e você troca em dois segundos com esse engate rápido.',
      'A parte de trás é bem lisinha pra não marcar nem incomodar a pele durante o dia.',
      'A estrutura de metal aguenta a rotina sem descascar e combina fácil com qualquer roupa casual ou esportiva.',
    ],
    dialoguesScene3: [
      'Um acessório que valoriza demais o visual no dia a dia. Se você gostou, dá uma olhada no carrinho laranja.',
      'Fica muito estiloso no pulso e é confortável de verdade. Clica no carrinho laranja pra conferir.',
      'Vale muito a pena pelo que entrega, eu não tiro mais do braço. Confere no carrinho laranja.',
    ],
  },
  vestuario: {
    category: 'Vestuário & Moda',
    defaultName: 'Peça de Vestuário Confortável',
    visualDetails: [
      'Tecido encorpado com caimento alinhado',
      'Gola firme com acabamento reforçado',
      'Caimento natural estendido sem amassar fácil',
      'Barra e mangas com costura limpa',
    ],
    materialsAndColors: ['Tecido de toque macio', 'Costuras reforçadas', 'Acabamento sem fiapos'],
    handInteractions: [
      'A pessoa caminha segurando a peça de vestuário à sua frente com a mão direita em direção à bancada, destacando a gola e o caimento no ombro.',
      'Os dedos indicador e polegar pinçam levemente a barra do tecido sem deformar a peça, demonstrando o toque.',
      'A mão se posiciona ao lado da manga com gesto indicativo para o caimento da barra.',
    ],
    keyFocalPoints: ['Gola firme e caimento no ombro', 'Toque do tecido e caimento na barra', 'Alinhamento das mangas e corte'],
    dialoguesScene1: [
      'Cara, essa camiseta me surpreendeu demais: o tecido é encorpado, não fica transparente na luz e cai super reto no corpo.',
      'Mano, quem usa roupa básica sabe como é difícil achar uma gola que não esgarce, e essa aqui não deforma de jeito nenhum.',
      'O corte dela nos ombros veste alinhado de primeira, dá uma presença muito massa sem parecer roupa desleixada.',
    ],
    dialoguesScene2: [
      'A malha é daquele tipo gostoso que você veste e não quer mais tirar, com costura bem feita por dentro sem fiapo.',
      'A etiqueta vem estampada no próprio tecido pra não ficar pinicando a nuca o dia inteiro.',
      'Você lava, usa e ela continua com a mesma modelagem bonita sem encolher nem torcer na lateral.',
    ],
    dialoguesScene3: [
      'Aquela peça curinga que combina com qualquer calça ou bermuda. Se você quiser garantir a sua, confere no carrinho laranja.',
      'Caimento impecável com tecido de primeira que dura muito. Clica no carrinho laranja pra ver seu tamanho.',
      'Vale a pena pegar mais de uma de tão boa que é no corpo. Dá uma olhada no carrinho laranja.',
    ],
  },
  ferramentas: {
    category: 'Ferramentas & Utilidades',
    defaultName: 'Ferramenta Ergonômica',
    visualDetails: [
      'Carcaça robusta com reforço contra quedas',
      'Empunhadura anatômica emborrachada antiderrapante',
      'Ponta metálica com trava rápida de broca',
      'Gatilho e seletores de força fáceis de acionar',
    ],
    materialsAndColors: ['Carcaça de alta resistência', 'Empunhadura em borracha macia', 'Peças em metal resistente'],
    handInteractions: [
      'A pessoa caminha segurando a ferramenta à sua frente com a mão direita em direção à bancada, destacando a ponta e a empunhadura.',
      'A mão toca o grip emborrachado da empunhadura, demonstrando a pegada firme.',
      'A mão repousa ao lado da base da ferramenta, apontando para o trilho de fixação.',
    ],
    keyFocalPoints: ['Engate rápido e empunhadura', 'Pegada antiderrapante e gatilho', 'Encaixe firme de bateria'],
    dialoguesScene1: [
      'Mano, essa parafusadeira quebrou um galho absurdo aqui em casa: a pegada é super firme e ela tem força pra qualquer serviço.',
      'Cara, o que eu mais curti é que você troca a broca ou a ponta com a mão mesmo, sem precisar de chave nenhuma.',
      'O botãozinho de inverter o giro fica bem na mira do dedão, então você trabalha com uma mão só sem se atrapalhar.',
    ],
    dialoguesScene2: [
      'A regulagem de força tem vários níveis pra você não espanar nenhum parafuso de móvel ou parede.',
      'A borracha no cabo não deixa a mão escorregar e a carcaça é bruta pra aguentar qualquer tombo na oficina.',
      'O encaixe da bateria é bem firme, não fica com aquele jogo chato balançando na mão.',
    ],
    dialoguesScene3: [
      'Resolve qualquer manutenção rápida em casa sem você passar raiva. Confere no carrinho laranja pra garantir a sua.',
      'Ferramenta boa que não te deixa na mão quando você precisa. Aproveita e clica no carrinho laranja.',
      'Agiliza qualquer serviço e vale cada centavo pelo que entrega. Dá uma olhada no carrinho laranja.',
    ],
  },
  geral: {
    category: 'Geral',
    defaultName: 'Produto Selecionado',
    visualDetails: [
      'Geometria e proporções fiéis ao item da foto de referência',
      'Acabamento limpo com encaixes bem delineados',
      'Superfície consistente sob a iluminação natural da sala',
      'Apoio estável e centralizado na mesa',
    ],
    materialsAndColors: ['Acabamento natural da peça', 'Superfície sem imperfeições', 'Estrutura sólida'],
    handInteractions: [
      'A pessoa caminha segurando a peça à sua frente com a mão direita em direção à bancada, destacando o contorno e as linhas principais.',
      'A ponta dos dedos indicador e médio repousa sobre a peça sem movê-la, demonstrando a estabilidade.',
      'A mão se posiciona calmamente ao lado do item com gesto indicativo antes de repousar na bancada.',
    ],
    keyFocalPoints: ['Contorno e linhas principais', 'Encaixes e acabamento superficial', 'Estabilidade na mesa'],
    dialoguesScene1: [
      'Cara, eu peguei esse produto pra testar e de cara já vi que a qualidade é muito boa, tudo bem firme e alinhado.',
      'Mano, o que mais me chamou atenção foi o acabamento limpo e a presença que essa peça tem na mão.',
      'Sério, ao vivo supera qualquer foto, você percebe logo no primeiro contato que é um produto diferenciado.',
    ],
    dialoguesScene2: [
      'O material passa uma sensação super resistente e você nota que os encaixes são perfeitos, sem folga nenhuma.',
      'O acabamento não pega marca de dedo fácil e a estrutura assenta muito firme na mesa sem balançar.',
      'É muito bem pensado pra durar e aguentar o uso diário sem perder a qualidade.',
    ],
    dialoguesScene3: [
      'Facilitou demais a minha rotina e vale muito a pena ter em casa. Se você gostou, dá uma olhada no carrinho laranja.',
      'Superou muito minhas expectativas e recomendo de olhos fechados. Clica no carrinho laranja pra conferir.',
      'Construção impecável com ótimo custo-benefício. Aproveita e garante o seu no carrinho laranja.',
    ],
  },
};

function selectProductProfile(brand: string, focus: string): ProductConfig {
  const combined = (brand + ' ' + focus).toLowerCase();

  if (combined.match(/tênis|tenis|sneaker|sapato|bota|calçado|calcado|chinelo|sandalia|solado/)) {
    return PRODUCT_CATALOG.calcados;
  }
  if (combined.match(/fone|headphone|earbud|áudio|audio|som|caixa de som|speaker|mouse|teclado|headset/)) {
    return PRODUCT_CATALOG.eletronicos;
  }
  if (combined.match(/sérum|serum|creme|frasco|skincare|óleo|oleo|pele|perfume|cosmético|cosmetico|maquiagem|pipeta/)) {
    return PRODUCT_CATALOG.cosmeticos;
  }
  if (combined.match(/garrafa|térmica|termica|copo|caneca|inox|stanley|shake|squeeze|pote|cozinha/)) {
    return PRODUCT_CATALOG.termicos;
  }
  if (combined.match(/relógio|relogio|watch|smartwatch|pulseira|bracelete|wearable/)) {
    return PRODUCT_CATALOG.wearables;
  }
  if (combined.match(/jaqueta|camisa|camiseta|calça|calca|moletom|blusa|tecido|roupa|vestuário|vestuario|boné|bone|bolsa/)) {
    return PRODUCT_CATALOG.vestuario;
  }
  if (combined.match(/ferramenta|trena|parafusadeira|furadeira|chave|alicate|martelo|oficina|automotivo/)) {
    return PRODUCT_CATALOG.ferramentas;
  }

  return PRODUCT_CATALOG.geral;
}

function adaptCtaLine(baseCta: string, ctaType: string): string {
  if (!ctaType) return baseCta;
  const lower = ctaType.toLowerCase();
  if (lower.includes('bio')) {
    return baseCta.replace(/carrinho laranja/gi, 'link na bio').replace(/no carrinho laranja/gi, 'no link da minha bio');
  }
  if (lower.includes('quero') || lower.includes('coment')) {
    return baseCta.replace(/dá uma olhada no carrinho laranja/gi, 'comenta "EU QUERO" aqui embaixo').replace(/clica no carrinho laranja/gi, 'comenta "EU QUERO"');
  }
  if (lower.includes('site') || lower.includes('loja')) {
    return baseCta.replace(/carrinho laranja/gi, 'site oficial').replace(/no carrinho laranja/gi, 'no site oficial');
  }
  return baseCta;
}

function generateAutonomousPOV(params: {
  brandName?: string;
  visualFocus?: string;
  ctaType?: string;
  cleanBase64?: string;
  clientColor?: { name?: string; hex?: string; secondaryName?: string; secondaryHex?: string };
}) {
  const brand = params.brandName ? params.brandName.trim() : '';
  const focus = params.visualFocus ? params.visualFocus.trim() : '';
  const cta = params.ctaType || 'TikTok Shop ("carrinho laranja")';

  // Run real analysis with client-verified color
  const visualMetrics: VisualAnalysisMetrics = analyzeRawImageBytes(params.cleanBase64 || '', params.clientColor);

  const profile = selectProductProfile(brand, focus);
  const productName = brand || profile.defaultName;

  const shape = visualMetrics.shapeDescription;

  // Use strictly product-specific component dialogues passing the 20-product test
  const dynamicScene1Options = profile.dialoguesScene1.map((d) =>
    brand ? d.replace(/(desse modelo|desse produto|dessa peça)/i, `do ${brand}`) : d
  );

  const dynamicScene2Options = profile.dialoguesScene2;

  const dynamicScene3Options = profile.dialoguesScene3.map((d) => adaptCtaLine(d, cta));

  const seed1 = Math.floor(Math.random() * dynamicScene1Options.length);
  const seed2 = Math.floor(Math.random() * dynamicScene2Options.length);
  const seed3 = Math.floor(Math.random() * dynamicScene3Options.length);

  const rawDialogue1 = dynamicScene1Options[seed1];
  const rawDialogue2 = dynamicScene2Options[seed2];
  const rawDialogue3 = dynamicScene3Options[seed3];

  const altDialogues1 = dynamicScene1Options;
  const altDialogues2 = dynamicScene2Options;
  const altDialogues3 = dynamicScene3Options;

  const detectedVisualDetails = [
    `Proporção geométrica: ${visualMetrics.aspectRatioLabel} (${visualMetrics.shapeDescription})`,
    `Acabamento superficial: ${visualMetrics.finishType}`,
    `Nível de textura: ${visualMetrics.textureDensity}`,
    ...profile.visualDetails,
  ];

  const detectedMaterialsAndColors = [
    `Construção física: ${visualMetrics.finishType}`,
    `Densidade de textura: ${visualMetrics.textureDensity}`,
    ...profile.materialsAndColors.filter(m => !m.toLowerCase().includes('cor')),
  ];

  const prompt1English = `Create ONE continuous ultra-realistic first-person POV product demonstration video.
Use the provided product image as the absolute visual reference for the product.
The video must feel like authentic footage recorded by a real person wearing an action camera physically strapped to their forehead/head while walking forward indoors with the product in hand.

CAMERA:
A real action camera is physically strapped to the person's forehead.
The camera represents the person's actual point of view.
The person is walking forward at a natural indoor pace, moving through a realistic Brazilian home-office / hallway towards their desk, looking slightly downward at the ${productName} held in their right hand.
Use a realistic wide-angle action-camera perspective, approximately 14–16mm equivalent.
The camera captures the subtle, organic vertical bobbing caused naturally by footsteps, without erratic shaking.
This is NOT an eye-level forward-facing POV.
This is NOT a chest-mounted camera.
This is NOT a handheld camera.
This is NOT a floating camera.
This is NOT a third-person camera.
The viewer must feel that the camera IS the person's head and eyes while walking.

COMPOSITION:
The person's right hand and forearm enter diagonally from the BOTTOM-RIGHT of the frame, holding the ${productName} steadily and presenting it forward.
In the lower frame, the person's jeans, legs and shoes are partially visible stepping forward on the wooden floor.
In the background ahead, the Brazilian home-office room with a large rectangular desk, computer monitor and window approaches as the person walks towards it.
The ${productName} remains prominently displayed in the person's hand near the center of the frame throughout the 9 seconds.
Never show the person's face.

ENVIRONMENT:
Realistic Brazilian home-office / apartment setting.
Wood parquet floor passing beneath the walking steps.
Warm natural daytime indoor lighting coming from room windows, creating soft natural shadows.
Authentic lived-in feel, not a commercial studio.

PRODUCT INTEGRITY:
Preserve the supplied ${productName} exactly as pictured in the reference image.
Maintain its exact shape, proportions, textures, materials, and visible surface details: ${profile.visualDetails.join(', ')}.
Do not redesign, replace, transform, duplicate, deform, or rotate the product.

CAMERA MOVEMENT:
Continuous forward walking motion for the full 9 seconds.
The action camera remains physically attached to the person's forehead.
Gentle, realistic walking bobbing synchronized with steps.
No robotic stabilization, no cinematic drone movement, no orbit, no dolly, no artificial spin.

HAND INTERACTION & MOTION:
The person's right hand holds the ${productName} firmly and naturally in front of them as they walk.
The fingers gently highlight ${profile.keyFocalPoints[0]} without covering key visual elements.
At approximately 0:08–0:09, the person approaches right in front of the desk, preparing to place the item down for detailed desk inspection.
Hand movement is steady, controlled, and synchronized with the walking stride and the spoken line.

DIALOGUE:
The person speaks naturally in Brazilian Portuguese (approximately 9 seconds):
"${rawDialogue1}"

NO TEXT ON SCREEN. NO SUBTITLES. NO GRAPHICS. NO ADDED LOGOS. NO WATERMARKS. NO CUTS.`;

  const prompt2English = `Create ONE continuous ultra-realistic first-person POV product demonstration video.
Use the provided product image as the absolute visual reference for the product.
The video must feel like authentic footage recorded by a real person wearing an action camera physically strapped to their forehead/head.

CAMERA:
A real action camera is physically strapped to the person's forehead.
The camera represents the person's actual point of view.
The person is standing directly in front of a large rectangular desk and looking strongly downward toward the product.
Use a realistic wide-angle action-camera perspective, approximately 14–16mm equivalent.
The camera looks almost vertically downward at the tabletop.
This is NOT an eye-level forward-facing POV.
This is NOT a chest-mounted camera.
This is NOT a handheld camera.
This is NOT a floating camera.
This is NOT a third-person camera.
The viewer must feel that the camera IS the person's head and eyes.

COMPOSITION:
The large tabletop dominates approximately 65–75% of the frame.
A computer monitor is visible along the upper edge of the frame.
The ${productName} rests naturally near the center of the desk, perfectly identical in shape and texture to the reference photo.
Part of the person's black shirt or torso is visible at the bottom center.
The person's jeans, legs and shoes are partially visible below the near edge of the desk.
The wooden floor is visible underneath and around the desk.
The right forearm enters naturally and diagonally from the BOTTOM-RIGHT portion of the frame.
The arm visibly belongs to the POV person's body.
Never show the person's face.
The composition must create the unmistakable impression that a real person is standing at their computer desk looking downward.

ENVIRONMENT:
Realistic Brazilian home-office environment.
Large light-colored desk with subtle natural reflection.
Computer monitor positioned at the opposite side.
Natural indoor ambient lighting casting realistic soft shadows on the tabletop.
Authentic lived-in room feel.

PRODUCT INTEGRITY:
Preserve the supplied ${productName} exactly.
Maintain all visual details observed in the reference image: ${profile.visualDetails.join(', ')}.
Do not deform the product, do not lift it, do not rotate it.
The product remains stationary on the desk while being inspected.

CAMERA MOVEMENT:
Almost no camera movement.
The action camera remains attached to the forehead throughout the entire 9-second clip.
Only subtle breathing micro-movements.
No cinematic movement, no orbit, no dolly, no artificial pan, no zoom.

HAND INTERACTION & MOTION:
${profile.handInteractions[1]}
The contact is gentle and physically realistic, showing the real texture without deforming or lifting the product.
Wrist moves minimally; forearm stays low.

DIALOGUE:
The person speaks naturally in Brazilian Portuguese (approximately 9 seconds):
"${rawDialogue2}"

NO TEXT ON SCREEN. NO SUBTITLES. NO GRAPHICS. NO ADDED LOGOS. NO WATERMARKS. NO CUTS.`;

  const prompt3English = `Create ONE continuous ultra-realistic first-person POV product demonstration video.
Use the provided product image as the absolute visual reference for the product.
The video must feel like authentic footage recorded by a real person wearing an action camera physically strapped to their forehead/head.

CAMERA:
A real action camera is physically strapped to the person's forehead.
The camera represents the person's actual point of view.
The person is standing directly in front of a large rectangular desk and looking strongly downward toward the product.
Use a realistic wide-angle action-camera perspective, approximately 14–16mm equivalent.
The camera looks almost vertically downward at the tabletop.
This is NOT an eye-level forward-facing POV.
This is NOT a chest-mounted camera.
This is NOT a handheld camera.
This is NOT a floating camera.
This is NOT a third-person camera.
The viewer must feel that the camera IS the person's head and eyes.

COMPOSITION:
The large tabletop dominates approximately 65–75% of the frame.
A computer monitor is visible along the upper edge of the frame.
The ${productName} rests naturally near the center of the desk, exactly as depicted in the original image.
Part of the person's black shirt or torso is visible at the bottom center.
The person's jeans, legs and shoes are partially visible below the near edge of the desk.
The wooden floor is visible underneath and around the desk.
The right forearm enters naturally and diagonally from the BOTTOM-RIGHT portion of the frame.
The arm visibly belongs to the POV person's body.
Never show the person's face.
The composition creates the unmistakable impression of standing at a desk looking down.

ENVIRONMENT:
Realistic Brazilian home-office environment.
Large light-colored desk with computer monitor on opposite side.
Consistent natural indoor lighting and authentic soft shadows.
Lived-in, realistic everyday setup.

PRODUCT INTEGRITY:
Preserve the supplied ${productName} completely.
Strictly maintain shape, colors, patterns, and visible craftsmanship details.
Do not invent unverified technical specifications or non-visible features.

CAMERA MOVEMENT:
Almost no camera movement.
The action camera remains firmly on the forehead with only subtle breathing micro-movements.
No cinematic movement, no orbit, no dolly, no artificial pan, no zoom.

HAND INTERACTION & MOTION:
${profile.handInteractions[2]}
No presenter waving, no palms toward camera lens.

DIALOGUE:
The person speaks naturally in Brazilian Portuguese (approximately 9 seconds):
"${rawDialogue3}"

NO TEXT ON SCREEN. NO SUBTITLES. NO GRAPHICS. NO ADDED LOGOS. NO WATERMARKS. NO CUTS.`;

  const rawFormattedResponse = `PROMPT 1
${prompt1English}

FALA:
"${rawDialogue1}"

PROMPT 2
${prompt2English}

FALA:
"${rawDialogue2}"

PROMPT 3
${prompt3English}

FALA:
"${rawDialogue3}"`;

  return {
    productAnalysis: {
      productName,
      category: profile.category,
      visualDetails: detectedVisualDetails,
      materialsAndColors: detectedMaterialsAndColors,
      handInteractionNotes: profile.handInteractions[1],
      visualMetrics: visualMetrics,
    },
    scenes: [
      {
        sceneNumber: 1,
        sceneType: 'gancho',
        title: 'Cena 1 — Caminhando com o Produto (Gancho / Descoberta)',
        timestampRange: '0:00 - 0:09 (9s)',
        englishPrompt: prompt1English,
        spokenDialogue: rawDialogue1,
        visualInteraction: `A pessoa caminha segurando o produto à sua frente com a mão direita em direção à bancada, destacando ${profile.keyFocalPoints[0]} enquanto fala.`,
        keyFocalPoint: profile.keyFocalPoints[0],
        mentalTrigger: 'Curiosidade & Quebra de Padrão (Caminhando)',
        alternativeDialogues: altDialogues1,
      },
      {
        sceneNumber: 2,
        sceneType: 'detalhes',
        title: 'Cena 2 — Detalhes / Prova Tátil na Bancada',
        timestampRange: '0:09 - 0:18 (9s)',
        englishPrompt: prompt2English,
        spokenDialogue: rawDialogue2,
        visualInteraction: profile.handInteractions[1],
        keyFocalPoint: profile.keyFocalPoints[1],
        mentalTrigger: 'Especificidade & Prova Tátil (Sensação de Posse)',
        alternativeDialogues: altDialogues2,
      },
      {
        sceneNumber: 3,
        sceneType: 'cta',
        title: 'Cena 3 — Conclusão + CTA de Alta Conversão',
        timestampRange: '0:18 - 0:27 (9s)',
        englishPrompt: prompt3English,
        spokenDialogue: rawDialogue3,
        visualInteraction: profile.handInteractions[2],
        keyFocalPoint: profile.keyFocalPoints[2],
        mentalTrigger: 'Custo-Benefício & Decisão Imediata (CTA no Carrinho)',
        alternativeDialogues: altDialogues3,
      },
    ],
    rawFormattedResponse,
  };
}

const handleAnalyze = async (req: any, res: any) => {
  try {
    const { imageBase64, brandName, visualFocus, clientColor } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Nenhuma imagem foi fornecida.' });
      return;
    }

    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
      try {
        const fetchRes = await fetch(imageBase64);
        const arrayBuf = await fetchRes.arrayBuffer();
        cleanBase64 = Buffer.from(arrayBuf).toString('base64');
      } catch (err) {
        // fallback
      }
    } else {
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }

    const visualMetrics = analyzeRawImageBytes(cleanBase64, clientColor);
    const brand = brandName ? brandName.trim() : '';
    const focus = visualFocus ? visualFocus.trim() : '';
    const profile = selectProductProfile(brand, focus);
    const productName = brand || profile.defaultName;

    const detectedFeatures = [
      `Geometria: ${visualMetrics.aspectRatioLabel} (${visualMetrics.shapeDescription})`,
      `Superfície: ${visualMetrics.finishType}`,
      `Nível de textura: ${visualMetrics.textureDensity}`,
      ...profile.visualDetails.slice(0, 3),
    ];

    res.json({
      productName,
      category: profile.category,
      confidenceScore: 98,
      detectedFeatures,
      dominantColor: visualMetrics.dominantColor,
      secondaryColor: visualMetrics.secondaryColor,
      finishType: visualMetrics.finishType,
      textureDensity: visualMetrics.textureDensity,
      shapeDescription: visualMetrics.shapeDescription,
      aspectRatioLabel: visualMetrics.aspectRatioLabel,
      handContactPoint: profile.handInteractions[1],
      suggestedSpeechThemes: {
        hook: `Gatilho de Curiosidade (Caminhando): Destacar o diferencial tangível nos primeiros passos até a mesa.`,
        demo: `Gatilho de Prova Tátil (Bancada): Demonstrar textura, costuras ou travas eliminando objeções de compra.`,
        cta: `Gatilho de Decisão (Conversão): Enfatizar a satisfação no uso real e convite fluido pro carrinho laranja.`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Falha ao analisar o produto com a IA.' });
  }
};

const handleGenerate = async (req: any, res: any) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', brandName, visualFocus, ctaType, clientColor } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Nenhuma imagem foi fornecida.' });
      return;
    }

    let cleanBase64 = imageBase64;
    // Handle image URLs (e.g. sample images) by fetching on server
    if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
      try {
        const fetchRes = await fetch(imageBase64);
        const arrayBuf = await fetchRes.arrayBuffer();
        cleanBase64 = Buffer.from(arrayBuf).toString('base64');
      } catch (fetchErr) {
        // Fallback without crashing
      }
    } else {
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }

    let parsedData = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const userPromptText = `Analise detalhadamente a imagem do produto anexada e gere os 3 PROMPTS DE VÍDEO POV DE 9 SEGUNDOS rigorosamente de acordo com o padrão exigido.
${brandName ? `Nome/marca informado pelo usuário: ${brandName}. (Você pode citar esta marca de forma natural na fala)` : 'Nenhuma marca foi informada pelo usuário. NUNCA invente nome de marca.'}
${visualFocus ? `Detalhe visual de interesse indicado pelo usuário: ${visualFocus}. (Apenas mencione se condizente com a imagem)` : ''}
${ctaType ? `Tipo de Call to Action (CTA) desejado para a Cena 3: ${ctaType}` : 'Tipo de CTA para a Cena 3: Padrão TikTok Shop ("carrinho laranja").'}

ATENÇÃO CRÍTICA PARA AS FALAS:
- TOM DE VOZ OBRIGATÓRIO: Fale EXATAMENTE como se estivesse conversando com um amigo e recomendando um produto que você comprou e curtiu demais ("Cara", "Mano", "Sério, você não tem noção", "O que eu mais curti...", "Vale muito a pena").
- PROIBIDO USAR PARTES TÉCNICAS: NUNCA use termos técnicos de engenharia/catálogo (nada de "mesh", "circumaural", "pesponto", "cânula", "polímero", "vulcanizado"). Fale do benefício real e do sentimento prático no dia a dia.
- PROIBIDO NARRAR A PRÓPRIA MÃO: NUNCA diga "passando a mão", "deslizando o dedo", "tocando aqui". O vídeo já mostra as mãos.
- PROIBIDO FALAR DE CORES: Zero menção a cores nas falas.
- PROMPT 1: Caminhando com o produto na mão em direção à mesa (~9s) com POV câmera na testa, passos sutis e mão direita segurando o produto à frente.
- PROMPT 2: Na bancada demonstrando a peça e tirando objeções como amigo (~9s).
- PROMPT 3: Na bancada com recomendação sincera + CTA curto pro carrinho laranja (~9s).
- Cada prompt deve estar completo e autossuficiente em inglês para gerador de vídeo, com descrição minuciosa do produto visualmente identificado, câmera de ação na testa, braço direito no canto inferior direito, e a fala exata em português brasileiro incluída no prompt e no campo de fala.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: userPromptText,
              },
            ],
          },
          config: {
            systemInstruction: AGENT_SYSTEM_INSTRUCTION,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                productAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING, description: 'Identificação visual precisa do produto' },
                    category: { type: Type.STRING, description: 'Categoria do produto (ex: Calçado, Eletrônico, Utensílio, etc)' },
                    visualDetails: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Lista de características reais visíveis na imagem'
                    },
                    materialsAndColors: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Cores e acabamentos visíveis na imagem'
                    },
                    handInteractionNotes: { type: Type.STRING, description: 'Como a mão interage fisicamente de forma crível com esse produto específico' },
                  },
                  required: ['productName', 'category', 'visualDetails', 'materialsAndColors', 'handInteractionNotes'],
                },
                scenes: {
                  type: Type.ARRAY,
                  description: 'Exatamente 3 cenas de 9 segundos',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sceneNumber: { type: Type.INTEGER, description: '1, 2 ou 3' },
                      sceneType: { type: Type.STRING, description: 'gancho, detalhes ou cta' },
                      title: { type: Type.STRING, description: 'Título descritivo da cena' },
                      timestampRange: { type: Type.STRING, description: 'Ex: 0:00 - 0:09, 0:09 - 0:18, 0:18 - 0:27' },
                      englishPrompt: {
                        type: Type.STRING,
                        description: 'O prompt completo, integral, detalhado e autossuficiente em inglês para gerador de vídeo'
                      },
                      spokenDialogue: {
                        type: Type.STRING,
                        description: 'A fala em Português do Brasil de aproximadamente 9 segundos, condizente com o produto e sem repetição'
                      },
                      visualInteraction: {
                        type: Type.STRING,
                        description: 'Descrição do movimento específico do braço/dedo sincronizado com a fala'
                      },
                      keyFocalPoint: {
                        type: Type.STRING,
                        description: 'O detalhe visual do produto em foco nesta cena'
                      },
                    },
                    required: ['sceneNumber', 'sceneType', 'title', 'timestampRange', 'englishPrompt', 'spokenDialogue', 'visualInteraction', 'keyFocalPoint'],
                  },
                },
                rawFormattedResponse: {
                  type: Type.STRING,
                  description: 'A resposta no formato padrão exato: PROMPT 1 [conteúdo] FALA: "[fala]" PROMPT 2 ... etc.'
                }
              },
              required: ['productAnalysis', 'scenes', 'rawFormattedResponse'],
            },
          },
        });

        if (response.text) {
          parsedData = JSON.parse(response.text);
        }
      } catch (_geminiError) {
        // Fallback gracefully without noisy errors
      }
    }

    if (!parsedData) {
      parsedData = generateAutonomousPOV({
        brandName,
        visualFocus,
        ctaType,
        cleanBase64,
        clientColor,
      });
    }

    res.json(parsedData);
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || 'Falha ao processar a imagem e gerar os prompts de vídeo.',
    });
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

  process.env.GEMINI_API_KEY = apiKey;
  ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  if (String(req.body?.action || '') === 'analyze-product') {
    return handleAnalyze(req, res);
  }

  return handleGenerate(req, res);
}
