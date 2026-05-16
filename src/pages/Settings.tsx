import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Globe, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
  const sections = [
    { title: 'Notificações', icon: Bell, description: 'Gerencie como você recebe avisos e atualizações.' },
    { title: 'Privacidade', icon: Shield, description: 'Controle quem vê suas informações e atividades.' },
    { title: 'Segurança', icon: Eye, description: 'Altere sua senha e gerencie login em dois fatores.' },
    { title: 'Idioma', icon: Globe, description: 'Escolha seu idioma de preferência para a interface.' },
    { title: 'Assinatura', icon: CreditCard, description: 'Veja detalhes do seu plano e histórico de pagamentos.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h2>
        <p className="text-gray-500">Ajuste a plataforma de acordo com suas preferências.</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group flex items-center justify-between rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <section.icon size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-400 font-medium">{section.description}</p>
              </div>
            </div>
            <button className="rounded-xl px-4 py-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
              Configurar
            </button>
          </motion.div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 ml-6">Zona de Risco</h3>
        <button className="flex w-full items-center justify-between rounded-[32px] border border-red-100 bg-red-50/30 p-6 text-red-600 hover:bg-red-50 transition-colors">
          <div className="text-left">
            <p className="font-bold">Desativar Conta</p>
            <p className="text-xs opacity-70">Sua conta será permanentemente removida da plataforma.</p>
          </div>
          <span className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-white rounded-xl border border-red-100">Desativar AGORA</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
