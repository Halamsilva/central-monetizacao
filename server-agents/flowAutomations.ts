import { createServiceClient, isFirebaseAdminConfigured } from '../api/_firebase.js';

const getServiceSupabase = () => (isFirebaseAdminConfigured() ? createServiceClient() : null);

const COLLECTION = 'flow_automations';

const clean = (value: unknown, maxLength = 2000) =>
  String(value || '').trim().slice(0, maxLength);

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

  return { user, isAdmin: profile?.role === 'admin' };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return res.status(500).json({ error: 'Servico indisponivel.' });
  }

  const access = await checkAccess(serviceSupabase, req, res);
  if (!access) return;

  const { user, isAdmin } = access;
  const action = clean(req.body?.action, 40);

  // ------------------------------------------------------------------- list
  if (action === 'list') {
    const { data, error } = await serviceSupabase
      .from(COLLECTION)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('flow_automations list error:', error);
      return res.status(500).json({ error: 'Nao consegui carregar as automacoes.' });
    }

    return res.status(200).json({ items: Array.isArray(data) ? data : [] });
  }

  // ------------------------------------------------------------------- save
  if (action === 'save') {
    if (!isAdmin) {
      return res.status(403).json({ error: 'Somente o administrador pode adicionar ou editar cards.' });
    }

    const id = clean(req.body?.id, 80);
    const title = clean(req.body?.title, 200);
    const description = clean(req.body?.description, 800);
    const imageUrl = clean(req.body?.imageUrl, 500000);
    const link = clean(req.body?.link, 1000);

    if (!title) {
      return res.status(400).json({ error: 'Informe o titulo do card.' });
    }

    if (!link) {
      return res.status(400).json({ error: 'Informe o link que o aluno vai abrir ao clicar.' });
    }

    const payload = {
      title,
      description,
      image_url: imageUrl,
      link,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await serviceSupabase
        .from(COLLECTION)
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('flow_automations update error:', error);
        return res.status(500).json({ error: 'Nao consegui salvar as alteracoes. Tente novamente.' });
      }

      return res.status(200).json({ ok: true, id });
    }

    const { data, error } = await serviceSupabase
      .from(COLLECTION)
      .insert({
        ...payload,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      console.error('flow_automations insert error:', error);
      return res.status(500).json({ error: 'Nao consegui adicionar o card. Tente novamente.' });
    }

    return res.status(200).json({ ok: true, id: data.id });
  }

  // ----------------------------------------------------------------- delete
  if (action === 'delete') {
    if (!isAdmin) {
      return res.status(403).json({ error: 'Somente o administrador pode remover cards.' });
    }

    const id = clean(req.body?.id, 80);
    if (!id) {
      return res.status(400).json({ error: 'Card nao informado.' });
    }

    const { error } = await serviceSupabase.from(COLLECTION).delete().eq('id', id);

    if (error) {
      console.error('flow_automations delete error:', error);
      return res.status(500).json({ error: 'Nao consegui remover o card. Tente novamente.' });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Acao invalida.' });
}
