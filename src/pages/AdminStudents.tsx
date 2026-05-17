import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Check,
    ShieldAlert,
    RefreshCw,
} from 'lucide-react';

import { supabase, UserProfile } from '../lib/supabase';

const AdminStudents: React.FC = () => {
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('created_at', { ascending: false });

        setLoading(false);

        if (error) {
            console.error(error);
            alert('Erro ao carregar alunos.');
            return;
        }

        setStudents(data || []);
    };

    const updateStudentStatus = async (
        studentId: string,
        status: 'active' | 'pending' | 'blocked'
    ) => {
        setUpdatingId(studentId);

        const { error } = await supabase
            .from('profiles')
            .update({
                access_status: status,
            })
            .eq('id', studentId);

        setUpdatingId(null);

        if (error) {
            console.error(error);
            alert('Erro ao atualizar acesso do aluno.');
            return;
        }

        await loadStudents();
    };

    const getStatusBadge = (status?: string) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                    <Check size={13} />
                    Ativo
                </span>
            );
        }

        if (status === 'blocked') {
            return (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-700">
                    <UserX size={13} />
                    Bloqueado
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                <Clock size={13} />
                Pendente
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        Gerenciar Alunos
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Aprove, bloqueie e controle o acesso dos alunos da Central.
                    </p>
                </div>

                <button
                    onClick={loadStudents}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                    <RefreshCw size={18} />
                    Atualizar lista
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase text-slate-400">
                        Total de alunos
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                        {students.length}
                    </h2>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase text-slate-400">
                        Pendentes
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-amber-600">
                        {
                            students.filter(
                                student => student.access_status !== 'active' && student.access_status !== 'blocked'
                            ).length
                        }
                    </h2>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase text-slate-400">
                        Ativos
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-emerald-600">
                        {students.filter(student => student.access_status === 'active').length}
                    </h2>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                        <Users className="text-blue-600" size={22} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Lista de alunos
                        </h2>

                        <p className="text-sm text-slate-500">
                            Controle manual de acesso.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-500">
                        Carregando alunos...
                    </div>
                ) : students.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                        <ShieldAlert className="mx-auto mb-4 text-slate-300" size={46} />

                        <h3 className="text-xl font-bold text-slate-700">
                            Nenhum aluno encontrado
                        </h3>

                        <p className="mt-2 text-slate-500">
                            Quando alguém se cadastrar, aparecerá aqui.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {students.map((student, index) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-black text-slate-900">
                                            {student.full_name || 'Aluno'}
                                        </h3>

                                        {getStatusBadge(student.access_status)}
                                    </div>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {student.email}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-400">
                                        Cadastro:{' '}
                                        {new Date(student.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => updateStudentStatus(student.id, 'active')}
                                        disabled={updatingId === student.id}
                                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                                    >
                                        <UserCheck size={17} />
                                        Aprovar
                                    </button>

                                    <button
                                        onClick={() => updateStudentStatus(student.id, 'pending')}
                                        disabled={updatingId === student.id}
                                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                                    >
                                        <Clock size={17} />
                                        Pendente
                                    </button>

                                    <button
                                        onClick={() => updateStudentStatus(student.id, 'blocked')}
                                        disabled={updatingId === student.id}
                                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                                    >
                                        <UserX size={17} />
                                        Bloquear
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStudents;