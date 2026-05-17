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
  CalendarCheck,
  Search,
  CalendarDays,
  Loader2,
  RefreshCw,
  AlertCircle,
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

  const [userFilter, setUserFilter] = useState<
    'all' | 'pending' | 'active' | 'blocked'
  >('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(
    null
  );
  const [savingStatus, setSavingStatus] = useState<
    'active' | 'pending' | 'blocked' | null
  >(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [notices] = useState<Notice[]>([]);
  const [agents] = useState<Agent[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');

    setTimeout(() => {
      setErrorMessage('');
    }, 4000);
  };

  const loadStudents = async () => {
    setIsLoadingStudents(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setIsLoadingStudents(false);
      showErrorMessage('Erro ao carregar alunos.');
      return;
    }

    setStudents(data || []);
    setIsLoadingStudents(false);
  };

  const updateStudentStatus = async (
    userId: string,
    status: 'active' | 'pending' | 'blocked'
  ) => {
    setSavingStudentId(userId);
    setSavingStatus(status);

    const updateData = {
      access_status: status,
      approved_at:
        status === 'active' ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error(error);
      showErrorMessage('Erro ao atualizar aluno.');
      setSavingStudentId(null);
      setSavingStatus(null);
      return;
    }

    await loadStudents();

    setSavingStudentId(null);
    setSavingStatus(null);
    showSuccessMessage('Aluno atualizado com sucesso.');
  };

  const handleStudentStatusChange = (
    userId: string,
    studentName: string,
    status: 'active' | 'pending' | 'blocked'
  ) => {
    if (status === 'pending') {
      const confirmed = window.confirm(
        `Tem certeza que deseja voltar ${studentName} para pendente? A data de aprovação será removida.`
      );

      if (!confirmed) return;
    }

    if (status === 'blocked') {
      const confirmed = window.confirm(
        `Tem certeza que deseja bloquear ${studentName}? O acesso será removido.`
      );

      if (!confirmed) return;
    }

    updateStudentStatus(userId, status);
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

  const formatDate = (date?: string | null) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusPriority = (status?: string) => {
    switch (status) {
      case 'pending':
        return 1;

      case 'active':
        return 2;

      case 'blocked':
        return 3;

      default:
        return 1;
    }
  };

  const totalPending = students.filter(
    student =>
      !student.access_status || student.access_status === 'pending'
  ).length;

  const totalActive = students.filter(
    student => student.access_status === 'active'
  ).length;

  const totalBlocked = students.filter(
    student => student.access_status === 'blocked'
  ).length;

  const sortedStudents = [...students].sort((studentA, studentB) => {
    const priorityA = getStatusPriority(studentA.access_status);
    const priorityB = getStatusPriority(studentB.access_status);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (
      new Date(studentB.created_at).getTime() -
      new Date(studentA.created_at).getTime()
    );
  });

  const filteredStudents = sortedStudents.filter(student => {
    const normalizedStatus = student.access_status || 'pending';

    const matchesStatus =
      userFilter === 'all' || normalizedStatus === userFilter;

    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      search === '' ||
      student.full_name?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });

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

      {activeTab === 'notices' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">
            Avisos
          </h2>

          <p className="mt-2 text-slate-500">
            Use a página Gerenciar Avisos para criar, editar e excluir avisos.
          </p>

          <p className="mt-4 text-sm text-slate-400">
            {notices.length} avisos carregados neste painel.
          </p>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">
            Agentes
          </h2>

          <p className="mt-2 text-slate-500">
            Use a página Gerenciar Agentes para criar, editar e excluir agentes.
          </p>

          <p className="mt-4 text-sm text-slate-400">
            {agents.length} agentes carregados neste painel.
          </p>
        </div>
      )}

      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Gerenciar Alunos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Aprove, bloqueie e controle acessos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadStudents}
                disabled={isLoadingStudents}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingStudents ? 'animate-spin' : ''
                    }`}
                />
                Atualizar
              </button>

              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {filteredStudents.length} de {students.length} alunos
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <Check className="h-4 w-4" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          {isLoadingStudents ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />

              <h3 className="text-lg font-bold text-slate-800">
                Carregando alunos...
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Sincronizando dados do painel administrativo.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-3 md:grid-cols-3">
                <button
                  onClick={() => setUserFilter('pending')}
                  className={`rounded-2xl border p-4 text-left transition ${userFilter === 'pending'
                      ? 'border-yellow-300 bg-yellow-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Pendentes
                    </span>

                    <span className="rounded-full bg-yellow-100 p-2 text-yellow-700">
                      <Clock className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {totalPending}
                  </p>
                </button>

                <button
                  onClick={() => setUserFilter('active')}
                  className={`rounded-2xl border p-4 text-left transition ${userFilter === 'active'
                      ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Ativos
                    </span>

                    <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                      <Check className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {totalActive}
                  </p>
                </button>

                <button
                  onClick={() => setUserFilter('blocked')}
                  className={`rounded-2xl border p-4 text-left transition ${userFilter === 'blocked'
                      ? 'border-red-300 bg-red-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      Bloqueados
                    </span>

                    <span className="rounded-full bg-red-100 p-2 text-red-700">
                      <UserX className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {totalBlocked}
                  </p>
                </button>
              </div>

              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Todos' },
                    { key: 'pending', label: 'Pendentes' },
                    { key: 'active', label: 'Ativos' },
                    { key: 'blocked', label: 'Bloqueados' },
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() =>
                        setUserFilter(
                          filter.key as
                          | 'all'
                          | 'pending'
                          | 'active'
                          | 'blocked'
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${userFilter === filter.key
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full xl:max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Buscar por nome ou e-mail"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredStudents.map(student => {
                  const isActive = student.access_status === 'active';
                  const isPending =
                    !student.access_status ||
                    student.access_status === 'pending';
                  const isBlocked = student.access_status === 'blocked';
                  const isSavingThisStudent =
                    savingStudentId === student.id;

                  return (
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

                        <div className="mt-3 flex flex-col items-start gap-2">
                          {getStatusBadge(student.access_status)}

                          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Cadastrado em {formatDate(student.created_at)}
                          </span>

                          {student.access_status === 'active' &&
                            student.approved_at && (
                              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                                <CalendarCheck className="h-3.5 w-3.5" />
                                Aprovado em {formatDate(student.approved_at)}
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            handleStudentStatusChange(
                              student.id,
                              student.full_name,
                              'active'
                            )
                          }
                          disabled={isActive || isSavingThisStudent}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${isActive || isSavingThisStudent
                              ? 'cursor-not-allowed bg-emerald-300'
                              : 'bg-emerald-500 hover:bg-emerald-600'
                            }`}
                        >
                          {isSavingThisStudent &&
                            savingStatus === 'active' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          {isSavingThisStudent &&
                            savingStatus === 'active'
                            ? 'Salvando...'
                            : isActive
                              ? 'Já aprovado'
                              : 'Aprovar'}
                        </button>

                        <button
                          onClick={() =>
                            handleStudentStatusChange(
                              student.id,
                              student.full_name,
                              'pending'
                            )
                          }
                          disabled={isPending || isSavingThisStudent}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${isPending || isSavingThisStudent
                              ? 'cursor-not-allowed bg-yellow-300'
                              : 'bg-yellow-500 hover:bg-yellow-600'
                            }`}
                        >
                          {isSavingThisStudent &&
                            savingStatus === 'pending' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          {isSavingThisStudent &&
                            savingStatus === 'pending'
                            ? 'Salvando...'
                            : isPending
                              ? 'Pendente'
                              : 'Voltar para pendente'}
                        </button>

                        <button
                          onClick={() =>
                            handleStudentStatusChange(
                              student.id,
                              student.full_name,
                              'blocked'
                            )
                          }
                          disabled={isBlocked || isSavingThisStudent}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${isBlocked || isSavingThisStudent
                              ? 'cursor-not-allowed bg-red-300'
                              : 'bg-red-500 hover:bg-red-600'
                            }`}
                        >
                          {isSavingThisStudent &&
                            savingStatus === 'blocked' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                          {isSavingThisStudent &&
                            savingStatus === 'blocked'
                            ? 'Salvando...'
                            : isBlocked
                              ? 'Bloqueado'
                              : 'Bloquear'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                    <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-slate-400" />

                    <h3 className="text-lg font-bold text-slate-700">
                      Nenhum aluno encontrado
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Ajuste o filtro ou tente buscar por outro nome ou e-mail.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Admin;