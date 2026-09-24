export interface RuralTask {
  id: string;
  name: string;
  clothing: string;
  environment: string;
  actionEnglish: string;
}

export interface GeneratedPrompt {
  id: string;
  task: string;
  spokenLine: string;
  fullPrompt: string;
}

export const LIST_OF_TASKS: RuralTask[] = [
  {
    id: "colhendo_milho",
    name: "Colhendo milho",
    clothing: "denim shorts, dirty boots, a tight tank top with sweat and dirt stains",
    environment: "sun-drenched vast cornfield, towering green stalks, dry leaves rustling underfoot",
    actionEnglish: "The woman is actively walking through the towering cornfield, harvesting ears of corn and throwing them into a rustic woven basket on the ground."
  },
  {
    id: "plantando_mandioca",
    name: "Plantando mandioca",
    clothing: "old country clothes, rolled up pants, soiled knees, simple tank top, dirty work boots",
    environment: "tilled brown earthy field, piles of cassava cuttings scattered on the muddy soil",
    actionEnglish: "The woman is squatting on the dirt, using a hand shovel to dig small holes, planting cassava stem cuttings into the soil with her bare, dirt-covered hands."
  },
  {
    id: "tirando_leite",
    name: "Tirando leite da vaca",
    clothing: "simple tank top, dirty denim shorts, rubber farm boots, light sweat marks",
    environment: "rustic wooden milking stable with a cow resting, dusty straw on the floor, morning sunlight",
    actionEnglish: "The woman is sitting on a small wooden stool, squeezing and milking the cow's udder with rhythmic hand movements, directing the fresh milk into a metallic bucket."
  },
  {
    id: "cortando_capim",
    name: "Cortando capim",
    clothing: "old countryside clothes, protective gloves, dirty boots, sleeveless top damp with sweat",
    environment: "lush tall grass clearing next to a wooden fence, bright hot mid-afternoon sun",
    actionEnglish: "The woman is bending down to cut tall grass with a small handheld sickle, bundling the cut grass onto her arm with strength."
  },
  {
    id: "carregando_balde",
    name: "Carregando balde de água",
    clothing: "simple bikini top under old farm shirt, denim shorts, mud-splattered legs and boots",
    environment: "dirt pathway winding between rustic fences, sun-beaten ground",
    actionEnglish: "The woman is carrying a heavy plastic bucket filled with water, walking with a heavy but steady stride, some water slightly splashing over the edge."
  },
  {
    id: "lavando_roupa",
    name: "Lavando roupa no tanque",
    clothing: "simple tank top, shorts, wet fabric clinging to her skin, foam on hands",
    environment: "rustic outdoor washing area under a clay tile roof, wet concrete floor, lush tropical green background",
    actionEnglish: "The woman is vigorously scrubbing a piece of cloth on a rough concrete laundry tub, hand-washing with soap, creating visible white lather and water splashes."
  },
  {
    id: "alimentando_galinhas",
    name: "Alimentando galinhas",
    clothing: "light flowy farm shorts, simple tank top, dusty feet, hair tied loosely",
    environment: "humble countryside yard with a wooden chicken coop, dry leaves, a flock of active chickens running around",
    actionEnglish: "The woman is holding a rustic plastic bowl containing corn grains, throwing handfuls of feed to a crowd of excited chickens pecking the ground around her feet."
  },
  {
    id: "mexendo_na_terra",
    name: "Mexendo na terra",
    clothing: "tight low-cut tank top, dirty denim shorts, bare hands covered in earthy soil",
    environment: "fertile garden bed, rich dark tilled earth, small rustic wooden fence in background",
    actionEnglish: "The woman is kneeling on the damp ground, actively mixing compost and breaking up clumps of dark soil with her fingers, showing visible dirt under her fingernails."
  },
  {
    id: "plantando_mudas",
    name: "Plantando mudas",
    clothing: "simple countryside clothes with sweat and dirt marks, dirty boots",
    environment: "greenhouse or sunny backyard horta, small green seed trays and fresh planting hole",
    actionEnglish: "The woman is gently handling a fragile green plant seedling, putting it into a small hole in the prepared garden bed and patting the surrounding soil down carefully."
  },
  {
    id: "carregando_racao",
    name: "Carregando saco de ração",
    clothing: "tight tank top damp with heavy sweat, rugged pants, dusty farm boots",
    environment: "rustic wooden barn entryway, sacks of feed stacked against the wall, dusty sunlight rays",
    actionEnglish: "The woman is lifting a heavy, dusty woven sack of animal feed onto her shoulder, showing effort and physical strain in her arms and back muscles."
  },
  {
    id: "cuidando_da_horta",
    name: "Cuidando da horta",
    clothing: "denim shorts, simple bikini top, damp forehead, dirt marks",
    environment: "abundant vegetable garden filled with lettuce, cabbage and tomato plants, sun hitting the leaves",
    actionEnglish: "The woman is bending down over green vegetable rows, plucking unwanted weeds from the soil around a tomato vine, sweating in the warm light."
  },
  {
    id: "trabalhando_curral",
    name: "Trabalhando no curral",
    clothing: "dirty denim shorts, rugged leather boots, tank top with sweat and dirt marks",
    environment: "dusty cattle corral enclosed by weathered wooden rails, warm afternoon haze",
    actionEnglish: "The woman is cleaning or adjusting a rustic wooden gate latch in the cattle corral, holding a rough rope, checking on the farm paddock."
  },
  {
    id: "cortando_lenha",
    name: "Cortando lenha",
    clothing: "simple tank top, denim shorts, protective leather gloves, sweat glistening on her collarbone",
    environment: "outdoor woodpile, a massive wooden chopping block, rustic axe, simple clay brick cottage wall",
    actionEnglish: "The woman is swinging a rustic axe downward to split a small log on a wooden cutting block, displaying strength, pausing briefly to wipe her brow."
  },
  {
    id: "pescando_rio",
    name: "Pescando no rio",
    clothing: "shirt tied at her waist, wet denim shorts, muddy bare feet, sun-exposed skin",
    environment: "gently flowing riverbank with muddy soil, dense wild green foliage hanging over the water, sunset glow",
    actionEnglish: "The woman is standing in the shallow mud near the river, holding a simple bamboo fishing rod, watching the water intently, feeling the warm afternoon mist."
  },
  {
    id: "trabalhando_sol",
    name: "Trabalhando no sol forte",
    clothing: "tight tank top heavily marked with sweat, shorts, old sun hat, dusty cheeks",
    environment: "open unshaded rural field under a blazing hot midday sun, dry golden soil",
    actionEnglish: "The woman is wiping heavy sweat from her forehead with her forearm while leaning on a weeding hoe, taking a brief breath before continuing her exhausting physical labor."
  },
  {
    id: "descascando_mandioca",
    name: "Descascando mandioca",
    clothing: "short cotton top, dirty shorts, bare legs, sweat on cheek bones and neck",
    environment: "shady porch of a brick farmhouse, rustic wooden floor covered in peeled skin and white starch powder",
    actionEnglish: "The woman is seated on a low wooden bench, hand-peeling a large cassava root with an old kitchen knife, with piles of white peeled roots around her feet."
  },
  {
    id: "moendo_cana",
    name: "Moendo cana-de-açúcar",
    clothing: "damp tank top, denim shorts, dusty boots, sweat glistening on shoulders and arms",
    environment: "old open wooden mill shed, rustic mechanical iron cane Crusher under weathered roof",
    actionEnglish: "The woman is feeding heavy thick green sugar cane stalks into a rustic manual iron crank-mill, turning the heavy metal wheel with noticeable physical effort, fresh sweet juice flowing into an old jar."
  },
  {
    id: "colhendo_cafe",
    name: "Colhendo café",
    clothing: "simple tank top, rugged worn shorts, hair dirty and tied, a woven wicker basket strapped to her waist",
    environment: "dense rustic coffee plantation, rows of leafy green shrubs packed with small red berries under morning fog",
    actionEnglish: "The woman is stripping ripe red coffee cherries off the branches of coffee shrubs with both hands, letting them fall into a rustic basket attached to her waist."
  },
  {
    id: "alimentando_porcos",
    name: "Alimentando os porcos",
    clothing: "bikini top, short mud-splattered denim shorts, high black rubber farm boots, sweat glistening on collarbone",
    environment: "weathered wooden pigpen, muddy soil puddles, rustic trough on the ground",
    actionEnglish: "The woman is tilting a heavy plastic bucket of corn mash and vegetable scraps to pour it into a low wooden trough, surrounded by several excited muddy farm pigs."
  },
  {
    id: "varrendo_terreiro",
    name: "Varrendo o terreiro de terra",
    clothing: "sleeveless cotton crop top, loose country farm shorts, dusty bare feet",
    environment: "rustic red-clay dirt yard of a simple countryside cottage, dry leaves scattered on ground, mango trees in background",
    actionEnglish: "The woman is sweeping dry leaves and red dust off the clay ground of the yard using a rustic handmade broom of dried twigs, moving with dynamic real physical exertion."
  },
  {
    id: "colhendo_ovos",
    name: "Colhendo ovos no ninho",
    clothing: "tight fitted top, short denim shorts, bare slender legs, dirty boots",
    environment: "dusty dark wooden chicken coop, straw-covered crates serving as rustic nests",
    actionEnglish: "The woman is bending down into a wooden nesting crate, carefully reaching under a clucking chicken to gather fresh brown eggs and placing them into a small rustic wicker basket."
  },
  {
    id: "peneirando_graos",
    name: "Peneirando feijão/milho",
    clothing: "simple crop top, comfortable shorts, sitting on rough wood block",
    environment: "sunny dirt yard of a farm, soft warm breeze passing through, golden hour sunlight",
    actionEnglish: "The woman is holding a round flat handmade wicker sieve, tossing raw dried beans slightly upward into the air so the wind clears away the dry husks, with beans catching the beautiful natural light."
  },
  {
    id: "batendo_manteiga",
    name: "Fazendo queijo e manteiga",
    clothing: "damp sleeveless top, thin fabric apron tied at waist, damp skin and bare wet arms",
    environment: "simple farm kitchen with white ceramic tiles, rustic wood table, pans with warm fresh milk",
    actionEnglish: "The woman is using her hands to mold and press cottage cheese curd tightly into a small round wooden container, squeezing out the yellow liquid whey on the table."
  }
];

