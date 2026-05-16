import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle2, Calendar } from 'lucide-react';
import { MOCK_UPDATES } from '../lib/mockData';

const Updates: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Atualizações do Sistema</h2>
        <p className="text-gray-500">Acompanhe as melhorias e novas funcionalidades da nossa plataforma.</p>
      </div>

      <div className="relative space-y-12 before:absolute before:left-8 before:top-4 before:h-[calc(100%-32px)] before:w-0.5 before:bg-gray-100 sm:before:left-12">
        {MOCK_UPDATES.map((update, idx) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-16 sm:pl-24"
          >
            {/* Timeline Dot */}
            <div className="absolute left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 sm:left-8 sm:h-10 sm:w-10">
              <RefreshCw size={16} className={idx === 0 ? "animate-spin-slow" : ""} />
            </div>

            <div className="space-y-4 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 uppercase tracking-widest">
                      v{update.version}
                    </span>
                    {idx === 0 && (
                      <span className="rounded-lg bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700 uppercase">Mais recente</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{update.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <Calendar size={16} />
                  {new Date(update.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-gray-600 leading-relaxed text-lg">
                  {update.content}
                </p>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">O que mudou:</h4>
                  <ul className="space-y-2">
                    {[
                      'Melhoria na performance do buscador de agentes',
                      'Novos filtros por categoria de monetização',
                      'Interface ajustada para dispositivos móveis',
                      'Correção de bugs na área de downloads'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-600">
                        <CheckCircle2 size={18} className="text-green-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Updates;
