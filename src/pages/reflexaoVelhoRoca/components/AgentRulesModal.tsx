import React from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, User, Clock, Film, Volume2, HeartHandshake } from 'lucide-react';

interface AgentRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentRulesModal: React.FC<AgentRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        id="agent-rules-modal"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1b1510] border border-[#3e2c1e] rounded-2xl shadow-2xl text-[#e8ded1] p-6 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#352518]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#c26a2c]/20 text-[#e08244]">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-roca font-bold text-[#f5ebd9]">
                Diretrizes Oficiais do Agente
              </h2>
              <p className="text-xs sm:text-sm text-[#ab9b88]">
                Manual de engenharia de prompts: "Reflexões do Velho da Roça"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="btn-close-rules"
            className="p-2 rounded-lg text-[#9e8d7b] hover:text-[#f5ebd9] hover:bg-[#2c1f15] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm text-[#d4c5b3] leading-relaxed">
          {/* Section 1 */}
          <div className="p-4 rounded-xl bg-[#251b13] border border-[#3a281a]">
            <div className="flex items-center gap-2 text-base font-semibold text-[#f0ae71] mb-2">
              <User className="w-4 h-4" />
              <span>1. Personagens da Roça: Homem ou Mulher de 80 Anos</span>
            </div>
            <p className="text-xs sm:text-sm text-[#bcaba0]">
              O criador pode escolher quem falará no vídeo:
              <br />
              • <strong>👨 O Velho da Roça (Homem, 80 anos):</strong> Rosto envelhecido pelo sol, rugas profundas, barba curta e cabelos grisalhos, chapéu de palha desfiado, camisa xadrez simples, mãos calejadas da lida. Voz masculina grave, pausada e reflexiva.
              <br />
              • <strong>👵 A Velha da Roça (Mulher, 80 anos):</strong> Senhora humilde do interior, cabelos brancos presos em coque simples, pele morena clara enrugada pelo tempo, vestido de chita floral discreto, mãos firmes que já mexeram tachos e plantações. Voz feminina doce, acolhedora, maternal e confortante.
              <strong className="text-[#f5ebd9] block mt-1.5">
                Nunca rejuvenescer os personagens. Nunca transformar em atores de estúdio. Estilo estritamente documental, natural e humano.
              </strong>
            </p>

            <div className="mt-3 p-3 rounded-lg bg-[#18110b] border border-[#422c1b] space-y-1">
              <span className="text-xs font-bold text-[#84c472] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Regra para Upload de Avatar Próprio:</span>
              </span>
              <p className="text-xs text-[#debfa6] leading-relaxed">
                Sempre que você subir sua própria foto ou avatar, a IA <strong>trava a mesma identidade e características físicas exatas em 100% dos prompts</strong> gerados. Além disso, cada cena exige fotorrealismo com <strong>textura de pele humana real</strong> (micro-poros naturais visíveis, rugas orgânicas, translucidez dérmica e olhos com reflexo natural), proibindo qualquer aspecto de plástico, filtro artificial ou 3D CGI.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-xl bg-[#251b13] border border-[#3a281a]">
            <div className="flex items-center gap-2 text-base font-semibold text-[#f0ae71] mb-2">
              <Clock className="w-4 h-4" />
              <span>2. Regra de Ouro dos 9 Segundos (Máximo 8 a 9s)</span>
            </div>
            <p className="text-xs sm:text-sm text-[#bcaba0]">
              Cada fala é estritamente calibrada entre <strong>12 e 17 palavras (máximo de 8 a 9 segundos)</strong> em ritmo calmo e pausado da roça. Isso garante que a fala nunca ultrapasse 9 segundos, evitando que o áudio seja cortado ou extrapole o tempo dos clipes de vídeo gerados em IA (Sora, Kling, Runway, Luma).
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-xl bg-[#251b13] border border-[#3a281a]">
            <div className="flex items-center gap-2 text-base font-semibold text-[#f0ae71] mb-2">
              <Film className="w-4 h-4" />
              <span>3. Estética do Vídeo & Independência de Cada Prompt</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#bcaba0]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#79a665] shrink-0 mt-0.5" />
                <span>Formato vertical 9:16 (TikTok, Instagram Reels, Facebook Reels, Shorts).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#79a665] shrink-0 mt-0.5" />
                <span>Estética UGC documental realista de smartphone premium 4K HDR, luz natural da roça.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#79a665] shrink-0 mt-0.5" />
                <span>Cada prompt descreve <strong>integralmente</strong> o personagem e cenário para funcionar de forma 100% independente em geradores de IA (Sora, Kling, Runway, Luma). Nunca escrever "mesmo cenário" ou "igual ao anterior".</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#df6554] shrink-0 mt-0.5" />
                <span className="text-[#f5ebd9] font-medium">NUNCA inserir legendas, títulos, marcas d'água ou textos gráficos na tela.</span>
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="p-4 rounded-xl bg-[#251b13] border border-[#3a281a]">
            <div className="flex items-center gap-2 text-base font-semibold text-[#f0ae71] mb-2">
              <Volume2 className="w-4 h-4" />
              <span>4. Voz & Tom da Reflexão</span>
            </div>
            <p className="text-xs sm:text-sm text-[#bcaba0]">
              Português brasileiro autêntico, voz masculina idosa, calma, grave e reflexiva com sotaque rural natural discreto. Fala simples e profunda com metáforas do campo (semente, chuva, terra, raiz). Sem termos sofisticados, sem tom corporativo ou discurso de coach.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-4 rounded-xl bg-[#251b13] border border-[#3a281a]">
            <div className="flex items-center gap-2 text-base font-semibold text-[#f0ae71] mb-2">
              <HeartHandshake className="w-4 h-4" />
              <span>5. Estrutura Progressiva da Reflexão</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#d1c1af]">
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">1. Gancho forte</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">2. Apresentação da ideia</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">3. Aprofundamento</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">4. Consequência</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">5. Frase emocional</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">6. Conselho humilde</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">7. Conclusão marcante</span>
              <span className="p-2 rounded bg-[#1e150f] border border-[#352518]">8. Fé e paz em Deus</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#352518] flex justify-end">
          <button
            onClick={onClose}
            id="btn-understand-rules"
            className="px-5 py-2.5 rounded-xl bg-[#c26a2c] hover:bg-[#d97730] text-white font-medium text-sm transition-colors shadow-md"
          >
            Entendido, vamos criar!
          </button>
        </div>
      </div>
    </div>
  );
};
