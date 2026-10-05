import React from 'react';
import { Sparkles, ShieldCheck, Clock, Layers, Flame, Droplets } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Agente Prompts Limpeza & Donas de Casa <span className="text-emerald-400 font-mono text-sm px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">4K PRO</span>
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Direct Response • Home Care & Faxina
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Prompts sequenciais hiper-realistas • Limpeza Pesada, Donas de Casa & Misturinhas • Maquetes de sujeira 1,20m • 9s de fala
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Misturinhas 100% Reais</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Falas Sem Clichês (Brasil)</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Maquete Gigante 1,20m</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>9s por Cena Exatos</span>
          </div>
        </div>
      </div>
    </header>
  );
};
