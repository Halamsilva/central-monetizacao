import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Clock,
  Copy,
  Download,
  Film,
  Layers,
  Lightbulb,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  Palette,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { describeHttpError } from '../lib/httpError';

const themes = [
  { label: 'Racismo', icon: '✊' },
  { label: 'Preconceito', icon: '🚫' },
  { label: 'Humilhação', icon: '👤' },
  { label: 'Injustiça', icon: '⚖️' },
  { label: 'Abuso de Poder', icon: '👑' },
  { label: 'Desigualdade Social', icon: '🏚️' },
  { label: 'Superação', icon: '✨' },
  { label: 'Deuses Gregos', icon: '⚡' },
  { label: 'Dorama', icon: '❤️' },
  { label: 'Infantil', icon: '🎈' },
  { label: 'Vida de Jesus', icon: '🙏' },
  { label: 'Roça', icon: '🤠' },
  { label: 'Comédia Br', icon: '😂' },
  { label: 'Frutas', icon: '🍎' },
  { label: 'Soldado voltando da guerra', icon: '🪖' },
  { label: 'Viagem no Tempo', icon: '⏳' },
  { label: 'Cartoon Emocionante', icon: '🎨' },
  { label: 'Dramas Emocionantes', icon: '✨' },
  { label: 'Jesus: Milagres e Ressurreição', icon: '🙏' },
  { label: 'Histórias de Brasileiros Reais', icon: '🇧🇷' },
  { label: 'Causa Animal e Reviravoltas', icon: '🐾' },
  { label: 'Outro', icon: '✍️' },
];

const countries = [
  { label: 'Brasil', lang: 'Português', flag: '🇧🇷' },
  { label: 'Estados Unidos', lang: 'English (US)', flag: '🇺🇸' },
  { label: 'Espanha', lang: 'Español (ES)', flag: '🇪🇸' },
  { label: 'México', lang: 'Español (MX)', flag: '🇲🇽' },
  { label: 'Reino Unido', lang: 'English (UK)', flag: '🇬🇧' },
  { label: 'França', lang: 'Français', flag: '🇫🇷' },
  { label: 'Itália', lang: 'Italiano', flag: '🇮🇹' },
  { label: 'Alemanha', lang: 'Deutsch', flag: '🇩🇪' },
];

const localeMap: Record<string, string> = {
  'Brasil': 'pt-BR',
  'Estados Unidos': 'en-US',
  'Reino Unido': 'en-GB',
  'Espanha': 'es-ES',
  'México': 'es-MX',
  'França': 'fr-FR',
  'Itália': 'it-IT',
  'Alemanha': 'de-DE',
};

const tones = [
  'Dramático e ultra-realista',
  'Emocionante e familiar',
  'Suspense com virada',
  'Comédia popular',
  'Cinematográfico sombrio',
];

const emotions = [
  { label: 'Empatia', desc: 'Compaixão e lição de vida' },
  { label: 'Tensão', desc: 'Suspense psicológico' },
  { label: 'Raiva', desc: 'Confronto e indignação' },
  { label: 'Medo', desc: 'Perigo e pavor' },
  { label: 'Tristeza', desc: 'Drama e vulnerabilidade' },
  { label: 'Alegria', desc: 'Humor e leveza' },
  { label: 'Nojo', desc: 'Repulsa e desprezo' },
  { label: 'Amor', desc: 'Afeto e reconciliação' },
  { label: 'Desprezo', desc: 'Frieza e deboche' },
  { label: 'Felicidade', desc: 'Final inspirador' },
  { label: 'Surpresa', desc: 'Choque e revelação' },
];

const skinLevels = [
  { value: 'standard', label: 'Cinematográfico', desc: 'Raw 35mm, textura natural, penugem e poros reais' },
  { value: 'extreme', label: 'Ultra Dermo-Realismo', desc: 'Microporos 8K, reflexos de córnea, suor e imperfeições' },
  { value: 'ultimate', label: 'Máximo (ARRI Alexa 65)', desc: 'Lente 85mm f/1.4, micro-textura crua e ótica de cinema' },
];

