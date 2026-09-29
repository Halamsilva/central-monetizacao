import React from "react";
import { Sparkles, Video, Clock, ShieldCheck, Film, Users, Mic, Cpu } from "lucide-react";

interface HeaderProps {
  activeTab: "gerador" | "dossie" | "speech_lab" | "personagens" | "modelos";
  setActiveTab: (tab: "gerador" | "dossie" | "speech_lab" | "personagens" | "modelos") => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hasApiKey }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-3">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/40 border border-amber-400/30">
                <Film className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                    CineRealista <span className="text-amber-400 font-extrabold">9s</span>
                  </h1>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Especialista em Prompts
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">
                  Réplicas Idênticas dos Vídeos: Anatomia, Pele Suada, Cenários Rústicos e Falas de 9s
                </p>
              </div>
            </div>

            {/* Badges for Mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-3 h-3" /> 9s
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("gerador")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "gerador"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerador de Prompts
            </button>

            <button
              onClick={() => setActiveTab("dossie")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "dossie"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Dossiê dos 4 Vídeos
            </button>

            <button
              onClick={() => setActiveTab("speech_lab")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "speech_lab"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Laboratório 9 Segundos
            </button>

            <button
              onClick={() => setActiveTab("personagens")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "personagens"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Fichas de Personagem
            </button>

            <button
              onClick={() => setActiveTab("modelos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === "modelos"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Guia IAs de Vídeo
            </button>
          </nav>

          {/* Right Status */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-3 h-3 text-emerald-400" />
              Falas Calibradas: 9.0s
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              Ultra-Realismo 8K
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
