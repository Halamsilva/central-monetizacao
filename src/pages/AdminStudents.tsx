import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Check,
    ShieldAlert,
    RefreshCw,
    UploadCloud,
    Search,
    Filter,
    MailSearch,
} from 'lucide-react';

import { supabase, UserProfile } from '../lib/supabase';

const AdminStudents: React.FC = () => {
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [legacyStudents, setLegacyStudents] = useState('');
    const [importingLegacy, setImportingLegacy] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'pending' | 'blocked'
    >('all');
    const [diagnosticEmail, setDiagnosticEmail] = useState('');
    const [diagnosingEmail, setDiagnosingEmail] = useState(false);
    const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
            setMessage({ type: 'error', text: 'Erro ao carregar alunos.' });
            return;
        }

        setMessage(null);
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
            setMessage({ type: 'error', text: 'Erro ao atualizar acesso do aluno.' });
            return;
        }

        await loadStudents();
        setMessage({ type: 'success', text: 'Acesso do aluno atualizado.' });
    };

    const sendLegacyImport = async (payload: { text?: string; entries?: Array<{ email: string; paidAt?: string }> }) => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) {
            throw new Error('Faça login novamente para importar alunos antigos.');
        }

        const response = await fetch('/api/admin/legacy-students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao importar alunos antigos.');
        }

        return result;
    };

    const diagnoseStudentEmail = async () => {
        const email = diagnosticEmail.trim().toLowerCase();

        if (!email.includes('@')) {
            setMessage({ type: 'error', text: 'Digite um e-mail valido para diagnosticar.' });
            return;
        }

        setDiagnosingEmail(true);
        setDiagnosticResult(null);

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            if (!token) {
                throw new Error('Faca login novamente para diagnosticar o aluno.');
            }

            const response = await fetch(`/api/admin/legacy-students?email=${encodeURIComponent(email)}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao diagnosticar aluno.');
            }

            setDiagnosticResult(result);
            setMessage(null);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao diagnosticar aluno.' });
        } finally {
            setDiagnosingEmail(false);
        }
    };

    const parseCsvRows = (text: string) => {
        const rows: string[][] = [];
        let row: string[] = [];
        let cell = '';
        let inQuotes = false;

        for (let index = 0; index < text.length; index += 1) {
            const char = text[index];
            const next = text[index + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    cell += '"';
                    index += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(cell);
                cell = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') index += 1;
                row.push(cell);

                if (row.some(value => value.trim())) {
                    rows.push(row);
                }

                row = [];
                cell = '';
            } else {
                cell += char;
            }
        }

        row.push(cell);

        if (row.some(value => value.trim())) {
            rows.push(row);
        }

        return rows;
    };

    const importLegacyStudents = async () => {
        const text = legacyStudents.trim();

        if (!text) {
            setMessage({ type: 'error', text: 'Cole pelo menos um e-mail antigo da Kiwify.' });
            return;
        }

        setImportingLegacy(true);

        try {
            const payload = await sendLegacyImport({ text });

            setLegacyStudents('');
            await loadStudents();
            setMessage({
                type: 'success',
                text: `${payload.imported} compra(s) antiga(s) importada(s). ${payload.active} ativo(s), ${payload.pending} pendente(s).`,
            });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao importar alunos antigos.' });
        } finally {
            setImportingLegacy(false);
        }
    };

    const importLegacyCsv = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportingLegacy(true);

        try {
            const csvText = await file.text();
            const rows = parseCsvRows(csvText);
            const header = rows[0]?.map(column => column.trim()) || [];
            const emailIndex = header.indexOf('Email');

            if (emailIndex < 0) {
                throw new Error('CSV sem coluna Email.');
            }

            const entries = rows
                .slice(1)
                .map(row => ({
                    email: String(row[emailIndex] || '').trim().toLowerCase(),
                }))
                .filter(entry => entry.email.includes('@'));

            if (!entries.length) {
                throw new Error('Nenhum e-mail válido encontrado no CSV.');
            }

            const payload = await sendLegacyImport({ entries });

            await loadStudents();
            setMessage({
                type: 'success',
                text: `${payload.imported} aluno(s) do CSV importado(s). ${payload.active} ativo(s), ${payload.pending} pendente(s).`,
            });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao importar CSV.' });
        } finally {
            setImportingLegacy(false);
            if (csvInputRef.current) {
                csvInputRef.current.value = '';
            }
        }
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

    const normalizeStatus = (status?: string) => {
        if (status === 'active' || status === 'blocked') return status;
        return 'pending';
    };

    const filteredStudents = students
        .filter((student) => {
            const search = searchTerm.trim().toLowerCase();
            const status = normalizeStatus(student.access_status);

            const matchesSearch =
                !search ||
                student.email?.toLowerCase().includes(search) ||
                student.full_name?.toLowerCase().includes(search);

            const matchesStatus =
                statusFilter === 'all' || status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((studentA, studentB) => {
            const priority = { pending: 0, active: 1, blocked: 2 };
            const statusA = normalizeStatus(studentA.access_status);
            const statusB = normalizeStatus(studentB.access_status);

            if (priority[statusA] !== priority[statusB]) {
                return priority[statusA] - priority[statusB];
            }

            return (
                new Date(studentB.created_at).getTime() -
                new Date(studentA.created_at).getTime()
            );
        });

    const totalPending = students.filter(
        student => normalizeStatus(student.access_status) === 'pending'
    ).length;
    const totalActive = students.filter(
        student => normalizeStatus(student.access_status) === 'active'
    ).length;
    const totalBlocked = students.filter(
        student => normalizeStatus(student.access_status) === 'blocked'
    ).length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        Gerenciar Alunos
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Controle as contas criadas na Central e importe compras antigas da Kiwify.
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

            {message && (
                <div
                    className={`rounded-2xl border p-4 text-sm font-bold ${
                        message.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase text-slate-400">
                        Contas na Central
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                        {students.length}
                    </h2>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        Alunos que já criaram login na plataforma.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase text-slate-400">
                        Pendentes na Central
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-amber-600">
                        {
                            totalPending
                        }
                    </h2>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        Contas aguardando prazo, compra ou revisão.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-bold uppercase text-slate-400">
                        Ativos na Central
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-emerald-600">
                        {totalActive}
                    </h2>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        Contas liberadas para acessar os agentes.
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                        <UploadCloud className="text-orange-600" size={22} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Importar alunos antigos da Kiwify
                        </h2>

                        <p className="text-sm text-slate-500">
                            Use para compras feitas antes do webhook. O CSV antigo libera os e-mails como alunos antigos.
                        </p>
                    </div>
                </div>

                <textarea
                    value={legacyStudents}
                    onChange={(event) => setLegacyStudents(event.target.value)}
                    rows={4}
                    placeholder={'gog750090@gmail.com\naluno@email.com, 14/05/2026'}
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

                <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={importLegacyCsv}
                />

                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                        Para lista manual: sem data libera como antigo. Com data, mantém a regra dos 7 dias. No CSV, todos entram como antigos.
                    </p>

                    <button
                        onClick={importLegacyStudents}
                        disabled={importingLegacy}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                        {importingLegacy ? (
                            <RefreshCw className="animate-spin" size={18} />
                        ) : (
                            <UploadCloud size={18} />
                        )}
                        {importingLegacy ? 'Importando...' : 'Importar e liberar'}
                    </button>

                    <button
                        onClick={() => csvInputRef.current?.click()}
                        disabled={importingLegacy}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                        <UploadCloud size={18} />
                        Importar CSV
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                        <MailSearch className="text-blue-600" size={22} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Diagnosticar acesso por e-mail
                        </h2>

                        <p className="text-sm text-slate-500">
                            Use quando um aluno antigo disser que comprou, mas ainda aparece como pendente.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row">
                    <input
                        type="email"
                        value={diagnosticEmail}
                        onChange={(event) => setDiagnosticEmail(event.target.value)}
                        placeholder="emaildoaluno@gmail.com"
                        className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                        onClick={diagnoseStudentEmail}
                        disabled={diagnosingEmail}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                        {diagnosingEmail ? (
                            <RefreshCw className="animate-spin" size={18} />
                        ) : (
                            <MailSearch size={18} />
                        )}
                        {diagnosingEmail ? 'Verificando...' : 'Verificar e-mail'}
                    </button>
                </div>

                {diagnosticResult && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                    Resultado
                                </p>
                                <h3 className="mt-1 text-lg font-black text-slate-900">
                                    {diagnosticResult.diagnosis?.title || 'Diagnostico encontrado'}
                                </h3>
                                <p className="mt-1 text-sm font-semibold text-slate-600">
                                    {diagnosticResult.diagnosis?.detail}
                                </p>
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-500 ring-1 ring-slate-200">
                                {diagnosticResult.email}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                <p className="text-xs font-bold uppercase text-slate-400">Conta na Central</p>
                                <p className="mt-1 text-sm font-black text-slate-800">
                                    {diagnosticResult.profile
                                        ? `${diagnosticResult.profile.access_status || 'pending'}`
                                        : 'Nao criada'}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                <p className="text-xs font-bold uppercase text-slate-400">Compras Kiwify</p>
                                <p className="mt-1 text-sm font-black text-slate-800">
                                    {diagnosticResult.purchases?.length || 0}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                                <p className="text-xs font-bold uppercase text-slate-400">Liberacao</p>
                                <p className="mt-1 text-sm font-black text-slate-800">
                                    {diagnosticResult.diagnosis?.release_at
                                        ? new Date(diagnosticResult.diagnosis.release_at).toLocaleDateString('pt-BR')
                                        : 'Sem data'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`rounded-3xl border p-5 text-left shadow-sm transition ${statusFilter === 'all'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                        }`}
                >
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide opacity-70">
                        <Filter size={15} />
                        Todos
                    </p>
                    <strong className="mt-2 block text-3xl">{students.length}</strong>
                </button>

                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`rounded-3xl border p-5 text-left shadow-sm transition ${statusFilter === 'pending'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200'
                        }`}
                >
                    <p className="text-xs font-black uppercase tracking-wide opacity-80">
                        Pendentes
                    </p>
                    <strong className="mt-2 block text-3xl">{totalPending}</strong>
                </button>

                <button
                    onClick={() => setStatusFilter('active')}
                    className={`rounded-3xl border p-5 text-left shadow-sm transition ${statusFilter === 'active'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200'
                        }`}
                >
                    <p className="text-xs font-black uppercase tracking-wide opacity-80">
                        Ativos
                    </p>
                    <strong className="mt-2 block text-3xl">{totalActive}</strong>
                </button>

                <button
                    onClick={() => setStatusFilter('blocked')}
                    className={`rounded-3xl border p-5 text-left shadow-sm transition ${statusFilter === 'blocked'
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-red-100 bg-red-50 text-red-700 hover:border-red-200'
                        }`}
                >
                    <p className="text-xs font-black uppercase tracking-wide opacity-80">
                        Bloqueados
                    </p>
                    <strong className="mt-2 block text-3xl">{totalBlocked}</strong>
                </button>
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
                            Contas cadastradas na Central. Compras importadas aparecem aqui quando o aluno cria login com o mesmo e-mail.
                        </p>
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar aluno por nome ou e-mail"
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
                        {filteredStudents.length} de {students.length} aluno(s)
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
                ) : filteredStudents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                        <Search className="mx-auto mb-4 text-slate-300" size={46} />

                        <h3 className="text-xl font-bold text-slate-700">
                            Nenhum aluno nesse filtro
                        </h3>

                        <p className="mt-2 text-slate-500">
                            Limpe a busca ou escolha outro status.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredStudents.map((student, index) => (
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
