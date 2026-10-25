import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import WhatsAppFloat from './components/common/WhatsAppFloat';
import { firebaseAuth, isFirebaseConfigured } from './lib/supabase';
import { MessageCircle } from 'lucide-react';
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from './lib/support';

// PÃ¡ginas com Lazy Loading
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
const ClonagemVideo = lazy(() => import('./pages/clonagem/App'));
const ClonagemPro = lazy(() => import('./pages/clonagemPro/App'));
const NovelinhasUni = lazy(() => import('./pages/NovelinhasUni'));
const FrameExtractor = lazy(() => import('./pages/FrameExtractor'));
const ViralProfiles = lazy(() => import('./pages/ViralProfiles'));
const Mestre30s = lazy(() => import('./pages/mestre30s/App'));
const Insetos = lazy(() => import('./pages/insetos/App'));
const PovProduto = lazy(() => import('./pages/povProduto/App'));
const Seedance = lazy(() => import('./pages/seedance/App'));
const AvatarScale = lazy(() => import('./pages/AvatarScale'));
const ReceitasEbook = lazy(() => import('./pages/receitasEbook/App'));
const Encapsulados = lazy(() => import('./pages/encapsulados/App'));
const RadarTikTokShop = lazy(() => import('./pages/RadarTikTokShop'));
const TiktokShopShopee = lazy(() => import('./pages/tiktokShopShopee/App'));
const Lumina8k = lazy(() => import('./pages/lumina8k/App'));
const ReflexaoVelhoRoca = lazy(() => import('./pages/reflexaoVelhoRoca/App'));
const Plantacoes = lazy(() => import('./pages/plantacoes/App'));
const Limpeza = lazy(() => import('./pages/limpeza/App'));
const Ganchos = lazy(() => import('./pages/ganchos/App'));
const VideoStudio = lazy(() => import('./pages/videoStudio/App'));
const FlowAutomations = lazy(() => import('./pages/flowAutomations/App'));
const CriadorNoticias = lazy(() => import('./pages/criadorNoticias/App'));
const ChatIA = lazy(() => import('./pages/ChatIA/App'));
const ImagensIA = lazy(() => import('./pages/ImagensIA/App'));
const Assinar = lazy(() => import('./pages/Assinar'));
const BoasVindas = lazy(() => import('./pages/BoasVindas'));
const ConfigurableAgent = lazy(() => import('./pages/ConfigurableAgent'));
const Tutorials = lazy(() => import('./pages/Tutorials'));
const Downloads = lazy(() => import('./pages/Downloads'));
const ShopVIP = lazy(() => import('./pages/ShopVIP')); // <-- Importado com calma aqui!
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Home = lazy(() => import('./pages/Home'));

// PÃ¡ginas de AdministraÃ§Ã£o
const Admin = lazy(() => import('./pages/Admin'));
const AdminAgents = lazy(() => import('./pages/AdminAgents'));
const AdminNotices = lazy(() => import('./pages/AdminNotices'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));
const AdminBlog = lazy(() => import('./pages/AdminBlog'));
const AdminSubscription = lazy(() => import('./pages/AdminSubscription'));

const routeTitles: Record<string, string> = {
  '/': 'InÃ­cio',
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
  '/clonagem-pro': 'Clonagem de Video PRO',
  '/novelinhas': 'Novelinhas Universal',
  '/mestre-30s': 'Mestre 30s',
  '/insetos': 'Receitas Anti-Pragas',
  '/pov-produto': 'POV Produto',
  '/seedance': 'TikTok Shop Seedance',
  '/avatar-scale': 'Gordo para Magro',
  '/receitas-ebook': 'Receitas p/ Ebook',
  '/encapsulados': 'Vender Encapsulados',
  '/radar-tiktok-shop': 'Radar TikTok Shop',
  '/tiktok-shop-shopee': 'TikTok Shop & Shopee',
  '/lumina-8k': 'Upscale de Imagem',
  '/reflexao-velho-roca': 'ReflexÃ£o do Velho da RoÃ§a',
  '/novelinhas-gordos': 'Novelinhas Gordos',
  '/novelinhas-frutas': 'Novelinhas Frutas',
  '/extrator-frames': 'Extrator de Quadros',
  '/perfis-virais': 'Perfis Virais',
  '/chat-ia': 'Chat IA',
  '/imagens-ia': 'Imagens IA',
  '/criador-noticias': 'Criador de NotÃ­cias',
  '/admin/assinatura': 'Pagina de Assinatura',
  '/tutoriais': 'Tutoriais',
  '/downloads': 'Downloads',
  '/shop-vip': 'Loja VIP',
  '/profile': 'Perfil',
  '/settings': 'ConfiguraÃ§Ãµes',
  '/admin': 'Painel Admin',
  '/admin/agents': 'Gerenciar Agentes',
  '/admin/notices': 'Gerenciar Avisos',
  '/admin/students': 'Gerenciar Alunos',
  '/admin/blog': 'Gerenciar Blog',
};

