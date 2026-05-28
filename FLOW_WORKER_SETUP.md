# Gerador de Videos com Google Flow

Este recurso usa fila no Supabase e um worker local no seu computador. A Vercel apenas mostra a tela e cria os pedidos; quem abre o Google Flow, gera e baixa o MP4 e o worker local.

## 1. Criar as tabelas

Rode o arquivo `supabase-flow-video-jobs.sql` no SQL Editor do Supabase do projeto da Central.

Ele cria:

- `public.generation_jobs`
- `public.generation_worker_status`
- bucket publico `flow-results`
- politicas para cada aluno ver apenas os proprios pedidos

## 2. Variaveis locais

No `.env.local`, preencha:

```env
VITE_SUPABASE_URL=https://dzbxmrzomzbnkwgujmmm.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
FLOW_PROJECT_URL=https://labs.google/fx/tools/flow/project/63ab691c-6565-40df-bdf5-77a0a90c2e10
FLOW_BROWSER_HEADLESS=0
FLOW_BROWSER_OFFSCREEN=1
```

O worker deve usar `SUPABASE_SERVICE_ROLE_KEY`, porque ele precisa ler pedidos de todos os alunos e atualizar resultados.

## 3. Ligar o controle local

Na primeira vez neste computador, instale o navegador usado pelo worker:

```bat
npx playwright install chromium
```

Antes de usar os botoes da aba `/gerar-videos`, deixe o servidor local aberto:

```bat
npm run flow:control
```

Ele fica em `http://127.0.0.1:8787` e permite abrir o perfil do Flow, liberar o worker e pausar o processamento pelo site.

## 4. Login no Flow

Rode:

```bat
login-flow-browser.cmd
```

Entre na sua conta Google/Flow no navegador que abrir. O login fica salvo na pasta `.flow-browser-profile`.

Voce tambem pode fazer isso pela aba `/gerar-videos`, usando o painel admin:

- cole o link do projeto Flow/Veo 3
- clique em `Salvar projeto`
- clique em `Abrir Flow`
- faca login no navegador separado do Flow
- depois clique em `Liberar gerador`

Esse painel so aparece para administrador e conversa com o servidor local `http://127.0.0.1:8787`.

## 5. Liberar ou pausar os alunos

Pelo painel admin da aba `/gerar-videos`:

- `Abrir Flow`: abre o perfil separado do navegador para conferir o login.
- `Liberar gerador`: inicia o worker local por tras e processa a fila dos alunos.
- `Pausar`: para o worker local. Os pedidos ficam salvos para depois.

Se preferir rodar sem o painel, ainda pode usar:

```bat
run-flow-browser-worker.cmd
```

Enquanto o computador estiver ligado e o gerador liberado, os pedidos da pagina `/gerar-videos` entram na fila e sao processados.

## 6. Aviso aos alunos

Quando o worker nao estiver ligado, os pedidos continuam salvos como `Pendente`. Quando voce ligar o computador e iniciar o worker, ele processa os pedidos na ordem de chegada.
