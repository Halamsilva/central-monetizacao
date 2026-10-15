import React from 'react';
import { Link2, FileText, Zap, Sparkles, Globe, MessageSquare, AlertCircle } from 'lucide-react';
import { InputMode, PacingOption, QuickFactsForm } from '../types';

interface InputTabsProps {
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  url: string;
  setUrl: (url: string) => void;
  text: string;
  setText: (text: string) => void;
  quickFacts: QuickFactsForm;
  setQuickFacts: React.Dispatch<React.SetStateAction<QuickFactsForm>>;
  pacing: PacingOption;
  setPacing: (pacing: PacingOption) => void;
  includeQuestion: boolean;
  setIncludeQuestion: (include: boolean) => void;
  onSelectExample: (example: any) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export const EXAMPLES = [
  {
    tag: 'Ciência & Espaço',
    title: 'James Webb descobre vapor de água e atmosfera densa em exoplaneta rochoso',
    snippet: 'Astrônomos da NASA e da ESA confirmaram que o telescópio espacial James Webb detectou assinaturas químicas consistentes com vapor de água na atmosfera do exoplaneta GJ 486 b, localizado a 26 anos-luz da Terra na constelação de Virgem. A descoberta intriga pesquisadores pois planetas com temperaturas tão próximas de suas estrelas geralmente perdem suas atmosferas.',
    mode: 'text',
  },
  {
    tag: 'Resgate Dramático',
    title: 'Baleia jubarte presa em rede de pesca é salva após 6 horas de operação no litoral de SP',
    snippet: 'Uma operação de alta complexidade do Instituto Biopesca e do Corpo de Bombeiros resgatou uma baleia jubarte jovem que havia ficado presa em redes de emalhe na costa de Ilhabela. Os biólogos cortaram mais de 50 metros de cabos náuticos com facas especiais, enquanto o animal dava sinais de exaustão.',
    mode: 'text',
  },
  {
    tag: 'Segurança & IA',
    title: 'Empresa multinacional perde 25 milhões de dólares em golpe com deepfake de diretoria',
    snippet: 'Um funcionário financeiro em Hong Kong foi induzido a transferir o equivalente a 25 milhões de dólares após participar de uma videoconferência com o diretor financeiro da matriz e outros colegas. A polícia local confirmou que todas as pessoas na chamada de vídeo eram representações digitais geradas por inteligência artificial (deepfakes).',
    mode: 'text',
  },
  {
    tag: 'Tecnologia & Inovação',
    title: 'Cientistas criam bateria que carrega em 5 minutos e dura 20 anos sem degradação',
    snippet: 'Pesquisadores da Universidade de Harvard desenvolveram uma nova bateria de estado sólido à base de lítio-metal capaz de reter 80% de sua capacidade mesmo após 6.000 ciclos de recarga. Os testes laboratoriais demonstraram recarga total em apenas 5 a 10 minutos, superando as limitações históricas de superaquecimento dos veículos elétricos.',
    mode: 'text',
  },
];

export const InputTabs: React.FC<InputTabsProps> = ({
  mode,
  setMode,
  url,
  setUrl,
  text,
  setText,
  quickFacts,
  setQuickFacts,
  pacing,
  setPacing,
  includeQuestion,
  setIncludeQuestion,
  onSelectExample,
  isLoading,
  onSubmit,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setMode('url')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            mode === 'url'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Link de Notícia (URL)
        </button>

        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            mode === 'text'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Texto / Reportagem Completa
        </button>

        <button
          onClick={() => setMode('quick_facts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            mode === 'quick_facts'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Fatos Rápidos & Título
        </button>

        <button
          onClick={() => setMode('examples')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
            mode === 'examples'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Exemplos Prontos
        </button>
      </div>

      {/* Tab 1: URL */}
      {mode === 'url' && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cole o Link da Matéria / Notícia:
          </label>
          <div className="relative">
            <input
              type="url"
              placeholder="https://g1.globo.com/..., https://bbc.com/..., https://reuters.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              O Agente acessa a página, extrai os fatos verificados e confirma dados via Google Search.
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Text / Report */}
      {mode === 'text' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cole o texto da notícia (qualquer idioma):
            </label>
            <span className="text-[11px] text-slate-500">
              {text.length} caracteres
            </span>
          </div>
          <textarea
            rows={6}
            placeholder="Cole aqui a notícia na íntegra, um trecho de reportagem ou um comunicado oficial... O agente traduzirá e adaptará automaticamente para o padrão de narração em português brasileiro."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 leading-relaxed font-sans"
          />
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Aceita notícias em inglês, espanhol, francês, japonês ou qualquer idioma — saída sempre em PT-BR fluído.
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Quick Facts */}
      {mode === 'quick_facts' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Título ou Tema do Acontecimento *
              </label>
              <input
                type="text"
                placeholder="Ex: Avião faz pouso de emergência em rodovia"
                value={quickFacts.title}
                onChange={(e) =>
                  setQuickFacts((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Onde aconteceu (Cidade, Estado, País) *
              </label>
              <input
                type="text"
                placeholder="Ex: Rodovia Ayrton Senna, São Paulo"
                value={quickFacts.location}
                onChange={(e) =>
                  setQuickFacts((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              O que aconteceu exatamente? *
            </label>
            <input
              type="text"
              placeholder="Ex: Monomotor sofreu pane no motor 10 minutos após decolagem e piloto conseguiu descer na pista"
              value={quickFacts.whatHappened}
              onChange={(e) =>
                setQuickFacts((prev) => ({ ...prev, whatHappened: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Detalhes, Consequências e Autoridades
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Ninguém se feriu, tráfego foi bloqueado por 1 hora, bombeiros e CENIPA foram acionados para investigar as causas."
              value={quickFacts.details}
              onChange={(e) =>
                setQuickFacts((prev) => ({ ...prev, details: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Examples */}
      {mode === 'examples' && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Selecione uma notícia real para testar o agente com 1 clique:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLES.map((ex, idx) => (
              <div
                key={idx}
                onClick={() => onSelectExample(ex)}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/60 hover:bg-slate-800/40 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 inline-block mb-1.5">
                    {ex.tag}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white leading-snug mb-1">
                    {ex.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {ex.snippet}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-end">
                  <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Carregar Exemplo →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customization Options Strip */}
      <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pacing */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Ritmo da Narração:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', label: 'Padrão (130-150 ppm)', desc: '200-240 palavras' },
              { id: 'fast', label: 'Viral / Reels (Ágil)', desc: '240-260 palavras' },
              { id: 'investigative', label: 'Tensão / Investigativo', desc: '180-210 palavras' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPacing(p.id as PacingOption)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  pacing === p.id
                    ? 'bg-rose-600/20 border-rose-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold block">{p.label}</span>
                <span className="text-[10px] text-slate-400">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Closing Question */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Pergunta no Encerramento (105-120s):
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIncludeQuestion(true)}
              className={`p-2 rounded-xl text-left border transition-all ${
                includeQuestion
                  ? 'bg-rose-600/20 border-rose-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold block">Com Pergunta</span>
              <span className="text-[10px] text-slate-400">Incentiva comentários</span>
            </button>

            <button
              type="button"
              onClick={() => setIncludeQuestion(false)}
              className={`p-2 rounded-xl text-left border transition-all ${
                !includeQuestion
                  ? 'bg-rose-600/20 border-rose-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold block">Sem Pergunta</span>
              <span className="text-[10px] text-slate-400">Desfecho conclusivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Submit Action */}
      <div className="pt-2">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:via-red-500 hover:to-rose-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-950/50 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Processando e Roteirizando com o Agente Viral...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>Gerar Roteiro Viral (Regras 1 a 9)</span>
              <span className="text-xs font-normal opacity-80">(Ctrl + Enter)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
