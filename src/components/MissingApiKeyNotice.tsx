import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Settings, X } from 'lucide-react';
import { MISSING_API_KEY_EVENT } from '../lib/missingApiKey';

const MissingApiKeyNotice: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handle = () => setOpen(true);

    window.addEventListener(MISSING_API_KEY_EVENT, handle);
    return () => window.removeEventListener(MISSING_API_KEY_EVENT, handle);
  }, []);

  if (!open) return null;

  const goToSettings = () => {
    setOpen(false);
    navigate('/settings');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <KeyRound size={24} />
          </span>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar aviso"
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-black text-slate-900">
          Cadastre sua chave de IA
        </h2>

        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
          Para usar os agentes voce precisa da sua propria chave do Google AI Studio
          (ela e gratuita e fica na sua conta). Assim cada aluno usa a propria API e a
          cota do administrador nunca e gasta.
        </p>

        <ol className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs font-medium leading-relaxed text-slate-600">
          <li>1. Crie a chave em ai.google.dev (Free).</li>
          <li>2. No painel, va em Configuracoes e cole a chave.</li>
          <li>3. Volte aqui e gere novamente.</li>
        </ol>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={goToSettings}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <Settings size={18} />
            Ir para Configuracoes
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissingApiKeyNotice;