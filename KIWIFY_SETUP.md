# Integração Kiwify

Fluxo usado:

1. A Kiwify envia o webhook para `/api/webhooks/kiwify`.
2. O servidor valida `KIWIFY_WEBHOOK_TOKEN`.
3. Compra aprovada fica `pending` até completar `KIWIFY_RELEASE_DELAY_DAYS`.
4. Ao completar o prazo, o próximo login do aluno sincroniza e libera `access_status = active`.
5. Reembolso, chargeback, assinatura cancelada ou atrasada bloqueiam o aluno.

## Supabase

Execute o arquivo `supabase-kiwify-access.sql` no SQL Editor do Supabase.

## Variáveis de ambiente

Configure no deploy:

```env
SUPABASE_SERVICE_ROLE_KEY=...
KIWIFY_WEBHOOK_TOKEN=...
KIWIFY_RELEASE_DELAY_DAYS=7
KIWIFY_ALLOWED_PRODUCTS=Monetizar pagina do facebook, tiktok e no Youtube
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Central Monetizacao <onboarding@resend.dev>
APP_URL=https://app.halamsilva.com.br
```

`KIWIFY_ALLOWED_PRODUCTS` trava a liberaÃ§Ã£o no produto correto. Se a Kiwify enviar
evento de outro produto, o webhook responde `ok`, mas ignora a liberaÃ§Ã£o.

`RESEND_API_KEY` ativa os e-mails automÃ¡ticos. Sem essa variÃ¡vel, cadastro e
webhook continuam funcionando normalmente, mas os e-mails nÃ£o sÃ£o enviados.

E-mails enviados:

- Cadastro recebido
- Compra confirmada, aguardando 7 dias
- Acesso liberado

## Kiwify

Crie um webhook em `Apps > Webhooks` com a URL:

```txt
https://app.halamsilva.com.br/api/webhooks/kiwify
```

Selecione os eventos:

- Compra aprovada
- Reembolso
- Chargeback
- Assinatura cancelada
- Assinatura atrasada
- Assinatura renovada