const themeQuickIdeas: Record<string, string[]> = {
  'Frutas': [
    'Moranguinha (protagonista romântica de vestido rosa e sementes douradas) descobre no dia do noivado que seu noivo Bananão (playboy de terno amarelo) tem um caso secreto com a vilã Uva Vitória (vestido roxo de gala).',
    'Moranguinha é humilhada pela esnobe Maçã Bianca em um baile de gala no bistrô, até que o misterioso herdeiro Abacaxi Arthur (jaqueta e alfaiataria elegante) a convida para a valsa principal desmascarando a rival.',
    'A jovem Cereja Sofia (sensível de vestido vermelho) é acusada injustamente de roubo pela governanta Pera Gertrudes, até que o delegado Limão Bento encontra as joias escondidas na bolsa da acusadora.',
    'Bananão tenta tomar o ateliê de costura da humilde Moranguinha para construir um cassino de frutas, mas o retorno triunfante de Manga Rodrigo como advogado vira o jogo no tribunal.',
    'Moranguinha sofre um acidente no pomar real e perde a memória, sendo acolhida pelo bondoso Pêssego Paulo, enquanto Bananão, arrependido, vasculha a cidade inteira tentando reconquistá-la.',
    'No grande julgamento do sindicato das frutas, a vilã Uva Vitória jura inocência, até que Moranguinha entra na corte com o contrato assinado que prova o golpe contra o prefeito Melancia.',
  ],
  'Deuses Gregos': [
    'Zeus desce à Terra disfarçado de mendigo em Atenas para testar quem tem compaixão, sendo acolhido com carinho apenas por um humilde oleiro.',
    'Hades concede a um pai mortal a chance de resgatar o espírito de sua filha do submundo, testando sua coragem e fidelidade inabalável.',
    'Atena desafia o arrogante deus Ares a resolver um conflito entre cidades sem derramar uma única gota de sangue.',
    'Afrodite retira a beleza de uma princesa arrogante para ensiná-la que a bondade do coração é a única luz que nunca envelhece.',
    'Hermes entrega uma mensagem misteriosa a um pastor de ovelhas, revelando que ele é o herdeiro legítimo do trono de Tebas.',
    'Poseidon acalma uma tempestade violenta após ver a coragem de um jovem marinheiro que arriscou a vida para salvar o amigo de infância.',
  ],
  'Causa Animal e Reviravoltas': [
    'Um vira-lata caramelo abandonado na chuva guia uma mãe aos prantos até o local exato onde seu filho pequeno estava perdido na mata.',
    'Um segurança de condomínio que maltratava um cão de rua é desmascarado quando o mesmo animal impede uma invasão e salva os moradores.',
    'Uma gatinha resgatada de um lixão não sai do lado de uma idosa solitária, descobrindo uma medalha antiga que reúne a família separada.',
    'Um pitbull rotulado injustamente como agressivo protege uma menina de um assalto no parque, quebrando o preconceito de todo o bairro.',
    'Um cavalo de carroça exausto é resgatado por um veterinário e anos depois salva o neto do próprio socorrista durante uma enchente.',
    'Um cachorro idoso cego reconhece o assobio do antigo dono desaparecido há 5 anos na porta do hospital, provocando comoção coletiva.',
  ],
  'Vida de Jesus': [
    'Um centurião romano que perseguia cristãos procura secretamente Jesus para implorar pela vida de seu jovem servo gravemente enfermo.',
    'Uma mulher humilde que sofria há anos toca com fé na orla das vestes de Jesus no meio da multidão e tem sua vida restaurada.',
    'Um cobrador de impostos odiado pela cidade desce da árvore após ser chamado pelo nome por Jesus e decide doar metade de seus bens aos pobres.',
    'Uma mãe desesperada pede uma migalha de bênção para sua filha aflita e comove Jesus pela sua fé profunda e perseverante.',
    'Pedro, após falhar e se sentir indigno à beira do mar da Galileia, é restaurado com amor incondicional pelo Mestre ressurreto.',
    'Um ladrão arrependido na cruz ao lado de Jesus reconhece sua divindade e recebe a promessa do Paraíso eterno naquele mesmo dia.',
  ],
  'Jesus: Milagres e Ressurreição': [
    'Um mendigo cego de nascença clama pelo Filho de Davi na entrada de Jericó e recebe o milagre da visão diante dos seus antigos opressores.',
    'Pescadores exaustos após uma noite inteira sem apanhar nada obedecem à ordem de Jesus para lançar a rede e testemunham a pesca milagrosa.',
    'No túmulo lacrado de Lázaro, Jesus chora com a família em luto e com um único brado de autoridade divina ordena que o falecido venha para fora.',
    'Uma viúva pobre em Naim chora no cortejo fúnebre de seu único filho, até que Jesus toca no esquife e devolve o jovem com vida aos braços da mãe.',
    'Em meio a uma tempestade furiosa que aterroriza os discípulos no barco, Jesus acalma os ventos e o mar com uma palavra de paz.',
    'Ao terceiro dia, as mulheres encontram a pedra rolada e o túmulo vazio, recebendo de anjos luminosos a mensagem triunfante da ressurreição.',
  ],
  'Roça': [
    'Um fazendeiro ganancioso tenta tomar o pequeno sítio de uma família caipira, mas um juiz que nasceu no sertão chega a cavalo com a escritura original.',
    'Um garoto da roça viaja à capital para disputar um concurso gastronômico e vence os chefs ricos usando o fubá e o queijo artesanal da avó.',
    'Um idoso sertanejo cede sua última cuia de água a um andarilho sedento, que revela ser um agrônomo que perfura um poço artesiano na terra seca.',
    'Dois irmãos do campo que romperam por causa de uma cerca velha se reencontram na capela da vila quando uma tempestade ameaça a colheita comunitária.',
    'Uma jovem do interior que aprendeu a cuidar da terra com o pai salva a cooperativa agrícola local ao criar um adubo orgânico revolucionário.',
    'Um peão humilde tratado com soberba pelo patrão salva o gado premiado da fazenda de uma queimada e é condecorado como herói regional.',
  ],
  'Comédia Br': [
    'Uma sogra finge desmaio no almoço de domingo para não lavar as panelas, até que o genro inventa que vai chamar um exorcista do bairro.',
    'Um vizinho fofoqueiro espalha que a dona de casa ganhou na mega-sena, e uma fila de parentes interesseiros invade a casa com pedidos absurdos.',
    'Dois camelôs rivais que disputam o mesmo ponto na calçada descobrem que seus filhos estão namorando escondido há seis meses.',
    'Um marido jura que sabe consertar o chuveiro elétrico para economizar, mas faz o quarteirão inteiro ficar sem energia no dia da final do futebol.',
    'Uma mãe finge que não sabe usar o aplicativo de mensagens e manda um áudio constrangedor no grupo da família elogiando o pretendente da filha.',
    'Um churrasqueiro de domingo tenta disfarçar que queimou a picanha dourada e convence os convidados de que é uma receita gourmet francesa defumada.',
  ],
  'Soldado voltando da guerra': [
    'Um soldado com farda camuflada entra de surpresa no meio de uma apresentação escolar da filha pequena fantasiada de bailarina.',
    'Um veterano com sequelas físicas chega na antiga carpintaria do pai idoso, que o reconhece pelos olhos e desaba em um abraço emocionante.',
    'Uma mãe que recebia cartas atrasadas há dois anos abre a porta de casa e encontra o filho fardado segurando o bolo de aniversário dela.',
    'Um cão farejador aposentado corre descontrolado no aeroporto ao sentir o cheiro do sargento com quem serviu no exterior.',
    'Um soldado ferido visita a família do companheiro de trincheira que salvou sua vida para entregar uma medalha de honra em mãos.',
    'Dois irmãos combatentes que se perderam durante uma evacuação de emergência se reencontram de surpresa na sala de desembarque militar.',
  ],
  'Viagem no Tempo': [
    'Um cientista arrogante viaja 25 anos no passado para mudar uma decisão profissional, mas descobre que a maior riqueza de sua vida foi o tempo com a mãe.',
    'Uma jovem viaja aos anos 1960 para impedir o casamento infeliz dos avós, mas percebe que a força e o amor deles foi o que moldou sua família.',
    'Um relógio antigo de família toca à meia-noite e transporta um neto mimado para a época em que o avô trabalhava 16 horas na lavoura.',
    'Um homem do futuro supertecnológico volta à infância simples no interior para reencontrar o sabor do pão caseiro feito na lenha.',
    'Um arquiteto volta 40 anos no tempo e dá um conselho crucial a um jovem sonhador, sem que o rapaz saiba que está conversando consigo mesmo.',
    'Uma fotógrafa encontra uma máquina de retrato mágica que permite registrar momentos que nunca puderam ser fotografados no passado.',
  ],
  'Cartoon Emocionante': [
    'Um pequeno robô feito de sucata rega diariamente a última plantinha verde em uma metrópole cinzenta, ensinando amor aos autômatos frios.',
    'Uma nuvenzinha cinzenta e triste que achava que só trazia chuva e frio descobre que seu orvalho faz brotar o campo de girassóis mais lindo do vale.',
    'Uma lâmpada antiga de filamento se recusa a queimar até ver a criança da casa terminar de ler seu primeiro livro de histórias.',
    'Um lápis de cor que vai ficando pequenininho de tanto desenhar sonhos se orgulha de pintar o mural mais colorido da cidade.',
    'Um relógio cuco que sonhava em voar é libertado por um passarinho de verdade e descobre a liberdade sob as estrelas.',
    'Um balão vermelho que escapou da mão de um menino viaja pelo mundo consolando pessoas solitárias até pousar suavemente no colo de uma idosa.',
  ],
  'Infantil': [
    'Um ursinho de pelúcia com uma orelha rasgada ajuda um menino tímido a fazer seu primeiro amigo no pátio da escola.',
    'Uma menininha constrói um jardim de flores na janela do quarto para atrair uma borboleta azul e alegrar o avô acamado.',
    'Dois irmãozinhos juntam moedinhas do cofrinho durante o ano inteiro para comprar uma boneca nova para a coleguinha que perdeu tudo na enchente.',
    'Um cachorrinho filhote que ninguém adotava no abrigo por ser o menorzinho encontra o abraço quentinho de uma criança autista.',
    'Uma garotinha descobre que a árvore velha do quintal é a morada secreta dos passarinhos cantores e convence o pai a não cortá-la.',
    'Um garoto que tinha medo do escuro ganha uma capa mágica de herói costurada pela avó e vence o medo de dormir sozinho.',
  ],
  'Dorama': [
    'O herdeiro de um conglomerado milionário renuncia ao casamento forçado de aparências para ficar com a jovem florista que salvou sua vida.',
    'Um promotor de justiça frio e implacável reencontra seu primeiro amor de infância, agora como advogada de defesa em um caso dramático.',
    'Uma pianista prodígio que perdeu a audição após um trauma volta a sentir as vibrações das notas ao tocar em dueto com um violoncelista apaixonado.',
    'Um idol de K-pop exausto da fama foge para uma vila costeira pacata e redescobre o valor da vida simples ao lado de uma jovem mergulhadora.',
    'O CEO arrogante e sua secretária eficiente trocam de corpo magicamente após um eclipse, sendo forçados a viver a realidade um do outro.',
    'Dois médicos rivais em um grande hospital de Seul precisam unir forças para operar um paciente de alto risco durante um apagão geral.',
  ],
  'Histórias de Brasileiros Reais': [
    'Um gari que estudava livros descartados no lixo sob a luz dos postes é aprovado com nota máxima no concurso para juiz de direito.',
    'Uma merendeira de escola pública que cozinhava com carinho para crianças famintas recebe a visita do menino que ela alimentou, agora como médico da cidade.',
    'Um feirante do interior do Nordeste que vendia rapadura financia a faculdade de cinco filhas, que se formam juntas em engenharia e direito.',
    'Um pescador humilde que salvou 30 pessoas com seu barquinho durante as cheias no Rio Grande do Sul é homenageado em rede nacional.',
    'Um motoboy de entrega resgata um idoso com Alzheimer desorientado na rodovia e o devolve em segurança à família desesperada.',
    'Uma professora de escola rural caminha 10 km todos os dias na estrada de terra para garantir que nenhuma criança da roça fique sem alfabetização.',
  ],
  'Racismo': [
    'Um jovem negro recém-empossado como diretor de tecnologia é barrado na portaria executiva por seguranças esnobes, revelando sua autoridade na assembleia.',
    'Um médico negro brilhante é confundido com maqueiro por uma paciente preconceituosa, até que ele lidera com maestria a cirurgia que salva sua vida.',
    'Uma mãe solo negra é acusada injustamente de furto em um supermercado luxuoso, até que as câmeras provam sua inocência e expõem o gerente.',
    'Um garoto negro de periferia vence as olimpíadas nacionais de matemática e dedica o troféu aos professores que acreditaram no seu potencial.',
    'Um professor universitário negro desafia o conselho acadêmico conservador ao publicar a pesquisa que resgata a verdadeira história esquecida da cidade.',
    'Duas crianças, uma negra e uma branca, ensinam uma lição de igualdade aos pais racistas ao se recusarem a brincar separadas no parquinho.',
  ],
  'Preconceito': [
    'Um jovem com tatuagens no rosto e roupas rasgadas é o único pedestre que para no sinal para realizar manobra de socorro e salvar um senhor engravatado.',
    'Uma mulher de 50 anos é rejeitada em entrevistas de emprego por ser considerada velha, até abrir um negócio próprio que supera todas as concorrentes.',
    'Um estudante com deficiência visual é subestimado pelos colegas de turma, mas resolve de ouvido o enigma sonoro da gincana acadêmica.',
    'Uma jovem mecânica é ridicularizada por clientes masculinos na oficina, até diagnosticar em segundos a falha mecânica que outros mecânicos não achavam.',
    'Um ex-presidiário regenerado tenta um recomeço como padeiro, provando sua honestidade quando devolve uma bolsa com milhares de reais esquecida no balcão.',
    'Uma família simples de imigrantes é mal recebida no bairro nobre, mas conquista a comunidade ao acolher os vizinhos desabrigados após uma tempestade.',
  ],
  'Humilhação': [
    'Uma cliente fútil humilha uma atendente simples em uma loja chique, até que a dona da rede chega e anuncia a atendente como a nova gerente geral.',
    'Um chefe abusivo joga papéis no chão para o estagiário recolher, sem saber que o jovem é o filho do maior acionista da holding.',
    'Uma mãe é expulsa de uma festa de aniversário infantil por levar um presente modesto, até que a aniversariante declara aquele como o brinquedo favorito.',
    'Um garçom é destratado por um cliente milionário arrogante, até que um empresário renomado se levanta e oferece um cargo executivo ao garçom.',
    'Uma aluna humilde é ridicularizada pelas roupas usadas na formatura, mas é aplaudida de pé como oradora da turma com a maior média da história.',
    'Uma mulher divorciada é zombada na reunião de família por morar de aluguel, até que revela ter fundado a ONG que sustenta os projetos da cidade.',
  ],
  'Injustiça': [
    'Um motorista de aplicativo honesto é acusado injustamente de sumir com uma encomenda cara, até que o rastreador e a câmera de bordo revelam o verdadeiro autor.',
    'Um operário é demitido sem direitos após denunciar irregularidades, até que um advogado voluntário leva o caso à corte e ganha indenização recorde.',
    'Uma enfermeira exemplar é suspensa injustamente por negligência, mas a família do paciente internado faz um protesto pacífico exigindo seu retorno.',
    'Um estudante humilde tem seu trabalho de conclusão roubado por um colega rico, até que uma gravação em nuvem com data anterior desmascara a farsa.',
    'Uma idosa quase perde a casa por um golpe imobiliário, até que o neto advogado recém-formado descobre a fraude na assinatura do cartório.',
    'Um comerciante de bairro é chantageado por fiscais corruptos, mas grava as exigências e entrega o dossiê direto ao Ministério Público.',
  ],
  'Abuso de Poder': [
    'O síndico autoritário corta a água de uma moradora idosa por vingança pessoal, até que a assembleia de moradores se revolta e o destitui por unanimidade.',
    'Um delegado corrupto tenta forjar provas contra um jovem inocente, até que a corregedoria da polícia civil cerca a delegacia em flagrante.',
    'Uma diretora de escola autoritária confisca os materiais de alunos carentes, até que a comunidade escolar faz um abaixo-assinado que a afasta do cargo.',
    'Um político arrogante estaciona na vaga de ambulância do hospital, até que os bombeiros rebocam o carro de luxo para dar passagem a um resgate urgente.',
    'Um gerente de banco nega crédito a um agricultor familiar por puro desdém, até que a matriz descobre a rentabilidade da safra sustentável do agricultor.',
    'Um fiscal de trânsito corrupto tenta extorquir um caminhoneiro humilde, sem perceber que a cabine inteira está transmitindo ao vivo para milhares de pessoas.',
  ],
  'Desigualdade Social': [
    'O filho de uma faxineira e o herdeiro de uma mansão estudam na mesma sala; anos depois, o filho da faxineira se torna o cirurgião que opera o antigo colega.',
    'Uma cozinheira de buffet leva as sobras intocadas para distribuir a famílias sem teto na praça, inspirando o dono do evento a criar um sopão comunitário.',
    'Dois amigos de infância que seguiram caminhos opostos se reencontram em um semáforo: um no volante de uma Ferrari e o outro vendendo balas.',
    'Uma arquiteta de projetos bilionários visita a comunidade pobre onde nasceu e decide doar seu tempo para reformar as creches da favela.',
    'Um empresário milionário passa um fim de semana disfarçado como pedreiro em sua própria construtora, transformando as condições de trabalho dos operários.',
    'Uma garota de rua desenha na calçada com pedaços de giz, até que um curador de arte internacional vê seu talento e organiza sua primeira galeria.',
  ],
  'Superação': [
    'Uma mãe solo que vendia doces de porta em porta vê o filho subir ao palco para receber o diploma de medicina e dedicar a conquista a ela.',
    'Um jovem paratleta que perdeu a perna em um acidente de moto treina sob chuva e conquista o ouro paralímpico com a torcida da família aos prantos.',
    'Uma costureira que perdeu tudo em uma enchente recomeça com uma única máquina doada e constrói a marca de moda mais admirada do estado.',
    'Um homem que viveu 10 anos em situação de rua aprende a ler na biblioteca pública e se torna autor de um best-seller motivacional.',
    'Uma garota da periferia que recolhia latinhas para pagar o curso de inglês é selecionada com bolsa integral para estudar em Oxford.',
    'Um agricultor que teve a safra inteira destruída pela seca inventa um sistema de gotejamento caseiro que salva as lavouras de todo o município.',
  ],
  'Dramas Emocionantes': [
    'Uma mãe que doou os órgãos do filho falecido escuta os batimentos cardíacos dele no peito do jovem transplantado em um reencontro emocionante.',
    'Um pianista idoso com Alzheimer não reconhece ninguém ao redor, até que as mãos encontram o teclado e tocam a canção de amor de sua falecida esposa.',
    'Dois irmãos gêmeos separados no berço se cruzam por acaso na fila de um transplante de medula, descobrindo que são compatíveis e irmãos.',
    'Um pai que passou 15 anos afastado trabalhando no exterior para sustentar a família chega no baile de debutante da filha sem avisar.',
    'Uma mulher que perdeu a aliança de casamento no mar há 30 anos a recebe de volta limpa das mãos de um mergulhador voluntário.',
    'Uma senhora solitária que comemorava seu aniversário sozinha no restaurante é surpreendida quando os garçons e clientes formam um coral com bolo.',
  ],
  'Outro': [
    'Uma história inédita e comovente onde as aparências enganam e uma revelação no meio da trama redefine todo o destino dos personagens.',
    'Um encontro inesperado entre duas pessoas de mundos opostos que descobrem ter mais em comum do que jamais imaginaram.',
    'Um dilema ético profundo onde a escolha mais difícil se revela o único caminho para a redenção e paz de espírito.',
    'Uma lição de humildade transmitida de forma sutil através de um ato de generosidade anônima que transforma uma família.',
    'Um reencontro após décadas de silêncio que cura feridas antigas e prova que o amor verdadeiro resiste ao tempo.',
    'Uma reviravolta surpreendente no último segundo que faz o espectador repensar tudo o que assistiu desde a primeira cena.',
  ],
};

