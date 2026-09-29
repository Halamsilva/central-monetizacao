import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, Sparkles, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SubscriptionOffer = {
  title: string;
  subtitle: string;
  price: string;
  benefits: string[];
  checkoutUrl: string;
};

const DEFAULT_OFFER: SubscriptionOffer = {
  title: 'Acesso à Plataforma',
  subtitle: 'Use todos os agentes de IA da Central Monetização — sem precisar do curso completo.',
  price: 'R$ 47/mês',
  benefits: [
    'Acesso a todos os agentes de IA da plataforma',
    'Novos agentes adicionados toda semana',
    'Use no seu ritmo, quando quiser',
    'Cancele quando quiser, sem burocracia',
  ],
  checkoutUrl: '',
};

const Assinar: React.FC = () => {
  const [offer, setOffer] = useState<SubscriptionOffer>(DEFAULT_OFFER);
  const [loading, setLoading] = useState(true);

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
            benefits: Array.isArray(value.benefits) && value.benefits.length
              ? value.benefits.map((item: unknown) => String(item))
              : DEFAULT_OFFER.benefits,
            checkoutUrl: String(value.checkoutUrl || ''),
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#141414] to-[#0f0f0f] shadow-2xl">
          <div className="border-b border-white/10 p-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-[#f27d26]/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#f27d26]">
              <Sparkles size={14} />
              Assinatura
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">{offer.title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              {offer.subtitle}
            </p>
          </div>

          <div className="grid gap-8 p-8 sm:grid-cols-2">
            <div>
              <ul className="space-y-3">
                {offer.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mb-1 flex items-center justify-center gap-1 text-[#f27d26]">
                <Star size={16} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-wide">Plano único</span>
              </div>
              <p className="mt-2 text-3xl font-black text-white">{offer.price}</p>

              {loading ? (
                <div className="mt-6 flex h-14 items-center justify-center rounded-2xl bg-white/10">
                  <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                </div>
              ) : offer.checkoutUrl ? (
                <a
                  href={offer.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#f27d26] text-sm font-black text-black transition hover:brightness-110"
                >
                  <CreditCard size={18} />
                  Assinar agora
                </a>
              ) : (
                <div className="mt-6 flex h-14 items-center justify-center rounded-2xl border border-dashed border-white/20 text-sm font-bold text-slate-500">
                  Link de assinatura em breve
                </div>
              )}

              <p className="mt-3 text-[11px] font-semibold text-slate-500">
                Pagamento seguro. Após assinar, use o mesmo e-mail aqui para liberar o acesso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assinar;
