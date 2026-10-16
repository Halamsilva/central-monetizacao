import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
} from 'lucide-react';
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from '../lib/support';

const STEPS = [
  {
    icon: Mail,
    title: 'Use o MESMO e-mail da compra',
    text: 'Ao criar sua conta aqui, use exatamente o mesmo e-mail que você usou na compra na Kiwify.',
  },
  {
    icon: CheckCircle2,
    title: 'Crie sua conta',
    text: 'Clique em "Criar minha conta", coloque seu nome, o e-mail da compra e uma senha.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso liberado na hora',
    text: 'Pronto! O sistema confere sua compra pelo e-mail e libera o acesso automaticamente.',
  },
];

const FAQ = [
  {
    question: 'Ainda não recebi nenhum e-mail. O que eu faço?',
    answer:
      'Procure "Central Monetização" na caixa de entrada e também na pasta SPAM. O link desta página também está dentro da sua área de compras na Kiwify.',
  },
  {
    question: 'Criei a conta mas continua "em análise".',
    answer:
      'Na maioria dos casos a conta foi criada com um e-mail diferente do usado na compra. Crie uma conta nova com o e-mail exato da Kiwify ou chame o suporte no WhatsApp.',
  },
  {
    question: 'Posso usar a plataforma no celular?',
    answer:
      'Sim! A plataforma foi feita para funcionar no celular e no computador. Basta abrir o site e entrar com a sua conta.',
  },
];

const BoasVindas: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-200">
            CM
          </div>
          <p className="mt-4 text-2xl font-black uppercase tracking-tight text-slate-900">
            CENTRAL <span className="text-blue-600">MONETIZAÇÃO</span>
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PartyPopper size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Compra aprovada! 🎉
            </h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              Falta só 1 passo pra liberar o seu acesso à plataforma.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {step.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <ShieldCheck className="mt-0.5 shrink-0 text-amber-500" size={18} />
            <p className="font-semibold">
              Atenção: use o <strong>mesmo e-mail da compra</strong>. Se você criar a
              conta com outro e-mail, o acesso não é liberado automaticamente.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              to="/register"
              className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Criar minha conta
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/login"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Já tenho conta — fazer login
            </Link>

            <a
              href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle size={17} />
              Falar com o suporte no WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-black text-slate-900">
            Perguntas frequentes
          </h2>

          <div className="mt-4 space-y-4">
            {FAQ.map((item) => (
              <div key={item.question}>
                <p className="text-sm font-bold text-slate-800">{item.question}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-slate-400">
          Central Monetização — todos os agentes de IA em um só lugar.
        </p>
      </div>
    </div>
  );
};

export default BoasVindas;
