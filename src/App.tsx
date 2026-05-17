import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
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

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );

  if (!user && import.meta.env.VITE_SUPABASE_URL) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          }
        >
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
              <Route
                index
                element={<Navigate to="/dashboard" replace />}
              />

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
            </Route>

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}