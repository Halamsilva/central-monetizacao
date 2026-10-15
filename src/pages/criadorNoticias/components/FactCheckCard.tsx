import React from 'react';
import { ShieldCheck, ExternalLink, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { KeyFacts, SearchLink } from '../types';

interface FactCheckCardProps {
  keyFacts?: KeyFacts;
  sources: string;
  searchLinks?: SearchLink[];
  scrapedSource?: {
    title?: string;
    url?: string;
  } | null;
}

export const FactCheckCard: React.FC<FactCheckCardProps> = ({
  keyFacts,
  sources,
  searchLinks,
  scrapedSource,
}) => {
  const factItems = [
    { label: 'O que aconteceu', value: keyFacts?.whatHappened },
    { label: 'Onde aconteceu', value: keyFacts?.location },
    { label: 'Quando aconteceu', value: keyFacts?.when },
    { label: 'Quem está envolvido', value: keyFacts?.who },
    { label: 'Consequências', value: keyFacts?.consequences },
    { label: 'Posição das Autoridades', value: keyFacts?.authorities },
    { label: 'Situação Atual', value: keyFacts?.currentStatus },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Verificação Jornalística & Fatos Apurados
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Regra 1 & 6 Cumpridas
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Conformidade factual estrita — sem boatos ou informações inventadas
            </p>
          </div>
        </div>
      </div>

      {/* Facts Grid */}
      {keyFacts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {factItems.map(
            (item, idx) =>
              item.value && (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
                    {item.label}
                  </span>
                  <span className="text-slate-200 font-medium leading-relaxed">
                    {item.value}
                  </span>
                </div>
              )
          )}
        </div>
      )}

      {/* Sources & Grounding */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
          FONTES & CHECAGEM (Regra 8):
        </span>
        <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
          {sources || 'Fontes apuradas com base nos dados fornecidos.'}
        </p>

        {/* Scraped link if any */}
        {scrapedSource?.url && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Link Analisado:</span>
            <a
              href={scrapedSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-rose-400 hover:text-rose-300 underline flex items-center gap-1 truncate max-w-md"
            >
              {scrapedSource.title || scrapedSource.url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Google Search grounding links */}
        {searchLinks && searchLinks.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              Links de Consulta e Verificação (Google Search):
            </span>
            <div className="flex flex-wrap gap-2">
              {searchLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span className="truncate max-w-[200px]">{link.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
