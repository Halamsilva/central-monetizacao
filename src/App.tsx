import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Páginas com Lazy Loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Recovery = lazy(() => import('./pages/Recovery'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notices = lazy(() => import('./pages/Notices'));
const Agents = lazy(() => import('./pages/Agents'));
const ViralPrompts = lazy(() => import('./pages/ViralPrompts'));
const TikTokShop = lazy(() => import('./pages/TikTokShop'));
const Facebook = lazy(() => import('./pages/Facebook'));
const YouTubeShorts = lazy(() => import('./pages/YouTubeShorts'));
const ToolsIA = lazy(() => import('./pages/ToolsIA'));
const Novelinhas = lazy(() => import('./pages/Novelinhas'));
const Downloads = lazy(() => import('./pages/Downloads'));
const ShopVIP = lazy(() => import('./pages/ShopVIP')); // <-- Importado com calma aqui!
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Páginas de Administração
const Admin = lazy(() => import('./pages/Admin'));
const AdminAgents = lazy(() => import('./pages/AdminAgents'));
const AdminNotices = lazy(() => import('./pages/AdminNotices'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));

const routeTitles: Record<string, string> = {
  '/login': 'Entrar',
  '/register': 'Cadastro',
  '/recovery': 'Recuperar acesso',
  '/dashboard': 'Dashboard',
  '/notices': 'Novidades',
  '/agents': 'Agentes IA',
  '/viral-prompts': 'Prompts Virais',
  '/tiktok-shop': 'TikTok Shop',
  '/facebook': 'Facebook',
  '/youtube-shorts': 'YouTube e Shorts',
  '/tools-ia': 'Ferramentas IA',
  '/novelinhas': 'Fábrica de Novelinhas',
  '/downloads': 'Downloads',
  '/shop-vip': 'Loja VIP',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/admin': 'Painel Admin',
  '/admin/agents': 'Gerenciar Agentes',
  '/admin/notices': 'Gerenciar Avisos',
  '/admin/students': 'Gerenciar Alunos',
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
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user && import.meta.env.VITE_SUPABASE_URL) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.access_status === 'blocked') {
    return <BlockedAccessScreen />;
  }

  if (profile?.role === 'admin') {
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
    return <Navigate to="/dashboard" replace />;
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

            {/* Rotas Privadas de Alunos com Layout Base */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notices" element={<Notices />} />
              <Route path="agents" element={<Agents />} />
              <Route path="viral-prompts" element={<ViralPrompts />} />
              <Route path="tiktok-shop" element={<TikTokShop />} />
              <Route path="facebook" element={<Facebook />} />
              <Route path="youtube-shorts" element={<YouTubeShorts />} />
              <Route path="tools-ia" element={<ToolsIA />} />
              <Route path="novelinhas" element={<Novelinhas />} />
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
            </Route>

            {/* Redirecionamento de Rotas Inexistentes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
