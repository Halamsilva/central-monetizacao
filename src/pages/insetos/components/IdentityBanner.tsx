import React from 'react';
import { User, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

export const IdentityBanner: React.FC = () => {
  return (
    <div id="identity-banner" className="border-b border-emerald-900/30 bg-[#0f1a14]/90 px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Especialista em Bio-Defesa */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-900/40 bg-[#14231b]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              <User className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-200 block">Especialista em Bio-Defesa</span>
              <p className="text-[11px] text-emerald-300/70 line-clamp-2 mt-0.5">
                Especialista veterano (~50 anos), polo utilitária escura com patch "BIO-DEFESA", autoridade e didatismo magnético.
              </p>
            </div>
          </div>

          {/* Cenário Bancada / Oficina Doméstica */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-900/40 bg-[#14231b]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-amber-400 border border-emerald-800/40">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-200 block">Oficina & Bancada Caseira</span>
              <p className="text-[11px] text-emerald-300/70 line-clamp-2 mt-0.5">
                Bancada de madeira rústica, prateleiras com frascos de louro, cravo, vinagre, hortelã e borrifadores profissionais.
              </p>
            </div>
          </div>

          {/* Maquete Colossal & Ação Instantânea */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-900/40 bg-[#1e1c12]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-950 text-amber-300 border border-amber-800/40">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-amber-200 block flex items-center gap-1">
                <span>Maquete Colossal (60%)</span>
              </span>
              <p className="text-[11px] text-amber-300/70 line-clamp-2 mt-0.5">
                Ralos, frestas ou ninhos em primeiro plano (60% da tela 9:16) com choque de fuga ou paralisia no segundo 00:00.
              </p>
            </div>
          </div>

          {/* Livro & CTA */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-900/40 bg-[#14231b]/60 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-200 block">Livro "Casa Livre de Pragas"</span>
              <p className="text-[11px] text-emerald-300/70 line-clamp-2 mt-0.5">
                Exibição do livro com as duas mãos no prompt final de CTA (ou modo 100% orgânico sem venda comercial).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
