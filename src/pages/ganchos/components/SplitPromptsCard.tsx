import React, { useMemo } from 'react';
import { Copy, Scissors, User } from 'lucide-react';
import { parsePromptText, buildSpeakerPrompts } from '../utils/promptParser';

interface SplitPromptsCardProps {
  promptText: string;
  skinRealismActive: boolean;
  onCopy: (text: string, label: string) => void;
}

export const SplitPromptsCard: React.FC<SplitPromptsCardProps> = ({
  promptText,
  skinRealismActive,
  onCopy,
}) => {
  const speakerPrompts = useMemo(() => {
    try {
      return buildSpeakerPrompts(parsePromptText(promptText), skinRealismActive);
    } catch {
      return [];
    }
  }, [promptText, skinRealismActive]);

  if (speakerPrompts.length < 2) return null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
          <Scissors size={15} />
        </span>
        <h3 className="text-xs font-black uppercase tracking-wider text-rose-300 sm:text-sm">
          Gerar em vídeos separados (um por falante)
        </h3>
      </div>

      <p className="mb-4 text-[11px] leading-relaxed text-slate-400 sm:text-xs">
        Cada prompt abaixo tem a estrutura técnica completa e identifica <strong className="text-slate-200">QUEM FALA</strong> —
        assim você gera um vídeo por fala, com o lip-sync certo em cada um.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {speakerPrompts.map((item) => (
          <div
            key={item.label}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/70 px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-slate-200">
                <User size={14} className="shrink-0 text-rose-400" />
                <span className="truncate">{item.label}</span>
              </span>

              <button
                type="button"
                onClick={() => onCopy(item.prompt, item.label)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-200 transition hover:bg-rose-500/20"
              >
                <Copy size={13} />
                Copiar
              </button>
            </div>

            <pre className="max-h-72 flex-1 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-slate-300">
              {item.prompt}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
};
