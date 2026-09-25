// Cloudflare Pages Function: proxy /api/* requests to the Vercel backend.
// Keeps all frontend fetch('/api/...') calls working unchanged.

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const target = `https://central-monetizacao.vercel.app${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('host', 'central-monetizacao.vercel.app');
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();

  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};