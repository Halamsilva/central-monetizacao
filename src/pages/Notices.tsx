import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Star,
  Calendar,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  link: string | null;
  is_pinned: boolean;
  is_highlighted: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  created_at: string;
  is_automated?: boolean; // Identifica se veio da tabela automática de agentes
}

const Notices: React.FC = () => {
  const { isAdmin } = useAuth();

  const [notices, setNotices] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem('notices_form_draft');
    return savedDraft ? JSON.parse(savedDraft) : { title: '', content: '', link: '', banner_url: '', is_pinned: false, is_highlighted: false };
  });

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    localStorage.setItem('notices_form_draft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const fetchNotices = async () => {
    try {
      setLoading(true);

      // 1. Puxa os comunicados tradicionais do mural
      const { data: manualAnnouncements, error: manualError } = await supabase
        .from('announcements')
        .select('*');

      if (manualError) throw manualError;

      // 2. Puxa as notificações geradas automaticamente (como novos Agentes IA)
      const { data: autoNotifications, error: autoError } = await supabase
        .from('notifications')
        .select('*');

      // Se der erro porque a tabela está vazia ou algo assim, criamos um array vazio seguro
      const safeAutoNotifications = autoError ? [] : (autoNotifications || []);

      // 3. Formata as notificações automáticas para caberem no layout de cards
      const formattedAuto = safeAutoNotifications.map((noti: any) => ({
        id: noti.id,
        title: noti.title,
        content: noti.message,
        link: '/agents', // Redireciona o aluno direto para a aba de Agentes se ele clicar
        is_pinned: false,
        is_highlighted: true, // Dá o destaque PRO azul para chamar atenção
        thumbnail_url: null,
        banner_url: null,
        created_at: noti.created_at,
        is_automated: true
      }));

      // 4. Junta tudo no mesmo mural
      const allNotices = [...(manualAnnouncements || []), ...formattedAuto];

      // 5. Ordena por fixados primeiro, e depois pelos mais recentes da fila
      allNotices.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotices(allNotices);
    } catch (err) {
      console.error('Erro ao unificar mural de avisos:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: 'title' | 'content' | 'link' | 'banner_url', value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateCheckbox = (field: 'is_pinned' | 'is_highlighted', value: boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const saveNotice = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: 'Título e Conteúdo são obrigatórios.' });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        link: formData.link.trim() || null,
        banner_url: formData.banner_url.trim() || null,
        thumbnail_url: null,
        is_pinned: formData.is_pinned,
        is_highlighted: formData.is_highlighted,
      };

      const { error } = await supabase
        .from('announcements')
        .insert([payload]);

      if (error) throw error;

      // Alimenta também a tabela de notificações globais para acender a bolinha na hora
      await supabase
        .from('notifications')
        .insert([
          {
            title: `📢 ${payload.title}`,
            message: payload.content,
            type: 'notice'
          }
        ]);

      setMessage({ type: 'success', text: 'Aviso publicado e alunos notificados com sucesso!' });

      setFormData({ title: '', content: '', link: '', banner_url: '', is_pinned: false, is_highlighted: false });
      localStorage.removeItem('notices_form_draft');

      await fetchNotices();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao salvar comunicado.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteNotice = async (notice: Announcement) => {
    if (!window.confirm('Deseja mesmo remover este aviso permanentemente?')) return;

    try {
      if (notice.is_automated) {
        // Se for um aviso automático de agente, deleta da tabela de notificações
        await supabase.from('notifications').delete().eq('id', notice.id);
      } else {
        // Se for manual, deleta da tabela tradicional
        await supabase.from('announcements').delete().eq('id', notice.id);
      }

      setMessage({ type: 'success', text: 'Aviso removido do mural.' });
      await fetchNotices();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao deletar.' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-2 sm:p-4">
        <div className="h-28 animate-pulse rounded-[24px] bg-white shadow-sm" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-[24px] border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-4 sm:space-y-8">
      {/* Cabeçalho superior */}
      <div className="space-y-2 px-1">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
          Central Monetização
        </span>
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Quadro de Avisos</h1>
        <p className="text-xs text-slate-500 sm:text-base">
          Mantenha-se informado sobre atualizações, novidades e comunicados importantes.
        </p>
      </div>

      {/* Alerta de Feedback */}
      {message && (
        <div className={`p-4 rounded-xl font-bold text-white text-sm ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {message.text}
        </div>
      )}

      {/* PAINEL DE ADMINISTRAÇÃO INTEGRADO */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[20px] sm:rounded-[28px] border border-blue-200 bg-blue-50/20 p-4 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            <h2 className="text-lg font-black text-slate-900">Criar Novo Comunicado para os Alunos</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Título do Aviso</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Ex: Rateio de VEO3"
                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Link do Botão (Opcional)</label>
              <input
                type="text"
                value={formData.link}
                onChange={e => updateField('link', e.target.value)}
                placeholder="https://pay.kiwify.com/..."
                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500">URL da Imagem de Fundo (Opcional)</label>
              <input
                type="text"
                value={formData.banner_url}
                onChange={e => updateField('banner_url', e.target.value)}
                placeholder="https://...imagem.jpg"
                className="h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Conteúdo do Aviso</label>
            <textarea
              value={formData.content}
              onChange={e => updateField('content', e.target.value)}
              placeholder="Digite as informações detalhadas aqui..."
              className="min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-4 py-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={formData.is_pinned} onChange={e => updateCheckbox('is_pinned', e.target.checked)} className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500" />
              Fixar no Topo
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={formData.is_highlighted} onChange={e => updateCheckbox('is_highlighted', e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
              Marcar como Destaque
            </label>
          </div>

          <button
            onClick={saveNotice}
            disabled={saving}
            className="flex w-full h-11 sm:h-12 items-center justify-center gap-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm shadow-sm"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            {saving ? 'Publicando...' : 'Liberar Comunicado no Mural'}
          </button>
        </motion.div>
      )}

      {/* SEÇÃO DOS AVISOS: CARDS EM 3 COLUNAS PURAS NO MOBILE (grid-cols-3) */}
      {notices.length === 0 ? (
        <div className="rounded-[20px] sm:rounded-[28px] border border-slate-200 bg-white p-10 text-center">
          <Bell size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">Nenhum aviso encontrado</h2>
          <p className="mt-1 text-xs text-slate-500">Novas notificações aparecerão quando necessário.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {notices.map((notice, idx) => {
            const hasBg = !!notice.banner_url;

            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`group relative flex flex-col overflow-hidden rounded-[12px] sm:rounded-[24px] border transition-all ${notice.is_highlighted ? 'border-blue-200 ring-2 ring-blue-50' : 'border-slate-200'
                  } ${hasBg ? 'text-white h-32 xs:h-36 sm:h-52 bg-slate-900' : 'text-slate-900 bg-white min-h-[120px] sm:min-h-[190px]'}`}
              >
                {hasBg && (
                  <>
                    <img src={notice.banner_url!} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />
                  </>
                )}

                <div className="relative z-10 p-1.5 sm:p-4 flex flex-col h-full justify-between space-y-1">
                  {/* Status superior */}
                  <div className="flex flex-wrap gap-0.5 sm:gap-1.5">
                    {notice.is_pinned && (
                      <span className="rounded bg-amber-500 px-1 py-0.5 text-[7px] sm:text-[9px] font-black uppercase text-white">
                        Fixado
                      </span>
                    )}
                    {notice.is_highlighted && (
                      <span className="rounded bg-blue-600 px-1 py-0.5 text-[7px] sm:text-[9px] font-black uppercase text-white">
                        {notice.is_automated ? 'NOVO' : 'PRO'}
                      </span>
                    )}
                  </div>

                  {/* Título responsivo */}
                  <h2 className="text-[10px] sm:text-base font-black leading-tight tracking-tight line-clamp-2">
                    {notice.title}
                  </h2>

                  {/* Descrição em parágrafo */}
                  <p className={`hidden sm:block text-xs font-medium leading-relaxed line-clamp-3 whitespace-pre-wrap ${hasBg ? 'text-white/85' : 'text-slate-500'}`}>
                    {notice.content}
                  </p>

                  {/* Base: Data e link */}
                  <div className="mt-auto pt-1 flex items-center justify-between gap-1">
                    <div className={`text-[7px] sm:text-[10px] font-bold uppercase ${hasBg ? 'text-white/60' : 'text-slate-400'}`}>
                      {formatDate(notice.created_at)}
                    </div>

                    {notice.link && (
                      <a
                        href={notice.link}
                        target={notice.is_automated ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shrink-0 shadow-xs"
                        title={notice.is_automated ? 'Ver Agentes' : 'Acessar link'}
                        aria-label={notice.is_automated ? 'Ver agentes' : `Acessar link do aviso ${notice.title}`}
                      >
                        <ExternalLink size={10} className="sm:size-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Excluir Comunicado Flutuante (Apenas Admin) */}
                {isAdmin && (
                  <button
                    onClick={() => deleteNotice(notice)}
                    className="absolute right-1 top-1 sm:right-2 sm:top-2 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-xs hover:bg-rose-600 transition"
                    aria-label={`Excluir aviso ${notice.title}`}
                  >
                    <Trash2 size={10} className="sm:size-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notices;
