import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Bot,
  Users,
  Check,
  Clock,
  UserCheck,
  UserX,
  ShieldAlert,
} from 'lucide-react';

import {
  Notice,
  Agent,
  UserProfile,
  supabase,
} from '../lib/supabase';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'notices' | 'agents' | 'users'
  >('users');

  const [notices] = useState<Notice[]>([]);
  const [agents] = useState<Agent[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setStudents(data || []);
  };

  const updateStudentStatus = async (
    userId: string,
    status: 'active' | 'pending' | 'blocked'
  ) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        access_status: status,
      })
      .eq('id', userId);

    if (error) {
      alert('Erro ao atualizar aluno');
      return;
    }

    await loadStudents();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3 w-3" />
            Ativo
          </span>
        );

      case 'blocked':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <UserX className="h-3 w-3" />
            Bloqueado
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Painel Administrativo
        </h1>

        <p className="mt-2 text-slate-500">
          Gerencie alunos da plataforma.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('notices')}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${activeTab === 'notices'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700'
            }`}
        >
          <Bell className="mr-2 inline h-4 w-4" />
          Avisos
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${activeTab === 'agents'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700'
            }`}
        >
          <Bot className="mr-2 inline h-4 w-4" />
          Agentes
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700'
            }`}
        >
          <Users className="mr-2 inline h-4 w-4" />
          Alunos
        </button>
      </div>

      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Gerenciar Alunos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Aprove, bloqueie e controle acessos.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {students.length} alunos
            </div>
          </div>

          <div className="space-y-4">
            {students.map(student => (
              <div
                key={student.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {student.full_name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {student.email}
                  </p>

                  <div className="mt-3">
                    {getStatusBadge(student.access_status)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateStudentStatus(
                        student.id,
                        'active'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <UserCheck className="h-4 w-4" />
                    Aprovar
                  </button>

                  <button
                    onClick={() =>
                      updateStudentStatus(
                        student.id,
                        'pending'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600"
                  >
                    <Clock className="h-4 w-4" />
                    Pendente
                  </button>

                  <button
                    onClick={() =>
                      updateStudentStatus(
                        student.id,
                        'blocked'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    <UserX className="h-4 w-4" />
                    Bloquear
                  </button>
                </div>
              </div>
            ))}

            {students.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-slate-400" />

                <h3 className="text-lg font-bold text-slate-700">
                  Nenhum aluno encontrado
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Novos alunos aparecerão aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Admin;