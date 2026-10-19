import { getAuth } from 'firebase-admin/auth';
import { createServiceClient, isFirebaseAdminConfigured, getAdminApp } from './_firebase.js';
import { sendAccessEmail, sendAccountReadyEmail } from './_emails.js';

type KiwifyAccessStatus = 'pending' | 'active' | 'blocked';

// Cria a conta do comprador automaticamente (sem o aluno precisar se cadastrar)
// e devolve se a conta acabou de nascer. O aluno recebe um link para criar a
// senha e ja entra com o acesso liberado.
const ensureBuyerAccount = async (
  serviceSupabase: any,
  email: string,
  displayName?: string,
): Promise<{ created: boolean; userId: string | null }> => {
  if (!isFirebaseAdminConfigured()) {
    return { created: false, userId: null };
  }

  const auth = getAuth(getAdminApp());
  let userId = '';
  let created = false;

  try {
    const existing = await auth.getUserByEmail(email);
    userId = existing.uid;
  } catch (error: any) {
    const code = String(error?.code || '');

    if (!code.includes('user-not-found')) {
      console.error('Kiwify account lookup error:', error?.message || error);
      return { created: false, userId: null };
    }

    const user = await auth.createUser({
      email,
      emailVerified: true,
      displayName: displayName || undefined,
    });

    userId = user.uid;
    created = true;
  }

  if (!created) return { created: false, userId: userId || null };

  const now = new Date().toISOString();

  const { error: profileError } = await serviceSupabase.from('profiles').insert({
    id: userId,
    email,
    full_name: displayName || 'Aluno',
    role: 'student',
    access_status: 'active',
    approved_at: now,
    created_at: now,
  });

  if (profileError) {
    console.error('Kiwify auto profile create error:', profileError);
  }

  return { created: true, userId };
};

