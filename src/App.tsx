import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import WhatsAppFloat from './components/common/WhatsAppFloat';
import { firebaseAuth, isFirebaseConfigured } from './lib/supabase';
import { reload, sendEmailVerification } from 'firebase/auth';
import { MessageCircle } from 'lucide-react';
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from './lib/support';

// Páginas com Lazy Loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Recovery = lazy(() => import('./pages/Recovery'));
const Agents = lazy(() => import('./pages/Agents'));
const ViralPrompts = lazy(() => import('./pages/ViralPrompts'));
const TikTokShop = lazy(() => import('./pages/TikTokShop'));
const Facebook = lazy(() => import('./pages/Facebook'));
const YouTubeShorts = lazy(() => import('./pages/YouTubeShorts'));
const ToolsIA = lazy(() => import('./pages/ToolsIA'));

const MeninaDaRoca = lazy(() => import('./pages/MeninaDaRoca'));
const ClonagemVideo = lazy(() => import('./pages/ClonagemVideo'));
const NovelinhasUni = lazy(() => import('./pages/NovelinhasUni'));
const Mestre30s = lazy(() => import('./pages/mestre30s/App'));
const Insetos = lazy(() => import('./pages/insetos/App'));
const PovProduto = lazy(() => import('./pages/povProduto/App'));
const Seedance = lazy(() => import('./pages/seedance/App'));
const Assinar = lazy(() => import('./pages/Assinar'));
const BoasVindas = lazy(() => import('./pages/BoasVindas'));
const ConfigurableAgent = lazy(() => import('./pages/ConfigurableAgent'));
const Tutorials = lazy(() => import('./pages/Tutorials'));
const Downloads = lazy(() => import('./pages/Downloads'));
const ShopVIP = lazy(() => import('./pages/ShopVIP')); // <-- Importado com calma aqui!
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Páginas de Administração
const Admin = lazy(() => import('./pages/Admin'));
const AdminAgents = lazy(() => import('./pages/AdminAgents'));
const AdminNotices = lazy(() => import('./pages/AdminNotices'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));
const AdminBlog = lazy(() => import('./pages/AdminBlog'));
const AdminSubscription = lazy(() => import('./pages/AdminSubscription'));

const routeTitles: Record<string, string> = {
  '/login': 'Entrar',
  '/register': 'Cadastro',
  '/recovery': 'Recuperar acesso',
  '/agents': 'Agentes IA',
  '/viral-prompts': 'Prompts Virais',
  '/tiktok-shop': 'TikTok Shop',
  '/facebook': 'Facebook',
  '/youtube-shorts': 'YouTube e Shorts',
  '/tools-ia': 'Ferramentas IA',
  '/menina-da-roca': 'Menina da Roca',
  '/clonagem-video': 'Clonagem de Video',
  '/novelinhas': 'Novelinhas Universal',
  '/mestre-30s': 'Mestre 30s',
  '/insetos': 'Receitas Anti-Pragas',
  '/pov-produto': 'POV Produto',
  '/seedance': 'TikTok Shop Seedance',
  '/admin/assinatura': 'Pagina de Assinatura',
  '/tutoriais': 'Tutoriais',
  '/downloads': 'Downloads',
  '/shop-vip': 'Loja VIP',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/admin': 'Painel Admin',
  '/admin/agents': 'Gerenciar Agentes',
  '/admin/notices': 'Gerenciar Avisos',
  '/admin/students': 'Gerenciar Alunos',
  '/admin/blog': 'Gerenciar Blog',
};

const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = routeTitles[location.pathname] || 'Central Monetização';
    document.title = `${pageTitle} | Central Monetização`;
  }, [location.pathname]);

  return null;
};

// Tela de Carregamento Global
const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