const defaultIdeas = [
  'Uma pessoa de classe simples é julgada injustamente pelas aparências, mas uma reviravolta surpreendente revela seu verdadeiro caráter e valor.',
  'Um protagonista humilde enfrenta um rival arrogante e vence através da bondade, dignidade e perseverança inabalável.',
  'Um segredo guardado por anos é revelado no momento mais crítico, transformando a vida de todos os envolvidos em uma grande lição de vida.',
  'Dois rivais declarados são forçados a cooperar diante de uma adversidade comum, descobrindo o valor do perdão e da solidariedade.',
  'Um ato despretensioso de bondade feito no passado retorna de forma milagrosa no instante de maior desespero do protagonista.',
  'Uma revelação de identidade no clímax da cena faz com que todos os opressores peçam perdão ao herói da história.',
];

type PromptBlock = {
  title: string;
  content: string;
  isPrompt00: boolean;
  speaker: string | null;
  toneOfVoice: string | null;
  dialogue: string | null;
  replySpeaker: string | null;
  replyDialogue: string | null;
  environment: string | null;
};

export type CharacterModelSheet = {
  characterName: string;
  role: string | null;
  prompt: string;
  masterIdentity: string | null;
};

export type MasterIdentity = {
  characterName: string;
  role: string | null;
  details: string;
};

export type ParsedScriptSections = {
  storySynopsis: string | null;
  charactersRoster: string | null;
  masterIdentities: MasterIdentity[];
  modelSheets: CharacterModelSheet[];
  promptBlocks: PromptBlock[];
};

type HistoryItem = {
  id: string;
  theme: string;
  country: string;
  scenes: number;
  text: string;
  createdAt: string;
};

const draftKey = 'novelinhas-generator-draft';
const historyKey = 'novelinhas-generator-history';