const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = routeTitles[location.pathname] || 'Central MonetizaÃ§Ã£o';
    document.title = `${pageTitle} | Central MonetizaÃ§Ã£o`;
  }, [location.pathname]);

  return null;
};

// Tela de Carregamento Global
const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

// Tela de Cadastro em AnÃ¡lise
const PendingAccessScreen = () => {
  const { profile } = useAuth();
  const email = profile?.email || '';

  return (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
    <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
        ðŸ”’
      </div>
      <h1 className="text-3xl font-black text-slate-900">Acesso em anÃ¡lise</h1>
      <p className="mt-4 leading-relaxed text-slate-500">
        Seu cadastro foi recebido. Use o <strong>mesmo e-mail da compra</strong> na Kiwify:
        o acesso Ã© liberado automaticamente apÃ³s a confirmaÃ§Ã£o da compra. A assinatura da
        plataforma e a compra do curso liberam na hora.
      </p>
      <a
        href="/assinar"
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700"
      >
        Quero sÃ³ o acesso Ã  plataforma (assinar)
      </a>
      <a
        href={whatsappLink(`OlÃ¡! Fiz a compra na Kiwify e meu acesso ainda nÃ£o foi liberado. Meu e-mail de compra Ã© ${email || '(meu e-mail)'}. Pode liberar meu acesso, por favor?`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-bold text-white transition hover:brightness-105"
      >
        <MessageCircle size={18} />
        Pedir liberaÃ§Ã£o no WhatsApp
      </a>
    </div>
  </div>
  );
};

// Tela de Acesso Bloqueado
const BlockedAccessScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
    <div className="max-w-md rounded-3xl border border-red-100 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
        ðŸš«
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
    return <Navigate to="/" replace />;
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
            {/* Rotas PÃºblicas */}
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
              <Route index element={<Home />} />
          <Route path="automacoes-flow" element={<FlowAutomations />} />
              <Route path="agents" element={<AdminRoute><Agents /></AdminRoute>} />
              <Route path="viral-prompts" element={<ViralPrompts />} />
              <Route path="tiktok-shop" element={<TikTokShop />} />
              <Route path="facebook" element={<Facebook />} />
              <Route path="youtube-shorts" element={<YouTubeShorts />} />
              <Route path="tools-ia" element={<ToolsIA />} />
              <Route path="menina-da-roca" element={<MeninaDaRoca />} />
              <Route path="clonagem-video" element={<ClonagemVideo />} />
          <Route path="clonagem-pro" element={<ClonagemPro />} />
              <Route path="novelinhas" element={<NovelinhasUni />} />
              <Route path="mestre-30s" element={<Mestre30s />} />
              <Route path="insetos" element={<Insetos />} />
              <Route path="pov-produto" element={<PovProduto />} />
              <Route path="seedance" element={<Seedance />} />
          <Route path="avatar-scale" element={<AvatarScale />} />
          <Route path="receitas-ebook" element={<ReceitasEbook />} />
          <Route path="encapsulados" element={<Encapsulados />} />
          <Route path="radar-tiktok-shop" element={<RadarTikTokShop />} />
          <Route path="tiktok-shop-shopee" element={<TiktokShopShopee />} />
          <Route path="lumina-8k" element={<Lumina8k />} />
          <Route path="reflexao-velho-roca" element={<ReflexaoVelhoRoca />} />
          <Route path="plantacoes" element={<Plantacoes />} />
          <Route path="limpeza" element={<Limpeza />} />
          <Route path="ganchos" element={<Ganchos />} />
          <Route path="criador-noticias" element={<CriadorNoticias />} />
          <Route path="video-studio" element={<VideoStudio />} />
          <Route path="novelinhas-gordos" element={<NovelinhasUni lockedTheme="Gordos" extraThemes={['Gordos Suados']} />} />
          <Route path="novelinhas-frutas" element={<NovelinhasUni lockedTheme="Frutas" />} />
          <Route path="extrator-frames" element={<FrameExtractor />} />
          <Route path="perfis-virais" element={<ViralProfiles />} />
          <Route path="chat-ia" element={<ChatIA />} />
          <Route path="imagens-ia" element={<ImagensIA />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <WhatsAppFloat />
      </BrowserRouter>
    </AuthProvider>
  );
}
