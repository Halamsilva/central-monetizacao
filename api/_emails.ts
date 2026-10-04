import { getAuth } from 'firebase-admin/auth';
import { createServiceClient, isFirebaseAdminConfigured, getAdminApp } from './_firebase.js';

type EmailKind = 'registration' | 'purchase_pending' | 'access_released' | 'password_reset';

type SendAccessEmailInput = {
  to: string;
  name?: string | null;
  releaseAt?: string | null;
  idempotencyKey?: string;
  resetUrl?: string | null;
};

const appName = 'Central Monetizacao';
const appUrl = (process.env.APP_URL || 'https://www.halamsilva.com.br').replace(/\/+$/, '');

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

const getServiceSupabase = () => isFirebaseAdminConfigured() ? createServiceClient() : null;

const platformCta = `<p style="margin:28px 0 0;">
                    <a href="${appUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Abrir plataforma</a>
                  </p>`;

const registerCta = `<p style="margin:28px 0 0;">
                    <a href="${appUrl}/boas-vindas" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Criar minha conta agora</a>
                  </p>`;

const baseEmailHtml = (title: string, preview: string, body: string, ctaHtml: string = platformCta) => `
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
                  ${ctaHtml}
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
  const rawName = (input.name || '').split(' ')[0] || 'aluno';
  const firstName = escapeHtml(rawName);
  const releaseDate = formatDate(input.releaseAt);

  if (kind === 'registration') {
    return {
      subject: 'Cadastro recebido na Central Monetizacao',
      text: `Oi, ${rawName}. Recebemos seu cadastro na Central Monetizacao.

ATENCAO: este e-mail e da CENTRAL MONETIZACAO. Se nao encontrar esta mensagem na caixa de entrada, procure tambem na pasta SPAM / lixo eletronico.

Para liberar seu acesso, use o mesmo e-mail da compra na Kiwify. A liberacao acontece automaticamente apos a confirmacao: a assinatura da plataforma libera na hora e a compra do curso libera apos o prazo de garantia de 7 dias.

Acesse: ${appUrl}`,
      html: baseEmailHtml(
        'Cadastro recebido',
        'Recebemos seu cadastro na Central Monetizacao.',
        `
          <p>Oi, ${firstName}. Recebemos seu cadastro com sucesso.</p>
          <p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:12px 14px;color:#92400e;font-size:14px;line-height:1.6;">
            <strong>Atencao:</strong> este e-mail e da <strong>Central Monetizacao</strong>.
            Se nao encontrar esta mensagem na caixa de entrada, procure tambem na pasta <strong>SPAM / lixo eletronico</strong>.
          </p>
          <p>Para liberar seu acesso, use o mesmo e-mail da compra na Kiwify. A liberacao acontece automaticamente apos a confirmacao: a assinatura da plataforma libera na hora e a compra do curso libera apos o prazo de garantia de 7 dias.</p>
          <p>Se voce acabou de comprar, nao precisa pedir aprovacao manual: o sistema vai conferir sua compra sozinho.</p>
        `
      ),
    };
  }

  if (kind === 'purchase_pending') {
    return {
      subject: 'Acao necessaria: crie sua conta na Central Monetizacao',
      text: `Oi, ${rawName}. Encontramos sua compra na Kiwify.

ATENCAO: este e-mail e da CENTRAL MONETIZACAO e e DIFERENTE do e-mail automatico da Kiwify. Se nao encontrar esta mensagem na caixa de entrada, procure tambem na pasta SPAM / lixo eletronico.

Crie sua conta na plataforma com o MESMO e-mail da compra:
${appUrl}/boas-vindas

Compras do curso sao liberadas automaticamente apos o prazo de garantia de 7 dias.${releaseDate ? `\nPrevisao de liberacao: ${releaseDate}.` : ''}

Quando o prazo terminar, entre na plataforma com este mesmo e-mail para ativar o acesso.`,
      html: baseEmailHtml(
        'Crie sua conta na Central Monetizacao',
        'Sua compra foi confirmada. Crie sua conta com o mesmo e-mail da compra.',
        `
          <p>Oi, ${firstName}. Encontramos sua compra na Kiwify.</p>
          <p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:12px 14px;color:#92400e;font-size:14px;line-height:1.6;">
            <strong>Atencao:</strong> este e-mail e da <strong>Central Monetizacao</strong> e e <strong>diferente</strong> do e-mail automatico da Kiwify.
            Se nao encontrar esta mensagem na caixa de entrada, procure tambem na pasta <strong>SPAM / lixo eletronico</strong>.
          </p>
          <p>Compras do curso sao liberadas automaticamente apos o prazo de garantia de 7 dias. Assinaturas da plataforma liberam na hora.</p>
          ${releaseDate ? `<p><strong>Previsao de liberacao:</strong> ${escapeHtml(releaseDate)}.</p>` : ''}
          <p>Para ja deixar tudo pronto, <strong>crie sua conta com o MESMO e-mail da compra</strong> clicando no botao abaixo:</p>
        `,
        registerCta
      ),
    };
  }

  if (kind === 'password_reset') {
    const resetUrl = input.resetUrl || appUrl;

    return {
      subject: 'Redefinir sua senha - Central Monetizacao',
      text: `Oi, ${rawName}. Recebemos um pedido para redefinir a senha da sua conta.