const ensureFinalPunctuation = (text: string) => {
  const trimmed = text.trim();
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const normalizeFalaLines = (text: string) =>
  text.replace(/^(\s*FALA:\s*)(["“]?)(.+?)(["”]?)\s*$/gim, (_match, prefix, _openQuote, rawText) => {
    const fala = String(rawText || '').replace(/^["“]|["”]$/g, '').trim();
    return fala ? `${prefix}"${ensureFinalPunctuation(fala)}"` : `${prefix}""`;
  });

const cleanText = (text: string) => normalizeFalaLines(text.replace(/\*\*/g, '').trim());

const parsePromptBlocks = (text: string): PromptBlock[] => {
  const markerRegex =
    /(?:^|\n)\s*(PROMPT\s+(?:00(?:\s*-\s*[^\n:]+)?|CENA\s+00|GANCHO\s+CHAMATIVO\s+CENA\s+\d+(?:\s*\([^)]*\))?|CENA\s+(?:EXTRA\s+DE\s+GANCHO|EXTRA\s+DE\s+CTA|\d+)(?:\s*\([^)]*\))?|EXTRA\s+DE\s+CTA)|CENA\s+\d+|CENA\s+00):?\s*/gi;
  const matches = Array.from(text.matchAll(markerRegex)) as RegExpMatchArray[];

  if (!matches.length) return [];

  return matches
    .map((match, index) => {
      const next = matches[index + 1];
      const start = (match.index || 0) + match[0].length;
      const end = next?.index ?? text.length;
      const rawTitle = cleanText(match[1] || `PROMPT CENA ${index + 1}`);

      let rawContent = text.slice(start, end);
      // If this is the last matched scene/prompt, ensure it stops before trailing Character Model Sheets or Master Identities
      if (!next) {
        const trailingBoundary = rawContent.search(
          /\n\s*(?:(?:AUDITORIA|LEVANTAMENTO)(?:\s+COMPLETO)?\s+DE\s+PERSONAGENS|MASTER\s+CHARACTER\s+IDENTIT|IDENTIDADE\s+MESTRE|PROMPT\s+MODEL\s+SHEET|CHARACTER\s+MODEL\s+SHEET|---SEO-START---)/i,
        );
        if (trailingBoundary !== -1) {
          rawContent = rawContent.slice(0, trailingBoundary);
        }
      }

      const content = cleanText(rawContent);

      const isPrompt00 =
        Boolean(rawTitle.match(/\b00\b/i)) ||
        rawTitle.toLowerCase().includes('ficha de personagens') ||
        rawTitle.toLowerCase().includes('fundo branco') ||
        rawTitle.toLowerCase().includes('reference sheet');

      const title = isPrompt00
        ? 'PROMPT 00 - FICHA DE PERSONAGENS (FUNDO BRANCO / SEEDANCE 2.5 REFERENCE SHEET)'
        : rawTitle;

      // Extract speaker (multilingual)
      const speakerMatch =
        content.match(
          /(?:quem fala|personagem que fala|personagem|falante|who speaks|speaker|character speaking|character|quién habla|personaje|qui parle|personnage|chi parla|wer spricht)[^\n:]*:[ \t]*([^\n]+)/i,
        ) || content.match(/(?:di[aá]logo real|di[aá]logo|fala real|fala|dialogue)\s*\(([^)]+)\)\s*:/i);

      // Extract tone / acting intention (multilingual)
      const toneMatch = content.match(
        /(?:tom e intenção da fala|tom da fala|tom e intenção|tom de voz|intenção da fala|tone of voice|tone and intention|tone|tono de voz|tono e intención|tono|ton de voix|ton|tono della voce|tonfall)[^\n:]*:[ \t]*([^\n]+)/i,
      );

      // Extract primary dialogue (multilingual - prioritized for DIÁLOGO REAL)
      const dialogueMatch =
        content.match(
          /(?:di[aá]logo real|di[aá]logo|fala real|fala principal|fala|real dialogue|spoken line|di[aá]logo sugerido|suggested dialogue|dialogue|line|parlamento|dialogue suggéré|dialogo suggerito|vorgeschlagener dialog)[^\n:]*:[ \t]*["“]?([^\n"”]+)["”]?/i,
        ) || content.match(/[A-Za-zÀ-ÿ\s]+fala[^:]*:[ \t]*["“]?([^\n"”]+)["”]?/i);

      // Extract reply speaker (multilingual)
      const replySpeakerMatch = content.match(
        /(?:quem responde|personagem que responde|réplica de|resposta de|interlocutor|reply speaker|responding character|quién responde|qui répond|chi risponde|wer antwortet)[^\n:]*:[ \t]*([^\n]+)/i,
      );

      // Extract reply dialogue (multilingual)
      const replyDialogueMatch = content.match(
        /(?:resposta|r[ée]plica|fala de resposta|reply dialogue|reply|response|respuesta|réplique|risposta|antwort)[^\n:]*:[ \t]*["“]?([^\n"”]+)["”]?/i,
      );

      // Extract environment / setting (multilingual)
      const environmentMatch =
        content.match(
          /\[Environment & Scene Setting\]:\s*([^\n\[]+(?:\n(?!\s*\[)[^\n]+)*)/i,
        ) ||
        content.match(
          /(?:cen[aá]rio e ambiente|cen[aá]rio|ambiente 3d|ambiente|loca[çc][aã]o|escenograf[ií]a|environment & scene setting|environment|scene setting|setting)\s*:[ \t]*([^\n]+)/i,
        );

      return {
        title,
        content,
        isPrompt00,
        speaker: isPrompt00 ? null : speakerMatch ? cleanText(speakerMatch[1]) : null,
        toneOfVoice: isPrompt00 ? null : toneMatch ? cleanText(toneMatch[1]) : null,
        dialogue: isPrompt00 ? null : dialogueMatch ? cleanText(dialogueMatch[1]) : null,
        replySpeaker: isPrompt00 ? null : replySpeakerMatch ? cleanText(replySpeakerMatch[1]) : null,
        replyDialogue: isPrompt00 ? null : replyDialogueMatch ? cleanText(replyDialogueMatch[1]) : null,
        environment: isPrompt00 ? null : environmentMatch ? cleanText(environmentMatch[1]) : null,
      };
    })
    .filter((block) => block.content);
};

const parseFullScript = (text: string): ParsedScriptSections => {
  const clean = cleanText(text);

  // 1. Story Synopsis
  let storySynopsis: string | null = null;
  const storyMatch = clean.match(
    /(?:HISTÓRIA COMPLETA DA NOVELINHA|HISTÓRIA COMPLETA|ETAPA 1:\s*HISTÓRIA COMPLETA)[^\n:]*:\s*\n?([\s\S]*?)(?=(?:PROMPT\s+00|PROMPT\s+GANCHO|PROMPT\s+CENA|LEVANTAMENTO|AUDITORIA|MASTER CHARACTER IDENTIT|PROMPT MODEL SHEET|$))/i,
  );
  if (storyMatch && storyMatch[1].trim().length > 20) {
    storySynopsis = storyMatch[1].trim();
  }

  // 2. Characters Roster (can appear before or after scenes)
  let charactersRoster: string | null = null;
  const rosterMatch = clean.match(
    /(?:LEVANTAMENTO DE PERSONAGENS|LEVANTAMENTO COMPLETO DE TODOS OS PERSONAGENS|AUDITORIA DE PERSONAGENS|AUDITORIA COMPLETA DE TODOS OS PERSONAGENS|IDENTIFICAÇÃO DE TODOS OS PERSONAGENS)[^\n:]*:\s*\n?([\s\S]*?)(?=(?:MASTER CHARACTER IDENTIT|ETAPA \d+:|PROMPT MODEL SHEET|PROMPT 00|PROMPT GANCHO|PROMPT CENA|---SEO-START---|$))/i,
  );
  if (rosterMatch && rosterMatch[1].trim().length > 10) {
    charactersRoster = rosterMatch[1].trim();
  }

  // 3. Master Character Identities
  const masterIdentities: MasterIdentity[] = [];
  const identityRegex =
    /(?:^|\n)\s*(?:MASTER CHARACTER IDENTITY|IDENTIDADE MESTRE)\s*[—\-–:]\s*([^\n:]+):?\s*([\s\S]*?)(?=(?:\n\s*(?:MASTER CHARACTER IDENTITY|IDENTIDADE MESTRE|PROMPT MODEL SHEET|CHARACTER MODEL SHEET|PROMPT 00|PROMPT GANCHO|PROMPT CENA)|$))/gi;
  for (const m of clean.matchAll(identityRegex)) {
    const rawName = (m[1] || '').trim().replace(/^\[|\]$/g, '').trim();
    const details = (m[2] || '').trim();
    if (rawName && details) {
      const roleMatch = details.match(/(?:Papel dram[aá]tico|Papel na novela|Papel|Role)\s*:\s*([^\n]+)/i);
      const existingIdx = masterIdentities.findIndex(
        (id) => id.characterName.toLowerCase() === rawName.toLowerCase(),
      );
      if (existingIdx >= 0) {
        if (details.length > masterIdentities[existingIdx].details.length) {
          masterIdentities[existingIdx] = {
            characterName: rawName,
            role: roleMatch ? roleMatch[1].trim() : masterIdentities[existingIdx].role,
            details,
          };
        }
      } else {
        masterIdentities.push({
          characterName: rawName,
          role: roleMatch ? roleMatch[1].trim() : null,
          details,
        });
      }
    }
  }

  // 4. Individual Character Model Sheets (pure white background, 6 body angles + 3 facial close-ups)
  const modelSheets: CharacterModelSheet[] = [];
  const modelSheetRegex =
    /(?:^|\n)\s*(?:PROMPT\s+MODEL\s+SHEET|CHARACTER\s+MODEL\s+SHEET)\s*[—\-–]\s*([^\n\(:–—]+)(?:\s*\([^)]*\))?:?\s*([\s\S]*?)(?=(?:\n\s*(?:PROMPT\s+MODEL\s+SHEET|CHARACTER\s+MODEL\s+SHEET|PROMPT 00|PROMPT GANCHO|PROMPT CENA|---SEO-START---)|$))/gi;
  for (const m of clean.matchAll(modelSheetRegex)) {
    const rawName = (m[1] || '').trim().replace(/^\[|\]$/g, '').trim();
    const promptContent = (m[2] || '').trim();
    if (rawName && promptContent) {
      const matchingIdentity = masterIdentities.find(
        (id) =>
          id.characterName.toLowerCase() === rawName.toLowerCase() ||
          id.characterName.toLowerCase().includes(rawName.toLowerCase()) ||
          rawName.toLowerCase().includes(id.characterName.toLowerCase()),
      );
      const existingIdx = modelSheets.findIndex(
        (s) => s.characterName.toLowerCase() === rawName.toLowerCase(),
      );
      if (existingIdx >= 0) {
        if (promptContent.length > modelSheets[existingIdx].prompt.length) {
          modelSheets[existingIdx] = {
            characterName: rawName,
            role: matchingIdentity?.role || modelSheets[existingIdx].role,
            prompt: promptContent,
            masterIdentity: matchingIdentity?.details || modelSheets[existingIdx].masterIdentity,
          };
        }
      } else {
        modelSheets.push({
          characterName: rawName,
          role: matchingIdentity?.role || null,
          prompt: promptContent,
          masterIdentity: matchingIdentity?.details || null,
        });
      }
    }
  }

  // 5. Sequential scene prompt blocks
  const promptBlocks = parsePromptBlocks(clean);

  return {
    storySynopsis,
    charactersRoster,
    masterIdentities,
    modelSheets,
    promptBlocks,
  };
};

const visualOnlyText = (text: string) =>
  cleanText(text)
    .replace(/^\s*(?:QUEM FALA|SPEAKER|WHO SPEAKS|PERSONAGEM|QUIÉN HABLA|PERSONAJE|QUI PARLE)[^\n:]*:[^\n]*\n?/gim, '')
    .replace(/^\s*(?:TOM E INTENÇÃO DA FALA|TONE OF VOICE|TONE|TOM DA FALA|TONO DE VOZ|TONO|TON DE VOIX)[^\n:]*:[^\n]*\n?/gim, '')
    .replace(/^\s*(?:DIÁLOGO REAL|DIÁLOGO|FALA REAL|FALA PRINCIPAL|FALA|REAL DIALOGUE|DIÁLOGO SUGERIDO|SUGGESTED DIALOGUE|DIALOGUE|LINE|PARLAMENTO)[^\n:]*:[^\n]*\n?/gim, '')
    .replace(/^\s*(?:QUEM RESPONDE|REPLY SPEAKER|RESPONSE FROM|QUIÉN RESPONDE|QUI RÉPOND)[^\n:]*:[^\n]*\n?/gim, '')
    .replace(/^\s*(?:RESPOSTA|REPLY|RESPONSE|RESPUESTA|RÉPLIQUE)[^\n:]*:[^\n]*\n?/gim, '')
    .replace(/^\s*(?:INSTRUÇÕES VISUAIS\s*\([^)]*\)|INSTRUÇÕES VISUAIS|INSTRUÇÃO VISUAL|VISUAL INSTRUCTIONS)[^\n:]*:\s*\n?/gim, '')
    .trim();

const loadHistory = (): HistoryItem[] => {
  try {
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
  } catch {
    localStorage.removeItem(historyKey);
    return [];
  }
};

