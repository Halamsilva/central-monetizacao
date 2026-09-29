import React from 'react';
import { User, Image as ImageIcon, Camera, BookOpen } from 'lucide-react';

export const IdentityBanner: React.FC = () => {
  return (
    <div id="identity-banner" className="border-b border-emerald-900/30 bg-[#0f1a14]/90 px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Avatar Mestre BJJ */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-900/40 bg-[#14231b]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              <User className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-200 block">Mestre de BJJ (~50 anos)</span>
              <p className="text-[11px] text-emerald-300/70 line-clamp-2 mt-0.5">
                Físico musculoso, orelhas de couve-flor autênticas, rashguard cinza BJJ, aliança de ouro na mão esquerda.
              </p>
            </div>
          </div>

          {/* Cenário Dojo com 3 Bandeiras */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-900/40 bg-[#14231b]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-amber-400 border border-emerald-800/40">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-200 block">Dojo BJJ • 3 Bandeiras</span>
              <p className="text-[11px] text-emerald-300/70 line-clamp-2 mt-0.5">
                Tatames cinza e pretos, banco de madeira e 3 bandeiras na parede: 1. Brasil, 2. EUA, 3. Israel.
              </p>
            </div>
          </div>

          {/* Câmera & Gancho com Modelo Colossal */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-900/40 bg-[#1e1c12]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-950 text-amber-300 border border-amber-800/40">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-amber-200 block flex items-center gap-1">
                <span>Modelo Colossal & Despejo</span>
              </span>
              <p className="text-[11px] text-amber-300/70 line-clamp-2 mt-0.5">
                Objeto gigante ocupa 55-65% da tela 9:16 com despejo visceral de líquido reagente no segundo 00:00.
              </p>
            </div>
          </div>

          {/* Livro & CTA */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-900/40 bg-[#14231b]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-200 block">Livro Físico / CTA Personalizado</span>
              <p className="text-[11px] text-emerald-300/70 line-clamp-2 mt-0.5">
                Livro físico exibido com as duas mãos no prompt final de CTA (ou modo 100% orgânico sem venda).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
