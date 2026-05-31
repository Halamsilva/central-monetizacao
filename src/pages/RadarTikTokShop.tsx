import React, { useState } from 'react';
import { ExternalLink, RefreshCw, ScanSearch, ShieldCheck } from 'lucide-react';

const radarUrl = 'https://radar-shop-br.vercel.app';

const RadarTikTokShop: React.FC = () => {
  const [frameKey, setFrameKey] = useState(0);

  return (
    <div className="-mx-2 -my-3 min-h-[calc(100vh-7rem)] bg-slate-50 px-3 py-5 sm:-mx-6 sm:-my-6 sm:px-6 lg:-mx-8 lg:-my-8 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <ScanSearch size={24} />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  <ShieldCheck size={13} />
                  Area para alunos
                </div>
                <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                  Radar TikTok Shop
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-600">
                  Analise produtos e oportunidades do TikTok Shop sem sair da Central.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setFrameKey((current) => current + 1)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Recarregar
              </button>

              <a
                href={radarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-orange-600"
              >
                <ExternalLink size={17} />
                Abrir em nova aba
              </a>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
            key={frameKey}
            title="Radar TikTok Shop"
            src={radarUrl}
            className="h-[calc(100vh-17rem)] min-h-[680px] w-full bg-white"
            allow="clipboard-read; clipboard-write; fullscreen"
          />
        </section>
      </div>
    </div>
  );
};

export default RadarTikTokShop;
