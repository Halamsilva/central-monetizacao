import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Star,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

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
}

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setNotices(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-500">Carregando avisos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
          Central Monetização
        </span>

        <h1 className="text-4xl font-black text-slate-900">
          Quadro de Avisos
        </h1>

        <p className="max-w-2xl text-lg text-slate-500">
          Mantenha-se informado sobre atualizações, novidades e comunicados
          importantes.
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <Bell size={48} className="mx-auto mb-4 text-slate-300" />

          <h2 className="text-2xl font-bold text-slate-700">
            Nenhum aviso encontrado
          </h2>

          <p className="mt-2 text-slate-500">
            Adicione avisos no painel admin.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice, idx) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:shadow-xl ${notice.is_highlighted
                  ? 'border-blue-200 ring-4 ring-blue-50'
                  : 'border-slate-200 hover:border-blue-100'
                }`}
            >
              {notice.banner_url && (
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={notice.banner_url}
                    alt={notice.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                          <Star size={14} className="fill-white" />
                          Fixado
                        </span>
                      )}

                      {notice.is_highlighted && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                          <Sparkles size={14} />
                          Destaque
                        </span>
                      )}
                    </div>

                    <h2 className="text-3xl font-black text-white">
                      {notice.title}
                    </h2>
                  </div>
                </div>
              )}

              {!notice.banner_url && notice.is_pinned && (
                <div className="absolute right-0 top-0 flex items-center gap-2 rounded-bl-3xl bg-amber-500 px-6 py-2 text-xs font-black uppercase tracking-widest text-white">
                  <Star size={14} className="fill-white" />
                  Fixado
                </div>
              )}

              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="hidden h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-600 sm:flex">
                    {notice.thumbnail_url ? (
                      <img
                        src={notice.thumbnail_url}
                        alt={notice.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Bell size={30} />
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <Calendar size={14} />

                        {new Date(notice.created_at).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
                      </div>

                      {!notice.banner_url && (
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-black text-slate-900 transition-colors group-hover:text-blue-600">
                            {notice.title}
                          </h2>

                          {notice.is_highlighted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase text-blue-700">
                              <Sparkles size={13} />
                              Destaque
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="whitespace-pre-line text-lg leading-relaxed text-slate-600">
                      {notice.content}
                    </p>

                    {notice.link && (
                      <a
                        href={notice.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                      >
                        <ExternalLink size={18} />
                        Acessar Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notices;