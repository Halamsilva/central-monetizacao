/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useId } from 'react';
import {
  ExternalLink,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Calculator,
  CheckCircle2,
  BookmarkPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  TrendingUp,
  DollarSign,
  AlertCircle
} from 'lucide-react';

const radarUrl = 'https://radar-shop-br.vercel.app';

interface SavedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  notes: string;
  status: 'analise' | 'aprovado' | 'descartado';
  createdAt: string;
}

export default function RadarTikTokShop() {
  const [frameKey, setFrameKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<'none' | 'calc' | 'criteria' | 'notes'>('none');

  // Calculator State
  const [sellingPrice, setSellingPrice] = useState<number>(89.90);
  const [productCost, setProductCost] = useState<number>(24.50);
  const [shippingCost, setShippingCost] = useState<number>(14.00);
  const [tiktokFeePercent, setTiktokFeePercent] = useState<number>(6.0); // TikTok Shop fee standard
  const [taxPercent, setTaxPercent] = useState<number>(4.0); // Simples Nacional / Imposto
  const [targetRoas, setTargetRoas] = useState<number>(2.5);

  // Notes / Saved Products State
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>(() => {
    try {
      const stored = localStorage.getItem('tiktok_radar_saved_products');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: '1',
        name: 'Mini Liquidificador Portátil USB',
        category: 'Cozinha / Fitness',
        price: 79.9,
        cost: 21.0,
        notes: 'Vídeos com mais de 2M visualizações nos últimos 7 dias. Margem boa para tráfego pago.',
        status: 'aprovado',
        createdAt: '24/09/2026'
      }
    ];
  });

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductNotes, setNewProductNotes] = useState('');

  // Unique IDs for form labels
  const priceInputId = useId();
  const costInputId = useId();
  const shippingInputId = useId();
  const feeInputId = useId();
  const taxInputId = useId();
  const roasInputId = useId();
  const newNameId = useId();
  const newCatId = useId();
  const newPriceId = useId();
  const newCostId = useId();
  const newNotesId = useId();

  useEffect(() => {
    try {
      localStorage.setItem('tiktok_radar_saved_products', JSON.stringify(savedProducts));
    } catch {
      // ignore
    }
  }, [savedProducts]);

  // Handle iframe reload
  const handleReload = () => {
    setIsLoading(true);
    setFrameKey((prev) => prev + 1);
  };

  // Math for TikTok Shop margin
  const tiktokFeeValue = (sellingPrice * tiktokFeePercent) / 100;
  const taxValue = (sellingPrice * taxPercent) / 100;
  const totalCostBeforeAds = productCost + shippingCost + tiktokFeeValue + taxValue;
  const maxCpa = Math.max(0, sellingPrice - totalCostBeforeAds);
  const breakEvenRoas = sellingPrice > 0 && maxCpa > 0 ? sellingPrice / maxCpa : 0;
  const estimatedAdSpend = targetRoas > 0 ? sellingPrice / targetRoas : 0;
  const netProfit = sellingPrice - totalCostBeforeAds - estimatedAdSpend;
  const netMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newProd: SavedProduct = {
      id: Date.now().toString(),
      name: newProductName.trim(),
      category: newProductCategory.trim() || 'Geral',
      price: parseFloat(newProductPrice) || 0,
      cost: parseFloat(newProductCost) || 0,
      notes: newProductNotes.trim(),
      status: 'analise',
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    setSavedProducts([newProd, ...savedProducts]);
    setNewProductName('');
    setNewProductCategory('');
    setNewProductPrice('');
    setNewProductCost('');
    setNewProductNotes('');
  };

  const handleRemoveProduct = (id: string) => {
    setSavedProducts(savedProducts.filter((p) => p.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: SavedProduct['status']) => {
    setSavedProducts(
      savedProducts.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-hidden bg-white p-2 sm:p-4' : 'px-3 py-5 sm:px-6 lg:px-8'
      }`}
    >
      <div className={`mx-auto flex flex-col gap-4 ${isFullscreen ? 'h-full max-w-full' : 'max-w-[1600px]'}`}>
        {/* Header Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm">
                <ScanSearch size={24} />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  <ShieldCheck size={13} />
                  <span>Área para alunos</span>
                </div>
                <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                  Radar TikTok Shop
                </h1>
                <p className="mt-1.5 max-w-3xl text-sm font-semibold leading-relaxed text-slate-600">
                  Analise produtos e oportunidades do TikTok Shop sem sair da Central.
                </p>
              </div>
            </div>

            {/* Quick Actions & Utilities */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Student Utilities Toggle */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'calc' ? 'none' : 'calc')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTool === 'calc'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Calculadora de Margem e ROAS TikTok Shop"
                >
                  <Calculator size={15} />
                  <span className="hidden sm:inline">Calculadora</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'criteria' ? 'none' : 'criteria')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTool === 'criteria'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Critérios de Validação de Produto Vencedor"
                >
                  <CheckCircle2 size={15} />
                  <span className="hidden sm:inline">Critérios</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'notes' ? 'none' : 'notes')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeTool === 'notes'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Produtos Salvos e Mineração"
                >
                  <BookmarkPlus size={15} />
                  <span className="hidden sm:inline">Salvos ({savedProducts.length})</span>
                </button>
              </div>

              {/* Reload Button */}
              <button
                type="button"
                onClick={handleReload}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-95"
                title="Recarregar tela do Radar"
              >
                <RefreshCw size={17} className={isLoading ? 'animate-spin text-orange-600' : ''} />
                <span>Recarregar</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                title={isFullscreen ? 'Reduzir tela' : 'Expandir tela inteira'}
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                <span className="hidden md:inline">{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</span>
              </button>

              {/* Open in new tab link */}
              <a
                href={radarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-orange-600 active:scale-95"
              >
                <ExternalLink size={17} />
                <span>Abrir em nova aba</span>
              </a>
            </div>
          </div>

          {/* Collapsible Utility: Calculadora de Margem */}
          {activeTool === 'calc' && (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 transition-all">
              <div className="mb-3 flex items-center justify-between border-b border-orange-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-orange-600" />
                  <h2 className="text-sm font-black text-slate-900">
                    Calculadora de Viabilidade TikTok Shop (R$)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTool('none')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div>
                  <label htmlFor={priceInputId} className="block text-[11px] font-bold text-slate-600">
                    Preço de Venda
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-400">
                      R$
                    </span>
                    <input
                      id={priceInputId}
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm font-bold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={costInputId} className="block text-[11px] font-bold text-slate-600">
                    Custo Produto (Forn.)
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-400">
                      R$
                    </span>
                    <input
                      id={costInputId}
                      type="number"
                      step="0.01"
                      value={productCost}
                      onChange={(e) => setProductCost(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm font-bold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={shippingInputId} className="block text-[11px] font-bold text-slate-600">
                    Frete / Embalagem
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-400">
                      R$
                    </span>
                    <input
                      id={shippingInputId}
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm font-bold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={feeInputId} className="block text-[11px] font-bold text-slate-600">
                    Taxa TikTok Shop (%)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id={feeInputId}
                      type="number"
                      step="0.5"
                      value={tiktokFeePercent}
                      onChange={(e) => setTiktokFeePercent(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-sm font-bold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={taxInputId} className="block text-[11px] font-bold text-slate-600">
                    Imposto / Simples (%)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id={taxInputId}
                      type="number"
                      step="0.5"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-sm font-bold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={roasInputId} className="block text-[11px] font-bold text-slate-600">
                    ROAS Alvo (Meta Ads)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id={roasInputId}
                      type="number"
                      step="0.1"
                      value={targetRoas}
                      onChange={(e) => setTargetRoas(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-sm font-bold tabular-nums text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 border border-orange-100">
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-500">CPA Máx. (Equilíbrio):</span>{' '}
                    <strong className="text-slate-900 tabular-nums">R$ {maxCpa.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ROAS de Break-even:</span>{' '}
                    <strong className="text-slate-900 tabular-nums">{breakEvenRoas.toFixed(2)}x</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Gasto em Anúncio Estimado:</span>{' '}
                    <strong className="text-slate-900 tabular-nums">R$ {estimatedAdSpend.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase text-slate-500">Lucro Líquido Est.</span>
                    <p
                      className={`text-base font-black tabular-nums ${
                        netProfit > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      R$ {netProfit.toFixed(2)} ({netMarginPercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Utility: Critérios de Validação */}
          {activeTool === 'criteria' && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 transition-all">
              <div className="mb-3 flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <h2 className="text-sm font-black text-slate-900">
                    Checklist de Validação: O que torna um produto vencedor no TikTok Shop?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTool('none')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">1</span>
                    Efeito "UAU" nos primeiros 3s
                  </div>
                  <p className="mt-1 text-slate-600">
                    O produto precisa de demonstração visual clara que retenha a atenção antes do usuário passar o feed.
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">2</span>
                    Margem Mínima de 60%
                  </div>
                  <p className="mt-1 text-slate-600">
                    Com margem menor, custos de tráfego, taxa da plataforma e devoluções consomem o lucro líquido rapidamente.
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">3</span>
                    Resolução de Dor Clara
                  </div>
                  <p className="mt-1 text-slate-600">
                    Produtos com apelo funcional (economia de tempo, estética, organização, alívio de dor) convertem até 4x mais.
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">4</span>
                    Faixa de Preço Impulsivo
                  </div>
                  <p className="mt-1 text-slate-600">
                    O ponto ideal de conversão direta no TikTok é entre R$ 49,90 e R$ 139,90, onde a decisão é rápida.
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">5</span>
                    Fácil Envio e Baixa Quebra
                  </div>
                  <p className="mt-1 text-slate-600">
                    Produtos leves (&lt; 600g), não perecíveis e resistentes diminuem a taxa de reembolso e o custo logístico.
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">6</span>
                    Potencial de UGC e Afiliados
                  </div>
                  <p className="mt-1 text-slate-600">
                    Criadores de conteúdo conseguem gerar dezenas de ângulos e avaliações facilmente para viralizar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Utility: Produtos Salvos */}
          {activeTool === 'notes' && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 transition-all">
              <div className="mb-3 flex items-center justify-between border-b border-indigo-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <BookmarkPlus size={18} className="text-indigo-700" />
                  <h2 className="text-sm font-black text-slate-900">
                    Produtos Minerados & Salvos na Sessão ({savedProducts.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTool('none')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Fechar
                </button>
              </div>

              {/* Quick Add Form */}
              <form onSubmit={handleAddProduct} className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label htmlFor={newNameId} className="block text-[11px] font-bold text-slate-700">Nome do Produto</label>
                  <input
                    id={newNameId}
                    type="text"
                    placeholder="Ex: Escova Elétrica Multifuncional"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={newCatId} className="block text-[11px] font-bold text-slate-700">Nicho / Categoria</label>
                  <input
                    id={newCatId}
                    type="text"
                    placeholder="Ex: Beleza & Cuidados"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor={newPriceId} className="block text-[11px] font-bold text-slate-700">Preço Venda (R$)</label>
                  <input
                    id={newPriceId}
                    type="number"
                    step="0.01"
                    placeholder="89.90"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor={newCostId} className="block text-[11px] font-bold text-slate-700">Custo Forn. (R$)</label>
                  <input
                    id={newCostId}
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-600 py-1.5 px-3 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95"
                  >
                    Salvar Produto
                  </button>
                </div>
                <div className="sm:col-span-6">
                  <label htmlFor={newNotesId} className="block text-[11px] font-bold text-slate-700">Observações / Links dos Criadores</label>
                  <input
                    id={newNotesId}
                    type="text"
                    placeholder="Ex: Bom volume de engajamento, concorrentes vendendo a R$ 99 com frete grátis."
                    value={newProductNotes}
                    onChange={(e) => setNewProductNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </form>

              {/* Products Table */}
              {savedProducts.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">Nenhum produto salvo ainda. Encontre oportunidades no radar e salve aqui!</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-indigo-100 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Produto</th>
                        <th className="py-2 px-3">Categoria</th>
                        <th className="py-2 px-3">Venda / Custo</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Notas</th>
                        <th className="py-2 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {savedProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                          <td className="py-2.5 px-3 font-semibold tabular-nums text-slate-700">
                            {p.price > 0 ? `R$ ${p.price.toFixed(2)}` : '-'} /{' '}
                            <span className="text-slate-500">{p.cost > 0 ? `R$ ${p.cost.toFixed(2)}` : '-'}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={p.status}
                              onChange={(e) => handleStatusChange(p.id, e.target.value as SavedProduct['status'])}
                              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none"
                            >
                              <option value="analise">Em Análise</option>
                              <option value="aprovado">Aprovado</option>
                              <option value="descartado">Descartado</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate text-slate-500" title={p.notes}>
                            {p.notes || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(p.id)}
                              className="text-slate-400 hover:text-rose-600 transition"
                              title="Remover produto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Embedded Iframe Container */}
        <section
          className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all ${
            isFullscreen ? 'flex-1' : ''
          }`}
        >
          {/* Subtle loading state overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <RefreshCw size={24} className="animate-spin" />
              </div>
              <p className="mt-3 text-sm font-black text-slate-900">
                Carregando Radar TikTok Shop...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Conectando à base de dados de produtos e criadores
              </p>
            </div>
          )}

          {/* Primary Iframe */}
          <iframe
            key={frameKey}
            title="Radar TikTok Shop"
            src={radarUrl}
            onLoad={() => setIsLoading(false)}
            className={`w-full bg-white transition-opacity ${
              isFullscreen ? 'h-full' : 'h-[calc(100vh-17rem)] min-h-[700px]'
            } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            allow="clipboard-read; clipboard-write; fullscreen"
          />

          {/* Quiet Fallback Bar in case of third-party cookie or CSP restrictions */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Conexão segura com a Central TikTok Shop</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Se a página não carregar devido a bloqueador de anúncios:</span>
              <a
                href={radarUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-orange-600 hover:text-orange-700 underline"
              >
                Clique aqui para abrir direto
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
