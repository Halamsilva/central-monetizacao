import React, { useEffect, useState } from 'react';
import { Check, Loader2, Save, Youtube } from 'lucide-react';
import { supabase } from '../lib/supabase';

type OfferForm = {
  title: string;
  subtitle: string;
  price: string;
  annualPrice: string;
  annualMonthly: string;
  coursePrice: string;
  checkoutUrl: string;
  annualCheckoutUrl: string;
  courseCheckoutUrl: string;
  videoUrl: string;
  benefitsText: string;
};

const EMPTY_FORM: OfferForm = {
  title: 'Acesso à Plataforma',
  subtitle:
    'Destrave todos os agentes de IA da Central Monetização e produza conteúdo em minutos — sem precisar comprar o curso completo.',
  price: 'R$ 47/mês',
  annualPrice: 'R$ 347/ano',
  annualMonthly: 'R$ 29/mês',
  coursePrice: 'R$ 297',
  checkoutUrl: '',
  annualCheckoutUrl: '',
  courseCheckoutUrl: '',
  videoUrl: '',
  benefitsText: '',
};

const AdminSubscription: React.FC = () => {
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'subscription_offer')
          .maybeSingle();

        const value = data?.value;

        if (value && typeof value === 'object') {
          setForm({
            title: String(value.title || EMPTY_FORM.title),
            subtitle: String(value.subtitle || EMPTY_FORM.subtitle),
            price: String(value.price || EMPTY_FORM.price),
            annualPrice: String(value.annualPrice || EMPTY_FORM.annualPrice),
            annualMonthly: String(value.annualMonthly || EMPTY_FORM.annualMonthly),
            coursePrice: String(value.coursePrice || EMPTY_FORM.coursePrice),
            checkoutUrl: String(value.checkoutUrl || ''),
            annualCheckoutUrl: String(value.annualCheckoutUrl || ''),
            courseCheckoutUrl: String(value.courseCheckoutUrl || ''),
            videoUrl: String(value.videoUrl || ''),
            benefitsText: Array.isArray(value.benefits) ? value.benefits.join('\n') : '',
          });
        }
      } catch {
        /* mantem padrao */
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const update = (key: keyof OfferForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);

    const value = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      price: form.price.trim(),
      annualPrice: form.annualPrice.trim(),
      annualMonthly: form.annualMonthly.trim(),
      coursePrice: form.coursePrice.trim(),
      checkoutUrl: form.checkoutUrl.trim(),
      annualCheckoutUrl: form.annualCheckoutUrl.trim(),
      courseCheckoutUrl: form.courseCheckoutUrl.trim(),
      videoUrl: form.videoUrl.trim(),
      benefits: form.benefitsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };

    const { error } = await supabase.from('app_settings').insert({
      id: 'subscription_offer',
      key: 'subscription_offer',
      value,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: 'Não foi possível salvar. Tente novamente.' });
      return;
    }

    setMessage({ type: 'success', text: 'Página de assinatura atualizada!' });
  };

  const field = (
    label: string,
    key: keyof OfferForm,
    placeholder = '',
    type = 'text'
  ) => (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Página de Assinatura</h1>
        <p className="mt-2 text-slate-500">
          Edite o que aparece na página <strong>/assinar</strong> — inclusive o vídeo de vendas.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.type === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          <Check size={18} />
          {message.text}
        </div>
      )}

      <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-red-600">
            <Youtube size={18} />
            Vídeo de vendas
          </div>
          <input
            type="text"
            value={form.videoUrl}
            onChange={(event) => update('videoUrl', event.target.value)}
            placeholder="Cole o link do YouTube (ex: https://www.youtube.com/watch?v=...)"
            className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm outline-none focus:border-red-400"
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Cole o link do YouTube (pode ser "não listado"). Também aceita Vimeo ou um link direto .mp4.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field('Título', 'title', 'Acesso à Plataforma')}
          {field('Preço mensal', 'price', 'R$ 47/mês')}
          {field('Preço anual', 'annualPrice', 'R$ 347/ano')}
          {field('Anual equivale a', 'annualMonthly', 'R$ 29/mês')}
          {field('Preço do curso', 'coursePrice', 'R$ 297')}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
            Subtítulo
          </span>
          <textarea
            value={form.subtitle}
            onChange={(event) => update('subtitle', event.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          {field('Link assinatura mensal', 'checkoutUrl', 'https://pay.kiwify.com.br/...')}
          {field('Link assinatura anual', 'annualCheckoutUrl', 'https://pay.kiwify.com.br/...')}
          {field('Link do curso', 'courseCheckoutUrl', 'https://pay.kiwify.com.br/...')}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
            Benefícios (um por linha)
          </span>
          <textarea
            value={form.benefitsText}
            onChange={(event) => update('benefitsText', event.target.value)}
            rows={6}
            placeholder={'Acesso a todos os agentes de IA\nNovos agentes toda semana'}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};

export default AdminSubscription;
