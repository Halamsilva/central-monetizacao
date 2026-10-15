import React, { useState } from 'react';
import { Clock, Zap, MapPin, Film, ShieldAlert, HelpCircle, Copy, Check } from 'lucide-react';
import { NewsBreakdown } from '../types';

interface BreakdownViewerProps {
  breakdown: NewsBreakdown;
}

export const BreakdownViewer: React.FC<BreakdownViewerProps> = ({ breakdown }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySegment = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const segments = [
    {
      key: 'hook',
      time: '0–10 seg',
      title: 'Gancho de Alta Retenção',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
      badge: 'bg-amber-500/20 text-amber-300',
      content: breakdown.hook,
      rule: 'Frase de impacto inicial para reter nos primeiros 5 segundos. Sem saudações.',
    },
    {
      key: 'context',
      time: '10–35 seg',
      title: 'Contextualização & Envolvidos',
      icon: <MapPin className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-200',
      badge: 'bg-cyan-500/20 text-cyan-300',
      content: breakdown.context,
      rule: 'Onde aconteceu, quem está envolvido e início do incidente.',
    },
    {
      key: 'development',
      time: '35–75 seg',
      title: 'Desenvolvimento dos Fatos',
      icon: <Film className="w-4 h-4 text-blue-400" />,
      color: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
      badge: 'bg-blue-500/20 text-blue-300',
      content: breakdown.development,
      rule: 'Sequência cronológica com linguagem jornalística dinâmica.',
    },
    {
      key: 'consequences',
      time: '75–105 seg',
      title: 'Consequências & Autoridades',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-500/5 text-rose-200',
      badge: 'bg-rose-500/20 text-rose-300',
      content: breakdown.consequences,
      rule: 'Atendimento oficial, desfecho e investigações em andamento.',
    },
    {
      key: 'closing',
      time: '105–120 seg',
      title: 'Encerramento & Engajamento',
      icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-500/5 text-purple-200',
      badge: 'bg-purple-500/20 text-purple-300',
      content: breakdown.closing,
      rule: 'Informação conclusiva e reflexão para incentivar comentários.',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          Análise da Estrutura da Notícia (Regra 3 — 0 a 120s)
        </h4>
        <span className="text-[11px] text-slate-400">
          5 fases milimetricamente cronometradas
        </span>
      </div>

      <div className="space-y-2.5">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`p-3.5 rounded-xl border ${seg.color} transition-all hover:border-slate-600 relative group`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-slate-900 border border-slate-800">
                  {seg.icon}
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${seg.badge}`}>
                  {seg.time}
                </span>
                <span className="text-xs font-bold text-white">
                  {seg.title}
                </span>
              </div>

              <button
                onClick={() => copySegment(seg.content, seg.key)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 transition-all border border-slate-700"
                title="Copiar trecho"
              >
                {copiedKey === seg.key ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans pl-7">
              {seg.content || '—'}
            </p>

            <div className="mt-2 pl-7 text-[10px] text-slate-400 italic">
              💡 {seg.rule}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
