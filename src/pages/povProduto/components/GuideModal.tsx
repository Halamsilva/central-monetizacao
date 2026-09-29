import React from 'react';
import { X, CheckCircle2, Video, Sparkles, AlertTriangle, ShieldCheck, Film, ExternalLink } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Guia de Criação & Compatibilidade com IAs de Vídeo
              </h2>
              <p className="text-xs text-neutral-400">
                Padrão POV de Câmera na Testa para Alta Conversão (TikTok Shop & Reels)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-sm">
          {/* Section 1: The 3 Scene Structure */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Estrutura Viral das 3 Cenas de 9 Segundos (Total 27s)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Cena 1 (0-9s)
                </span>
                <h4 className="font-bold text-white text-xs">Gancho & Curiosidade</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Primeiro contato. A mão aponta no detalhe visual mais chamativo para prender a atenção no feed.
                </p>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Cena 2 (9-18s)
                </span>
                <h4 className="font-bold text-white text-xs">Demonstração Real</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Toque leve na textura, costura, botão ou acabamento, provando autenticidade física do produto.
                </p>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Cena 3 (18-27s)
                </span>
                <h4 className="font-bold text-white text-xs">Conclusão + CTA</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Fechamento natural para ação de compra imediata: <em>"dá uma olhada no carrinho laranja"</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Rigorous Visual Rules */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Regras Rígidas do Padrão Visual POV
            </h3>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Câmera na Testa:</strong> Lente de ação grande angular 14–16mm apontada para baixo em direção à mesa. Não é visão na altura dos olhos e não é câmera flutuante.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Composição de Mesa:</strong> A mesa domina 65–75% do enquadramento, com monitor na borda superior, camisa preta e pernas discretamente na base, e chão visível.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Movimento da Mão:</strong> O antebraço entra exclusivamente pelo canto inferior direito. Movimentos curtos (5 a 8 cm). Proibido gesticular como apresentador ou acenar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Integridade Total do Produto:</strong> A IA preserva cores, formas e texturas reais sem inventar especificações, preços, garantias ou materiais inexistentes.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3: Recommended Video AI Tools */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              Como usar os prompts nas Ferramentas de Vídeo IA
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="font-bold text-orange-400">Kling AI (v1.5 / v1.6):</span>
                <p className="text-neutral-400 mt-1">
                  Use no modo <strong>Image-to-Video</strong> anexando a foto do seu produto como primeiro frame. Cole o Prompt da cena no campo de texto, configure a proporção para <strong>9:16</strong> (vertical) e mantenha Camera Movement em Static.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="font-bold text-cyan-400">Runway Gen-3 Alpha:</span>
                <p className="text-neutral-400 mt-1">
                  Envie a imagem no slot de referência e cole o prompt em inglês. O prompt já contém comandos estritos para suprimir qualquer movimento cinematográfico excessivo.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="font-bold text-emerald-400">Luma Dream Machine & Sora:</span>
                <p className="text-neutral-400 mt-1">
                  Cole o prompt correspondente diretamente. Cada prompt é 100% autossuficiente e funciona de forma independente em qualquer motor de vídeo moderno.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Editing Tip */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Dica de Montagem no CapCut ou Premiere:</p>
              <p className="text-neutral-400 mt-1">
                Junte os 3 clipes gerados de 9 segundos em sequência direta (sem transições chamativas). Grave ou adicione a locução em áudio com a fala em Português do Brasil seguindo o ritmo do simulador de voz de 9s desta aplicação!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 px-6 py-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs transition"
          >
            Entendido, Começar Criação
          </button>
        </div>
      </div>
    </div>
  );
};
