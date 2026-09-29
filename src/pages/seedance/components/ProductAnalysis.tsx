import { ProductAnalysis as AnalysisType } from "../types";
import { Sparkles, Eye, Tag, Palette, Box, Target, Hammer, AlertCircle, Layers } from "lucide-react";

interface ProductAnalysisProps {
  analysis: AnalysisType;
}

export default function ProductAnalysis({ analysis }: ProductAnalysisProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-8" id="product-analysis-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
          <h3 className="font-extrabold text-slate-950 text-lg tracking-tight">
            Análise Avançada do Produto pela IA
          </h3>
        </div>
        {analysis.anglesAnalyzed && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <Layers className="w-3.5 h-3.5" />
            {analysis.anglesAnalyzed}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Nome / Tipo do Produto
              </span>
              <span className="text-slate-800 font-medium">
                {analysis.productName}
              </span>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Cores Identificadas
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {analysis.colors && analysis.colors.length > 0 ? (
                  analysis.colors.map((color, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-full font-medium"
                    >
                      {color}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Não identificada</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Materiais e Acabamento
              </span>
              <span className="text-slate-800 text-sm font-medium">
                {analysis.materials || "Não especificado"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Embalagem e Quantidade
              </span>
              <span className="text-slate-800 text-sm font-medium">
                {analysis.packaging || "Não especificado"}
              </span>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Público-Alvo Provável
              </span>
              <span className="text-slate-800 text-sm font-medium">
                {analysis.targetAudience}
              </span>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Função e Utilidade
              </span>
              <span className="text-slate-800 text-sm font-medium">
                {analysis.likelyFunction}
              </span>
            </div>
          </div>
        </div>
      </div>

      {analysis.visualDetails && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Fidelidade de Detalhes Logotipo e Inscrições
            </span>
            <p className="text-slate-600 text-xs leading-relaxed mt-0.5">
              {analysis.visualDetails}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
