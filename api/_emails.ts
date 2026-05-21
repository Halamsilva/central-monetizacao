import { createClient } from '@supabase/supabase-js';

type EmailKind = 'registration' | 'purchase_pending' | 'access_released';

type SendAccessEmailInput = {
  to: string;
  name?: string | null;
  releaseAt?: string | null;
  idempotencyKey?: string;
};

const appName = 'Central Monetizacao';
const appUrl = process.env.APP_URL || 'https://app.halamsilva.com.br';

const normalizeEmail = (email?: unknown) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const escapeHtml = (value: unknown) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
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

const baseEmailHtml = (title: string, preview: string, body: string) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
              <tr>
                <td style="padding:28px 28px 10px;">
                  <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#2563eb;">${appName}</div>
                  <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#0f172a;">${escapeHtml(title)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 28px 28px;font-size:16px;line-height:1.65;color:#334155;">
                  ${body}
                  <p style="margin:28px 0 0;">
                    <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Abrir plataforma</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const buildEmail = (kind: EmailKind, input: SendAccessEmailInput) => {
  const firstName = escapeHtml((input.name || '').split(' ')[0] || 'aluno');
  const releaseDate = formatDate(input.releaseAt);

  if (kind === 'registration') {
    return {
      subject: 'Cadastro recebido na Central Monetizacao',
      html: baseEmailHtml(
        'Cadastro recebido',
        'Recebemos seu cadastro na Central Monetizacao.',
        `
          <p>Oi, ${firstName}. Recebemos seu cadastro com sucesso.</p>
          <p>Para liberar seu acesso, use o mesmo e-mail da compra na Kiwify. A liberacao acontece automaticamente depois da confirmacao da compra e do prazo de garantia de 7 dias.</p>
          <p>Se voce acabou de comprar, nao precisa pedir aprovacao manual: o sistema vai conferir sua compra sozinho.</p>
        `
      ),
    };
  }

  if (kind === 'purchase_pending') {
    return {
      subject: 'Compra confirmada: acesso em liberacao',
      html: baseEmailHtml(
        'Compra confirmada',
        'Sua compra foi confirmada e o acesso sera liberado apos 7 dias.',
        `
          <p>Oi, ${firstName}. Encontramos sua compra na Kiwify.</p>
          <p>Por seguranca, o acesso da area de alunos sera liberado automaticamente apos o prazo de garantia de 7 dias.</p>
          ${releaseDate ? `<p><strong>Previsao de liberacao:</strong> ${escapeHtml(releaseDate)}.</p>` : ''}
          <p>Quando o prazo terminar, entre na plataforma com este mesmo e-mail para ativar o acesso.</p>
        `
      ),
    };
  }

  return {
    subject: 'Seu acesso foi liberado',
    html: baseEmailHtml(
      'Acesso liberado',
      'Seu acesso a Central Monetizacao foi liberado.',
      `
        <p>Oi, ${firstName}. Seu acesso foi liberado.</p>
        <p>Agora voce ja pode entrar na plataforma e acessar a area de alunos.</p>
      `
    ),
  };
};

export const sendAccessEmail = async (kind: EmailKind, input: SendAccessEmailInput) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = normalizeEmail(input.to);

  if (!to) return { ok: false, skipped: true, reason: 'missing_email' };
  if (!resendApiKey) {
    console.warn(`RESEND_API_KEY not configured. Skipping ${kind} email to ${to}.`);
    return { ok: false, skipped: true, reason: 'missing_resend_api_key' };
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Central Monetizacao <onboarding@resend.dev>';
  const email = buildEmail(kind, input);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json',
  };

  if (input.idempotencyKey) {
    headers['Idempotency-Key'] = input.idempotencyKey;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from,
      to,
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error(`Failed to send ${kind} email:`, message);
    return { ok: false, error: message };
  }

  return { ok: true };
};

export const handleRegistrationEmail = async (authorization: string | undefined, body: any) => {
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
    error,
  } = await serviceSupabase.auth.getUser(token);

  if (error || !user?.email) {
    return { status: 401, body: { error: 'Invalid session' } };
  }

  const email = normalizeEmail(user.email);
  const requestedEmail = normalizeEmail(body?.email);

  if (requestedEmail && requestedEmail !== email) {
    return { status: 403, body: { error: 'Email mismatch' } };
  }

  const result = await sendAccessEmail('registration', {
    to: email,
    name: body?.name || user.user_metadata?.full_name,
    idempotencyKey: `registration-${user.id}`,
  });

  return { status: 200, body: { ok: true, email_sent: result.ok, skipped: result.skipped } };
};
