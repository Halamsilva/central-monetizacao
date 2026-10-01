import React from "react";
import { Sparkles, ShoppingBag, Flame, Zap } from "lucide-react";
import { DefaultProductPreset } from "../types";

const presets: DefaultProductPreset[] = [
  {
    name: "Copo Térmico Anti-Vazamento Premium",
    niche: "Cozinha & Utensílios / Lifestyle",
    description: "Copo térmico de 500ml com tampa hermética de vedação dupla a vácuo, pintura rugosa anti-risco, com isolamento que mantém gelado por 12 horas e quente por 6 horas. Ideal para viagens ou academia sem risco de derramar na mochila.",
    benefit: "Vedação impecável a vácuo que não vaza nada na mochila e mantém o gelo de verdade",
  },
  {
    name: "Escova de Limpeza Elétrica 5 em 1",
    niche: "Utilidades Domésticas / Limpeza",
    description: "Escova de limpeza giratória multifuncional sem fio que recarrega no USB. Vem com 5 cerdas intercambiáveis para rejuntes, vidros, panelas e sofás. Faz todo o esforço de esfregar de forma autônoma.",
    benefit: "Esfrega e limpa o azulejo do banheiro encardido sem precisar fazer força no braço",
  },
  {
    name: "Almofada de Massagem Cervical Inteligente",
    niche: "Saúde & Bem-Estar",
    description: "Almofada ergonômica de massagem shiatsu aquecida para pescoço e coluna lombar. Conta com 4 nós de massagem profunda rotação bidirecional e correia elástica para fixar em cadeiras de escritório.",
    benefit: "Alívio imediato no pescoço duro depois de passar o dia todo trabalhando no computador",
  },
];

interface ProductPresetsProps {
  onSelectPreset: (preset: DefaultProductPreset) => void;
}

export function ProductPresets(props: ProductPresetsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span>Preenchimento Rápido (Ideias de Sucesso)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {presets.map((preset, index) => (
          <button
            key={index}
            id={`preset-btn-${index}`}
            type="button"
            onClick={() => props.onSelectPreset(preset)}
            className="flex flex-col items-start text-left p-3 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-800/80 hover:shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 mb-1 bg-amber-50 text-amber-800 text-[10px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full">
              {index === 0 && <Flame className="w-3 h-3" />}
              {index === 1 && <Zap className="w-3 h-3" />}
              {index === 2 && <ShoppingBag className="w-3 h-3" />}
              <span>{preset.niche.split(" / ")[0]}</span>
            </div>
            <h4 className="font-bold text-xs text-neutral-900 group-hover:text-amber-800 transition-colors line-clamp-1">
              {preset.name}
            </h4>
            <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
              {preset.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
