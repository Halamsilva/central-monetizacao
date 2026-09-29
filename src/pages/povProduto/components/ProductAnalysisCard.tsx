import React from 'react';
import { ProductAnalysis } from '../types';
import { CheckCircle2, ShieldCheck, Sparkles, Box, HandMetal, AlertCircle, Eye, Cpu, Compass, Layers } from 'lucide-react';

interface ProductAnalysisCardProps {
  analysis: ProductAnalysis;
  imageUrl: string;
}

export const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  analysis,
  imageUrl,
}) => {
  const metrics = analysis.visualMetrics;

  return (
    <div className="bg-neutral-900/70 rounded-2xl border border-neutral-800 p-5 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Product Image Thumbnail with AI Scanner overlay */}
        <div className="w-full md:w-52 h-52 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex-shrink-0 relative group">
          <img
            src={imageUrl}
            alt={analysis.productName}
            className="w-full h-full object-contain p-2"
          />
          <div className="absolute top-2 left-2 bg-neutral-950/85 backdrop-blur-sm border border-neutral-700/80 px-2 py-0.5 rounded text-[10px] font-semibold text-orange-400 flex items-center gap-1">
            <Eye className="w-3 h-3 text-orange-400" />
            <span>Referência Visual</span>
          </div>

          <div className="absolute bottom-2 left-2 right-2 bg-neutral-950/90 backdrop-blur-sm border border-neutral-800 px-2.5 py-1 rounded text-[10px] text-neutral-300 flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              IA Estrutural Ativa
            </span>
            <span className="text-neutral-500 font-mono text-[9px]">
              {metrics ? `${metrics.width}×${metrics.height}px` : 'Escaneado'}
            </span>
          </div>
        </div>

        {/* Details & Specs observed */}
        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {analysis.category}
                </span>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Preservação Rigorosa do Objeto
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {analysis.productName}
              </h2>
            </div>
          </div>

          {/* Computer Vision Extracted Structure & Shape Display */}
          {metrics && (
            <div className="bg-neutral-950/90 rounded-xl p-3 border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extração Visual da IA (Geometria & Acabamento Estrutural)</span>
                </div>
                <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  {metrics.aspectRatioLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                {/* Shape / Geometry */}
                <div className="bg-neutral-900/80 rounded-lg p-2 border border-neutral-800 flex items-center gap-2.5">
                  <Box className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-500 block leading-none">Formato</span>
                    <span className="text-xs font-semibold text-white truncate block">
                      {metrics.shapeDescription}
                    </span>
                  </div>
                </div>

                {/* Surface Finish */}
                <div className="bg-neutral-900/80 rounded-lg p-2 border border-neutral-800 flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-500 block leading-none">Superfície</span>
                    <span className="text-xs font-semibold text-white truncate block">
                      {metrics.finishType}
                    </span>
                  </div>
                </div>

                {/* Texture density */}
                <div className="bg-neutral-900/80 rounded-lg p-2 border border-neutral-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-500 block leading-none">Textura</span>
                    <span className="text-xs font-semibold text-neutral-200 truncate block">
                      {metrics.textureDensity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Visual characteristics */}
            <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
              <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-2">
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>Detalhes Estruturais Observados</span>
              </div>
              <ul className="space-y-1.5 text-neutral-300">
                {analysis.visualDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Materials and Construction */}
            <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
              <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Materiais e Construção da Peça</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.materialsAndColors.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-1.5">
                <HandMetal className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                <span>{analysis.handInteractionNotes}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 text-[11px] text-emerald-300/90 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Foco Exclusivo em Estrutura & Construção:</strong> As falas descrevem o produto exclusivamente pela ergonomia, acabamento, textura e detalhes físicos reais, sem citar cores.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
