import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Recovery = lazy(() => import('./pages/Recovery'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notices = lazy(() => import('./pages/Notices'));
const Updates = lazy(() => import('./pages/Updates'));
const Agents = lazy(() => import('./pages/Agents'));
const ViralPrompts = lazy(() => import('./pages/ViralPrompts'));
const TikTokShop = lazy(() => import('./pages/TikTokShop'));
const Facebook = lazy(() => import('./pages/Facebook'));
const YouTubeShorts = lazy(() => import('./pages/YouTubeShorts'));
const ToolsIA = lazy(() => import('./pages/ToolsIA'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminAgents = lazy(() => import('./pages/AdminAgents'));
const AdminNotices = lazy(() => import('./pages/AdminNotices'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

const PendingAccessScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
    <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
        🔒
      </div>

      <h1 className="text-3xl font-black text-slate-900">
        Acesso em análise
      </h1>

      <p className="mt-4 leading-relaxed text-slate-500">
        Seu cadastro foi recebido. Aguarde a liberação da equipe.
      </p>
    </div>
  </div>
);

const BlockedAccessScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
    <div className="max-w-md rounded-3xl border border-red-100 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
        🚫
      </div>

      <h1 className="text-3xl font-black text-slate-900">
        Acesso bloqueado
      </h1>

      <p className="mt-4 leading-relaxed text-slate-500">
        Seu acesso foi bloqueado.
      </p>
    </div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user && import.meta.env.VITE_SUPABASE_URL) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  if (profile?.access_status === 'blocked') {
    return <BlockedAccessScreen />;
  }

  if (profile?.access_status !== 'active') {
    return <PendingAccessScreen />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recovery" element={<Recovery />} />

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
              <Route path="updates" element={<Updates />} />
              <Route path="agents" element={<Agents />} />
              <Route path="viral-prompts" element={<ViralPrompts />} />
              <Route path="tiktok-shop" element={<TikTokShop />} />
              <Route path="facebook" element={<Facebook />} />
              <Route path="youtube-shorts" element={<YouTubeShorts />} />
              <Route path="tools-ia" element={<ToolsIA />} />
              <Route path="downloads" element={<Downloads />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />

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

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}