const VerifyEmailScreen = () => {
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const resend = async () => {
    if (!firebaseAuth.currentUser) return;
    setBusy(true);
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
      setMessage('Enviamos um novo link de confirmação para seu e-mail.');
    } catch {
      setMessage('Não foi possível enviar agora. Aguarde alguns minutos e tente novamente.');
    } finally { setBusy(false); }
  };

  const check = async () => {
    if (!firebaseAuth.currentUser) return;
    setBusy(true);
    try {
      await reload(firebaseAuth.currentUser);
      if (firebaseAuth.currentUser.emailVerified) window.location.reload();
      else setMessage('Ainda não recebemos a confirmação. Confira o link no seu e-mail.');
    } catch { setMessage('Não foi possível conferir agora. Tente novamente.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Confirme seu e-mail</h1>
        <p className="mt-3 text-slate-600">Enviamos um link para {firebaseAuth.currentUser?.email}. Confirme o endereço para acessar a plataforma.</p>

        <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-left text-sm leading-relaxed text-amber-900">
          <strong>Não achou o e-mail?</strong> Confira a caixa de <strong>spam</strong> (ou lixo
          eletrônico) e marque como "não é spam" para receber os próximos.
        </div>

        <a
          href={whatsappLink(
            'Ola! Fiz meu cadastro na Central Monetizacao e nao achei o e-mail de verificacao. Pode me ajudar?'
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white transition hover:brightness-105"
        >
          <MessageCircle size={18} />
          Falar com o suporte no WhatsApp
        </a>

        {message && <p role="status" className="mt-4 text-sm text-slate-700">{message}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={busy} onClick={check} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Já confirmei</button>
          <button type="button" disabled={busy} onClick={resend} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50">Reenviar e-mail</button>
        </div>
      </div>
    </div>
  );
};

// Tela de Cadastro em Análise
const PendingAccessScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
    <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
        🔒
      </div>
      <h1 className="text-3xl font-black text-slate-900">Acesso em análise</h1>
      <p className="mt-4 leading-relaxed text-slate-500">
        Seu cadastro foi recebido. Use o mesmo e-mail da compra na Kiwify:
        o acesso é liberado automaticamente após a confirmação da compra e o
        prazo de 7 dias.
      </p>
      <a
        href="/assinar"
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
      >
        Quero só o acesso à plataforma (assinar)
      </a>
      <a
        href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-bold text-white transition hover:brightness-105"
      >
        <MessageCircle size={18} />
        Falar no WhatsApp
      </a>
    </div>
  </div>
);

// Tela de Acesso Bloqueado
const BlockedAccessScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
    <div className="max-w-md rounded-3xl border border-red-100 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
        🚫
      </div>
      <h1 className="text-3xl font-black text-slate-900">Acesso bloqueado</h1>
      <p className="mt-4 leading-relaxed text-slate-500">
        Seu acesso foi bloqueado.
      </p>
    </div>
  </div>
);

// Protetor de Rotas Privadas (Alunos)
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user && isFirebaseConfigured) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.emailVerified) return <VerifyEmailScreen />;

  if (profile?.access_status === 'blocked') {
    return <BlockedAccessScreen />;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  if (profile?.access_status !== 'active') {
    return <PendingAccessScreen />;
  }

  return <>{children}</>;
};

// Protetor de Rotas Admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, isAdmin, profile } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAdmin || profile?.access_status === 'blocked') {
    return <Navigate to="/agents" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TitleManager />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="/assinar" element={<Assinar />} />
            <Route path="/boas-vindas" element={<BoasVindas />} />

            {/* Rotas Privadas de Alunos com Layout Base */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/agents" replace />} />
              <Route path="agents" element={<Agents />} />
              <Route path="viral-prompts" element={<ViralPrompts />} />
              <Route path="tiktok-shop" element={<TikTokShop />} />
              <Route path="facebook" element={<Facebook />} />
              <Route path="youtube-shorts" element={<YouTubeShorts />} />
              <Route path="tools-ia" element={<ToolsIA />} />
              <Route path="menina-da-roca" element={<MeninaDaRoca />} />
              <Route path="clonagem-video" element={<ClonagemVideo />} />
              <Route path="novelinhas" element={<NovelinhasUni />} />
              <Route path="mestre-30s" element={<Mestre30s />} />
              <Route path="insetos" element={<Insetos />} />
              <Route path="pov-produto" element={<PovProduto />} />
              <Route path="seedance" element={<Seedance />} />
              <Route path="custom-agent/:slug" element={<ConfigurableAgent />} />
              <Route path="tutoriais" element={<Tutorials />} />
              <Route path="downloads" element={<Downloads />} />
              <Route path="shop-vip" element={<ShopVIP />} /> {/* <-- Rota da loja registrada aqui! */}
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
                            <Route path="vip-store" element={<Navigate to="/shop-vip" replace />} />

              {/* Sub-rotas Administrativas */}
                            
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/agents"
                element={
                  <AdminRoute>
                    <AdminAgents />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/notices"
                element={
                  <AdminRoute>
                    <AdminNotices />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/students"
                element={
                  <AdminRoute>
                    <AdminStudents />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/blog"
                element={
                  <AdminRoute>
                    <AdminBlog />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/assinatura"
                element={
                  <AdminRoute>
                    <AdminSubscription />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Redirecionamento de Rotas Inexistentes */}
            <Route path="*" element={<Navigate to="/agents" replace />} />
          </Routes>
        </Suspense>

        <WhatsAppFloat />
      </BrowserRouter>
    </AuthProvider>
  );
}
