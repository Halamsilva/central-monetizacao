import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, User, Camera, Sparkles, Layers } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-900/60 bg-[#0c1410] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/40 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Manual Visual e Regras Fixas — Receitas Anti-Pragas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-emerald-400 hover:bg-emerald-900/40 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5 text-xs text-emerald-200/90 leading-relaxed">
          {/* Section 1 */}
          <div className="rounded-xl border border-emerald-900/40 bg-[#121f18] p-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Estrutura dos Vídeos Virais — 3 a 8 Prompts × 8s (9:16, 4K, 30fps)</span>
            </h3>
            <p className="text-[11px] text-emerald-300/80 mb-2.5">
              O usuário pode escolher a quantidade exata de prompts (de 3 a 8 prompts de 8s cada, de 24s a 64s no total) e optar por incluir ou não a chamada para ação (CTA) com o livro físico no final. Na fórmula completa de 8 prompts:
            </p>
            <ul className="space-y-2 pl-2 list-disc list-inside text-emerald-200/80">
              <li><strong>PROMPT 1 (00:00 - 00:08):</strong> Gancho Chocante com Maquete Colossal & Ação Visceral — Ralo, fresta escura ou ninho de pragas COLOSSAL ocupa de 55% a 65% do enquadramento vertical 9:16 em primeiro plano extremo. No segundo 00:00 EXATO, o especialista executa ação imediata (borrifação de choque, pó ou isca) com debandada ou paralisia das pragas e fala impactante direta.</li>
              <li><strong>PROMPT 2 (00:08 - 00:16):</strong> Explicação do Problema (Onde Elas se Escondem e Por Que Venenos Falham) — Especialista debruçado sobre a maquete aponta para os ovos, frestas e biologia dos insetos/roedores, alertando por que sprays químicos apenas espalham a infestação pela casa.</li>
              <li><strong>PROMPT 3 (00:16 - 00:24):</strong> Ingredientes Caseiros da Receita na Bancada — Mostra e cita na bancada os ingredientes simples da cozinha (bicarbonato, açúcar, louro, cravo, vinagre, hortelã, borra de café, etc.), destacando sua ação biológica letal ou repelente contra as pragas e segurança para a família.</li>
              <li><strong>PROMPT 4 (00:24 - 00:32):</strong> Preparo Parte 1: Base & Sincronização Labial ao Vivo (Anti-Locutor) — Especialista em plano médio conversando olho no olho na câmera com sincronização labial perfeita: inicia o preparo da mistura, tônico ou isca na tigela/frasco sobre a bancada.</li>
              <li><strong>PROMPT 5 (00:32 - 00:40):</strong> Preparo Parte 2: Continuação Direta na Mesma Tigela/Recipiente & Potencialização — Continua diretamente no mesmo recipiente com os ingredientes anteriores, adicionando os óleos essenciais ou bioativos ativos e homogeneizando a mistura.</li>
              <li><strong>PROMPT 6 (00:40 - 00:48):</strong> Quantidade Exata de Ingredientes e Pontos Estratégicos de Aplicação — Especialista detalha diretamente na câmera as medidas exatas de cada ingrediente e ensina os locais exatos onde aplicar (ralos, frestas, forros, rodapés, atrás de eletrodomésticos).</li>
              <li><strong>PROMPT 7 (00:48 - 00:56):</strong> Comprovação Prática & Casa Livre de Pragas — Especialista mostra o local agora 100% limpo e livre de insetos/ratos, relatando o alívio imediato e a proteção de crianças e animais de estimação.</li>
              <li><strong>PROMPT 8 / FINAL (com CTA):</strong> Chamada para Ação com Livro Físico "CASA LIVRE DE PRAGAS" — O especialista ergue o livro físico nas duas mãos e convida o público com o gatilho "Comenta EU QUERO aqui embaixo que te mando no privado... Garante o teu!". Caso o usuário escolha <em>Sem CTA</em>, o vídeo conclui de forma 100% orgânica sem menção a livros ou vendas.</li>
            </ul>

            {/* Regra de Ouro para Poucos Prompts */}
            <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-[11px] text-amber-200">
              <strong className="text-amber-300 block mb-1 font-bold flex items-center gap-1.5">
                <span>⚡ REGRA DE OURO PARA POUCOS PROMPTS (3 A 5 PROMPTS):</span>
              </strong>
              <p className="mb-1.5">
                Sempre que o usuário escolher poucos prompts (especialmente 3 ou 4 prompts), o roteiro se adapta automaticamente para dinamismo e retenção imediata:
              </p>
              <ul className="space-y-1 pl-3 list-disc list-inside text-amber-100/90 font-mono text-[10px]">
                <li><strong>PROMPT 1:</strong> Gancho Chocante com Maquete Colossal (60% da tela) e ação no segundo 00:00.</li>
                <li><strong>PROMPT 2:</strong> Já entra direto mostrando e falando os nomes dos ingredientes na bancada (sem enrolação de ninhos).</li>
                <li><strong>PROMPT 3:</strong> Preparo rápido ao vivo na tigela/borrifador & modo de aplicação imediata!</li>
                <li><strong>PROMPT 4 / 5 (se selecionados):</strong> Finalização com CTA do Livro ou Comprovação prática da casa protegida.</li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="rounded-xl border border-emerald-900/40 bg-[#121f18] p-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Apresentador Oficial: Especialista em Bio-Defesa & Pele Humana Real</span>
            </h3>
            <p className="mb-2">
              <strong>Identidade Fixa:</strong> Especialista brasileiro veterano em controle biológico de pragas, ~50 anos, porte físico forte e experiente, ombros largos e antebraços firmes com veias de quem trabalha com as mãos. Cabelo curto grisalho aparado nas laterais, barba rala estilosa, traços marcantes, pele morena média brasileira com marcas naturais de expressão e aliança dourada na mão esquerda. Veste <strong>camisa polo utilitária escura com patch "BIO-DEFESA" no peito esquerdo</strong> e calça cargo de trabalho.
            </p>
            <p className="text-amber-300/90 font-medium">
              <strong>Regra de Ouro:</strong> NUNCA escrever "same character" ou "mesma descrição". CADA prompt repete integralmente os detalhes biológicos da pele (poros irregulares, pelos corporais, linhas faciais, sem filtro de cera ou plástico) e mãos com 5 dedos e aliança no anelar esquerdo.
            </p>
          </div>

          {/* Section 3 */}
          <div className="rounded-xl border border-emerald-900/40 bg-[#121f18] p-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>Cenário Oficial: Oficina & Bancada Caseira de Demonstração</span>
            </h3>
            <ul className="space-y-1.5 pl-2 list-disc list-inside text-emerald-200/80">
              <li>Oficina / estúdio organizado de bio-defesa caseira com piso de ladrilho rústico cinza-ardósia.</li>
              <li>Prateleiras de madeira rústica ao fundo com frascos de vidro etiquetados (louro, cravo, vinagre, hortelã, bicarbonato e borrifadores profissionais).</li>
              <li>Bancada sólida de madeira clara no primeiro plano onde as maquetes de ralos/frestas e os ingredientes são manipulados.</li>
              <li>Câmera vertical 9:16, 4K, 30fps com lente ultra-wide 20–24mm no gancho (maquete colossal ocupando 55% a 65% do enquadramento).</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="rounded-xl border border-red-900/40 bg-[#191012] p-4">
            <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>Regra Crítica Inegociável: Sem Legendas e Sem Textos nos Vídeos</span>
            </h3>
            <p className="text-red-200/90 mb-2">
              <strong>Zero Text Overlays / Zero Subtitles:</strong> Os vídeos devem ser gravações cinematográficas 100% limpas de texto gerado ou sobreposto na tela. É estritamente proibido exibir legendas (subtitles/captions), closed captions, letreiros, tarjas, letterings, lower thirds, títulos digitais ou marcas na imagem.
            </p>
            <p className="text-emerald-300/90 font-medium">
              <strong>Fala 100% Sincronizada ao Vivo:</strong> A fala do especialista é articulada diretamente pelos movimentos dos lábios (lip-sync) e fornecida em áudio/dublagem, mantendo a autenticidade crua e viral de filmagem real sem poluição visual. O único elemento gráfico permitido é o título impresso na capa do livro físico no Prompt final e o patch da camisa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-emerald-900/40 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
