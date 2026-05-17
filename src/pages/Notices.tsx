import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Star,
  Calendar,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
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
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">
          Carregando avisos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
          Central Monetização
        </span>

        <h1 className="text-4xl font-black text-slate-900">
          Quadro de Avisos
        </h1>

        <p className="max-w-2xl text-slate-500 text-lg">
          Mantenha-se informado sobre atualizações,
          novidades e comunicados importantes.
        </p>
      </div>

      {/* EMPTY */}
      {notices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <Bell
            size={48}
            className="mx-auto text-slate-300 mb-4"
          />

          <h2 className="text-2xl font-bold text-slate-700">
            Nenhum aviso encontrado
          </h2>

          <p className="text-slate-500 mt-2">
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
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all"
            >
              {/* FIXADO */}
              {notice.is_pinned && (
                <div className="absolute top-0 right-0 rounded-bl-3xl bg-amber-500 px-6 py-2 text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Star
                    size={14}
                    className="fill-white"
                  />

                  Fixado
                </div>
              )}

              <div className="flex items-start gap-6">
                {/* ICON */}
                <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 flex-shrink-0">
                  <Bell size={30} />
                </div>

                {/* CONTENT */}
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Calendar size={14} />

                      {new Date(
                        notice.created_at
                      ).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {notice.title}
                    </h2>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                    {notice.content}
                  </p>
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