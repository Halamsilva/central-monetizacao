import React, { useState } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  BookOpen, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Flame,
  Heart,
  UserCheck,
  CheckCheck,
  Info,
  Upload,
  X,
  Image,
  Lock,
  Unlock
} from "lucide-react";
import { 
  LIST_OF_TASKS, 
  RuralTask, 
  CTAS, 
  GeneratedPrompt 
} from "../roca-types";
import { supabase } from "../lib/supabase";

export default function App() {
  // State variables
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState<string>("");
  const [customTask, setCustomTask] = useState<string>("");
  const [preferredCtas, setPreferredCtas] = useState<string[]>([]);
  const [customCtaInput, setCustomCtaInput] = useState<string>("");
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generationMode, setGenerationMode] = useState<"ai" | "local">("ai");
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [characterImage, setCharacterImage] = useState<string>("");
  const [characterImageName, setCharacterImageName] = useState<string>("");
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);

  // For managing editing inside the client UI
  const [editablePrompts, setEditablePrompts] = useState<{ [key: string]: string }>({});

  // Sexy +18 Mode toggle State
  const [isSexy18, setIsSexy18] = useState<boolean>(false);
  const [isPantiesMode, setIsPantiesMode] = useState<boolean>(false);
  const [pantyStyle, setPantyStyle] = useState<string>("romantica");
  const [characterDetails, setCharacterDetails] = useState<string>("");
  const [language, setLanguage] = useState<string>("brasil");

  // Pre-compiled highly provocative/sensual country-girl physical and verbal lines for Sexy Mode +18 offline.
  const OFFLINE_SEXY_LINES: { [key: string]: string[] } = {
    colhendo_milho: [
      "Esse milharal é alto e esconde tudo... se você estivesse aqui no meio das folhas comigo, o que você faria? Me segue de uma vez pra gente se perder...",
      "O sol tá quente no meu corpo e a lida cansa. Se eu tirar essa camisa colada pra refrescar, você promete continuar olhando? Me segue pra ver...",
      "Trabalhando nesse milharal e suando tanto... Queria ver se você aguenta a companhia de uma mulher de roça atrevida. Então me segue."
    ],
    plantando_mandioca: [
      "A terra tá quente e eu tô mexendo nela com carinho... me diz, você gosta de me ver de joelhos plantando assim? Me segue pra me acompanhar de perto.",
      "A lida é pesada e eu fico aqui me curvando toda com esse calor... será que você quer provar do meu mel? Me segue e vem provar.",
      "Minhas mãos estão sujas de terra, mas meu corpo tá ardendo de vontade de ter um companheiro fogoso de verdade. Me segue e fica."
    ],
    tirando_leite: [
      "Achei que você ia gostar de me ver tirando leite bem de perto... o balde tá enchendo de espuma e eu tô ficando acalorada. Me segue pra ver mais.",
      "Com o molejo certo a gente consegue tudo aqui no curral... queria testar esse meu jeito em você. Me segue pra eu saber se você guenta.",
      "Tirando leite logo cedo com essa blusa solta... o calor da roça já tá batendo. Se tiver coragem de vir me ajudar, me segue."
    ],
    cortando_capim: [
      "O capim tá alto e esconde a gente... se você chegar bem perto, eu mordo seu lábio e conto meu segredo. Me segue antes que alguém veja.",
      "Cortando capim com esse sol batendo no peito todo molhado... tá quente demais pra ficar sozinha. Se você for homem de verdade, me segue.",
      "Esse mato esconde cada loucura... queria uma companhia quente pra dividir esse calor comigo hoje. Você se atreve? Me segue."
    ],
    carregando_balde: [
      "Carregando esse balde pesado com a camisa molhada colando no corpo... tá difícil aguentar esse calor sem você por perto. Me segue.",
      "A água do balde tá gelada, mas se encostar em mim ela ferve de tão quente que eu tô. Quer provar? Me segue e vem ver.",
      "Minhas pernas estão molhadas da água do balde e o sol tá batendo forte... queria alguém pra me secar com carinho. Me segue para saber."
    ],
    lavando_roupa: [
      "Lavar roupa nesse tanque deixa minha blusa toda molhada e colada... tá me olhando com esse desejo por que? Me segue e vem ver de perto.",
      "A espuma do sabão escorre pelo meu peito e eu sinto o calor subir. Queria um homem de verdade pra me abraçar por trás agora. Me segue.",
      "Lavar roupa na mão cansa, mas rebolar no seu colo é o que eu queria de verdade hoje. Se você tiver essa audácia... me segue."
    ],
    alimentando_galinhas: [
      "Jogando milho no terreiro com esse shortinho micro... as galinhas não são as únicas querendo um pedaço de mim, né? Me segue pra me ter.",
      "O terreiro tá cheio, mas eu me sinto tão sozinha e necessitada de um carinho safado de roça... Se você for esse homem, me segue.",
      "Olha só como eu me movimento... Cuidar do quintal exige requbrado. Se você gosta de ver, me segue e fica."
    ],
    mexendo_na_terra: [
      "Mexendo nessa terra fértil de joelhos, sentindo o calor subir pelas pernas... será que você seria o homem pra domar essa caipira? Me segue.",
      "Minhas mãos estão na terra úmida, mas minha cabeça tá pensando em coisas bem quentes com você... Quer saber o que é? Me segue.",
      "Preparando a terra com paixão. Queria alguém que soubesse mexer comigo com o mesmo fogo. Se você for esse homem... me segue."
    ],
    plantando_mudas: [
      "Plantar exige carinho e um toque bem suave... exatamente como eu gosto que mexam comigo em quatro paredes. Se você sabe tratar, me segue.",
      "Estou de joelhos plantando e o suor tá escorrendo pelo meu decote... quer vir me limpar com a boca? Se tiver coragem, me segue.",
      "Cuidado com cada detalhe, cada toque na muda... eu faria coisas ainda mais gostosas com você se ficasse aqui. Me segue e fica."
    ],
    carregando_racao: [
      "Carregar esse saco de ração pesado me deixa ofegante e molhada de suor... quer sentir como meu coração tá batendo rápido? Me segue.",
      "O suor corre pelo meu pescoço e decote com o esforço... dizem que mulher da roça é quente, quer testar meu fogo? Me segue e vem.",
      "A lida me deixa cansada, mas na cama eu nunca perco o fôlego. Queria ver se você aguenta o tranco. Me segue… vamos ver se você fica."
    ],
    cuidando_da_horta: [
      "Curvada cuidando dos tomates com esse short jeans super curto... sei que você tá olhando pra trás de mim. Gosta do que vê? Me segue.",
      "Arrancando ervas com carinho... Eu sei exatamente como cuidar do que é meu, principalmente se me der prazer. Se você quer ser meu, me segue.",
      "O sol tá ardendo na minha horta, e eu tô mais quente ainda precisando de um banho de rio com você... quer vir junto? Me segue."
    ],
    trabalhando_curral: [
      "Lidar com gado no curral é um perigo, mas o perigo de verdade sou eu quando decido te provocar de perto. Você aguenta? Me segue.",
      "O curral tá quente, mansas são as vacas, mas eu sou uma leoa selvagem quando quero. Quer tentar me domar? Me segue e vem pro teste.",
      "O suor tá brilhando no meu corpo todo aqui na lida do gado... que tal a gente se refrescar juntos no celeiro? Me segue e me acha."
    ],
    cortando_lenha: [
      "Rachando lenha no sol forte com essa blusa toda molhada e colada... o suor já tá escorrendo pelo meu abdômen inteiro. Tá gostando de olhar? Me segue.",
      "O machado é pesado, mas meu requbrado é forte. Queria ver se você tem força pra me segurar com desejo hoje à noite. Me segue.",
      "Todo mundo me olha de longe amassando essa lenha, mas poucos têm pegada de verdade para me dar o calor que eu preciso. Se você tem, me segue."
    ],
    pescando_rio: [
      "Pescando nesse rio de águas calmas, mas por dentro eu tô fervendo... que tal a gente dar um mergulho sem roupa nenhuma hoje? Me segue.",
      "A água do rio tá batendo na minha coxa molhada e eu tô aqui te esperando com um olhar safado... vai ficar só olhando? Me segue e vem cá.",
      "O pôr do sol tá lindo, mas eu ficaria ainda mais bonita deitada com você sob as estrelas na beira desse rio. Tem coragem? Me segue."
    ],
    trabalhando_sol: [
      "O sol tá queimando forte na minha pele quente de poeira e suor real. Se você me der um copo d'água gelada, eu dou meu corpo inteiro. Me segue.",
      "Trabalhando no sol ardente... o calor da roça me deixa ofegante e com a blusa colada no peito. Vem refrescar meu corpo... me segue.",
      "O calor da roça é forte, mas o meu desejo de ter um homem de verdade me possuindo hoje é ainda maior. Se você quer ser ele, me segue e fica."
    ]
  };

  // Base prompt components for offline fallback assembler
  const SKIN_BOILERPLATE = "realistic natural human skin captured by a regular smartphone camera, sun-exposed uneven skin tone, subtle natural facial oil, slight sweat on forehead and around nose, mild under-eye darkness, natural asymmetry, absolutely no facial hair, no peach fuzz, clean-shaven smooth skin, soft irregular skin texture, slightly rough cheeks from sun and dust, darker tanned neck, realistic calloused dry hands from rural work, visible veins and dirt residue on fingers, visible skin variation without exaggeration, pores only subtly visible at close distance, no skin smoothing, no beauty filter, no retouching, no waxy skin, no plastic skin, no CGI face, no doll-like face, no perfect symmetry, no glamorous skin, no over-sharpening";
  const CAMERA_BOILERPLATE = "shot on a regular mid-range Android smartphone, vertical 9:16, handheld homemade recording, natural auto exposure, slight focus breathing, minor hand shake, normal mobile video compression, realistic smartphone sharpness, strictly no starting face close-up, strictly no starting avatar close-up, do not start with a face zoom or close-up of the character, start directly with a stable medium shot or chest-up framing showing her actively working with her hands and environment visible, no cinematic lens, no studio lighting, no HDR look, no commercial polish, no beauty filter, no studio face, no polished skin, no fashion model face, no wax texture, no plastic face, no artificial symmetry";

  // Pre-compiled high-quality offline spoken lines matching each task, to protect from server shortages
  const OFFLINE_LINES: { [key: string]: string[] } = {
    colhendo_milho: [
      "Queria saber quem aqui teria coragem de entrar nesse milharal comigo e me ajudar na colheita. Se você for diferente… me segue.",
      "O dia tá quente, mas a colheita não para. Será que você aguentaria essa lida do meu lado? Se ainda existir alguém assim, me segue.",
      "Tem muito milho pra colher hoje, mas o que falta mesmo é alguém Divider o silêncio comigo no fim do dia. Então me segue e fica por aqui."
    ],
    plantando_mandioca: [
      "Trabalhar na terra ensina a ter paciência, mas às vezes eu só queria alguém me esperando voltar pra casa. Me segue… vamos ver se você fica.",
      "É debaixo de sol que a gente planta o futuro, mas quase ninguém tem coragem de ficar de verdade na mesma roça. Se você for diferente… me segue.",
      "Minhas mãos estão cheias de terra, mas meu coração tá aberto pra quem quiser somar comigo. Se você for diferente de todos os outros… me segue."
    ],
    tirando_leite: [
      "Acordar antes do sol pra tirar leite é rotina na fazenda, mas queria saber se alguém teria coragem de me fazer companhia. Me segue.",
      "O leite tá quentinho no balde, mas o frio da solidão bate forte às vezes aqui na fazenda. Se você for diferente… me segue.",
      "Queria saber quem de vocês daria valor a uma mulher de roça humilde que trabalha desde cedo. Então me segue e fica por aqui."
    ],
    cortando_capim: [
      "O capim tá alto e o sol tá forte, mas o trabalho duro não tira meu sorriso. Será que você aguentaria me acompanhar? Me segue.",
      "Tem muita gente que só quer olhar de longe, mas ajudar mesmo na lida pesada ninguém quer. Se você for diferente… me segue.",
      "Cortando de folha em folha, eu fico pensando se ainda existe homem de verdade que queira construir uma vida comigo. Se ainda existir, me segue."
    ],
    carregando_balde: [
      "Carregar esse balde pesado todo dia é lida dura, mas o pior é carregar a saudade de alguém de verdade. Me segue, eu quero saber se você é assim.",
      "Um caminho longo pra buscar água sob o calor do sol... seria mais fácil se você estivesse aqui dividindo esse peso comigo. Se você for assim... me segue.",
      "Tem gente que acha que sou delicada demais pra essa vida, mas eu tenho força pra lutar pelo que quero. Me segue… vamos ver se você fica."
    ],
    lavando_roupa: [
      "Esfregando cada muda de roupa eu fico lavando a alma e pensando se ainda existe alguém leal de verdade por aí. Se você for diferente… me segue.",
      "A água do tanque tá gelada, mas o sol da tarde aquece o peito. Queria alguém que não me abandonasse nessa roça. Então me segue e fica por aqui.",
      "Lavar roupa na mão dá trabalho, mas o carinho que eu tenho pra dar é ainda maior pra quem merecer. Se ainda existir alguém assim, me segue."
    ],
    alimentando_galinhas: [
      "Alimentar esses bichos me lembra que a simplicidade da vida rural é tudo que eu preciso, só falta você pra completar. Me segue pra eu saber.",
      "O terreiro tá cheio de galinhas correndo, mas às vezes tudo o que eu queria era um abraço apertado no fim da tarde. Se você for diferente… me segue.",
      "Cuidar do quintal é simples, mas requer dedicação. Exatamente o que eu procuro em alguém. Então me segue e fica por aqui."
    ],
    mexendo_na_terra: [
      "Preparando esse canteiro eu fico pensando se a gente colhe o amor que planta por aqui. Se você acredita nisso… me segue.",
      "A terra é pura e simples. Queria encontrar alguém simples e verdadeiro assim também. Se você for diferente… me segue.",
      "Minhas mãos estão cheias de terra preta, mas meu peito tá cheio de esperança de encontrar alguém leal. Então me segue e fica."
    ],
    plantando_mudas: [
      "Plantar essa muda é ver a vida crescer do zero. Quem sabe o nosso destino também não começa aqui? Se ainda existir alguém leal, me segue.",
      "Dizem que quem planta colhe. Eu tô plantando carinho nessa fazenda, e queria saber se você vem colher comigo. Me segue.",
      "Cuidado com cada detalhe, cada folha... eu cuidaria de você exatamente assim se você ficasse. Então me segue e fica por aqui."
    ],
    carregando_racao: [
      "Carregar saco pesado de ração mostra que mulher da roça não tem medo de lida. Mas e você, tem medo de compromisso? Me segue… vamos ver se você fica.",
      "O suor corre pela testa com o peso do trabalho, mas a vontade de vencer é maior. Queria alguém pra somar comigo nessa jornada. Se você for assim... me segue.",
      "A ração tá pesada, mas o coração continua leve na esperança de alguém diferente aparecer. Se você for diferente… me segue."
    ],
    cuidando_da_horta: [
      "Tirando as ervas daninhas pra horta crescer limpa. Às vezes a gente precisa limpar pessoas vazias da vida também. Concorda? Então me segue e fica.",
      "Cuidar da horta ensina muito sobre dedicação diária. Será que você se dedicaria a mim do mesmo jeito? Se você for diferente… me segue.",
      "Olha o verde dessa horta... dá trabalho diário, mas o resultado compensa. Queria alguém pra dividir essa vida humilde. Me segue para eu saber."
    ],
    trabalhando_curral: [
      "Lidar com gado no curral exige coragem, coisa que hoje em dia quase ninguém tem de verdade pra amar alguém. Se você for diferente… me segue.",
      "O curral tá quieto agora, fim de tarde na fazenda... a hora que a solidão mais aperta a gente. Se ainda existir alguém disposto, me segue.",
      "Meu pai sempre fala que a vida ensina quem é de verdade logo no curral da lida. Será que você passaria no teste? Me segue e fica."
    ],
    cortando_lenha: [
      "Cortar lenha sob o sol forte aquece a alma, mas o que eu queria mesmo era alguém pra dividir a lenha e o silêncio do fogão. Se você for diferente... me segue.",
      "O machado é pesado, mas a rotina humilde me traz paz. Queria saber se o seu coração bate no mesmo ritmo dessa roça. Me segue.",
      "Muitos olham minhas fotos bonitas, mas poucos aguentariam me ver na lida diária rachando lenha no sol. Me segue… vamos ver se você fica."
    ],
    pescando_rio: [
      "Esperando o peixe puxar na beira do rio, pensando se ainda existe alguém com paciência para construir algo de verdade hoje em dia. Me segue.",
      "A água do rio corre devagar, lembrando que a vida humilde tem o seu tempo certo. Se você quer desacelerar comigo... me segue e fica.",
      "Uma vara de pescar simples e o pôr do sol na fazenda. Faltou só você aqui do meu lado pra assistir. Se ainda existir alguém assim, me segue."
    ],
    trabalhando_sol: [
      "O sol tá queimando forte na horta e a lida é pesada. Só queria dividir um copo d'água e uma vida inteira com alguém especial. Se for você... me segue.",
      "Trabalhando no sol quente o dia todo... o calor da roça cansa, mas o que dói é a falta de alguém de verdade do lado. Se você for diferente... me segue.",
      "A pele tá quente do sol, com poeira e suor real. Quem vê de fora não entende a simplicidade de quem trabalha com amor. Me segue e fica por aqui."
    ]
  };

  // Select/Deselect rural tasks (Single-Select)
  const handleToggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds([taskId]);
    }
  };

  // Toggle CTAs
  const handleToggleCta = (cta: string) => {
    if (preferredCtas.includes(cta)) {
      setPreferredCtas(preferredCtas.filter(item => item !== cta));
    } else {
      setPreferredCtas([...preferredCtas, cta]);
    }
  };

  // Add custom CTA
  const handleAddCustomCta = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCtaInput.trim()) {
      const cleaned = customCtaInput.trim().toLowerCase();
      if (!CTAS.includes(cleaned) && !preferredCtas.includes(cleaned)) {
        setPreferredCtas([...preferredCtas, cleaned]);
      }
      setCustomCtaInput("");
    }
  };

  // Execute Local offline fallback generator
  const generateOffline = () => {
    setLoading(true);
    setErrorNotice(null);

    // Pick 5 copies of the single chosen task
    let chosenTask: RuralTask;
    const availableTasks = [...LIST_OF_TASKS];

    if (customTask && customTask.trim() !== "") {
      chosenTask = {
        id: "custom",
        name: customTask.trim(),
        clothing: "simple farm clothes",
        environment: "outdoors in a simple rural setting",
        actionEnglish: `performing the custom activity: ${customTask.trim()}`
      };
    } else if (selectedTaskIds.length > 0) {
      chosenTask = availableTasks.find(t => t.id === selectedTaskIds[0]) || availableTasks[0];
    } else {
      // Pick a random task as theme if none selected
      chosenTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
    }

    const tasksToUse = [chosenTask, chosenTask, chosenTask, chosenTask, chosenTask];

    const getOfflineLine = (taskId: string, index: number, isSexy: boolean, lang: string): string => {
      if (lang === "brasil" || !lang) {
        const list = isSexy ? OFFLINE_SEXY_LINES[taskId] : OFFLINE_LINES[taskId];
        return list ? list[index % list.length] : "Frequento a roça todo dia... me segue.";
      }

      const taskNamesEN: Record<string, string> = {
        colhendo_milho: "harvesting corn in the fields",
        plantando_mandioca: "planting cassava in the soil",
        tirando_leite: "milking cows in the early morning",
        cortando_capim: "cutting fresh tall grass",
        carregando_balde: "carrying a heavy water bucket",
        lavando_roupa: "washing clothes in the water tank",
        alimentando_galinhas: "feeding the chickens in the yard",
        mexendo_na_terra: "working the rich soil",
        plantando_mudas: "planting fresh green saplings",
        carregando_racao: "carrying heavy feed bags",
        cuidando_da_horta: "working in the vegetable garden",
        trabalhando_curral: "managing cattle in the corral",
        cortando_lenha: "chopping wood under the hot sun",
        pescando_rio: "fishing by the calm river bank",
        trabalhando_sol: "working hard under the blazing sun"
      };

      const taskNamesES: Record<string, string> = {
        colhendo_milho: "cosechando maíz en el campo",
        plantando_mandioca: "plantando yuca en la tierra",
        tirando_leite: "ordeñando vacas por la mañana",
        cortando_capim: "cortando pasto fresco",
        carregando_balde: "cargando una cubeta pesada de agua",
        lavando_roupa: "lavando ropa en el lavadero",
        alimentando_galinhas: "alimentando a las gallinas en el corral",
        mexendo_na_terra: "trabajando en la tierra fértil",
        plantando_mudas: "plantando pequeños brotes",
        carregando_racao: "cargando sacos pesados de alimento",
        cuidando_da_horta: "cuidando las verduras en el huerto",
        trabalhando_curral: "manejando el ganado en el corral",
        cortando_lenha: "partiendo leña bajo el sol caliente",
        pescando_rio: "pescando junto al río tranquilo",
        trabalhando_sol: "trabajando duro bajo el sol ardiente"
      };

      const taskEN = taskNamesEN[taskId] || "working hard on the farm";
      const taskES = taskNamesES[taskId] || "trabajando duro en el rancho";

      if (isSexy) {
        if (lang === "estados_unidos") {
          const linesSexyEN = [
            `It's so hot while I'm ${taskEN}, and my clothes are sticking to my sweaty skin... are you just gonna stand there and watch? Follow me to get closer.`,
            `Getting my hands dirty here in the fields... I need a real, strong partner to hold me tight tonight. Follow me and see if that's you.`,
            `My body is sweating from the hard farm labor of ${taskEN}... what would you do if we were lost in the fields together? Follow me and find out, darlin'.`,
            `Working up a sweat early in the morning... I can handle the heavy work, but I'm looking for a real man to tame me. Follow me and stay.`,
            `I know you're looking at me in these tiny farm shorts while I'm busy. If you've got the courage to handle this country fire, follow me, y'all.`
          ];
          return linesSexyEN[index % linesSexyEN.length];
        } else {
          const linesSexyES = [
            `Hace tanto calor mientras estoy ${taskES} y mi blusa ya se pegó a mi piel sudada... ¿te vas a quedar ahí mirando, mi amor? Sígueme para verme de cerca.`,
            `Ensuciándome las manos aquí en el campo... necesito un hombre de verdad con mucha fuerza para abrazarme fuerte esta noche. Sígueme.`,
            `Mi cuerpo está sudando por el trabajo duro de ${taskES}... ¿qué harías si nos perdiéramos juntos en la hacienda? Sígueme y entérate, corazón.`,
            `Trabajando bajo el sol caliente, cansada pero con ganas de algo más... ¿tienes el valor de domar a esta ranchera? Sígueme y quédate.`,
            `Sé que me miras con estos shorts tan cortos de mezclilla. Si tienes la pasión para aguantar mi fuego de campo, sígueme.`
          ];
          return linesSexyES[index % linesSexyES.length];
        }
      } else {
        if (lang === "estados_unidos") {
          const linesNormalEN = [
            `Working hard out here ${taskEN}, but sometimes I wish there was someone to keep me company. Follow me to see if you're that special one.`,
            `The sun is so hot, and the day is long on this farm. I just want someone to share the quiet sunset with. Follow me.`,
            `They say a hard-working, simple country girl is hard to find. Do you have what it takes to stand by my side? Follow me.`,
            `Getting my hands dirty ${taskEN}. It's a simple, honest life, but it can get lonely. Follow me and stay a while.`,
            `So many eyes watching me from afar, but so few have the courage to actually be here on the ranch. Follow me and let's see.`
          ];
          return linesNormalEN[index % linesNormalEN.length];
        } else {
          const linesNormalES = [
            `Trabajando duro ${taskES}, pero a veces desearía tener a alguien que me haga compañía. Sígueme si eres tú, corazón.`,
            `El sol está muy caliente en el campo, y el día es largo. Solo quiero con quién compartir el atardecer. Sígueme.`,
            `Dicen que una mujer de campo trabajadora es difícil de encontrar. ¿Tienes lo necesario para estar a mi lado? Sígueme.`,
            `Ensuciándome las manos ${taskES}. El trabajo es duro pero honesto. Sígueme y quédate conmigo en el rancho.`,
            `Muchos ojos me miran de lejos, pero muy pocos tienen el valor de quedarse en mi vida. Sígueme para saber quién es de verdad.`
          ];
          return linesNormalES[index % linesNormalES.length];
        }
      }
    };

    // Pick CTAs and match lines
    const generated = tasksToUse.map((task, index) => {
      const isSexyActive = isSexy18 || isPantiesMode;
      
      // Distribute lines properly based on language and sexiness
      let chosenLine = getOfflineLine(task.id, index, isSexyActive, language);

      // Overwrite CTA if there are preferred ones selected
      if (preferredCtas.length > 0) {
        const selectedCta = preferredCtas[Math.floor(Math.random() * preferredCtas.length)];
        const splitRegex = /me segue|follow me|sígueme/i;
        const phraseBasePart = chosenLine.split(splitRegex)[0].trim();
        const joinWord = phraseBasePart.endsWith("…") || phraseBasePart.endsWith(".") ? "" : " ";
        chosenLine = `${phraseBasePart}${joinWord}${selectedCta}`;
      }

      // Format custom clothing and action strings based on sexy mode
      let localPantiesVariations = [
        "wearing only elegant high-waisted lace panties (calcinha de renda feminina sensível) or micro cheeky underwear bottoms, matching thin wet white crop top without bra clinging to full breasts, wet droplets and sweat on bare belly skin",
        "wearing vintage silk boyshort panties (calcinha de seda retrô de cintura alta) and a completely unbuttoned rustic cotton plaid farm shirt revealing a wet white tank top without bra underneath, belly covered in soft glistening sweat and rustic farm dirt",
        "wearing ultra-cheeky floral French lace panties (calcinha de renda floral cavada), paired with a short knotted crop top shirt that leaves her midriff entirely bare, showing beads of water and dirt smudges on her sun-kissed skin",
        "wearing delicate satin string panties (calcinha de cetim fininha) with thin hip straps, a wet cotton rib-knit tank top clinging tightly to her curves, sweat soaking through the fabric, showing detailed skin texture and messy hair",
        "wearing a delicate lace bralette matching delicate low-rise lace panties (conjunto de lingerie de renda sensível com calcinha baixa), a thin unbuttoned wet farm apron or linen wrap, covered in light field dust and clear sweat drops from hard agricultural work"
      ];

      const styleSel = (pantyStyle || "romantica").toLowerCase();
      if (styleSel === "preta") {
        localPantiesVariations = [
          "wearing only elegant high-waisted black lace panties (calcinha de renda preta de cintura alta) or micro black cheeky underwear bottoms, matching thin wet white crop top without bra clinging to full breasts, wet droplets and sweat on bare belly skin",
          "wearing vintage black silk boyshort panties (calcinha de seda preta retrô) and a completely unbuttoned rustic cotton plaid farm shirt revealing a wet white tank top without bra underneath, belly covered in soft glistening sweat and rustic farm dirt",
          "wearing ultra-cheeky black floral French lace panties (calcinha de renda preta cavada), paired with a short knotted crop top shirt that leaves her midriff entirely bare, showing beads of water and dirt smudges on her sun-kissed skin",
          "wearing delicate black satin string panties (calcinha de cetim preto fininha) with thin hip straps, a wet black cotton rib-knit tank top clinging tightly to her curves, sweat soaking through the fabric, showing detailed skin texture and messy hair",
          "wearing a delicate black lace bralette matching delicate low-rise black lace panties (conjunto de lingerie de renda preta sensível), a thin unbuttoned wet farm apron or linen wrap, covered in light field dust and clear sweat drops from hard agricultural work"
        ];
      } else if (styleSel === "vermelha") {
        localPantiesVariations = [
          "wearing only elegant high-waisted red lace panties (calcinha de renda vermelha de cintura alta) or micro crimson cheeky underwear bottoms, matching thin wet white crop top without bra clinging to full breasts, wet droplets and sweat on bare belly skin",
          "wearing vintage scarlet silk boyshort panties (calcinha de seda vermelha retrô) and a completely unbuttoned rustic cotton plaid farm shirt revealing a wet white tank top without bra underneath, belly covered in soft glistening sweat and rustic farm dirt",
          "wearing ultra-cheeky ruby floral French lace panties (calcinha de renda vermelha cavada e vibrante), paired with a short knotted crop top shirt that leaves her midriff entirely bare, showing beads of water and dirt smudges on her sun-kissed skin",
          "wearing delicate red satin string panties (calcinha de cetim vermelho fininha) with thin hip straps, a wet red cotton rib-knit tank top clinging tightly to her curves, sweat soaking through the fabric, showing detailed skin texture and messy hair",
          "wearing a delicate red lace bralette matching delicate low-rise red lace panties (conjunto de lingerie de renda vermelha sensível), a thin unbuttoned wet farm apron or linen wrap, covered in light field dust and clear sweat drops from hard agricultural work"
        ];
      } else if (styleSel === "branca") {
        localPantiesVariations = [
          "wearing only elegant high-waisted white lace panties (calcinha de renda branca de cintura alta) or micro white cheeky underwear bottoms, matching thin wet white crop top without bra clinging to full breasts, wet droplets and sweat on bare belly skin",
          "wearing vintage white silk boyshort panties (calcinha de seda branca retrô) and a completely unbuttoned rustic cotton plaid farm shirt revealing a wet white tank top without bra underneath, belly covered in soft glistening sweat and rustic farm dirt",
          "wearing ultra-cheeky white floral French lace panties (calcinha de renda branca cavada e delicada), paired with a short knotted crop top shirt that leaves her midriff entirely bare, showing beads of water and dirt smudges on her sun-kissed skin",
          "wearing delicate white satin string panties (calcinha de cetim branco fininha) with thin hip straps, a wet white cotton rib-knit tank top clinging tightly to her curves, sweat soaking through the fabric, showing detailed skin texture and messy hair",
          "wearing a delicate white lace bralette matching delicate low-rise white lace panties (conjunto de lingerie de renda branca sensível), a thin unbuttoned wet farm apron or linen wrap, covered in light field dust and clear sweat drops from hard agricultural work"
        ];
      } else if (styleSel === "micro") {
        localPantiesVariations = [
          "wearing only an ultra-minimalist micro string g-string panty (calcinha fio dental micro de renda sensível) and a tight wet white crop top, highlighting high hip lines and wet droplets of water",
          "wearing cheeky high-cut black string panties (calcinha fio dental preta cavada) with thin side straps, accompanied by an open rustic shirt that shows a wet solid white rib tank underneath, covered in light mud on thighs",
          "wearing an ultra-cheeky crimson lace thong (calcinha fio dental de renda vermelha provocante), paired with a short knotted crop top shirt that leaves her midriff entirely bare, showing beads of water and sweat",
          "wearing a delicate white satin string low-rise thong (calcinha fio dental branca de cetim com tiras finas), a wet cotton rib-knit tank top clinging tightly to her curves",
          "wearing a matching delicate lace bralette and low-rise cheeky string panties (conjunto de micro-calcinha de renda), covered in field dust and sweat drops from hard agricultural work"
        ];
      } else if (styleSel === "oncinha") {
        localPantiesVariations = [
          "wearing only elegant leopard print lace cheeky panties (calcinha de oncinha de renda sensual) matching with a thin wet crop top without bra, wet droplets and sweat on her bare belly",
          "wearing vintage leopard print boyshort underwear bottoms (calcinha de oncinha retrô confortável) and a completely unbuttoned rustic cotton plaid farm shirt revealing a wet white tank top without bra underneath",
          "wearing ultra-cheeky animal print string panties (calcinha de oncinha cavada), paired with a short knotted crop top shirt that leaves her midriff entirely bare, showing beads of water",
          "wearing a delicate leopard pattern satin string panty (calcinha de cetim de oncinha fininha) with thin hip straps, a wet cotton rib-knit tank top clinging tightly to her curves",
          "wearing a matching leopard print bralette and low-rise cheeky leopard print panties (conjunto sensual de oncinha com renda), covered in field dust and clear sweat drops"
        ];
      } else if (styleSel === "esportiva") {
        localPantiesVariations = [
          "wearing only sporty grey ribbed cotton boyshort panties (calcinha boxinho cinza de algodão esportivo ou boxer feminina) with a white elastic waistband, matching tight grey cotton sports bra top without padding, glistening sweat drops on her flat athletic belly",
          "wearing cheeky sport-cut black cotton low-rise underwear brief (calcinha esportiva de algodão preta cavada) with a thick waistband, a loose open rustic plaid shirt displaying her wet grey sports tank top underneath, thighs lightened with field sweat and soil dust",
          "wearing ultra-cheeky athletic cotton cheeky string panties (calcinha de algodão estilo asa delta esportiva), matching raw-cut cotton crop top revealing her sweaty midriff, showing small grass stains and water beads from physical work",
          "wearing seamless sporty black boyshort panties (calcinha esportiva sem costura) showing her active athletic hip stance, a tight crop top clinging to her chest as she works, wet droplets dripping down her stomach",
          "wearing grey cotton classic sports briefs (calcinha clássica de algodão cinza mescla) with a thick cozy band, an unbuttoned wet farm vest worn over her bare upper body revealing her curves and glistening skin"
        ];
      } else if (styleSel === "cetim") {
        localPantiesVariations = [
          "wearing only elegant emerald green luxury silk panties with an incredibly glossy liquid satin finish (calcinha sensual de cetim verde esmeralda super brilhoso), matching emerald green thin satin crop camisole top clinging perfectly with sweat",
          "wearing vintage champagne-colored pure silk boyshort panties (calcinha retrô de seda pura tom champanhe acetinada) and a completely unbuttoned rustic cotton farm shirt showing her bare wet tummy and glossy undergarment",
          "wearing ultra-cheeky ruby red satin string panties with thin satin side-straps (calcinha de cetim vermelho com tiras fininhas laterais), paired with a short knotted thin shirt leaving her smooth glowing skin exposed in natural golden sunlight",
          "wearing delicate gold silk low-rise panties (calcinha fina de seda dourada), a wet thin silk tank top clinging tightly to her wet chest, with beautiful water droplets gleaming on her neck",
          "wearing a matching luxury rose pink satin bralette and low-rise satin string panties (conjunto luxuoso de cetim rosa com brilho suave), covered in a light layer of dust and clear sweat drops from hard manual physical labor"
        ];
      } else if (styleSel === "croche") {
        localPantiesVariations = [
          "wearing only an authentic beige handcrafted rustic yarn crochet bikini bottom (calcinha de biquíni de crochê rústico feito à mão) with delicate side ties, matching a wet hand-knit crochet crop top displaying her beautiful curves and bare sweating torso",
          "wearing rustic cotton-yarn crocheted short-style bikini bottoms (calcinha de crochê estilo shorts rústico) and a completely unbuttoned plaid shirt revealing a thin wet white tank top, skin covered in fine dust and water droplets",
          "wearing an ultra-cheeky colorful handmade crochet string micro-bikini bottom (fio dental minimalista de crochê tecido à mão), paired with a short knotted crop top shirt leaving her midriff entirely bare to the warm rural sun",
          "wearing a delicate white cotton-yarn crochet string thong (calcinha fio dental de crochê delicada branca), a wet sleeveless cotton top clinging heavily to her chest, showing real sweat soaking the rustic fabric",
          "wearing a matching earthy brown organic yarn crochet top and cheeky crochet bikini briefs (conjunto artesanal de crochê rústico de linha grossa), covered in dust and sweat drops from working manually outdoors"
        ];
      } else if (styleSel === "tule") {
        localPantiesVariations = [
          "wearing only an ultra-thin nude skin-colored mesh tulle panty (calcinha invisível de tule cor da pele) that blends seamlessly with her skin, matching white cotton crop top, wet sweat droplets glistening all over her bare midriff",
          "wearing delicate lavender lace-and-mesh tulle boyshort panties (calcinha de tule e renda lilás) and an unbuttoned rustic plaid work shirt revealing her wet skin, glowing under natural warm sunlight",
          "wearing ultra-cheeky black transparent mesh tulle string thong (calcinha fio dental de tule preto), paired with a short knotted crop top, showing wet beads of sweat and light soil marks on her skin",
          "wearing delicate rose pink tulle low-rise string panties with thin hip straps (calcinha de tule rosa com tiras finas), a wet cotton tank top clinging tightly, revealing details of skin texture under the wet fabric",
          "wearing a matching white lace bralette and low-rise cheeky lace panties (conjunto de calcinha e sutiã de renda macia), covered in field dust and tiny sweat drops from hard field chore strain"
        ];
      }

      const clothingText = isPantiesMode 
        ? localPantiesVariations[index % localPantiesVariations.length]
        : isSexy18 
          ? "sensual hot rural outfit or a micro bikini top, wet tight crop top, clinging fabric with glistening sweat, bikini top under unbuttoned farm shirt, short micro denim shorts" 
          : task.clothing;
      
      const actionText = isSexyActive 
        ? `${task.actionEnglish} She is heavily sweating and taking slow deep breaths, breasts moving with her breath, slightly wet and sticky clothing. She stops to lock direct suggestive, provocative eye contact with the camera lens with wet parted lips.`
        : task.actionEnglish;

      let stylingOverride = "";
      if (characterDetails && characterDetails.trim().length > 0) {
        stylingOverride = `, with physical features of a woman described as ${characterDetails.trim()}`;
      }
      if (characterImage && characterImage.trim().length > 0) {
        stylingOverride += `, using the uploaded reference avatar image as an absolute facial and character identity reference, strictly matching the face, hair texture/length/color, facial symmetry, and physical identity of the uploaded photo`;
      }

      const getLangDesc = (lang: string) => {
        if (lang === "estados_unidos") return "exactly as it will be spoken in English: ";
        if (lang === "mexico") return "exactly as it will be spoken in Spanish: ";
        return "exactly as it will be spoken in Brazilian Portuguese: ";
      };

      // Format custom string
      const promptText = `${SKIN_BOILERPLATE}, ${CAMERA_BOILERPLATE}, Young rural Brazilian woman${stylingOverride}, naturally beautiful, curvy body, real and accessible appearance, Brazilian model features, emotionally expressive eyes, Simple rural clothing according to the task being performed: ${clothingText}, Simple humble rural environments only: ${task.environment}, Natural sunlight hitting parts of the body, visible heat, sweat and dust from physical work, The woman must always be actively performing a REAL rural task with true physical labor, manual exertion, getting her hands dirty, showing realistic physical effort and dynamic body movement while working, absolutely not posing like a fashion model, in normal caught-on-camera rustic motion: ${actionText}, Camera fixed or slightly shaky, strictly no starting face zoom, strictly no starting close-up of her avatar or face, do not start with any close-up or face-only framing, start directly with a stable medium shot or chest-up framing showcasing her hands, body, and work environment, Emotional direction: direct eye contact with the camera during pauses, intimate low voice, emotional vulnerability, natural pauses while working. The literal spoken sentence MUST be written inside the prompt ${getLangDesc(language)}"${chosenLine}", 1 second final silence maintaining eye contact with the camera, No music, no subtitles, no text on screen, no emojis`;

      return {
        id: `local-prompt-${index + 1}`,
        task: task.name,
        spokenLine: chosenLine,
        fullPrompt: promptText.replace(/\s+/g, ' ').trim()
      };
    });

    setTimeout(() => {
      setPrompts(generated);
      // Populate editable prompts State
      const editMap: { [key: string]: string } = {};
      generated.forEach(item => {
        editMap[item.id] = item.fullPrompt;
      });
      setEditablePrompts(editMap);
      setLoading(false);
    }, 600);
  };

  // Analyze uploaded image using Gemini Vision on server-side
  const analyzeUploadedImage = async (base64Image: string) => {
    setAnalyzingImage(true);
    setErrorNotice(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Faça login novamente para usar este agente.");
      }

      const response = await fetch("/api/agents/menina-da-roca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "analyze-image", characterImage: base64Image })
      });

      if (!response.ok) {
        let errMsg = "Erro ao analisar a imagem.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data && data.success && data.description) {
        setCharacterDetails(data.description);
      }
    } catch (err: any) {
      console.error("Erro na análise da imagem:", err);
      setErrorNotice(`Aviso: Não conseguimos descrever as feições físicas da imagem automaticamente via IA (${err.message}). Você pode digitar os detalhes manualmente no campo correspondente.`);
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Call Server-Side AI generator
  const handleGenerateAI = async () => {
    setLoading(true);
    setErrorNotice(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Faça login novamente para usar este agente.");
      }

      const response = await fetch("/api/agents/menina-da-roca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "generate-prompts",
          selectedTaskIds,
          customContext,
          preferredCtas,
          isSexy18,
          customTask,
          isPantiesMode,
          characterImage,
          pantyStyle,
          characterDetails,
          language
        })
      });

      if (!response.ok) {
        let errMsg = "Resposta inválida do servidor.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {
          if (response.status === 413) {
            errMsg = "A imagem enviada é muito grande. Reajuste ou use outra imagem.";
          } else {
            errMsg = `Erro HTTP ${response.status} do servidor.`;
          }
        }
        throw new Error(`${errMsg} Verifique as configurações ou a chave nos Secrets.`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.prompts)) {
        setPrompts(data.prompts);
        // Populate editable map
        const editMap: { [key: string]: string } = {};
        data.prompts.forEach((item: GeneratedPrompt) => {
          editMap[item.id] = item.fullPrompt;
        });
        setEditablePrompts(editMap);
      } else {
        throw new Error(data.error || "Formato de retorno inesperado.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(
        `Erro ao gerar prompts com IA: ${err.message}. Ativamos o modo gerador off-line inteligente para você continuar experimentando!`
      );
      // Silent automatic fallback to keep app 100% stable
      generateOffline();
    } finally {
      setLoading(false);
    }
  };

  // Generate button handler based on mode
  const handlePrimaryGenerateAction = () => {
    if (generationMode === "ai") {
      handleGenerateAI();
    } else {
      generateOffline();
    }
  };

  // Copy individual prompt
  const handleCopySingle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Copy all following user's packaging constraints
  const handleCopyAllFormatted = () => {
    // Delivery format requested:
    // "Entregar 5 PROMPTS COMPLETOS em inglês somente com as falas em português do brasil
    // Cada prompt deve ser um único bloco contínuo de texto separado apenas por números
    // Não usar títulos, listas, explicações ou comentários"
    const textToCopy = prompts.map((p, index) => {
      const text = editablePrompts[p.id] || p.fullPrompt;
      return `${index + 1} ${text}`;
    }).join("\n\n");

    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Clear selections
  const handleResetSettings = () => {
    setSelectedTaskIds([]);
    setCustomContext("");
    setCustomTask("");
    setCustomCtaInput("");
    setPreferredCtas([]);
    setIsSexy18(false);
    setIsPantiesMode(false);
    setCharacterImage("");
    setCharacterImageName("");
    setPrompts([]);
    setEditablePrompts({});
    setPantyStyle("romantica");
    setCharacterDetails("");
    setLanguage("brasil");
    setErrorNotice(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 selection:bg-white/10 pb-24 font-sans">
      {/* Header Section */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f27d26] flex items-center justify-center text-black shadow-lg">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                VEO3/SORA <span className="text-[#f27d26]">RuralGen</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                Especialista em Retenção Emocional TikTok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              id="mode-ai-btn"
              onClick={() => {
                setGenerationMode("ai");
                setErrorNotice(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                generationMode === "ai"
                  ? "bg-[#f27d26] text-black shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Inteligente (Gemini IA)
            </button>
            <button
              id="mode-local-btn"
              onClick={() => {
                setGenerationMode("local");
                setErrorNotice(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                generationMode === "local"
                  ? "bg-[#f27d26] text-black shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Instantâneo (Local)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Banner Alert if API issue/fallback occurred */}
        {errorNotice && (
          <div className="mb-6 p-4 rounded-xl bg-[#f27d26]/15 border border-[#f27d26]/30 text-[#f27d26] text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>{errorNotice}</div>
          </div>
        )}

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Settings */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Customizer Settings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#f27d26]"></span>
                  Configurações
                </h2>
                <button 
                  onClick={handleResetSettings}
                  className="text-xs text-[#f27d26] hover:underline"
                >
                  Limpar tudo
                </button>
              </div>

              {/* SELETOR DE IDIOMA */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  Idioma das Falas / Language:
                </label>
                <div id="language-selector" className="grid grid-cols-3 gap-2">
                  {[
                    { id: "brasil", label: "Brasil", flag: "🇧🇷", lang: "Português" },
                    { id: "estados_unidos", label: "EUA", flag: "🇺🇸", lang: "English" },
                    { id: "mexico", label: "México", flag: "🇲🇽", lang: "Español" }
                  ].map((langOpt) => {
                    const isActive = language === langOpt.id;
                    return (
                      <button
                        key={langOpt.id}
                        type="button"
                        id={`lang-btn-${langOpt.id}`}
                        onClick={() => setLanguage(langOpt.id)}
                        className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                          isActive
                            ? "bg-[#f27d26]/10 border-[#f27d26] text-white font-bold"
                            : "bg-black/30 border-white/5 text-slate-400 hover:bg-[#1c1c1c] hover:border-white/10"
                        }`}
                      >
                        <span className="text-lg">{langOpt.flag}</span>
                        <span className="text-[10px] uppercase font-black tracking-wide">{langOpt.label}</span>
                        <span className="text-[8px] opacity-70 font-normal leading-none -mt-0.5">{langOpt.lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAREFAS DE ROÇA MULTI-SELECT */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">
                  Selecione o Tema / Ação Física Principal:
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5 normal-case">
                    Serão gerados 5 prompts com falas e descrições criativas focadas 100% no tema escolhido.
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto p-2 bg-black/40 rounded-lg border border-white/10 custom-scrollbar">
                  {LIST_OF_TASKS.map((task) => {
                    const isChecked = selectedTaskIds.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        id={`task-btn-${task.id}`}
                        onClick={() => handleToggleTask(task.id)}
                        className={`text-left text-xs p-2 rounded transition-all border flex items-center justify-between gap-1.5 ${
                          isChecked
                            ? "bg-[#f27d26] text-black font-bold border-transparent"
                            : "bg-[#161616] hover:bg-[#202020] text-slate-300 border-white/5"
                        }`}
                      >
                        <span className="truncate">{task.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0 text-black stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CAMPO MANUAL PERSONALIZADO DE TAREFA */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">
                  OU Escreva uma Tarefa Personalizada Manual:
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5 normal-case">
                    Se preenchido, gera scripts focados integralmente no que você digitar abaixo.
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="custom-task-input"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="Ex: Espalhando café no terreiro sob o sol ardente..."
                    className="w-full bg-[#121212] border border-white/10 rounded px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f27d26]"
                  />
                  {customTask.trim() && (
                    <button
                      type="button"
                      onClick={() => setCustomTask("")}
                      className="absolute right-3 top-[10px] text-[10px] text-slate-500 hover:text-white uppercase font-bold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {customTask.trim() && (
                  <p className="text-[10px] text-[#f27d26] mt-1.5 italic font-medium flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#f27d26]" />
                    Ativo: esta tarefa manual substituirá as opções de cliques acima!
                  </p>
                )}
              </div>

              {/* CTAs DISPONÍVEIS NA COMPILAÇÃO */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wide">
                  Estilos de Finais (Selecione para fixar):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CTAS.map((cta, idx) => {
                    const isSelected = preferredCtas.includes(cta);
                    return (
                      <button
                        key={idx}
                        id={`cta-btn-${idx}`}
                        className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                          isSelected 
                            ? "bg-[#f27d26] text-black font-bold border-transparent" 
                            : "bg-[#181818] text-slate-400 border-white/10 hover:bg-[#242424]"
                        }`}
                        onClick={() => handleToggleCta(cta)}
                      >
                        "{cta}"
                      </button>
                    );
                  })}
                </div>

                {/* Custom CTA Input */}
                <form onSubmit={handleAddCustomCta} className="flex gap-2">
                  <input
                    type="text"
                    id="custom-cta"
                    placeholder="Adicionar final personalizado..."
                    value={customCtaInput}
                    onChange={(e) => setCustomCtaInput(e.target.value)}
                    className="flex-1 bg-[#121212] border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f27d26]"
                  />
                  <button
                    type="submit"
                    className="bg-[#f27d26] hover:bg-[#d06718] text-black text-xs px-3 py-1.5 rounded font-black uppercase tracking-tight transition-all"
                  >
                    Somar
                  </button>
                </form>
              </div>

              {/* DETALHE EXTRA */}
              <div>
                <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wide" htmlFor="custom-context">
                  Anotações sobre Ambiente / Clima (Opcional):
                </label>
                <textarea
                  id="custom-context"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Ex: Pôr do sol avermelhado na fazenda, poeira de horta real, olhar humilde e tímido..."
                  rows={2}
                  className="w-full bg-[#121212] border border-white/10 rounded p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f27d26]"
                ></textarea>
              </div>

              {/* SELEÇÃO E SUBIDA DE IMAGEM DA PERSONAGEM */}
              <div id="character-image-section" className="border border-white/10 rounded-lg p-3.5 bg-[#141414]/50 space-y-2.5">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Image className="w-4 h-4 text-[#f27d26]" /> 
                  Subir Imagem da Personagem (Opcional):
                </label>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Selecione uma imagem de referência visual. A IA analisará suas feições físicas (cabelo, expressão, etnia) para descrevê-la de forma consistente nos prompts.
                </p>

                {characterImage ? (
                  <div className="flex items-center justify-between gap-3 bg-[#0d0d0d] p-2.5 rounded border border-white/5 relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={characterImage}
                        alt="Personagem Ref"
                        className="w-12 h-12 object-cover rounded border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-white font-bold truncate">
                          {characterImageName || "imagem_enviada.jpg"}
                        </p>
                        <p className="text-[9px] text-[#f27d26] font-medium flex items-center gap-1 mt-0.5">
                          <CheckCheck className="w-3.5 h-3.5 text-[#f27d26]" /> Referência ativa no Modo IA
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="remove-character-img"
                      onClick={() => {
                        setCharacterImage("");
                        setCharacterImageName("");
                      }}
                      className="p-1 px-2 text-[10px] uppercase font-bold text-slate-400 hover:text-red-400 hover:bg-white/5 rounded flex items-center gap-1 transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                ) : (
                  <div 
                    id="character-drag-drop"
                    onClick={() => document.getElementById("character-file-input")?.click()}
                    className="border border-dashed border-white/20 hover:border-[#f27d26]/40 hover:bg-white/[0.01] rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all select-none text-center group"
                  >
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-[#f27d26] transition-transform group-hover:-translate-y-0.5" />
                    <div>
                      <span className="text-[11px] text-slate-300 font-bold group-hover:text-white transition-colors block">
                        Clique para escolher imagem
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        JPEG, PNG, WEBP ou GIF (Consistência Visual)
                      </span>
                    </div>
                    <input
                      type="file"
                      id="character-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCharacterImageName(file.name);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              const imgBase64 = reader.result;
                              setCharacterImage(imgBase64);
                              analyzeUploadedImage(imgBase64);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Características físicas input */}
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#f27d26]" /> Fisionomia / Detalhes da Modelo:
                    </label>
                    {characterImage && (
                      <button
                        type="button"
                        id="reanalyze-image-btn"
                        disabled={analyzingImage}
                        onClick={() => analyzeUploadedImage(characterImage)}
                        className="text-[9px] text-[#f27d26] hover:text-[#d06718] uppercase font-bold flex items-center gap-1 transition-all disabled:opacity-50 select-none cursor-pointer"
                      >
                        <Sparkles className={`w-3 h-3 ${analyzingImage ? "animate-spin" : ""}`} />
                        {analyzingImage ? "Analisando..." : "Analisar com IA"}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      id="character-details"
                      value={characterDetails}
                      onChange={(e) => setCharacterDetails(e.target.value)}
                      placeholder={analyzingImage ? "Analisando imagem enviada via IA..." : "Ex: caipira ruiva com sardas, cabelo longo ondulado, crop top branco..."}
                      className={`w-full bg-[#111111] border text-white placeholder-slate-600 text-xs rounded-lg p-2.5 pr-10 focus:outline-none transition-all font-medium ${
                        analyzingImage ? "border-[#f27d26] animate-pulse text-slate-400" : "border-white/5 focus:border-[#f27d26]/60"
                      }`}
                      disabled={analyzingImage}
                    />
                    {analyzingImage && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 text-[#f27d26] animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal animate-fade-in">
                    {analyzingImage ? "Aguarde, a IA está escaneando a foto para captar a textura do cabelo, etnia e expressão..." : "Manterá a cor de cabelo, roupas e traços físicos idênticos nas descrições de todas as 5 cenas (\x22Siga a descrição da imagem\x22)."}
                  </p>
                </div>

                {/* Info indicator if in local generation mode */}
                {generationMode === "local" && characterImage && (
                  <p className="text-[9px] text-amber-500/80 italic mt-1 leading-normal flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Nota: O processamento de imagem por IA está desativado no Modo Off-line local. Ative o modo "Gerador IA" para obter os detalhes de consistência!
                  </p>
                )}
              </div>

              {/* MODO SEXY +18 TOGGLE */}
              <div 
                id="sexy-mode-container"
                onClick={() => setIsSexy18(!isSexy18)}
                className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
                  isSexy18 
                    ? "bg-red-500/10 border-red-500/40 text-red-400" 
                    : "bg-[#181818] border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded mt-0.5 flex items-center justify-center transition-transform shrink-0 ${
                    isSexy18 ? "bg-red-500 text-black scale-105" : "bg-white/5 text-slate-400"
                  }`}>
                    <Flame className={`w-4 h-4 ${isSexy18 ? "animate-pulse" : ""}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-black uppercase tracking-wider ${isSexy18 ? "text-red-500" : "text-white"}`}>
                        Modo Sexy +18
                      </span>
                      <span className="bg-red-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded leading-none uppercase">
                        HOT
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Roteiros com duplo sentido provocativo, blusas coladas, suor escorrendo e olhares penetrantes de extrema retenção.
                    </p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${
                    isSexy18 ? "bg-red-500" : "bg-neutral-800"
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      isSexy18 ? "transform translate-x-[18px]" : "transform translate-x-[2px]"
                    }`} />
                  </div>
                </div>
              </div>

              {/* MODO CALCINHA TOGGLE */}
              <div 
                id="panties-mode-container"
                onClick={() => setIsPantiesMode(!isPantiesMode)}
                className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
                  isPantiesMode 
                    ? "bg-pink-500/10 border-pink-500/40 text-pink-400" 
                    : "bg-[#181818] border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded mt-0.5 flex items-center justify-center transition-transform shrink-0 ${
                    isPantiesMode ? "bg-pink-500 text-black scale-105" : "bg-white/5 text-slate-400"
                  }`}>
                    <Heart className={`w-4 h-4 ${isPantiesMode ? "scale-110" : ""}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-black uppercase tracking-wider ${isPantiesMode ? "text-pink-500" : "text-white"}`}>
                        Modo Calcinha & Lingerie
                      </span>
                      <span className="bg-pink-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded leading-none uppercase">
                        RETER +
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Força descrições visuais de calcinha de renda sensível, lingeries decoradas, roupas molhadas ou micro biquíni cavado.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {isPantiesMode ? (
                    <span className="flex items-center gap-1 text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded border border-pink-500/20 font-bold animate-pulse">
                      <Unlock className="w-3 h-3" /> ABERTO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-bold">
                      <Lock className="w-3 h-3" /> FECHADO
                    </span>
                  )}
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${
                    isPantiesMode ? "bg-pink-500" : "bg-neutral-800"
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      isPantiesMode ? "transform translate-x-[18px]" : "transform translate-x-[2px]"
                    }`} />
                  </div>
                </div>
              </div>

              {/* CONFIGURAÇÕES EXTRAS DO MODO CALCINHA */}
              {isPantiesMode && (
                <div 
                  id="panties-custom-options" 
                  className="bg-pink-500/[0.02] border border-pink-500/20 rounded-lg p-3.5 space-y-3.5 animate-fadeIn"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-pink-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-400" />
                      Estilo e Cor da Calcinha:
                    </label>
                    <select
                      id="panty-style-select"
                      value={pantyStyle}
                      onChange={(e) => setPantyStyle(e.target.value)}
                      className="w-full bg-[#111111] border border-pink-500/20 text-white text-xs rounded-lg p-2 focus:outline-none focus:border-pink-500/50 font-medium transition-all cursor-pointer"
                    >
                      <option value="romantica">🌹 Romântica (Renda Mista)</option>
                      <option value="preta">🖤 Renda Preta Suprema</option>
                      <option value="vermelha">❤️ Vermelha Fatal (Seda & Renda)</option>
                      <option value="branca">🤍 Branca Delicada / Noiva</option>
                      <option value="micro">🔥 Fio Dental Extremo</option>
                      <option value="oncinha">🐆 Oncinha / Animal Print</option>
                      <option value="esportiva">👟 Esportiva Algodão (Calvin Style)</option>
                      <option value="cetim">✨ Cetim & Seda Luxuosa</option>
                      <option value="croche">🧶 Biquíni de Crochê Rústico</option>
                      <option value="tule">💨 Tule Transparente & Mesh</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Botão de Ação */}
              <button
                id="generate-button"
                onClick={handlePrimaryGenerateAction}
                disabled={loading}
                className={`w-full py-4 px-4 rounded-lg font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2.5 ${
                  loading
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-[#f27d26] text-black hover:bg-[#d06718] hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#f27d26]/10"
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Formatando Roteiros Rurais...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Compilar 5 Prompts Autosuficientes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Prompts output view styled as cinematic output blocks */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {prompts.length === 0 ? (
              /* State Empty display */
              <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center flex flex-col items-center justify-center min-h-[500px] shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#f27d26]/10 border border-[#f27d26]/30 flex items-center justify-center text-[#f27d26] mb-4">
                  <Flame className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight mb-2">
                  Pronto para dominar o Algoritmo do TikTok?
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                  Selecione os trabalhos rurais e gere um pacote completo de 5 roteiros virais e prompts robustos compatíveis com Veo3 e Sora de forma instantânea.
                </p>
                
                <button
                  id="generate-initial-btn"
                  onClick={handlePrimaryGenerateAction}
                  className="bg-white hover:bg-slate-250 text-black px-6 py-3.5 rounded-lg font-black text-xs uppercase tracking-wide transition-all"
                >
                  Sintetizar Lote Inicial
                </button>
              </div>
            ) : (
              /* Populated Prompts display */
              <div className="space-y-6">
                
                {/* Copiar Todos Toolbar formatted cleanly for Sora */}
                <div className="bg-[#151515] p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00ff00] animate-pulse"></span>
                    <span className="text-xs font-bold text-white tracking-wider">
                      LOTE SORA / VEO LISTO PARA COPIA
                    </span>
                  </div>
                  
                  <button
                    id="copy-all-btn"
                    onClick={handleCopyAllFormatted}
                    className="w-full sm:w-auto py-2.5 px-4 bg-[#f27d26] hover:bg-[#d06718] text-black text-xs font-black rounded uppercase transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    {copiedAll ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-black" />
                        Copiado no Formato Sem Listas!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-black" />
                        Copiar Todos (Formatado 1-5)
                      </>
                    )}
                  </button>
                </div>

                {/* Formatted Sora Guidelines Warning */}
                <div className="p-3 bg-[#f27d26]/5 rounded-lg border border-white/10 text-xs text-slate-400 flex items-start gap-2.5">
                  <Info className="w-4.5 h-4.5 text-[#f27d26] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Copie individualmente cada prompt ou use o compilador consolidado. Todos os prompts carregam a modelagem de pele hiper-realista, texturas naturais de smartphones sem filtros comerciais e o script final pronunciado em português integrado.
                  </p>
                </div>

                {/* 5 Prompts Cards Grid */}
                <div className="space-y-4">
                  {prompts.map((prompt, index) => {
                    const currentVal = editablePrompts[prompt.id] || prompt.fullPrompt;
                    return (
                      <div 
                        key={prompt.id} 
                        id={`prompt-card-${index}`}
                        className="bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col"
                      >
                        {/* Title details bar */}
                        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-[#f27d26] text-black flex items-center justify-center text-xs font-mono font-black">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {prompt.task}
                            </span>
                          </div>

                          <button
                            id={`copy-btn-${index}`}
                            onClick={() => handleCopySingle(prompt.id, currentVal)}
                            className="p-1 px-2.5 text-[11px] text-[#f27d26] hover:bg-white/5 rounded transition-all flex items-center gap-1 font-bold uppercase"
                          >
                            {copiedId === prompt.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#00ff00]" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copiar
                              </>
                            )}
                          </button>
                        </div>

                        {/* Speech card block in Portuguese */}
                        <div className="p-4 bg-white/[0.02] border-b border-white/5">
                          <div className="text-[9px] text-[#f27d26] tracking-widest font-mono uppercase font-bold mb-1">
                            Script de Falas Português (TikTok):
                          </div>
                          <p className="text-xs italic text-white leading-relaxed font-serif">
                            {prompt.spokenLine}
                          </p>
                        </div>

                        {/* Deep view prompt in English */}
                        <div className="p-4 flex flex-col gap-2">
                          <div className="text-[9px] text-white/40 tracking-widest font-mono uppercase font-bold">
                            Sora / Veo Creative Prompts (English):
                          </div>
                          <textarea
                            id={`prompt-text-${index}`}
                            value={currentVal}
                            onChange={(e) => {
                              setEditablePrompts({
                                ...editablePrompts,
                                [prompt.id]: e.target.value
                              });
                            }}
                            rows={5}
                            className="bg-[#111111] border border-white/10 rounded p-3 text-xs font-mono text-slate-300 leading-relaxed focus:bg-black focus:outline-none focus:border-[#f27d26] custom-scrollbar"
                          ></textarea>
                          <div className="text-[10px] text-right text-slate-500 italic">
                            Você pode polir ou ajustar a instrução da câmera livremente.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Elegant Dark Analytics Metrics Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#f27d26]/10 border border-[#f27d26]/30 rounded-xl p-4 flex flex-col justify-center shadow-lg">
                    <span className="text-[10px] text-[#f27d26] font-bold uppercase tracking-wider">Gatilho Conversão</span>
                    <span className="text-2xl font-black text-white">Alta Retenção</span>
                  </div>
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-mono">Humor Visual</span>
                    <span className="text-2xl font-black text-[#f27d26]">Orgânico</span>
                  </div>
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-mono">Fidelidade Real</span>
                    <span className="text-2xl font-black text-white">9:16 Veo</span>
                  </div>
                </div>

                {/* Raw continuous stream visualization area */}
                <div className="bg-black border border-white/10 rounded-xl p-6 shadow-sm">
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">
                      Raw Stream Output (Pronto para copiar em lote)
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Cópia direta sem formatação markdown ou títulos. Separado por números de 1 a 5 apenas.
                    </p>
                  </div>

                  <pre className="bg-[#050505] text-[#acbda5] p-4 rounded border border-white/5 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[220px] custom-scrollbar selection:bg-[#f27d26]/30">
                    {prompts.map((p, index) => {
                      const text = editablePrompts[p.id] || p.fullPrompt;
                      return `${index + 1} ${text}`;
                    }).join("\n\n")}
                  </pre>
                </div>

              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
