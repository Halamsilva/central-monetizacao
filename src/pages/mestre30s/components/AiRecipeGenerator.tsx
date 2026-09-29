import React, { useState } from 'react';
import { Sparkles, Loader2, ChefHat, ArrowRight, Lightbulb, AlertCircle } from 'lucide-react';
import { MasterRecipe, DetailedIngredient, DetailedStep } from '../data/recipes';
import { supabase } from '../../../lib/supabase';

interface AiRecipeGeneratorProps {
  onRecipeGenerated: (recipe: MasterRecipe) => void;
  onClose?: () => void;
}

const QUICK_INSPIRATIONS = [
  { label: 'Camarão na manteiga de garrafa & manga fresca', cuisine: 'brasileira' },
  { label: 'Banana da terra grelhada com queijo da canastra', cuisine: 'brasileira' },
  { label: 'Carpaccio de abobrinha fresca com avelãs e queijo', cuisine: 'internacional' },
  { label: 'Toast de figo fresco com queijo de cabra e mel', cuisine: 'internacional' },
];

export const AiRecipeGenerator: React.FC<AiRecipeGeneratorProps> = ({
  onRecipeGenerated,
  onClose,
}) => {
  const [ingredientIdea, setIngredientIdea] = useState<string>('');
  const [cuisine, setCuisine] = useState<'brasileira' | 'internacional' | 'todas'>('brasileira');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientIdea.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';
      const response = await fetch('/api/agents/mestre30s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredientOrIdea: ingredientIdea,
          cuisine,
        }),
      });

      if (!response.ok) {
        throw new Error('Servidor indisponível ou limite de IA atingido. Ativando receita express.');
      }

      const data = await response.json();

      // Normalize freshIngredients to DetailedIngredient[]
      const freshIngredients: DetailedIngredient[] =
        Array.isArray(data.freshIngredients) && typeof data.freshIngredients[0] === 'object'
          ? data.freshIngredients.map((ing: any) => ({
              name: ing.name || 'Ingrediente fresco',
              quantity: ing.quantity || '100g',
              prepTime: ing.prepTime || '1 min de preparo',
              techniqueTip: ing.techniqueTip || 'Corte uniforme para cocção precisa.',
            }))
          : [
              {
                name: `${ingredientIdea} frescos`,
                quantity: '200g (cortados em lâminas finas)',
                prepTime: '1 min 30s de corte',
                techniqueTip: 'Mantenha espessura uniforme para resposta homogênea ao calor.',
              },
              {
                name: 'Ervas frescas colhidas (manjericão/coentro/alecrim)',
                quantity: '1 punhado farto (15g)',
                prepTime: '20s para desfolhar',
                techniqueTip: 'Rasgue manualmente apenas na finalização.',
              },
              {
                name: 'Gordura nobre (azeite extravirgem ou manteiga pura)',
                quantity: '2 colheres de sopa (30ml)',
                prepTime: 'Temperatura ambiente',
                techniqueTip: 'Aqueça até formar primeira fumaça suave.',
              },
            ];

      // Normalize steps to DetailedStep[]
      const steps: DetailedStep[] =
        Array.isArray(data.steps) && typeof data.steps[0] === 'object'
          ? data.steps.map((st: any, idx: number) => ({
              stepNumber: st.stepNumber || idx + 1,
              phase: st.phase || (idx === 0 ? 'Mise en Place' : idx === 1 ? 'Fogo & Cocção' : 'Finalização & Ponto'),
              timeEstimate: st.timeEstimate || '1 minuto',
              action: st.action || 'Preparo Técnico',
              description: st.description || '',
              temperatureOrFire: st.temperatureOrFire || 'Fogo médio',
            }))
          : [
              {
                stepNumber: 1,
                phase: 'Mise en Place' as const,
                timeEstimate: '2 minutos',
                action: 'Pesagem & Cortes Precisos',
                description: `Pese os ingredientes e fatie ${ingredientIdea} em tiras milimétricas para calor imediato.`,
                temperatureOrFire: 'Bancada',
              },
              {
                stepNumber: 2,
                phase: 'Fogo & Cocção' as const,
                timeEstimate: '1 min 30s',
                action: 'Selagem & Liberação de Aromas',
                description: 'Aqueça a frigideira de ferro fundido, sele com azeite ou manteiga mexendo com energia.',
                temperatureOrFire: 'Fogo médio-alto',
              },
              {
                stepNumber: 3,
                phase: 'Finalização & Ponto' as const,
                timeEstimate: '30 segundos',
                action: 'Finalização com Ervas & Servir',
                description: 'Desligue o fogo, salpique as ervas frescas rasgadas e flor de sal. Sirva imediatamente.',
                temperatureOrFire: 'Calor residual',
              },
            ];

      const pantryItems =
        Array.isArray(data.pantryItems) && typeof data.pantryItems[0] === 'object'
          ? data.pantryItems
          : [
              { item: 'Flor de sal marinho', quantity: '1 pitada leve (1.5g)' },
              { item: 'Pimenta moída na hora', quantity: '1 toque aromático' },
            ];

      const newRecipe: MasterRecipe = {
        id: `ai-${Date.now()}`,
        title: data.title || `Prato Artesanal de ${ingredientIdea}`,
        subtitle: data.subtitle || 'Receita desenvolvida pelo Mestre Centenário com proporções exatas e ingredientes frescos.',
        cuisineType: data.cuisineType === 'internacional' ? 'internacional' : 'brasileira',
        country: data.country || (cuisine === 'brasileira' ? 'Brasil' : 'Culinária Internacional'),
        flag: cuisine === 'brasileira' ? '🇧🇷' : '🌍',
        category: 'Exclusiva do Mestre',
        servings: data.servings || '2 porções',
        prepTimeMinutes: data.prepTimeMinutes || 3,
        cookTimeMinutes: data.cookTimeMinutes !== undefined ? data.cookTimeMinutes : 2,
        totalTimeDisplay: data.totalTimeDisplay || '5 minutos',
        freshIngredients,
        pantryItems,
        steps,
        masterSecret:
          data.masterSecret ||
          'Corte fino é a chave de ouro: pedaços uniformes absorvem tempero e calor instantaneamente!',
        flavorProfile: 'Frescor intenso, textura contrastante e aroma vegetal marcante.',
        fixedSceneGlobal:
          data.fixedSceneGlobal ||
          'Bancada rústica de pedra escura fosca com tábua de madeira maciça, parede de concreto aparente em bokeh suave e iluminação cinematográfica quente lateral a 45°.',
        fixedObjectsGlobal:
          data.fixedObjectsGlobal ||
          `Frigideira de ferro fundido preta fosca com cabo de madeira clara, faca de chef japonesa de aço escovado, tigela rasa de cerâmica artesanal e ramequim com temperos frescos.`,
        prompts:
          data.prompts && data.prompts.length === 4
            ? data.prompts.map((p: any, idx: number) => ({
                takeNumber: (idx + 1) as 1 | 2 | 3 | 4,
                timeRange: p.timeRange || `Take ${idx + 1}`,
                actName: p.actName || `Take ${idx + 1}`,
                spokenLine: p.spokenLine,
                videoShotPrompt: p.videoShotPrompt,
                soundFxCue: p.soundFxCue || 'Chiado nítido e vibrante de preparo.',
                targetWords: p.spokenLine ? p.spokenLine.split(' ').length : 24,
                fixedSceneContext:
                  p.fixedSceneContext ||
                  'Bancada rústica de pedra escura fosca com tábua de madeira maciça, parede de concreto aparente em bokeh suave e iluminação cinematográfica quente lateral a 45°.',
                fixedObjectsProps:
                  p.fixedObjectsProps ||
                  `Frigideira de ferro fundido preta fosca com cabo de madeira clara, faca de chef japonesa de aço escovado, tigela rasa de cerâmica artesanal e ramequim com temperos frescos.`,
              }))
            : createFallbackPrompts(data.title || ingredientIdea),
      };

      onRecipeGenerated(newRecipe);
    } catch (err: any) {
      console.warn('Fallback generator activated:', err);
      // Fallback generator with authentic 100-year master style
      const fallbackRecipe = generateInstantExpertRecipe(ingredientIdea, cuisine);
      onRecipeGenerated(fallbackRecipe);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="generator" className="py-12 bg-stone-900/60 border-t border-stone-800 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-950 rounded-2xl border border-stone-800 p-6 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Subtle gradient background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wide uppercase mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gerador com IA Mestre</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mb-2">
              Crie uma Nova Receita com Pesos, Tempos & 4 Prompts
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mb-6 max-w-2xl leading-relaxed">
              Diga o que você tem na despensa ou qual sabor deseja hoje. O especialista dos 100 anos elaborará as medidas exatas na balança, a técnica de cocção e o roteiro calibrado de 4 falas de 9s.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input for ingredient */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                  Ingredientes ou Ideia de Prato:
                </label>
                <input
                  type="text"
                  value={ingredientIdea}
                  onChange={(e) => setIngredientIdea(e.target.value)}
                  placeholder="Ex: Queijo coalho com melaço, cogumelos com alho fresco, manga com pimenta..."
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all text-sm"
                  required
                />
              </div>

              {/* Segmented control for Cuisine */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                    Estilo de Culinária:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCuisine('brasileira')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        cuisine === 'brasileira'
                          ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      🇧🇷 Brasileira
                    </button>
                    <button
                      type="button"
                      onClick={() => setCuisine('internacional')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        cuisine === 'internacional'
                          ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      🌍 Internacional
                    </button>
                    <button
                      type="button"
                      onClick={() => setCuisine('todas')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        cuisine === 'todas'
                          ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Livre / Fusão
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !ingredientIdea.trim()}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm self-end w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>O Mestre está criando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-stone-950" />
                      <span>Gerar Receita & 4 Takes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick inspiration chips */}
              <div className="pt-4 border-t border-stone-800/80">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspirações com Pesos & Sabores:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_INSPIRATIONS.map((insp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIngredientIdea(insp.label);
                        setCuisine(insp.cuisine as any);
                      }}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 hover:border-amber-500/40 border border-stone-800 rounded-lg text-xs text-stone-300 transition-colors text-left"
                    >
                      {insp.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Fallback generator helper
function createFallbackPrompts(title: string) {
  const fixedScene = 'Bancada rústica de pedra sabão cinza escuro, parede de tijolo aparente texturizado ao fundo com iluminação cinematográfica quente lateral a 45°.';
  const fixedObjects = `Frigideira preta de ferro fundido de 22cm com cabo de madeira clara, tábua de madeira nobre de peroba-rosa, faca de chef de aço escovado e prato artesanal de cerâmica cinza grafite.`;

  return [
    {
      takeNumber: 1 as const,
      timeRange: '0:00 - 0:09',
      actName: 'Take 1: O Gancho & Apresentação',
      spokenLine: `Hoje você vai aprender esse ${title} com ingredientes frescos estalando na panela e um sabor equilibrado que você nunca provou igual!`,
      videoShotPrompt: 'Vertical 9:16, close macro dinâmico no prato fumegante com corte rápido e vapor denso subindo.',
      soundFxCue: 'Estalo de corte limpo e chiado vivo de fritura rápida.',
      targetWords: 24,
      fixedSceneContext: fixedScene,
      fixedObjectsProps: fixedObjects,
    },
    {
      takeNumber: 2 as const,
      timeRange: '0:09 - 0:18',
      actName: 'Take 2: Ingredientes & Pesos na Bancada',
      spokenLine: 'Duzentos gramas do ingrediente fresco fatiado fino, trinta mililitros de azeite e ervas recém-colhidas para dar aquela explosão de perfume!',
      videoShotPrompt: 'Ângulo zenital top-down com mãos ágeis acomodando os itens frescos e coloridos na tábua.',
      soundFxCue: 'Som de faca rítmica e gotas densas de azeite.',
      targetWords: 22,
      fixedSceneContext: fixedScene,
      fixedObjectsProps: fixedObjects,
    },
    {
      takeNumber: 3 as const,
      timeRange: '0:18 - 0:27',
      actName: 'Take 3: O Ponto do Fogo & Tempo de Cocção',
      spokenLine: 'Frigideira em calor médio-alto: são apenas dois minutos salteando para dourar a superfície sem perder a suculência interna do ingrediente!',
      videoShotPrompt: 'Close médio nas chamas e na fumaça rápida levantando enquanto a panela salteia os ingredientes.',
      soundFxCue: 'Chiado intenso da panela de ferro no fogo alto.',
      targetWords: 23,
      fixedSceneContext: fixedScene,
      fixedObjectsProps: fixedObjects,
    },
    {
      takeNumber: 4 as const,
      timeRange: '0:27 - 0:36',
      actName: 'Take 4: A Mordida & Gran Finale',
      spokenLine: 'Finaliza com flor de sal marinho e cai dentro! Olha esse espetáculo de textura. Salva essa receita e me segue para mais!',
      videoShotPrompt: 'Super close na garfada generosa aproximando da lente com textura brilhante e suculenta.',
      soundFxCue: 'Som cristalino de mordida crocante e encerramento.',
      targetWords: 23,
      fixedSceneContext: fixedScene,
      fixedObjectsProps: fixedObjects,
    },
  ];
}

function generateInstantExpertRecipe(
  idea: string,
  cuisine: 'brasileira' | 'internacional' | 'todas'
): MasterRecipe {
  const isBr = cuisine === 'brasileira';
  const fixedScene = isBr
    ? 'Bancada rústica brasileira de pedra-sabão cinza escuro, parede de taipa ao fundo e luz solar dourada quente entrando pela janela.'
    : 'Bancada minimalista de mármore escuro polido, fundo com painel de ripas de madeira nobre e iluminação difusa direcional a 45°.';
  const fixedObjects = `Frigideira de ferro fundido pesada de 22cm com cabo de madeira clara, tábua de madeira maciça envelhecida, faca de aço escovado, prato de cerâmica artesanal rústico e tigela com ingredientes frescos.`;

  return {
    id: `ai-${Date.now()}`,
    title: `${idea.charAt(0).toUpperCase() + idea.slice(1)} Artesanal do Mestre`,
    subtitle: `Combinação equilibrada com pesos exatos na balança e técnicas de cocção apuradas pelo Mestre Centenário.`,
    cuisineType: isBr ? 'brasileira' : 'internacional',
    country: isBr ? 'Brasil' : 'Cozinha Internacional',
    flag: isBr ? '🇧🇷' : '🌍',
    category: 'Exclusiva do Mestre',
    servings: '2 porções',
    prepTimeMinutes: 3,
    cookTimeMinutes: 2,
    totalTimeDisplay: '5 minutos',
    freshIngredients: [
      {
        name: `${idea} frescos e limpos`,
        quantity: '250g (cortado em tiras de 4mm)',
        prepTime: '2 min para limpar e fatiar',
        techniqueTip: 'Seque antes de selar para que o calor caramelize a superfície rapidamente.',
      },
      {
        name: 'Ervas frescas aromáticas (manjericão ou alecrim)',
        quantity: '2 ramos (folhas soltas)',
        prepTime: '20s para desfolhar',
        techniqueTip: 'Salpique apenas nos últimos segundos de frigideira.',
      },
      {
        name: 'Azeite de oliva extravirgem ou manteiga pura',
        quantity: '2 colheres de sopa (30ml)',
        prepTime: 'Temperatura ambiente',
        techniqueTip: 'Aqueça na frigideira de ferro antes de acomodar os ingredientes.',
      },
      {
        name: 'Raspas de limão ou tangerina fresca',
        quantity: '1 colher de café de raspas finas',
        prepTime: '20s no zester',
        techniqueTip: 'Apenas a casca externa colorida, evitando a parte branca amarga.',
      },
    ],
    pantryItems: [
      { item: 'Flor de sal marinho', quantity: '1/2 colher de chá (2g)' },
      { item: 'Pimenta-do-reino moída na hora', quantity: '1 pitada' },
    ],
    steps: [
      {
        stepNumber: 1,
        phase: 'Mise en Place',
        timeEstimate: '2 minutos',
        action: 'Higienização, Pesagem & Corte',
        description: `Pese os 250g de ${idea} e fatie com faca bem afiada em lâminas uniformes de 4mm.`,
        temperatureOrFire: 'Bancada de preparo',
      },
      {
        stepNumber: 2,
        phase: 'Fogo & Cocção',
        timeEstimate: '1 min 30s',
        action: 'Aquecimento Térmico & Selagem',
        description: 'Frigideira de ferro em fogo médio-alto com o azeite: sele os ingredientes por 90 segundos virando continuamente.',
        temperatureOrFire: 'Fogo médio-alto (190°C)',
      },
      {
        stepNumber: 3,
        phase: 'Finalização & Ponto',
        timeEstimate: '30 segundos',
        action: 'Perfume de Ervas & Flor de Sal',
        description: 'Salpique as ervas frescas rasgadas na mão, raspas cítricas, flor de sal e sirva fumegante.',
        temperatureOrFire: 'Calor residual',
      },
    ],
    masterSecret: 'Ingredientes em temperatura ambiente garantem que a panela não perca calor nos primeiros 5 segundos cruciais.',
    flavorProfile: 'Vibrante, aromático, crocante por fora e tenro por dentro.',
    fixedSceneGlobal: fixedScene,
    fixedObjectsGlobal: fixedObjects,
    prompts: createFallbackPrompts(idea),
  };
}
