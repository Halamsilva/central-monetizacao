# Recuperar a plataforma usando Supabase Free novo

O erro `402` no Supabase atual indica bloqueio por cota/cobranca. Enquanto esse projeto estiver bloqueado, o login da plataforma nao volta, porque Auth e banco dependem dele.

## Caminho gratis mais rapido

1. Crie um projeto novo no Supabase Free.
2. No Supabase novo, abra `SQL Editor`.
3. Rode o arquivo `supabase-new-project-bootstrap.sql`.
4. Em `Authentication > Providers`, ative `Email` e, se for usar, `Google`.
5. Em `Authentication > URL Configuration`, configure:
   - Site URL: `https://app.halamsilva.com.br`
   - Redirect URLs: `https://app.halamsilva.com.br/**`
6. Copie do Supabase novo:
   - Project URL
   - anon/public key
   - service role key
7. Na Vercel, troque as variaveis de producao:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
8. Faça um redeploy na Vercel.
9. Crie sua conta admin de novo no site.
10. No SQL Editor do Supabase novo, libere seu usuario como admin:

```sql
update public.profiles
set role = 'admin',
    is_admin = true,
    access_status = 'active',
    approved_at = now()
where lower(email) = lower('silvahalam@gmail.com');
```

## Importante

- O projeto antigo nao esta com erro de senha. Ele esta bloqueado no provedor.
- Nao suba MP4 pesado no Supabase novo. Use YouTube nao listado para aulas e Cloudflare R2 para videos gerados.
- Se os alunos antigos precisarem entrar, importe os e-mails novamente pela tela `Gerenciar Alunos` ou cole a lista no fluxo de alunos antigos.

