import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const checkAccess = async (serviceSupabase: any, req: any, res: any) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Sessao invalida. Faca login novamente.' });
    return null;
  }

  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('role, access_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Erro ao conferir acesso.' });
    return null;
  }

  const canUse =
    profile?.role === 'admin' ||
    (profile?.role === 'student' && profile?.access_status === 'active');

  if (!canUse) {
    res.status(403).json({ error: 'Acesso ainda nao liberado.' });
    return null;
  }

  return user;
};

type Network = 'tiktok' | 'instagram' | 'youtube' | 'outro';

const detectNetwork = (hostname: string): Network => {
  const host = hostname.toLowerCase();

  if (host.includes('tiktok')) return 'tiktok';
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';

  return 'outro';
};

// Extrai o @usuario do link. Aceita /@nome, /nome, /c/nome, /user/nome.
const extractHandle = (pathname: string, network: Network) => {
  const parts = pathname
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  const last = parts[parts.length - 1] || '';
  const cleaned = last.replace(/^@/, '').split('?')[0];

  if (network === 'youtube') {
    return cleaned;
  }

  return cleaned;
};

const fetchTikTokOEmbed = async (url: string) => {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; central-monetizacao/1.0)' },
    });

    if (!response.ok) return null;

    const data: any = await response.json();
    return {
      name: String(data?.author_name || '').trim(),
    };
  } catch {
    return null;
  }
};

const buildAvatarUrl = (network: Network, handle: string) => {
  if (!handle) return '';

  if (network === 'tiktok') return `https://unavatar.io/tiktok/${handle}`;
  if (network === 'instagram') return `https://unavatar.io/instagram/${handle}`;
  if (network === 'youtube') return `https://unavatar.io/youtube/@${handle}`;

  return '';
};

const handleFetchProfile = async (req: any, res: any) => {
  const rawUrl = String(req.body?.url || '').trim();

  if (!rawUrl.includes('http')) {
    return res.status(400).json({ error: 'Cole o link completo do perfil (comecando com https://).' });
  }

  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Esse link nao parece valido.' });
  }

  const network = detectNetwork(parsed.hostname);
  const handle = extractHandle(parsed.pathname, network);

  if (!handle) {
    return res.status(400).json({ error: 'Nao consegui identificar o @usuario nesse link.' });
  }

  let name = handle;

  if (network === 'tiktok') {
    const oembed = await fetchTikTokOEmbed(rawUrl);
    if (oembed?.name) name = oembed.name;
  }

  return res.json({
    ok: true,
    network,
    handle,
    name,
    avatarUrl: buildAvatarUrl(network, handle),
    url: rawUrl,
    // Instagram bloqueia extracao automatica desde 2020. O nome/foto precisam
    // ser completados na mao nesse caso.
    needsManualAvatar: network === 'instagram',
  });
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const user = await checkAccess(serviceSupabase, req, res);
  if (!user) return;

  return handleFetchProfile(req, res);
}