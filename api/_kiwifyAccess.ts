import { createServiceClient, isFirebaseAdminConfigured } from './_firebase.js';
import { sendAccessEmail } from './_emails.js';

type KiwifyAccessStatus = 'pending' | 'active' | 'blocked';

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
    return { status: 401, body: { error: 'Invalid webhook token' } };
  }

  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) {
    return { status: 500, body: { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' } };
  }

  const event = getKiwifyEvent(payload);
  const email = findEmail(payload);

  if (!email) {
    return { status: 400, body: { error: 'Customer email not found in webhook payload' } };
  }

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

  // Bloqueios por reembolso/chargeback/cancelamento SEMPRE aplicam, mesmo se o produto não estiver na lista de permitidos.
  if (isApproved && !isAllowedKiwifyProduct(product)) {
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

  if (accessStatus === 'pending') {
    emailResult = await sendAccessEmail('purchase_pending', {
      to: email,
      releaseAt: releaseAt.toISOString(),
      idempotencyKey: `kiwify-pending-${purchaseId}`,
    });
  }

  if (accessStatus === 'active') {
    emailResult = await sendAccessEmail('access_released', {
      to: email,
      releaseAt: releaseAt.toISOString(),
      idempotencyKey: `kiwify-active-${purchaseId}`,
    });
  }

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
