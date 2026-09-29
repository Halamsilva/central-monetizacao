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
              Manual Visual e Regras Fixas — Corpo Revelado
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
              <li><strong>PROMPT 1 (00:00 - 00:08):</strong> Gancho Chocante com Modelo Colossal & Ação Visceral — Objeto educacional COLOSSAL ocupa de 55% a 65% do enquadramento vertical 9:16 em primeiro plano extremo. No segundo 00:00 EXATO, o apresentador executa ação visceral com fala impactante direta.</li>
              <li><strong>PROMPT 2 (00:08 - 00:16):</strong> Explicação do Problema (O Que É o Problema) — Apresentador debruçado sobre o modelo colossal aponta com precisão anatômica para a patologia interna dissecada, explicando de forma simples e assustadora o que está acontecendo no corpo e os sintomas.</li>
              <li><strong>PROMPT 3 (00:16 - 00:24):</strong> Ingredientes Caseiros da Cura na Bancada — Apresentador mostra e fala no banco de madeira quais são os ingredientes caseiros simples que combatem o problema na raiz, apontando e destacando os compostos bioativos naturais (100% em conformidade com as diretrizes das plataformas).</li>
              <li><strong>PROMPT 4 (00:24 - 00:32):</strong> Preparo Parte 1: Base & Sincronização Labial ao Vivo (Anti-Locutor) — Apresentador em plano médio conversando olho no olho na câmera com sincronização labial perfeita: inicia o preparo na panela inox sobre o fogão elétrico portátil.</li>
              <li><strong>PROMPT 5 (00:32 - 00:40):</strong> Preparo Parte 2: Continuação Direta na Panela & Bioativos — Continua na mesma panela com a infusão fervendo, adicionando os compostos bioativos concentrados e mexendo com o mesmo utensílio.</li>
              <li><strong>PROMPT 6 (00:40 - 00:48):</strong> Quantidade de Ingredientes e Tempo de Preparo para Ficar Pronto — Apresentador detalha diretamente na câmera as medidas exatas de cada ingrediente (colheres, ml, copos, gotas) e o tempo exato de fervura ou infusão em fogo brando para extrair o máximo de bioativos.</li>
              <li><strong>PROMPT 7 (00:48 - 00:56):</strong> Uso, Degustação & Relato de Cura — Apresentador degusta a receita com satisfação, compartilha a dosagem correta e um relato real de alívio e desobstrução.</li>
              <li><strong>PROMPT 8 / FINAL (com CTA):</strong> Chamada para Ação com Livro Físico — O apresentador ergue o livro físico nas duas mãos e convida o público com o gatilho "Comenta EU QUERO aqui embaixo que te mando no privado... Garante o teu!". Caso o usuário escolha <em>Sem CTA</em>, o vídeo conclui de forma 100% orgânica sem menção a livros ou vendas.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="rounded-xl border border-emerald-900/40 bg-[#121f18] p-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Apresentador Oficial: Mestre de BJJ & Pele Humana Real</span>
            </h3>
            <p className="mb-2">
              <strong>Identidade Fixa:</strong> Mestre brasileiro veterano de artes marciais, ~50 anos, porte físico musculoso de lutador, ombros largos e peitoral desenvolvido, antebraços fortes com vascularização visível, <strong>orelhas de couve-flor autênticas (cauliflower ears)</strong>. Cabelo curto grisalho aparado nas laterais, barba rala grisalha estilosa, traços marcantes, pele morena média brasileira com marcas naturais de expressão e aliança dourada na mão esquerda. Veste <strong>rashguard / camiseta de compressão cinza mescla (heather-gray) com letras "BJJ" em preto e branco no peito esquerdo</strong> e bermuda de treino preta.
            </p>
            <p className="text-amber-300/90 font-medium">
              <strong>Regra de Ouro:</strong> NUNCA escrever "same character" ou "mesma descrição". CADA prompt repete integralmente os detalhes biológicos da pele (poros irregulares, pelos corporais, linhas faciais, sem filtro de cera ou plástico) e mãos com 5 dedos e aliança no anelar esquerdo.
            </p>
          </div>

          {/* Section 3 */}
          <div className="rounded-xl border border-emerald-900/40 bg-[#121f18] p-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>Cenário Oficial: Dojo de BJJ com as 3 Bandeiras</span>
            </h3>
            <ul className="space-y-1.5 pl-2 list-disc list-inside text-emerald-200/80">
              <li>Academia / Dojo autêntico de Brazilian Jiu-Jitsu (BJJ) com tatames cinza no chão e protetores de tatami pretos na parede inferior.</li>
              <li>Parede superior clara com janelas altas e luz natural abundante combinada com iluminação de teto.</li>
              <li><strong>AS 3 BANDEIRAS NACIONAIS PENDURADAS NA PAREDE DE FUNDO NA ORDEM EXATA:</strong> 1. Bandeira do Brasil (esquerda), 2. Bandeira dos Estados Unidos (centro), 3. Bandeira de Israel (direita).</li>
              <li>Bancada / banco rústico de madeira clara no primeiro plano onde os modelos e os ingredientes são manipulados.</li>
              <li>Câmera vertical 9:16, 4K, 30fps com lente ultra-wide 20–24mm no gancho (modelo colossal ocupando 55% a 65% do enquadramento).</li>
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
              <strong>Fala 100% Sincronizada ao Vivo:</strong> A fala do apresentador é articulada diretamente pelos movimentos dos lábios (lip-sync) e fornecida em áudio/dublagem, mantendo a autenticidade crua e viral de filmagem real sem poluição visual. O único elemento gráfico permitido é o título impresso na capa do livro físico no Prompt 7 e o logo da camiseta.
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
