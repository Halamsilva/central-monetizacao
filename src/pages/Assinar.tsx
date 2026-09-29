import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  CreditCard,
  Infinity as InfinityIcon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type SubscriptionOffer = {
  title: string;
  subtitle: string;
  price: string;
  annualPrice: string;
  annualMonthly: string;
  benefits: string[];
  checkoutUrl: string;
  annualCheckoutUrl: string;
};

const DEFAULT_OFFER: SubscriptionOffer = {
  title: 'Acesso à Plataforma',
  subtitle:
    'Destrave todos os agentes de IA da Central Monetização e produza conteúdo em minutos — sem precisar comprar o curso completo.',
  price: 'R$ 47/mês',
  annualPrice: 'R$ 347/ano',
  annualMonthly: 'R$ 29/mês',
  benefits: [
    'Acesso a TODOS os agentes de IA da plataforma',
    'Novos agentes adicionados toda semana',
    'Menina da Roça, Clonagem de Vídeo e Prompts Virais',
    'Ferramentas prontas para TikTok Shop, Facebook e YouTube',
    'Atualizações e melhorias contínuas',
    'Acesso pelo seu e-mail, direto no site',
  ],
  checkoutUrl: '',
  annualCheckoutUrl: '',
};

const FAQ = [
  {
    q: 'Preciso comprar o curso completo?',
    a: 'Não. Esta assinatura dá acesso à plataforma de agentes de IA separadamente. O curso é outra opção, para quem quer aprender o passo a passo completo.',
  },
  {
    q: 'Como recebo meu acesso?',
    a: 'Após assinar, crie sua conta no site com o MESMO e-mail da compra. O acesso é liberado automaticamente.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, sem burocracia. Ao cancelar, você mantém o acesso até o fim do período já pago.',
  },
  {
    q: 'Tem limite de uso?',
    a: 'Você usa os agentes dentro das regras da plataforma. Para os agentes de IA, você pode conectar sua própria chave gratuita do Google AI Studio.',
  },
];

const Assinar: React.FC = () => {
  const [offer, setOffer] = useState<SubscriptionOffer>(DEFAULT_OFFER);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const loadOffer = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'subscription_offer')
          .maybeSingle();

        const value = data?.value;

        if (value && typeof value === 'object') {
          setOffer({
            title: String(value.title || DEFAULT_OFFER.title),
            subtitle: String(value.subtitle || DEFAULT_OFFER.subtitle),
            price: String(value.price || DEFAULT_OFFER.price),
            annualPrice: String(value.annualPrice || DEFAULT_OFFER.annualPrice),
            annualMonthly: String(value.annualMonthly || DEFAULT_OFFER.annualMonthly),
            benefits:
              Array.isArray(value.benefits) && value.benefits.length
                ? value.benefits.map((item: unknown) => String(item))
                : DEFAULT_OFFER.benefits,
            checkoutUrl: String(value.checkoutUrl || ''),
            annualCheckoutUrl: String(value.annualCheckoutUrl || ''),
          });
        }
      } catch {
        setOffer(DEFAULT_OFFER);
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, []);

  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      {/* HERO */}
      <section className="relative overflow-hidden px-4 pb-14 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(242,125,38,0.28),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f27d26]/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#f27d26]">
            <Sparkles size={14} />
            Central Monetização · Assinatura
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-6xl">
            Todos os <span className="text-[#f27d26]">agentes de IA</span> na sua mão
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {offer.subtitle}
          </p>

          <button
            type="button"
            onClick={scrollToPlans}
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#f27d26] px-8 text-base font-black text-black transition hover:brightness-110"
          >
            <CreditCard size={20} />
            Quero meu acesso agora
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Pagamento seguro
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw size={14} className="text-emerald-400" /> Cancele quando quiser
            </span>
            <span className="inline-flex items-center gap-1.5">
              <InfinityIcon size={14} className="text-emerald-400" /> Acesso imediato
            </span>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-center text-2xl font-black sm:text-3xl">
              O que você recebe
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {offer.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check size={14} />
                  </span>
                  <span className="text-sm font-semibold text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="scroll-mt-10 px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-400">
              <Zap size={14} />
              Escolha seu plano
            </div>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">Comece hoje mesmo</h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Mensal */}
            <div className="flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Mensal
              </p>
              <p className="mt-3 text-4xl font-black text-white">{offer.price}</p>
              <p className="mt-1 text-sm text-slate-500">Renovação automática</p>

              <ul className="mt-6 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400" /> Acesso completo à plataforma
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400" /> Novos agentes toda semana
                </li>
              </ul>

              {loading ? (
                <div className="mt-8 h-14 animate-pulse rounded-2xl bg-white/10" />
              ) : offer.checkoutUrl ? (
                <a
                  href={offer.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Assinar mensal
                </a>
              ) : (
                <div className="mt-8 flex h-14 items-center justify-center rounded-2xl border border-dashed border-white/20 text-sm font-bold text-slate-500">
                  Em breve
                </div>
              )}
            </div>

            {/* Anual */}
            <div className="relative flex flex-col rounded-[1.75rem] border-2 border-[#f27d26] bg-gradient-to-b from-[#f27d26]/10 to-transparent p-7 shadow-[0_0_60px_-20px_rgba(242,125,38,0.6)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f27d26] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black">
                  <Star size={12} fill="currentColor" /> Mais vantajoso
                </span>
              </div>

              <p className="text-xs font-black uppercase tracking-widest text-[#f27d26]">
                Anual
              </p>
              <p className="mt-3 text-4xl font-black text-white">{offer.annualPrice}</p>
              <p className="mt-1 text-sm text-slate-400">
                equivale a <strong className="text-slate-200">{offer.annualMonthly}</strong> · economize muito
              </p>

              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400" /> Tudo do plano mensal
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400" /> 12 meses garantidos pelo menor preço
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400" /> Sem preocupação com renovação mensal
                </li>
              </ul>

              {loading ? (
                <div className="mt-8 h-14 animate-pulse rounded-2xl bg-white/10" />
              ) : offer.annualCheckoutUrl ? (
                <a
                  href={offer.annualCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#f27d26] text-sm font-black text-black transition hover:brightness-110"
                >
                  Assinar anual
                </a>
              ) : (
                <div className="mt-8 flex h-14 items-center justify-center rounded-2xl border border-dashed border-[#f27d26]/40 text-sm font-bold text-[#f27d26]/80">
                  Em breve
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-semibold text-slate-500">
            Pagamento seguro pela Kiwify. Após assinar, use o <strong>mesmo e-mail</strong> para criar sua conta no site.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Perguntas frequentes</h2>

          <div className="mt-8 space-y-3">
            {FAQ.map((item, index) => {
              const open = openFaq === index;
              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="text-sm font-black text-slate-200">{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={scrollToPlans}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#f27d26] px-8 text-base font-black text-black transition hover:brightness-110"
            >
              <CreditCard size={20} />
              Quero garantir meu acesso
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Central Monetização · Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Assinar;