export const FALAS_BASE = [
  "“Se eu largasse essa vida da roça pra morar com você… será que você cuidaria mesmo de mim? Me segue pra eu saber.”",
  "“Depois de passar o dia inteiro no sol da fazenda, tudo que eu queria era alguém pra dividir silêncio comigo. Se você for diferente… me segue.”",
  "“Eu passo o dia mexendo na terra, cuidando dos animais e trabalhando sem parar… mas às vezes queria alguém cuidando de mim também. Então me segue.”",
  "“Meu pai sempre fala que homem de verdade quase não existe mais. Será que ele tá certo? Se você for diferente… me segue.”",
  "“Eu acordo cedo pra tirar leite, cuidar da plantação e trabalhar até escurecer… queria saber se ainda existe alguém disposto a ficar do lado de uma mulher da roça. Me segue.”",
  "“Tem muita gente olhando minhas fotos… mas coragem de ficar mesmo, quase ninguém tem. Me segue… vamos ver se você fica.”",
  "“Você ainda tá aqui olhando pra mim no meio dessa roça toda… talvez seja porque sente falta de alguém de verdade. Então me segue e fica.”"
];

export const CTAS = [
  "se você for diferente… me segue",
  "então me segue e fica por aqui",
  "me segue, eu quero saber se você é assim",
  "me segue… vamos ver se você fica",
  "se ainda existir alguém assim, me segue",
  "queria saber se você tem coragem… me segue",
  "então me segue pra gente se conhecer",
  "se você não for igual a todos eles… me segue"
];