const Novelinhas: React.FC = () => {
  const [theme, setTheme] = useState('Dramas Emocionantes');
  const [customThemeTitle, setCustomThemeTitle] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [tone, setTone] = useState(tones[0]);
  const [emotion, setEmotion] = useState('Empatia');
  const [skinRealism, setSkinRealism] = useState('ultimate');
  const [scenes, setScenes] = useState(6);
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPartTwo, setIsPartTwo] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [playingDialogueIndex, setPlayingDialogueIndex] = useState<number | null>(null);
  const [generatedIdeasMap, setGeneratedIdeasMap] = useState<Record<string, string[]>>({});
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideaToast, setIdeaToast] = useState('');

  const effectiveTheme = theme === 'Outro' ? customThemeTitle.trim() || 'Tema personalizado' : theme;
  const canGenerate = useMemo(
    () => !loading && (theme !== 'Outro' || customThemeTitle.trim().length > 2),
    [customThemeTitle, loading, theme],
  );
  const [promptsPart, seoPart = ''] = result.split(/---SEO-START---/i);
  const parsedScript = useMemo(() => parseFullScript(promptsPart || ''), [promptsPart]);
  const promptBlocks = parsedScript.promptBlocks;
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'models' | 'scenes' | 'story'>('all');
  const [expandedMasterId, setExpandedMasterId] = useState<Record<string, boolean>>({});

  const toggleMasterIdentity = (charName: string) => {
    setExpandedMasterId((prev) => ({ ...prev, [charName]: !prev[charName] }));
  };

  const copyAllModelSheets = () => {
    if (!parsedScript.modelSheets.length) return;
    const combined = parsedScript.modelSheets
      .map(
        (sheet, i) =>
          `================================================================================\n` +
          `CHARACTER MODEL SHEET ${i + 1}: ${sheet.characterName.toUpperCase()}${sheet.role ? ` (${sheet.role})` : ''}\n` +
          `FUNDO BRANCO PURO (#FFFFFF) • 6 ÂNGULOS DE CORPO INTEIRO + 3 RETRATOS FACIAIS\n` +
          `================================================================================\n\n` +
          (sheet.masterIdentity ? `MASTER CHARACTER IDENTITY:\n${sheet.masterIdentity}\n\n` : '') +
          `PROMPT INDEPENDENTE DE IMAGEM:\n${sheet.prompt}\n`,
      )
      .join('\n\n');
    copyToClipboard('all-model-sheets', combined);
  };

  useEffect(() => {
    setHistory(loadHistory());

    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (!savedDraft) return;

      const draft = JSON.parse(savedDraft);

      if (typeof draft.theme === 'string') setTheme(draft.theme);
      if (typeof draft.customThemeTitle === 'string') setCustomThemeTitle(draft.customThemeTitle);
      if (typeof draft.country === 'string') setCountry(draft.country === 'EUA' ? 'Estados Unidos' : draft.country);
      if (typeof draft.tone === 'string') setTone(draft.tone);
      if (typeof draft.emotion === 'string') setEmotion(draft.emotion);
      if (typeof draft.skinRealism === 'string') setSkinRealism(draft.skinRealism);
      if (typeof draft.context === 'string') setContext(draft.context);
      if (typeof draft.result === 'string') setResult(draft.result);
      if (typeof draft.scenes === 'number') setScenes(Math.min(60, Math.max(4, draft.scenes)));
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, []);

  useEffect(() => {
    const draft = {
      theme,
      customThemeTitle,
      country,
      tone,
      emotion,
      skinRealism,
      scenes,
      context,
      result,
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [theme, customThemeTitle, country, tone, emotion, skinRealism, scenes, context, result]);

  const saveHistory = (text: string) => {
    const nextItem: HistoryItem = {
      id: crypto.randomUUID(),
      theme: effectiveTheme,
      country,
      scenes,
      text,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [nextItem, ...history].slice(0, 40);
    setHistory(nextHistory);
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
  };

  const copyToClipboard = async (key: string, text: string) => {
    if (!text) return;

    await navigator.clipboard.writeText(cleanText(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2200);
  };

  const downloadScriptTxt = () => {
    if (!result) return;
    const element = document.createElement('a');
    const file = new Blob([cleanText(result)], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `roteiro-${effectiveTheme.toLowerCase().replace(/\s+/g, '-')}-${scenes}cenas.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleGenerateMoreIdeas = async () => {
    if (isGeneratingIdeas) return;
    setIsGeneratingIdeas(true);
    setIdeaToast('IA criando 5 novas ideias virais...');
    try {
      const { data: ideasSession } = await supabase.auth.getSession();
      const ideasToken = ideasSession?.session?.access_token || '';
      const response = await fetch('/api/agents/novelinhas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ideasToken}`,
        },
        body: JSON.stringify({
          action: 'generate-ideas',
          theme: effectiveTheme,
          country,
          count: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(await describeHttpError(response, 'Falha ao gerar novas ideias.'));
      }

      const data = await response.json();
      if (data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
        setGeneratedIdeasMap((prev) => ({
          ...prev,
          [effectiveTheme]: [...data.ideas, ...(prev[effectiveTheme] || [])],
        }));
        setIdeaToast('✨ 5 novas ideias geradas pela IA!');
        setTimeout(() => setIdeaToast(''), 3000);
      }
    } catch (err) {
      console.error('Error generating ideas:', err);
      // Smart creative fallback
      const fallbacks = [
        `Um dilema inesperado no tema ${effectiveTheme} onde um gesto humilde desmascara a hipocrisia de um rival perante todos.`,
        `Uma reviravolta tocante onde o protagonista de ${effectiveTheme} descobre que seu maior opositor era, na verdade, alguém protegendo sua família.`,
        `Um teste de integridade decisivo dentro de ${effectiveTheme} que ensina uma lição inesquecível de empatia e reconciliação.`,
        `Um sacrifício silencioso no universo de ${effectiveTheme} que é descoberto no momento crucial e comove toda a comunidade.`,
      ];
      setGeneratedIdeasMap((prev) => ({
        ...prev,
        [effectiveTheme]: [...fallbacks, ...(prev[effectiveTheme] || [])],
      }));
      setIdeaToast('✨ Novas ideias adicionadas!');
      setTimeout(() => setIdeaToast(''), 3000);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handlePickRandomIdea = () => {
    const list = [
      ...(generatedIdeasMap[effectiveTheme] || []),
      ...(themeQuickIdeas[effectiveTheme] || themeQuickIdeas[theme] || defaultIdeas),
    ];
    if (list.length === 0) return;
    const randomIndex = Math.floor(Math.random() * list.length);
    const chosen = list[randomIndex];
    setContext(chosen);
    setIdeaToast('🎲 Ideia sorteada aplicada!');
    setTimeout(() => setIdeaToast(''), 2800);
  };

  const speakDialogue = (block: PromptBlock, index: number) => {
    if (!('speechSynthesis' in window)) return;

    if (playingDialogueIndex === index) {
      window.speechSynthesis.cancel();
      setPlayingDialogueIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const lang = localeMap[country] || 'pt-BR';
    const textToSpeak = block.dialogue || '';
    if (!textToSpeak) return;

    const utterance1 = new SpeechSynthesisUtterance(textToSpeak);
    utterance1.lang = lang;
    utterance1.rate = 1.0;
    utterance1.pitch = 1.0;

    if (block.replyDialogue) {
      const utterance2 = new SpeechSynthesisUtterance(block.replyDialogue);
      utterance2.lang = lang;
      utterance2.rate = 1.0;
      utterance2.pitch = 0.92;

      utterance1.onend = () => {
        window.speechSynthesis.speak(utterance2);
      };

      utterance2.onend = () => {
        setPlayingDialogueIndex(null);
      };
      utterance2.onerror = () => {
        setPlayingDialogueIndex(null);
      };
    } else {
      utterance1.onend = () => {
        setPlayingDialogueIndex(null);
      };
    }

    utterance1.onerror = () => {
      setPlayingDialogueIndex(null);
    };

    setPlayingDialogueIndex(index);
    window.speechSynthesis.speak(utterance1);
  };

  const resetGenerator = () => {
    setResult('');
    setError('');
    setCopiedKey('');
    setIsPartTwo(false);
    localStorage.removeItem(draftKey);
  };

  const deleteHistoryItem = (id: string) => {
    const nextHistory = history.filter((item) => item.id !== id);
    setHistory(nextHistory);
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
  };

  const generateScript = async (previousResult?: string) => {
    if (!canGenerate) return;

    setLoading(true);
    setIsPartTwo(Boolean(previousResult));
    setError('');
    setCopiedKey('');
    if (!previousResult) setResult('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token || 'standalone-token';

      const response = await fetch('/api/agents/novelinhas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'generate',
          theme: effectiveTheme,
          country,
          tone,
          emotion,
          skinRealism,
          scenes,
          context,
          previousStory: previousResult || '',
        }),
      });

      const rawPayload = await response.text();
      let payload: { text?: string; error?: string } = {};

      try {
        payload = rawPayload ? JSON.parse(rawPayload) : {};
      } catch {
        payload = {
          error: rawPayload || 'O servidor respondeu em um formato inesperado. Tente novamente.',
        };
      }

      if (!response.ok) {
        throw new Error(`${payload.error || 'Nao foi possivel gerar os prompts.'} (HTTP ${response.status})`);
      }

      const nextText = payload.text || '';
      const finalText = previousResult
        ? `${result.split(/---SEO-START---/i)[0].trim()}\n\n${nextText}`.trim()
        : nextText;

      setResult(finalText);
      if (finalText) saveHistory(finalText);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar prompts.');
    } finally {
      setLoading(false);
      setIsPartTwo(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white sm:px-8 sm:py-12 lg:px-12">
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            className="h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">Histórico</p>
                <h2 className="text-2xl font-black text-white">Roteiros salvos</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-black text-zinc-300 hover:border-orange-500"
              >
                <X size={18} />
              </button>
            </div>

            {history.length ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-zinc-800 bg-black p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-white">{item.theme}</h3>
                        <p className="text-xs font-bold text-zinc-500">
                          {item.country} • {item.scenes} cenas • {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteHistoryItem(item.id)}
                        className="grid size-9 shrink-0 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResult(item.text);
                          setShowHistory(false);
                        }}
                        className="h-10 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-black uppercase text-white hover:border-orange-500"
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.id, item.text)}
                        className="h-10 flex-1 rounded-xl border border-orange-500/50 bg-orange-500/15 text-xs font-black uppercase text-orange-100"
                      >
                        {copiedKey === item.id ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-black p-8 text-center text-sm font-bold text-zinc-500">
                Os roteiros gerados aparecerão aqui automaticamente.
              </div>
            )}
          </motion.aside>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-7 sm:space-y-10">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-400 sm:px-4 sm:text-[11px] sm:tracking-[0.28em]">
            <Film size={14} />
            Agente Seedance 2.5 • Direção Cinematográfica 4K
          </div>

          <h1 className="mx-auto max-w-5xl text-4xl font-black leading-none text-white sm:text-7xl lg:text-8xl">
            Remix: Novelinhas
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-400 sm:mt-5 sm:text-xl">
            Prompts estruturados no formato oficial do <strong className="text-white">Seedance 2.5 (ByteDance / CapCut)</strong> com Ficha Prompt 00 em fundo branco, consistência total de figurinos e personagens em todas as cenas, áudio nativo e lip-sync.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
              📸 Prompt 00 (Personagens & Cenário Mestre)
            </span>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-bold text-sky-300">
              🏰 Consistência de Cenário (Ambientes 3D Descritos em Cada Cena)
            </span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-300">
              🛡️ Consistência de Personagens (Traços e Figurinos Fixos)
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
              🎬 Flow & Seedance 2.5 (Anti-Fundo Branco Ativo)
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-xs font-black uppercase tracking-wide text-white hover:border-orange-500 transition"
            >
              <Clock size={16} />
              Histórico {history.length ? `(${history.length})` : ''}
            </button>

            {result && (
              <button
                type="button"
                onClick={downloadScriptTxt}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 text-xs font-black uppercase tracking-wide text-orange-200 hover:border-orange-400 transition"
              >
                <Download size={16} />
                Baixar Roteiro (.txt)
              </button>
            )}
          </div>
        </motion.section>

        <section className="space-y-6 sm:space-y-8">
          <div>
            <div className="mb-4 flex items-center gap-3 text-base font-black text-white sm:mb-5 sm:text-lg">
              <Palette size={20} className="text-orange-500 sm:size-[22px]" />
              Selecione o tema
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {themes.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setTheme(item.label)}
                  className={`group flex min-h-16 items-center justify-start gap-2 rounded-2xl border p-3 text-left transition sm:aspect-[1.15] sm:min-h-28 sm:flex-col sm:justify-center sm:gap-3 sm:text-center ${
                    theme === item.label
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_18px_60px_rgba(249,115,22,0.18)]'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900'
                  }`}
                >
                  <span className="shrink-0 text-xl transition group-hover:scale-110 sm:text-2xl">{item.icon}</span>
                  <span
                    className={`text-[10px] font-black uppercase leading-tight tracking-wide sm:text-xs sm:tracking-wider ${
                      theme === item.label ? 'text-orange-300' : 'text-zinc-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {theme === 'Outro' && (
            <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-4 sm:p-5">
              <label className="mb-3 block text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Nome do tema personalizado
              </label>
              <input
                value={customThemeTitle}
                onChange={(event) => setCustomThemeTitle(event.target.value)}
                maxLength={80}
                placeholder="Ex: Herança secreta, mãe desaparecida, vingança silenciosa..."
                className="h-12 w-full rounded-xl border border-orange-500/30 bg-black px-4 text-sm font-black text-white outline-none placeholder:text-zinc-600 focus:border-orange-400"
              />
            </div>
          )}

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                  Tema Selecionado:
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/25 px-2.5 py-0.5 text-xs font-black text-white">
                  {effectiveTheme}
                </span>
              </div>
              {context && (
                <button
                  type="button"
                  onClick={() => setContext('')}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-black uppercase text-red-300 hover:bg-red-500/20 transition"
                  title="Limpar contexto para focar exclusivamente no tema selecionado"
                >
                  Limpar contexto
                </button>
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3 text-base font-black text-white sm:text-lg">
                <WandSparkles size={22} className="text-orange-500" />
                Contexto do vídeo (opcional)
              </label>
              <span className="text-xs text-zinc-500 font-mono">
                {context.length} / 900 caracteres
              </span>
            </div>

            {theme === 'Frutas' && (
              <div className="mb-4 overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-950/40 via-zinc-950 to-black p-4 sm:p-5 shadow-lg">
                <div className="mb-2 flex items-center gap-2 text-pink-300">
                  <span className="text-2xl">🍓</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-pink-300 sm:text-sm">
                      Modo Frutas Humanizadas • Animação 3D Vertical (9:16)
                    </h4>
                    <p className="text-[11px] font-semibold text-pink-200/80">
                      Personagens com corpo de fruta, membros e feições humanas, roupas elegantes fixas e personalidade marcante
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px] font-semibold">
                  <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-2.5">
                    <span className="block font-black text-pink-300">🍓 Moranguinha</span>
                    <span className="text-zinc-400">Protagonista romântica, vestido rosa, sementes douradas</span>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                    <span className="block font-black text-amber-300">🍌 Bananão</span>
                    <span className="text-zinc-400">Playboy carismático, terno amarelo bem cortado</span>
                  </div>
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5">
                    <span className="block font-black text-purple-300">🍇 Uva Vitória</span>
                    <span className="text-zinc-400">Vilã calculista e invejosa, vestido de gala roxo</span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                    <span className="block font-black text-emerald-300">🍎 Maçã / Abacaxi</span>
                    <span className="text-zinc-400">Jovem herdeiro ou leal aliado, alfaiataria elegante</span>
                  </div>
                </div>
              </div>
            )}

            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 sm:text-xs sm:tracking-[0.24em]">
              Adicione detalhes específicos para {effectiveTheme} ou selecione uma ideia rápida abaixo
            </p>

            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={4}
              maxLength={900}
              placeholder={
                theme === 'Frutas'
                  ? 'Ex: Moranguinha (vestido rosa elegante, sementes douradas) confronta seu noivo Bananão (terno amarelo) em um baile de gala ao descobrir a farsa de Uva Vitória...'
                  : theme === 'Deuses Gregos'
                  ? 'Ex: Zeus desce à Terra disfarçado de mendigo em Atenas para testar a compaixão dos mortais...'
                  : theme === 'Roça'
                  ? 'Ex: No sertão, um fazendeiro rico tenta tomar as terras de uma família caipira simples...'
                  : theme === 'Causa Animal e Reviravoltas'
                  ? 'Ex: Um vira-lata caramelo abandonado na chuva salva uma criança e dá uma lição no antigo dono...'
                  : 'Ex: Adicione detalhes específicos sobre os personagens, ambiente ou reviravolta para a história...'
              }
              className="w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-sm font-semibold leading-relaxed text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 sm:p-5 sm:text-base"
            />

            {/* Painel de Ideias Dinâmicas e Botão para Gerar Novas Ideias */}
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                    <Lightbulb size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                      Ideias de enredo para {effectiveTheme}
                    </span>
                    <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                      {(generatedIdeasMap[effectiveTheme]?.length || 0) +
                        (themeQuickIdeas[effectiveTheme] || themeQuickIdeas[theme] || defaultIdeas).length}{' '}
                      opções
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ideaToast && (
                    <span className="animate-pulse rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-300">
                      {ideaToast}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handlePickRandomIdea}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                    title="Sortear uma ideia aleatória para o roteiro"
                  >
                    <Shuffle size={13} />
                    Sortear
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateMoreIdeas}
                    disabled={isGeneratingIdeas}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-orange-500/60 bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-3 text-xs font-black text-orange-200 transition hover:border-orange-400 hover:from-orange-500/30 hover:to-amber-500/30 disabled:opacity-50"
                    title="Usar IA para gerar 5 ideias inéditas para este tema"
                  >
                    {isGeneratingIdeas ? (
                      <Loader2 size={13} className="animate-spin text-orange-400" />
                    ) : (
                      <WandSparkles size={13} className="text-orange-400" />
                    )}
                    {isGeneratingIdeas ? 'Criando ideias...' : 'Gerar novas ideias com IA'}
                  </button>

                  {context.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setContext('')}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
                      title="Limpar contexto do roteiro"
                    >
                      <X size={13} /> Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Cards de ideias com visualização e seleção */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ...(generatedIdeasMap[effectiveTheme] || []).map((idea, idx) => ({
                    idea,
                    isAiGenerated: true,
                    idx: idx + 1,
                  })),
                  ...(themeQuickIdeas[effectiveTheme] || themeQuickIdeas[theme] || defaultIdeas).map(
                    (idea, idx) => ({
                      idea,
                      isAiGenerated: false,
                      idx: (generatedIdeasMap[effectiveTheme]?.length || 0) + idx + 1,
                    }),
                  ),
                ].map(({ idea, isAiGenerated, idx }) => {
                  const isSelected = context === idea;
                  return (
                    <button
                      key={`${idx}-${idea.slice(0, 30)}`}
                      type="button"
                      onClick={() => {
                        setContext(idea);
                        setIdeaToast(`Ideia ${idx} aplicada ao roteiro!`);
                        setTimeout(() => setIdeaToast(''), 2500);
                      }}
                      className={`group relative flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/15 text-orange-100 ring-2 ring-orange-500/20'
                          : 'border-zinc-800/90 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-orange-400">
                          <span>Ideia {idx}</span>
                          {isAiGenerated && (
                            <span className="rounded border border-amber-500/30 bg-gradient-to-r from-orange-500/30 to-amber-500/30 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                              ✨ Nova
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
                            <Check size={11} /> Ativa
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-400 group-hover:text-zinc-200">
                        {idea}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1fr_1fr_1.15fr]">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                  País e idioma nativo
                </label>
                <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[11px] font-black text-orange-300">
                  {countries.find((c) => c.label === country)?.flag}{' '}
                  {countries.find((c) => c.label === country)?.lang || 'Português'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {countries.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCountry(item.label)}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border p-2.5 text-center transition ${
                      country === item.label
                        ? 'border-orange-500 bg-orange-500/10 text-orange-300 shadow-md shadow-orange-500/20'
                        : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900'
                    }`}
                  >
                    <span className="text-lg">{item.flag}</span>
                    <span className="text-xs font-black leading-tight">{item.label}</span>
                    <span className="text-[10px] font-semibold text-zinc-400">{item.lang}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                Tom do roteiro
              </label>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm font-black text-zinc-100 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              >
                {tones.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                  <SlidersHorizontal size={15} className="text-orange-500" />
                  Quantidade de cenas
                </label>
                <input
                  type="number"
                  min={4}
                  max={60}
                  value={scenes}
                  onChange={(event) => setScenes(Math.min(60, Math.max(4, Number(event.target.value) || 4)))}
                  className="h-10 w-20 rounded-xl border border-zinc-800 bg-black text-center text-xl font-black text-orange-400 outline-none focus:border-orange-500"
                />
              </div>
              <input
                type="range"
                min={4}
                max={60}
                value={scenes}
                onChange={(event) => setScenes(Number(event.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="mt-2 flex justify-between text-[11px] font-bold text-zinc-600">
                <span>4 cenas (Short)</span>
                <span>60 cenas (Episódio Completo)</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                Emoção principal
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {emotions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setEmotion(item.label)}
                    className={`min-h-16 rounded-xl border p-3 text-left transition ${
                      emotion === item.label
                        ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                        : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-1 block text-[11px] font-bold text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                Realismo da pele (Direção Visual)
              </label>
              <div className="grid gap-2">
                {skinLevels.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSkinRealism(item.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      skinRealism === item.value
                        ? 'border-orange-500 bg-orange-500/10 text-orange-200'
                        : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-1 block text-xs font-bold text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-200 shadow-lg shadow-red-950/20">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={20} className="shrink-0 text-red-400" />
                <span className="leading-snug">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => generateScript()}
                disabled={loading}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2 text-xs font-black uppercase text-red-100 hover:bg-red-500/30 transition disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Tentar novamente
              </button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => generateScript()}
              disabled={!canGenerate}
              className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-orange-300/70 bg-orange-500 px-8 text-sm font-black uppercase tracking-wide text-black shadow-[0_18px_60px_rgba(249,115,22,0.28)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 sm:w-auto"
            >
              {loading && !isPartTwo ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {loading && !isPartTwo ? 'Gerando roteiro cinematográfico...' : result ? 'Gerar novo roteiro' : 'Gerar roteiro'}
            </button>

            {result && (
              <button
                type="button"
                onClick={() => generateScript(result)}
                disabled={!canGenerate}
                className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-orange-400/70 bg-orange-500/20 px-8 text-sm font-black uppercase tracking-wide text-orange-100 shadow-[0_14px_45px_rgba(249,115,22,0.14)] transition hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading && isPartTwo ? <Loader2 className="animate-spin" size={20} /> : <Film size={20} />}
                {loading && isPartTwo ? 'Criando parte 2...' : 'Continuar como parte 2'}
              </button>
            )}

            {(result || context) && (
              <button
                type="button"
                onClick={resetGenerator}
                disabled={loading}
                className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-red-400/60 bg-red-500/20 px-8 text-sm font-black uppercase tracking-wide text-red-100 shadow-[0_14px_45px_rgba(239,68,68,0.12)] transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <RotateCcw size={20} />
                Limpar
              </button>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40 sm:p-7">
          {/* Header do Painel de Resultados */}
          <div className="mb-6 flex flex-col items-stretch justify-between gap-3 sm:mb-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 sm:text-xs sm:tracking-[0.24em]">
                Pipeline Cinematográfico & Character Model Sheets
              </p>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                {result
                  ? `${promptBlocks.filter((b) => !b.isPrompt00).length} Cenas • ${parsedScript.modelSheets.length} Model Sheets • Consistência Total`
                  : 'Pronto para gerar'}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {result && (
                <>
                  <button
                    type="button"
                    onClick={downloadScriptTxt}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-xs font-black text-white hover:border-orange-500 transition"
                    title="Baixar roteiro completo em texto (.txt)"
                  >
                    <Download size={15} />
                    Baixar (.txt)
                  </button>

                  {parsedScript.modelSheets.length > 0 && (
                    <button
                      type="button"
                      onClick={copyAllModelSheets}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/15 px-4 text-xs font-black text-amber-200 hover:border-amber-400 hover:bg-amber-500/25 transition"
                      title="Copiar todos os Character Model Sheets dos personagens"
                    >
                      {copiedKey === 'all-model-sheets' ? <Check size={15} /> : <Users size={15} />}
                      {copiedKey === 'all-model-sheets' ? 'Copiado!' : 'Copiar Model Sheets'}
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => copyToClipboard('all', promptsPart)}
                disabled={!result}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-4 text-xs font-black text-white shadow-lg shadow-black/25 transition hover:border-orange-500/60 hover:bg-zinc-800 disabled:opacity-40 sm:w-auto"
              >
                {copiedKey === 'all' ? <Check size={16} /> : <Copy size={16} />}
                {copiedKey === 'all' ? 'Copiado' : 'Copiar Roteiro'}
              </button>
            </div>
          </div>

          {result && (
            <>
              {/* Banner das 6 Etapas Obrigatórias de Produção */}
              <div className="mb-6 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-zinc-950 to-black p-4 sm:p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="text-orange-400 shrink-0" size={20} />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-orange-300 sm:text-sm">
                        Pipeline Canônico de Produção • Model Sheets no Final
                      </h3>
                      <p className="text-[11px] font-semibold text-zinc-400">
                        História e cenas geradas primeiro para mapear 100% dos personagens; Model Sheets gerados no final para garantir que nenhum personagem fique de fora.
                      </p>
                    </div>
                  </div>
                  {parsedScript.modelSheets.length > 0 && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-300">
                      ✓ {parsedScript.modelSheets.length} Model Sheets Gerados
                    </span>
                  )}
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 text-[10px] font-bold">
                  <div className={`rounded-xl border p-2.5 ${parsedScript.storySynopsis ? 'border-orange-500/40 bg-orange-500/10 text-orange-200' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'}`}>
                    <span className="block font-black text-orange-400">1. História</span>
                    <span>{parsedScript.storySynopsis ? 'Definida' : 'Completa'}</span>
                  </div>
                  <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-2.5 text-sky-200">
                    <span className="block font-black text-sky-400">2. Cenário Mestre</span>
                    <span>Escenografia Fixa</span>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${promptBlocks.length > 0 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'}`}>
                    <span className="block font-black text-emerald-400">3. Cenas da História</span>
                    <span>{promptBlocks.filter((b) => !b.isPrompt00).length} Takes 4K</span>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${parsedScript.charactersRoster ? 'border-orange-500/40 bg-orange-500/10 text-orange-200' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'}`}>
                    <span className="block font-black text-orange-400">4. Auditoria Total</span>
                    <span>{parsedScript.charactersRoster ? '100% Personagens' : 'Todos os Papéis'}</span>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${parsedScript.masterIdentities.length > 0 ? 'border-orange-500/40 bg-orange-500/10 text-orange-200' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'}`}>
                    <span className="block font-black text-orange-400">5. Master Identity</span>
                    <span>{parsedScript.masterIdentities.length ? `${parsedScript.masterIdentities.length} Fichas` : 'Canônica'}</span>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${parsedScript.modelSheets.length > 0 ? 'border-amber-500/50 bg-amber-500/15 text-amber-200' : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'}`}>
                    <span className="block font-black text-amber-300">6. Model Sheets (Final)</span>
                    <span>{parsedScript.modelSheets.length ? `${parsedScript.modelSheets.length} em 9 Ângulos` : 'Fundo Branco'}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Navegação por Abas */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('all')}
                  className={`h-9.5 rounded-xl px-3.5 text-xs font-black uppercase transition ${
                    activeViewTab === 'all'
                      ? 'border border-orange-500 bg-orange-500 text-black shadow-md shadow-orange-500/20'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  🌟 Visão Geral Completa
                </button>

                {parsedScript.modelSheets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('models')}
                    className={`inline-flex items-center gap-1.5 h-9.5 rounded-xl px-3.5 text-xs font-black uppercase transition ${
                      activeViewTab === 'models'
                        ? 'border border-amber-400 bg-amber-400 text-black shadow-md shadow-amber-500/20'
                        : 'border border-amber-500/40 bg-amber-500/15 text-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <Users size={14} />
                    Character Model Sheets ({parsedScript.modelSheets.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveViewTab('scenes')}
                  className={`inline-flex items-center gap-1.5 h-9.5 rounded-xl px-3.5 text-xs font-black uppercase transition ${
                    activeViewTab === 'scenes'
                      ? 'border border-orange-500 bg-orange-500 text-black shadow-md shadow-orange-500/20'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <Film size={14} />
                  Cenas de Vídeo ({promptBlocks.filter((b) => !b.isPrompt00).length})
                </button>

                {(parsedScript.storySynopsis || parsedScript.charactersRoster) && (
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('story')}
                    className={`inline-flex items-center gap-1.5 h-9.5 rounded-xl px-3.5 text-xs font-black uppercase transition ${
                      activeViewTab === 'story'
                        ? 'border border-sky-400 bg-sky-400 text-black shadow-md shadow-sky-500/20'
                        : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <BookOpen size={14} />
                    História & Personagens
                  </button>
                )}
              </div>
            </>
          )}

          {/* SEÇÃO: História Completa e Levantamento de Personagens */}
          {(activeViewTab === 'all' || activeViewTab === 'story') &&
            (parsedScript.storySynopsis || parsedScript.charactersRoster) && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 space-y-4"
              >
                {parsedScript.storySynopsis && (
                  <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/30 via-zinc-950 to-black p-5 sm:p-6 shadow-xl">
                    <div className="mb-3 flex items-center justify-between border-b border-sky-500/20 pb-3">
                      <div className="flex items-center gap-2 text-sky-300">
                        <BookOpen size={18} />
                        <h3 className="text-xs font-black uppercase tracking-wider text-sky-300 sm:text-sm">
                          Etapa 1 • História Completa da Novelinha
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('story-synopsis', parsedScript.storySynopsis || '')}
                        className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-sky-200 hover:bg-sky-500/20 transition"
                      >
                        {copiedKey === 'story-synopsis' ? 'Copiado!' : 'Copiar História'}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-200">
                      {parsedScript.storySynopsis}
                    </p>
                  </div>
                )}

                {parsedScript.charactersRoster && (
                  <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5 shadow-lg">
                    <div className="mb-2.5 flex items-center gap-2 text-orange-400">
                      <UserCheck size={18} />
                      <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 sm:text-sm">
                        Etapa 2 • Levantamento Oficial de Todos os Personagens
                      </h4>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs font-medium leading-relaxed text-zinc-300">
                      {parsedScript.charactersRoster}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}

          {/* SEÇÃO OBRIGATÓRIA: Character Model Sheets Individuais (Fundo Branco Puro) */}
          {(activeViewTab === 'all' || activeViewTab === 'models') &&
            parsedScript.modelSheets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 space-y-5"
              >
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-black p-5 sm:p-6 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-500/25 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-400/40">
                            Etapa Final • Todos os Personagens
                          </span>
                          <span className="text-[11px] font-bold text-zinc-400">
                            Fundo Branco Puro #FFFFFF • Sem Cenário
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-black text-white sm:text-lg">
                          Character Model Sheets Individuais ({parsedScript.modelSheets.length} Personagens da História)
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-300">
                          Referência visual oficial gerada no final da história para <strong>todos os personagens que apareceram na trama</strong> nos <strong>6 ângulos de corpo inteiro</strong> (frontal, 3/4 frontal, perfis, 3/4 traseiro, costas) + <strong>3 retratos faciais</strong>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={copyAllModelSheets}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/70 bg-amber-500/25 px-4 text-xs font-black uppercase tracking-wider text-amber-100 hover:bg-amber-500/35 transition shadow-lg"
                    >
                      {copiedKey === 'all-model-sheets' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedKey === 'all-model-sheets' ? 'Todos Copiados!' : 'Copiar Todos os Model Sheets'}
                    </button>
                  </div>

                  {/* Checklist dos 9 Ângulos Obrigatórios */}
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-black/50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">
                      📐 Ângulos Canônicos Obrigatórios em Cada Model Sheet:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 text-[10px] font-semibold text-zinc-300">
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> 1. Corpo Frontal
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> 2. Corpo 3/4 Frontal
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> 3. Perfil Esquerdo
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> 4. Perfil Direito
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> 5. Corpo 3/4 Traseiro
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> 6. Vista Traseira
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-amber-400 shrink-0" /> 7. Rosto Frontal
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-amber-400 shrink-0" /> 8. Rosto 3/4
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-900/80 px-2 py-1 border border-zinc-800">
                        <CheckCircle2 size={11} className="text-amber-400 shrink-0" /> 9. Rosto Perfil
                      </span>
                      <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 border border-emerald-500/30 text-emerald-300 font-bold">
                        🛡️ Zero Mutação
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cards Individuais de Cada Personagem */}
                <div className="grid gap-5">
                  {parsedScript.modelSheets.map((sheet, idx) => {
                    const sheetKey = `modelsheet-${idx}`;
                    const uniqueCharKey = `${sheet.characterName}-${idx}`;
                    const isExpanded = Boolean(expandedMasterId[uniqueCharKey] || expandedMasterId[sheet.characterName]);

                    return (
                      <article
                        key={`modelsheet-card-${uniqueCharKey}`}
                        className="rounded-2xl border border-amber-500/30 bg-zinc-950 p-5 shadow-xl transition hover:border-amber-400/60"
                      >
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/15 text-lg font-black text-amber-300">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-black text-white sm:text-lg">
                                  {sheet.characterName}
                                </h4>
                                {sheet.role && (
                                  <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-orange-300 border border-orange-500/30">
                                    {sheet.role}
                                  </span>
                                )}
                                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                                  Fundo Branco Puro • 9 Ângulos
                                </span>
                              </div>
                              <p className="text-xs text-zinc-400 font-semibold">
                                Character Turnaround Sheet para Midjourney / Flux / Ideogram / Google Flow Ingrediente
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {sheet.masterIdentity && (
                              <button
                                type="button"
                                onClick={() => toggleMasterIdentity(uniqueCharKey)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-black uppercase text-zinc-300 hover:border-amber-400 hover:text-white transition"
                              >
                                <User size={13} className="text-amber-400" />
                                {isExpanded ? 'Ocultar Identidade Mestre' : 'Ver Identidade Mestre'}
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => copyToClipboard(sheetKey, sheet.prompt)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500/20 px-3.5 py-2 text-xs font-black uppercase text-amber-200 hover:bg-amber-500/30 transition shadow-md"
                            >
                              {copiedKey === sheetKey ? <Check size={14} /> : <Copy size={14} />}
                              {copiedKey === sheetKey ? 'Copiado!' : 'Copiar Model Sheet'}
                            </button>
                          </div>
                        </div>

                        {/* Identidade Mestre Expansível */}
                        {sheet.masterIdentity && isExpanded && (
                          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                                🧬 Master Character Identity — Características Físicas e Figurino Fixo Canônico
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`id-${idx}`, sheet.masterIdentity || '')}
                                className="text-[10px] font-bold uppercase text-amber-300 hover:underline"
                              >
                                {copiedKey === `id-${idx}` ? 'Copiado!' : 'Copiar Ficha'}
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-xs font-medium leading-relaxed text-zinc-200">
                              {sheet.masterIdentity}
                            </pre>
                          </div>
                        )}

                        {/* Bloco de Código do Prompt do Model Sheet */}
                        <div className="rounded-xl border border-zinc-800 bg-black p-3.5 sm:p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                              Prompt Fotográfico de Turnaround Sheet (Pure White Background)
                            </span>
                            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                              Hasselblad • 8K Textures
                            </span>
                          </div>
                          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-zinc-200 sm:text-[12.5px]">
                            {sheet.prompt}
                          </pre>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </motion.div>
            )}

          {/* SEÇÃO: Cenas de Vídeo Sequenciais (Seedance 2.5 & Google Flow) e Prompt 00 */}
          {result && promptBlocks.length > 0 && (activeViewTab === 'all' || activeViewTab === 'scenes') ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <Film size={18} />
                  <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 sm:text-sm">
                    Etapa 6 • Prompts Sequenciais das Cenas (Seedance 2.5 & Google Flow)
                  </h3>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {promptBlocks.filter((b) => !b.isPrompt00).length} Cenas com Diálogos e Áudio Nativo
                </span>
              </div>

              {promptBlocks.map((block, index) => {
                const blockText = `${block.title}\n${block.content}`;
                const key = `prompt-${index}`;
                const visualOnly = visualOnlyText(block.content);

                return (
                  <motion.article
                    key={`${block.title}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group relative rounded-2xl border p-4 transition sm:p-6 ${
                      block.isPrompt00
                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-zinc-950 to-black hover:border-amber-400/60 shadow-xl shadow-amber-950/20'
                        : 'border-zinc-700 bg-black/45 hover:border-orange-500/40 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div
                      className={`absolute bottom-5 left-[-4px] top-5 w-1 rounded-full transition ${
                        block.isPrompt00
                          ? 'bg-amber-400 group-hover:bg-amber-300'
                          : 'bg-orange-500/50 group-hover:bg-orange-400'
                      }`}
                    />

                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] ${
                            block.isPrompt00
                              ? 'border border-amber-400/40 bg-amber-400/20 text-amber-200'
                              : 'bg-orange-500/10 text-orange-400'
                          } sm:tracking-[0.32em]`}
                        >
                          {block.isPrompt00 ? (
                            <>
                              <Camera size={13} className="text-amber-300" />
                              PROMPT 00 • FICHA CONJUNTA & CENÁRIO MESTRE
                            </>
                          ) : (
                            block.title
                          )}
                        </span>
                        <h3 className="text-sm font-black text-zinc-400">
                          {block.isPrompt00
                            ? 'Lineup Conjunto de Personagens & Escenografia Mestre (Seedance Reference)'
                            : `Segmento cinematográfico ${index} • ~4 a 6 segundos`}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {block.isPrompt00 ? (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(key, blockText)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/70 bg-amber-500/20 px-4 text-[11px] font-black uppercase tracking-wider text-amber-100 shadow-lg shadow-black/25 transition hover:bg-amber-500/30 sm:w-auto"
                          >
                            {copiedKey === key ? <Check size={14} /> : <Copy size={14} />}
                            {copiedKey === key ? 'Copiado' : 'Copiar Prompt 00 (Fundo Branco)'}
                          </button>
                        ) : (
                          <>
                            {(block.dialogue || block.speaker) && (
                              <button
                                type="button"
                                onClick={() => speakDialogue(block, index)}
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-[11px] font-black uppercase text-zinc-300 hover:border-orange-500 hover:text-white transition"
                                title="Ouvir atuação da fala"
                              >
                                {playingDialogueIndex === index ? (
                                  <>
                                    <VolumeX size={14} className="text-orange-400" />
                                    Parar
                                  </>
                                ) : (
                                  <>
                                    <Volume2 size={14} />
                                    Ouvir atuação
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => copyToClipboard(`visual-${index}`, visualOnly)}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-orange-500/50 bg-orange-500/10 px-3.5 text-[11px] font-black uppercase text-orange-200 hover:border-orange-400 hover:bg-orange-500/20 transition"
                              title="Copiar prompt de vídeo formatado com comandos anti-fundo branco para Google Flow Ingredientes e Seedance 2.5"
                            >
                              {copiedKey === `visual-${index}` ? <Check size={14} /> : <Copy size={14} />}
                              Copiar Flow / Seedance
                            </button>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(key, blockText)}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-[11px] font-black uppercase tracking-wider text-zinc-300 shadow-lg shadow-black/25 transition hover:border-zinc-500 hover:text-white sm:w-auto"
                            >
                              {copiedKey === key ? <Check size={14} /> : <Clipboard size={14} />}
                              {copiedKey === key ? 'Copiado' : 'Cena completa'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {block.isPrompt00 ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
                          <div className="mb-2 flex items-center gap-2 text-amber-300">
                            <Users size={18} />
                            <h4 className="text-sm font-black uppercase tracking-wide">
                              Lineup de Personagens (Ingredientes do Google Flow & Seedance 2.5)
                            </h4>
                          </div>
                          <p className="text-xs font-semibold leading-relaxed text-zinc-300 sm:text-sm">
                            💡 <strong>Como usar no Google Flow (Ingredientes):</strong> Faça o upload do Model Sheet de cada personagem marcando a opção <strong>"Personagem" (Character Ingredient)</strong>.
                          </p>
                          <div className="mt-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs leading-relaxed text-emerald-200">
                            🛡️ <strong>Consistência Canônica Ativa:</strong> Em todas as cenas abaixo, as características físicas e roupas dos Model Sheets foram integralmente reescritas em <code>[Subject &amp; Character Consistency]</code>, e o fundo branco é 100% substituído pelo ambiente 3D real da história através do <code>[Background Override]</code>!
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
                          <div className="mb-2.5 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 sm:tracking-[0.28em]">
                              Prompt de Imagem (Reference Sheet • Fundo Branco)
                            </p>
                            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                              Fundo Branco Puro • 8K
                            </span>
                          </div>
                          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-zinc-200 sm:text-[13px]">
                            {visualOnly}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <>
                        {(block.dialogue || block.speaker) && (
                          <div className="mb-4 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-zinc-950 to-black p-4 sm:p-5 shadow-lg">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-orange-500/15 pb-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/20 px-2.5 py-1 text-xs font-black uppercase text-orange-200">
                                  <User size={13} className="text-orange-400" />
                                  Quem fala: {block.speaker || 'Personagem principal'}
                                </span>
                                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300 border border-emerald-500/30">
                                  Diálogo Real
                                </span>
                                {block.toneOfVoice && (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                                    <Mic size={12} className="text-orange-400" />
                                    Tom: {block.toneOfVoice}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(`dial-${index}`, block.dialogue || '')}
                                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-300 hover:border-orange-500 hover:text-white transition"
                                >
                                  {copiedKey === `dial-${index}` ? 'Copiado' : 'Copiar Diálogo Real'}
                                </button>
                              </div>
                            </div>

                            {block.dialogue && (
                              <div className="relative pl-3.5 border-l-2 border-orange-500">
                                <p className="text-sm font-black italic leading-relaxed text-white sm:text-base">
                                  “{block.dialogue}”
                                </p>
                              </div>
                            )}

                            {block.replyDialogue && (
                              <div className="mt-3.5 pt-3 border-t border-zinc-800/80">
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                                    <MessageSquare size={12} className="text-orange-400" />
                                    Resposta de: {block.replySpeaker || 'Interlocutor'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(`reply-${index}`, block.replyDialogue || '')}
                                    className="text-[10px] font-bold uppercase text-zinc-400 hover:text-orange-300 transition"
                                  >
                                    {copiedKey === `reply-${index}` ? 'Copiado' : 'Copiar'}
                                  </button>
                                </div>
                                <div className="pl-3.5 border-l-2 border-zinc-600">
                                  <p className="text-xs font-black italic leading-relaxed text-zinc-200 sm:text-sm">
                                    “{block.replyDialogue}”
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {block.environment && (
                          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-zinc-950 to-black p-3.5 sm:p-4 text-xs text-sky-200 shadow-md">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                              <MapPin size={15} />
                            </span>
                            <div className="flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                                  Cenário 3D & Ambientação (Consistência Ativa)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(`env-${index}`, block.environment || '')}
                                  className="text-[10px] font-bold uppercase text-sky-400/80 hover:text-sky-300 transition"
                                >
                                  {copiedKey === `env-${index}` ? 'Copiado' : 'Copiar cenário'}
                                </button>
                              </div>
                              <p className="text-xs font-semibold leading-relaxed text-sky-100/90">
                                {block.environment}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
                          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 sm:tracking-[0.28em]">
                              🎬 Prompt Google Flow & Seedance 2.5 (VEO / ByteDance / CapCut)
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                                🛡️ Anti-Fundo Branco Ativo
                              </span>
                              <span className="rounded bg-orange-500/15 px-2 py-0.5 text-[10px] font-black text-orange-300">
                                4K • Áudio & Lip-Sync
                              </span>
                            </div>
                          </div>
                          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-zinc-300 sm:text-[13px]">
                            {visualOnly}
                          </pre>
                        </div>
                      </>
                    )}
                  </motion.article>
                );
              })}
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-700 bg-black p-5">
                <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300">
                  {cleanText(promptsPart)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-black p-5 text-center text-sm font-semibold leading-relaxed text-zinc-500 sm:p-7">
              <Film size={32} className="mb-3 text-orange-500/60" />
              Os prompts e Character Model Sheets aparecerão aqui.
              <span className="mt-1 text-xs text-zinc-600">
                Escolha o tema, personalize o contexto e clique em Gerar roteiro para criar a história, os Model Sheets em 9 ângulos e as cenas.
              </span>
            </div>
          )}
        </section>

        {seoPart.trim() && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40 sm:p-7">
            <div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 sm:text-xs sm:tracking-[0.24em]">
                  SEO & Engajamento
                </p>
                <h2 className="text-xl font-black text-white sm:text-2xl">Legenda, gatilho e hashtags</h2>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard('seo', seoPart)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-4 text-xs font-black text-white shadow-lg shadow-black/25 transition hover:border-orange-500/60 hover:bg-zinc-800 sm:w-auto"
              >
                {copiedKey === 'seo' ? <Check size={16} /> : <Clipboard size={16} />}
                {copiedKey === 'seo' ? 'Copiado' : 'Copiar SEO'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-2xl border border-zinc-800 bg-black p-4 font-mono text-[11px] leading-6 text-zinc-300 sm:p-5 sm:text-[13px] sm:leading-7">
              {cleanText(seoPart)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
};

export default Novelinhas;
