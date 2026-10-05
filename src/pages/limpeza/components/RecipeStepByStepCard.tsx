import React, { useState } from 'react';
import { RecipeStepByStep } from '../types';
import {
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  ChefHat,
  Droplets,
  Flame,
  Info,
} from 'lucide-react';

interface RecipeStepByStepCardProps {
  recipe: RecipeStepByStep;
  productName: string;
}

export const RecipeStepByStepCard: React.FC<RecipeStepByStepCardProps> = ({ recipe, productName }) => {
  const [copied, setCopied] = useState(false);

  const formatFullRecipeText = () => {
    return `🧼 GUIA DA MISTURINHA CASEIRA PASSO A PASSO
PRODUTO: ${productName}
TEMPO PARA AGIR: ${recipe.totalReadyTime}
DIFICULDADE: ${recipe.difficulty}
RENDIMENTO: ${recipe.servings}

📋 INGREDIENTES CASEIROS DA DESPENSA (MEDIDAS EXATAS):
${recipe.ingredientsWithMeasurements.map((ing, i) => `  ${i + 1}. ${ing}`).join('\n')}

🥣 MODO DE FAZER PASSO A PASSO:
${recipe.steps
  .map(
    (s) =>
      `  [PASSO ${s.stepNumber}]: ${s.title} (${s.timeEstimate})\n  -> ${s.instruction}\n  -> Ingrediente chave: ${s.keyIngredient}`
  )
  .join('\n\n')}

🧽 COMO APLICAR E LIMPAR:
${recipe.howToConsume}

🛡️ SEGURANÇA DOMÉSTICA E RESPALDO QUÍMICO:
${recipe.safetyNotice}
Fonte: ${recipe.scientificBacking}
`;
  };

  const handleCopyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(formatFullRecipeText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Preparo Passo a Passo & Tempo de Ação da Misturinha
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Misturinha Real Comprovada
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instruções práticas de bancada com medidas de cozinha fáceis e tempo exato cronometrado sem esfregar
            </p>
          </div>
        </div>

        {/* Copy full recipe button */}
        <button
          type="button"
          onClick={handleCopyRecipe}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Receita Copiada!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiar Receita Completa</span>
            </>
          )}
        </button>
      </div>

      {/* Badges Bar: Time, Difficulty, Servings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Tempo de Ação:</span>
            <span className="text-xs font-bold text-emerald-300 font-mono">{recipe.totalReadyTime}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Nível de Dificuldade:</span>
            <span className="text-xs font-bold text-slate-200">{recipe.difficulty}</span>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Rendimento / Aplicação:</span>
            <span className="text-xs font-bold text-slate-200">{recipe.servings}</span>
          </div>
        </div>
      </div>

      {/* Two columns: Ingredients & How to apply */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Ingredients Column */}
        <div className="lg:col-span-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Ingredientes da Despensa (Medidas Caseiras):
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {recipe.ingredientsWithMeasurements.map((ingredient, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-emerald-400 font-bold font-mono text-[11px] shrink-0 mt-0.5">
                  {idx + 1}.
                </span>
                <span className="leading-relaxed">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* How to Apply Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                Como Aplicar & Limpar Sem Cansar o Braço:
              </h4>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-medium">
              {recipe.howToConsume}
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                Segurança Doméstica & Respaldo Químico:
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              {recipe.safetyNotice}
            </p>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-cyan-400 font-semibold">Fonte Científica:</span>
              <span className="text-slate-300">{recipe.scientificBacking}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wide">
            Modo de Fazer Passo a Passo (Bancada da Faxina):
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {recipe.steps.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center border border-emerald-500/30">
                    {step.stepNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {step.timeEstimate}
                  </span>
                </div>

                <h5 className="text-xs font-bold text-white mb-1.5">{step.title}</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{step.instruction}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                <span className="text-slate-500">Ativo chave:</span>
                <span className="truncate">{step.keyIngredient}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
