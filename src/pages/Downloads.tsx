import React from 'react';
import { motion } from 'motion/react';
import { Download, FileText, ExternalLink, Search } from 'lucide-react';
import { MOCK_DOWNLOADS } from '../lib/mockData';

const DownloadsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Biblioteca de Downloads</h2>
          <p className="text-gray-500">Materiais de apoio, checklists e templates exclusivos para alunos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {MOCK_DOWNLOADS.map((file, idx) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col sm:flex-row items-center gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FileText size={40} />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">{file.title}</h3>
                <span className="inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 uppercase">
                  {file.category}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {file.description}
              </p>
              <div className="pt-2">
                <a 
                  href={file.file_url} 
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                >
                  Baixar Material <Download size={16} />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggestion CTA */}
      <div className="rounded-[40px] bg-blue-600 p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 mt-12">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-3xl font-bold">Precisa de algum template específico?</h3>
          <p className="text-blue-100 opacity-80">Nossa equipe pode criar materiais exclusivos sob demanda para a comunidade.</p>
        </div>
        <button className="whitespace-nowrap rounded-2xl bg-white px-8 py-4 font-bold text-blue-600 shadow-xl transition-all hover:bg-blue-50 active:scale-95">
          Solicitar Material
        </button>
      </div>
    </div>
  );
};

export default DownloadsPage;
