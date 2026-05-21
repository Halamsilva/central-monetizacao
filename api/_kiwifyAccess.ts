import { createClient } from '@supabase/supabase-js';
import { sendAccessEmail } from './_emails';

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
      'Product.id',
      'product.id',
      'product_id',
      'data.product.id',
      'order.product.id',
      'subscription.product.id',
    ]) || ''
  );
  const name = String(
    getNestedValue(payload, [
      'Product.name',
      'product.name',
      'product_name',
      'data.product.name',
      'order.product.name',
      'subscription.product.name',
      'course.name',
      'data.course.name',
    ]) || ''
  );

  return { id, name };
};

const isAllowedKiwifyProduct = (product: { id: string; name: string }) => {
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

const getServiceSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

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

  if (!isAllowedKiwifyProduct(product)) {
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

  const paidAtValue = getNestedValue(payload, [
    'paid_at',
    'approved_at',
    'created_at',
    'data.paid_at',
    'order.created_at',
  ]);
  const paidAt = paidAtValue ? new Date(String(paidAtValue)) : new Date();
  const releaseDelayDays = Number(process.env.KIWIFY_RELEASE_DELAY_DAYS || 7);
  const releaseAt = addDays(Number.isNaN(paidAt.getTime()) ? new Date() : paidAt, releaseDelayDays);
  const isReleased = releaseAt.getTime() <= Date.now();

  const revokedEvents = [
    'reembolso',
    'compra_reembolsada',
    'order_refunded',
    'chargeback',
    'assinatura_cancelada',
    'assinatura_atrasada',
    'subscription_canceled',
    'subscription_late',
    'refunded',
    'canceled',
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

  let accessStatus: KiwifyAccessStatus | null = null;

  if (revokedEvents.includes(event)) accessStatus = 'blocked';
  if (approvedEvents.includes(event)) accessStatus = isReleased ? 'active' : 'pending';

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

  if (accessStatus === 'pending') {
    await sendAccessEmail('purchase_pending', {
      to: email,
      releaseAt: releaseAt.toISOString(),
      idempotencyKey: `kiwify-pending-${purchaseId}`,
    });
  }

  if (accessStatus === 'active') {
    await sendAccessEmail('access_released', {
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
      access_status: accessStatus,
      release_at: releaseAt.toISOString(),
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
  const nextStatus: KiwifyAccessStatus =
    purchase.purchase_status === 'blocked'
      ? 'blocked'
      : releaseAt.getTime() <= Date.now()
        ? 'active'
        : 'pending';

  if (nextStatus === 'active' && purchase.purchase_status !== 'active') {
    await serviceSupabase
      .from('kiwify_purchases')
      .update({ purchase_status: 'active', updated_at: new Date().toISOString() })
      .eq('email', email);

    await sendAccessEmail('access_released', {
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
    },
  };
};
