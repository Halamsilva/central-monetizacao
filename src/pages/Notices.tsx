import React from 'react';
import { motion } from 'motion/react';
import { Bell, Star, Calendar, ArrowRight } from 'lucide-react';
import { MOCK_NOTICES } from '../lib/mockData';

const Notices: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Quadro de Avisos</h2>
        <p className="text-gray-500">Mantenha-se informado sobre as últimas novidades da comunidade.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {MOCK_NOTICES.map((notice, idx) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all"
          >
            {notice.is_pinned && (
              <div className="absolute top-0 right-0 rounded-bl-3xl bg-amber-500 px-6 py-2 text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Star size={14} className="fill-white" /> Fixado
              </div>
            )}
            
            <div className="flex items-start gap-6">
              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 flex-shrink-0">
                <Bell size={32} />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar size={14} /> 
                    {new Date(notice.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {notice.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {notice.content}
                </p>
                <div className="pt-4">
                  <button className="flex items-center gap-2 font-bold text-blue-600 hover:gap-3 transition-all">
                    Ler aviso completo <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Notices;