const normalizeEmail = (email?: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getNestedValue = (source: any, paths: string[]) => {
  for (const pathKey of paths) {
    const value = pathKey
      .split('.')
      .reduce((current, key) => (current && typeof current === 'object' ? current[key] : undefined), source);

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const findEmail = (source: any): string => {
  const directEmail = getNestedValue(source, [
    'Customer.email',
    'customer.email',
    'client.email',
    'buyer.email',
    'data.customer.email',
    'data.buyer.email',
    'order.customer.email',
    'subscription.customer.email',
    'email',
  ]);

  if (directEmail) return normalizeEmail(directEmail);

  if (!source || typeof source !== 'object') return '';

  for (const value of Object.values(source)) {
    if (value && typeof value === 'object') {
      const email = findEmail(value);
      if (email) return email;
    }
  }

  return '';
};

const normalizeEventName = (event: unknown) =>
  String(event || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const normalizeProductKey = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const getKiwifyEvent = (payload: any) =>
  normalizeEventName(
    getNestedValue(payload, [
      'webhook_event_type',
      'event',
      'event_type',
      'trigger',
      'type',
      'status',
      'order_status',
      'data.status',
      'order.status',
    ]) || ''
  );

const getKiwifyProduct = (payload: any) => {
  const id = String(
    getNestedValue(payload, [
      'Product.product_id',
      'Product.id',
      'product.product_id',
      'product.id',
      'product_id',
      'data.Product.product_id',
      'data.product.id',
      'order.Product.product_id',
      'order.product.id',
      'subscription.product.id',
    ]) || ''
  );
  const name = String(
    getNestedValue(payload, [
      'Product.product_name',
      'Product.name',
      'product.product_name',
      'product.name',
      'product_name',
      'data.Product.product_name',
      'data.product.name',
      'order.Product.product_name',
      'order.product.name',
      'subscription.product.name',
      'course.name',
      'data.course.name',
    ]) || ''
  );

  return { id, name };
};

const getSubscriptionProducts = () =>
  String(process.env.KIWIFY_SUBSCRIPTION_PRODUCTS || '')
    .split(',')
    .map((item) => normalizeProductKey(item))
    .filter(Boolean);

const isSubscriptionProduct = (product: { id: string; name: string }) => {
  const subscriptions = getSubscriptionProducts();

  if (!subscriptions.length) return false;

  const candidates = [product.id, product.name]
    .map((item) => normalizeProductKey(item))
    .filter(Boolean);

  return candidates.some((candidate) =>
    subscriptions.some(
      (subscription) =>
        candidate === subscription ||
        candidate.includes(subscription) ||
        subscription.includes(candidate)
    )
  );
};

const isAllowedKiwifyProduct = (product: { id: string; name: string }) => {
  if (isSubscriptionProduct(product)) return true;

  const allowedProducts = process.env.KIWIFY_ALLOWED_PRODUCTS;

  if (!allowedProducts) return true;

  const allowed = allowedProducts
    .split(',')
    .map((item) => normalizeProductKey(item))
    .filter(Boolean);

  if (!allowed.length) return true;

  const candidates = [product.id, product.name].map((item) => normalizeProductKey(item)).filter(Boolean);

  return candidates.some((candidate) => allowed.includes(candidate));
};

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

export const handleKiwifyWebhook = async (payload: any, token?: unknown) => {
  const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN;

  if (!webhookToken) {
    return { status: 500, body: { error: 'KIWIFY_WEBHOOK_TOKEN is not configured' } };
  }

  if (token !== webhookToken) {
    console.warn('[kiwify] RECUSADO token invalido');
    return { status: 401, body: { error: 'Invalid webhook token' } };
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return { status: 500, body: { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' } };
  }

  const event = getKiwifyEvent(payload);
  const email = findEmail(payload);

  console.log(`[kiwify] recebido evento=${event || 'sem_evento'} email=${email ? 'ok' : 'ausente'}`);

  if (!email) {
    return { status: 400, body: { error: 'Customer email not found in webhook payload' } };
  }

  const buyerName = String(
    getNestedValue(payload, [
      'Customer.full_name',
      'Customer.name',
      'customer.full_name',
      'customer.name',
      'buyer.name',
      'data.customer.name',
      'data.buyer.name',
      'order.customer.name',
      'name',
    ]) || '',
  ).trim();

  const purchaseId = String(
    getNestedValue(payload, ['order_id', 'sale_id', 'id', 'data.id', 'order.id', 'transaction.id']) || email
  );
  const product = getKiwifyProduct(payload);

  const paidAtValue = getNestedValue(payload, [
    'paid_at',
    'approved_at',
    'approved_date',
    'paid_date',
    'created_at',
    'data.paid_at',
    'data.approved_date',
    'order.created_at',
    'order.approved_date',
  ]);
  const paidAt = paidAtValue ? new Date(String(paidAtValue)) : new Date();
  const basePaidAt = Number.isNaN(paidAt.getTime()) ? new Date() : paidAt;
  const isSubscription = isSubscriptionProduct(product);
  // Liberacao IMEDIATA por padrao (compra aprovada = acesso na hora, sem os 7 dias).
  // Se quiser reativar o prazo de garantia no futuro, basta definir a variavel
  // KIWIFY_RELEASE_DELAY_DAYS no painel da Vercel (ex.: 7).
  const rawReleaseDelay = Number(process.env.KIWIFY_RELEASE_DELAY_DAYS);
  const releaseDelayDays =
    Number.isFinite(rawReleaseDelay) && rawReleaseDelay > 0 ? Math.floor(rawReleaseDelay) : 0;
  const releaseAt = releaseDelayDays > 0 ? addDays(basePaidAt, releaseDelayDays) : basePaidAt;
  const isReleased = releaseAt.getTime() <= Date.now();

  const revokedEvents = [
    'reembolso',
    'compra_reembolsada',
    'compra_chargeback',
    'chargeback',
    'order_refunded',
    'order_chargeback',
    'assinatura_cancelada',
    'assinatura_atrasada',
    'assinatura_chargeback',
    'subscription_canceled',
    'subscription_late',
    'subscription_chargeback',
    'refunded',
    'canceled',
    'cancelled',
    'late',
  ];
  const approvedEvents = [
    'compra_aprovada',
    'order_approved',
    'assinatura_renovada',
    'subscription_renewed',
    'approved',
    'paid',
  ];

  const isRevoked = revokedEvents.includes(event);
  const isApproved = approvedEvents.includes(event);

  // Log enxuto de cada compra: e o que permite conferir nos logs se o aluno
  // recebeu acesso, sem precisar entrar no banco.
  const maskedEmail = email.replace(/^(.).*(@.*)$/, '$1***$2');
  const logEvent = (extra: string) => console.log(`[kiwify] ${extra} | evento=${event} email=${maskedEmail}`);

  // Bloqueios por reembolso/chargeback/cancelamento SEMPRE aplicam, mesmo se o produto não estiver na lista de permitidos.
  if (isApproved && !isAllowedKiwifyProduct(product)) {
    logEvent('IGNORADO produto_nao_permitido');

    return {
      status: 200,
      body: {
        ok: true,
        ignored: true,
        reason: 'product_not_allowed',
        event,
      },
    };
  }

  let accessStatus: KiwifyAccessStatus | null = null;

  if (isRevoked) accessStatus = 'blocked';
  if (isApproved) accessStatus = isReleased ? 'active' : 'pending';

  if (!accessStatus) {
    logEvent('IGNORADO evento_sem_acao');

    return { status: 200, body: { ok: true, ignored: true, event } };
  }

  const { error: purchaseError } = await serviceSupabase
    .from('kiwify_purchases')
    .upsert(
      {
        email,
        kiwify_order_id: purchaseId,
        product_id: product.id || product.name || null,
        purchase_status: accessStatus,
        paid_at: paidAt.toISOString(),
        release_at: releaseAt.toISOString(),
        raw_payload: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (purchaseError) {
    console.error('Kiwify purchase upsert error:', purchaseError);
    return { status: 500, body: { error: 'Failed to save purchase' } };
  }

  const profileUpdate: Record<string, string | null> = {
    access_status: accessStatus,
  };

  if (accessStatus === 'active') profileUpdate.approved_at = new Date().toISOString();
  if (accessStatus === 'pending') profileUpdate.approved_at = null;

  // Le o perfil ANTES de atualizar: precisamos saber se o acesso ja estava ativo
  // (renovacao de assinatura nao deve disparar e-mail de novo).
  const { data: existingProfile } = await serviceSupabase
    .from('profiles')
    .select('id, access_status, full_name')
    .eq('email', email)
    .eq('role', 'student')
    .maybeSingle();

  const wasActive = existingProfile?.access_status === 'active';

  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .update(profileUpdate)
    .eq('email', email)
    .eq('role', 'student');

  if (profileError) {
    console.error('Kiwify profile update error:', profileError);
    return { status: 500, body: { error: 'Failed to update profile' } };
  }

  let emailResult: { ok: boolean; skipped?: boolean; reason?: string; error?: string } = { ok: false };
  let accountCreated = false;

  if (accessStatus === 'pending') {
    emailResult = await sendAccessEmail('purchase_pending', {
      to: email,
      releaseAt: releaseAt.toISOString(),
      idempotencyKey: `kiwify-pending-${purchaseId}`,
    });
  }

  if (accessStatus === 'active') {
    // 1) Garante que existe conta no Firebase + perfil (cria se faltar algum dos dois).
    //    Sem isso, um perfil importado manualmente nao teria login nenhum.
    const account = await ensureBuyerAccount(serviceSupabase, email, buyerName || existingProfile?.full_name || undefined);
    accountCreated = account.created;

    // 2) Primeira liberacao (acesso novo): manda o link que define a senha.
    //    Esse link chega no e-mail do COMPRADOR — e o que impede alguem que tenha
    //    se cadastrado antes com o e-mail de outra pessoa de ficar com o acesso:
    //    o dono real do e-mail redefine a senha e assume a conta.
    //    Renovacao de assinatura (wasActive) nao recebe nada para nao virar spam.
    if (!wasActive) {
      emailResult = await sendAccountReadyEmail(email, {
        name: buyerName || existingProfile?.full_name || null,
        idempotencyKey: `kiwify-account-ready-${email}-${purchaseId}`,
      });
    }
  }

  logEvent(
    `OK status=${accessStatus} conta_criada=${accountCreated} email_enviado=${emailResult.ok}` +
      (emailResult.skipped ? ` email_pulado=${emailResult.reason || 'sim'}` : '') +
      (emailResult.error ? ` email_erro=${String(emailResult.error).slice(0, 160)}` : ''),
  );

  return {
    status: 200,
    body: {
      ok: true,
      event,
      email,
      product_name: product.name || null,
      product_id: product.id || null,
      is_subscription: isSubscription,
      release_days: isSubscription ? 0 : releaseDelayDays,
      access_status: accessStatus,
      release_at: releaseAt.toISOString(),
      account_created: accountCreated,
      email_sent: emailResult.ok,
      email_skipped: Boolean(emailResult.skipped),
      email_reason: emailResult.reason || null,
      email_error: emailResult.error ? String(emailResult.error).slice(0, 300) : null,
    },
  };
};

export const handleAccessSync = async (authorization?: string) => {
  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return { status: 500, body: { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' } };
  }

  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { status: 401, body: { error: 'Missing authorization token' } };
  }

  const {
    data: { user },
    error: authError,
  } = await serviceSupabase.auth.getUser(token);

  if (authError || !user?.email) {
    return { status: 401, body: { error: 'Invalid session' } };
  }

  const email = normalizeEmail(user.email);
  const { data: purchase, error: purchaseError } = await serviceSupabase
    .from('kiwify_purchases')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (purchaseError) {
    console.error('Access sync purchase error:', purchaseError);
    return { status: 500, body: { error: 'Failed to check purchase' } };
  }

  if (!purchase) {
    return { status: 200, body: { ok: true, access_status: 'pending' } };
  }

  const releaseAt = new Date(purchase.release_at);
  const purchaseProductKey = String(purchase.product_id || '');
  const matchesSubscription = purchaseProductKey
    ? isSubscriptionProduct({ id: purchaseProductKey, name: purchaseProductKey })
    : false;

  // Mesma regra do webhook: sem prazo configurado, libera na hora (inclusive os
  // alunos que ficaram pendentes pela regra antiga dos 7 dias).
  const rawSyncDelay = Number(process.env.KIWIFY_RELEASE_DELAY_DAYS);
  const syncDelayDays =
    Number.isFinite(rawSyncDelay) && rawSyncDelay > 0 ? Math.floor(rawSyncDelay) : 0;

  const nextStatus: KiwifyAccessStatus =
    purchase.purchase_status === 'blocked'
      ? 'blocked'
      : matchesSubscription || syncDelayDays === 0 || releaseAt.getTime() <= Date.now()
        ? 'active'
        : 'pending';

  let syncEmailResult: { ok: boolean; skipped?: boolean; reason?: string; error?: string } | null = null;

  if (nextStatus === 'active' && purchase.purchase_status !== 'active') {
    await serviceSupabase
      .from('kiwify_purchases')
      .update({ purchase_status: 'active', updated_at: new Date().toISOString() })
      .eq('email', email);

    syncEmailResult = await sendAccessEmail('access_released', {
      to: email,
      releaseAt: purchase.release_at,
      idempotencyKey: `access-released-${email}-${purchase.release_at}`,
    });
  }

  const profileUpdate: Record<string, string | null> = {
    access_status: nextStatus,
  };

  if (nextStatus === 'active') profileUpdate.approved_at = new Date().toISOString();

  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)
    .eq('role', 'student');

  if (profileError) {
    console.error('Access sync profile error:', profileError);
    return { status: 500, body: { error: 'Failed to update access' } };
  }

  return {
    status: 200,
    body: {
      ok: true,
      access_status: nextStatus,
      release_at: purchase.release_at,
      email_sent: syncEmailResult ? syncEmailResult.ok : null,
      email_skipped: syncEmailResult ? Boolean(syncEmailResult.skipped) : null,
      email_reason: syncEmailResult?.reason || null,
      email_error: syncEmailResult?.error ? String(syncEmailResult.error).slice(0, 300) : null,
    },
  };
};
