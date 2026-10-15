import React from 'react';
import { X, ShieldAlert, Zap, Clock, Mic, CheckCircle2, BookmarkCheck, FileText, Bot } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      num: 'REGRA 1',
      title: 'Pesquisa e Verificação',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      desc: 'Identificar o que aconteceu, onde, quando, quem está envolvido, consequências, posicionamento das autoridades e situação atual. Nunca inventar dados ou declarações. Se não houver confirmação, deixar explícito.',
    },
    {
      num: 'REGRA 2',
      title: 'Gancho de Alta Retenção',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      desc: 'Começar com frase impactante nos primeiros 5 segundos. Proibido iniciar com "Olá pessoal" ou saudações. Direto ao fato mais chocante ou relevante.',
    },
    {
      num: 'REGRA 3',
      title: 'Estrutura da Notícia (0 a 120s)',
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
      desc: '0–10s: Gancho • 10–35s: Contexto • 35–75s: Desenvolvimento • 75–105s: Consequências e Autoridades • 105–120s: Encerramento com pergunta de engajamento.',
    },
    {
      num: 'REGRA 4',
      title: 'Estilo de Narração',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      desc: 'Português brasileiro natural, claro e ágil. Tom jornalístico profissional. Frases curtas, ritmo dinâmico e emoção proporcional aos fatos. Sem termos rebuscados.',
    },
    {
      num: 'REGRA 5',
      title: 'Duração Máxima de 2 Minutos',
      icon: <Clock className="w-5 h-5 text-blue-400" />,
      desc: 'Preferencialmente entre 180 e 260 palavras (~130 a 150 ppm). Nunca inventar informações apenas para esticar o tempo.',
    },
    {
      num: 'REGRA 6',
      title: 'Fidelidade Absoluta aos Fatos',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      desc: 'Proibido criar testemunhas fictícias, mortes sem confirmação, locais falsos ou teorias da conspiração. Máximo respeito a vítimas e familiares.',
    },
    {
      num: 'REGRA 7',
      title: 'Título Viral',
      icon: <BookmarkCheck className="w-5 h-5 text-yellow-400" />,
      desc: 'Título chamativo com alto poder de clique (CTR), mas 100% verdadeiro e fiel ao conteúdo, sem clickbait falso.',
    },
    {
      num: 'REGRA 8',
      title: 'Formato da Resposta',
      icon: <FileText className="w-5 h-5 text-indigo-400" />,
      desc: 'Ordem estrita: TÍTULO: • NOTÍCIA PARA NARRAÇÃO: (texto contínuo, sem rubricas de câmera ou emojis) • DURAÇÃO ESTIMADA: • FONTES:.',
    },
    {
      num: 'REGRA 9',
      title: 'Funcionamento Automático',
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
      desc: 'Ao receber o link ou texto, processa imediatamente e devolve o roteiro pronto para cópia e gravação vocal.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                PROMPT MESTRE — AGENTE DE NOTÍCIAS VIRAIS
              </h2>
              <p className="text-xs text-slate-400">
                A Tríade Fundamental: <strong className="text-rose-400">Veracidade</strong> + <strong className="text-amber-400">Retenção</strong> + <strong className="text-emerald-400">Narração Natural</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                    {rule.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {rule.num}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {rule.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>
              💡 <strong>Dica de gravação:</strong> 220 palavras faladas em tom dinâmico equivalem a exatamente ~1 minuto e 40 segundos, o ponto doce do algoritmo do TikTok e Instagram Reels.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-950/40"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