Crie uma nova senha neste link (valido por 1 hora):
${resetUrl}

Se voce nao pediu isso, pode ignorar este e-mail: sua senha continua a mesma.`,
      html: baseEmailHtml(
        'Redefinir senha',
        'Recebemos um pedido para redefinir sua senha.',
        `
          <p>Oi, ${firstName}. Recebemos um pedido para redefinir a senha da sua conta.</p>
          <p>Clique no botao abaixo para criar uma nova senha. Este link e valido por 1 hora.</p>
          <p>Se voce nao pediu isso, pode ignorar este e-mail: sua senha continua a mesma.</p>
        `,
        `<p style="margin:28px 0 0;">
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;">Criar nova senha</a>
        </p>`
      ),
    };
  }

  return {
    subject: 'Seu acesso foi liberado: crie sua conta na Central Monetizacao',
    text: `Oi, ${rawName}. Seu acesso foi liberado!

ATENCAO: este e-mail e da CENTRAL MONETIZACAO e e DIFERENTE do e-mail automatico da Kiwify. Se nao encontrar esta mensagem na caixa de entrada, procure tambem na pasta SPAM / lixo eletronico.

Para entrar:
1. Crie sua conta aqui: ${appUrl}/boas-vindas
2. Use o MESMO e-mail desta compra.
3. Pronto: o acesso e liberado automaticamente.

Importante: use o mesmo e-mail da compra. Se o e-mail for diferente, o acesso nao e liberado sozinho.`,
    html: baseEmailHtml(
      'Crie sua conta na Central Monetizacao',
      'Seu acesso a Central Monetizacao foi liberado.',
      `
        <p>Oi, ${firstName}. Seu acesso foi liberado!</p>
        <p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:12px 14px;color:#92400e;font-size:14px;line-height:1.6;">
          <strong>Atencao:</strong> este e-mail e da <strong>Central Monetizacao</strong> e e <strong>diferente</strong> do e-mail automatico da Kiwify.
          Se nao encontrar esta mensagem na caixa de entrada, procure tambem na pasta <strong>SPAM / lixo eletronico</strong>.
        </p>
        <p><strong>Para entrar, e simples:</strong></p>
        <p>
          1. <strong>Clique no botao abaixo para criar sua conta:</strong><br/>
          2. Use o <strong>MESMO e-mail desta compra</strong><br/>
          3. Pronto: o acesso e liberado automaticamente.
        </p>
        <p style="color:#b45309;">Importante: use o mesmo e-mail da compra. Se o e-mail for diferente, o acesso nao e liberado sozinho.</p>
      `,
      registerCta
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

  const from = process.env.RESEND_FROM_EMAIL || 'Central Monetizacao <nao-responda@halamsilva.com.br>';
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
      text: email.text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error(`Failed to send ${kind} email:`, message);
    return { ok: false, error: message };
  }

  return { ok: true };
};

export const sendPasswordResetEmail = async (email: string) => {
  const to = normalizeEmail(email);
  if (!to) return { ok: false, skipped: true, reason: 'missing_email' };

  if (!isFirebaseAdminConfigured()) {
    console.warn('Firebase Admin nao configurado. Nao foi possivel gerar o link de recuperacao.');
    return { ok: false, skipped: true, reason: 'missing_admin' };
  }

  let resetLink: string;
  try {
    resetLink = await getAuth(getAdminApp()).generatePasswordResetLink(to, {
      url: `${appUrl}/recovery`,
    });
  } catch (error: any) {
    if (String(error?.code || '').includes('user-not-found')) {
      return { ok: true, skipped: true, reason: 'user_not_found' };
    }
    throw error;
  }

  const oobCode = new URL(resetLink).searchParams.get('oobCode');
  const directUrl = oobCode
    ? `${appUrl}/recovery?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`
    : resetLink;

  return sendAccessEmail('password_reset', { to, resetUrl: directUrl });
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
