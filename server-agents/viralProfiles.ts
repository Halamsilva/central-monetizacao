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

type Network = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'outro';

const detectNetwork = (hostname: string): Network => {
  const host = hostname.toLowerCase();

  if (host.includes('tiktok')) return 'tiktok';
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('facebook') || host.includes('fb.com') || host.includes('fb.me')) return 'facebook';

  return 'outro';
};

// Extrai o @usuario (ou id) do link. Aceita /@nome, /nome, /c/nome,
// /people/Nome/123 e profile.php?id=123.
const extractHandle = (parsed: URL, network: Network) => {
  const parts = parsed.pathname
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (network === 'facebook') {
    const id = parsed.searchParams.get('id');
    if (id) return id;

    const peopleIndex = parts.indexOf('people');
    if (peopleIndex >= 0 && parts[peopleIndex + 2]) return parts[peopleIndex + 2];

    if (parts[0] === 'profile.php') return '';

    return (parts[0] || '').split('?')[0];
  }

  const last = parts[parts.length - 1] || '';
  const cleaned = last.replace(/^@/, '').split('?')[0];

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

// Leitor publico que renderiza a pagina com navegador real. E o unico jeito
// de ler o Facebook sem login/App Review (o site bloqueia requests diretas).
const JINA_READER = 'https://r.jina.ai/';

const fetchRenderedHtml = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${JINA_READER}${url}`, {
      headers: {
        'X-Return-Format': 'html',
        Accept: 'text/html',
      },
      signal: controller.signal,
    });

    if (!response.ok) return '';

    return await response.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
};

const decodeEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const formatFollowerCount = (raw: string) => {
  const value = raw.trim();
  if (!value) return '';

  if (value.includes(',')) {
    return `${value.replace(/,/g, '.')} seguidores`;
  }

  return `${value} seguidores`;
};

const readFacebookProfile = async (url: string) => {
  const html = await fetchRenderedHtml(url);
  if (!html) return null;

  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s*\|\s*Facebook.*$/i, '');

  const ogImage =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
    '';

  const description =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ||
    '';

  const followerMatch = decodeEntities(description).match(/([\d.,]+\s*[KMB]?)\s*followers?/i);

  return {
    name: title,
    avatarUrl: decodeEntities(ogImage),
    followers: followerMatch ? formatFollowerCount(followerMatch[1]) : '',
    slug: readFacebookSlug(html),
  };
};

const formatCompactNumber = (raw: string) => {
  const value = raw.trim().replace(/\s+/g, '');

  if (/^\d+\.\d+[KMB]?$/i.test(value)) return value.replace('.', ',');
  if (/^\d{1,3}(,\d{3})+$/.test(value)) return value.replace(/,/g, '.');

  return value;
};

const fetchRenderedMarkdown = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${JINA_READER}${url}`, {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (!response.ok) return '';

    return await response.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
};

const readSocialProfile = async (url: string) => {
  const markdown = await fetchRenderedMarkdown(url);
  if (!markdown || /Log into|Log in to|Enter your password/i.test(markdown.slice(0, 1500))) return null;

  const title = decodeEntities(markdown.match(/^Title:\s*(.+)$/m)?.[1] || '');
  const subscriberMatch = markdown.match(/([\d.,]+\s*[KMB]?)\s*subscribers?/i);
  const tiktokFollowerMatch = markdown.match(/\*\*([\d.,]+\s*[KMB]?)\*\*\s*Followers/i);

  let followers = '';

  if (subscriberMatch) followers = `${formatCompactNumber(subscriberMatch[1])} inscritos`;
  else if (tiktokFollowerMatch) followers = `${formatCompactNumber(tiktokFollowerMatch[1])} seguidores`;

  return { name: title, followers };
};

const readFacebookSlug = (html: string) => {
  const people = html.match(/people\/([^/"\\]+)\/\d+/)?.[1];
  if (people) return decodeURIComponent(people);

  const page = html.match(/\/p\/([^/"\\]+)-\d+/)?.[1];
  if (page) return decodeURIComponent(page);

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
  const handle = extractHandle(parsed, network);

  if (!handle) {
    const message =
      network === 'facebook'
        ? 'Use o link completo do perfil (ex: https://www.facebook.com/profile.php?id=123456789).'
        : 'Nao consegui identificar o @usuario nesse link.';

    return res.status(400).json({ error: message });
  }

  let name = '';
  let avatarUrl = buildAvatarUrl(network, handle);
  let followers = '';
  let notice = '';
  let needsManualAvatar = false;
  let displayHandle = handle;

  if (network === 'facebook') {
    const facebook = await readFacebookProfile(rawUrl);

    if (facebook) {
      name = facebook.name;
      avatarUrl = facebook.avatarUrl || '';
      followers = facebook.followers;
      if (facebook.slug) displayHandle = facebook.slug;
    }

    if (!name && !avatarUrl) {
      notice = 'O Facebook nao liberou os dados agora. Preencha nome, foto e seguidores manualmente.';
    }
  } else if (network === 'tiktok') {
    const [oembed, social] = await Promise.all([fetchTikTokOEmbed(rawUrl), readSocialProfile(rawUrl)]);

    name = oembed?.name || social?.name || '';
    followers = social?.followers || '';
  } else if (network === 'instagram') {
    needsManualAvatar = true;
    notice =
      'O Instagram bloqueia nome, foto e seguidores automaticamente. Preencha os campos abaixo (ou deixe em branco).';
  } else if (network === 'youtube') {
    const social = await readSocialProfile(rawUrl);

    name = social?.name || '';
    followers = social?.followers || '';

    if (!name && !followers) {
      notice = 'O YouTube nao liberou os dados agora. Confira a foto e complete os campos restantes.';
    }
  } else {
    notice = 'Rede nao reconhecida. Preencha os dados manualmente.';
  }

  return res.json({
    ok: true,
    network,
    handle: displayHandle,
    name,
    avatarUrl,
    followers,
    notice,
    url: rawUrl,
    needsManualAvatar,
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