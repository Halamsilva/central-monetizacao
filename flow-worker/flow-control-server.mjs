import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const FLOW_CONFIG_PATH = resolve(PROJECT_ROOT, '.flow-config.json');
const PORT = Number(process.env.FLOW_CONTROL_PORT || 8787);
const DEFAULT_FLOW_PROJECT_URL =
  'https://labs.google/fx/tools/flow/project/63ab691c-6565-40df-bdf5-77a0a90c2e10';

const json = (response, status, payload) => {
  response.writeHead(status, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) =>
  new Promise((resolveBody, rejectBody) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on('end', () => resolveBody(body));
    request.on('error', rejectBody);
  });

const getFlowProjectUrl = async () => {
  if (!existsSync(FLOW_CONFIG_PATH)) return DEFAULT_FLOW_PROJECT_URL;

  try {
    const config = JSON.parse(await readFile(FLOW_CONFIG_PATH, 'utf8'));
    return config.flowProjectUrl || DEFAULT_FLOW_PROJECT_URL;
  } catch {
    return DEFAULT_FLOW_PROJECT_URL;
  }
};

const assertFlowProjectUrl = (url) => {
  const parsed = new URL(url);
  const isFlowProject =
    parsed.hostname === 'labs.google' &&
    /^\/fx\/tools\/flow\/project\/[a-z0-9-]+$/i.test(parsed.pathname);

  if (!isFlowProject) {
    throw new Error('Use um link de projeto do Flow no formato https://labs.google/fx/tools/flow/project/...');
  }

  return parsed.toString();
};

const saveFlowProjectUrl = async (flowProjectUrl) => {
  const cleanUrl = assertFlowProjectUrl(flowProjectUrl);
  await writeFile(FLOW_CONFIG_PATH, `${JSON.stringify({ flowProjectUrl: cleanUrl }, null, 2)}\n`);
  return cleanUrl;
};

const runPowerShell = (command) =>
  new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      {
        cwd: PROJECT_ROOT,
        windowsHide: true,
      },
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', rejectRun);
    child.on('close', (code) => {
      if (code === 0) resolveRun({ stdout, stderr });
      else rejectRun(new Error(stderr || stdout || `PowerShell saiu com código ${code}`));
    });
  });

const stopFlowProcesses = () =>
  runPowerShell(
    "$targets = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'flow-browser-worker|run-flow-browser-worker|flow:worker|flow:login|chrome-win64|flow-browser-profile' -and $_.ProcessId -ne $PID }; foreach ($p in $targets) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 1",
  );

const openFlowLogin = async () => {
  const flowProjectUrl = await getFlowProjectUrl();
  await stopFlowProcesses();
  const command = [
    `$env:FLOW_PROJECT_URL='${flowProjectUrl.replace(/'/g, "''")}'`,
    `$env:FLOW_BROWSER_HEADLESS='0'`,
    `$env:FLOW_BROWSER_OFFSCREEN='0'`,
    `Start-Process -FilePath node -ArgumentList 'flow-worker\\flow-browser-worker.mjs','--login' -WorkingDirectory '${PROJECT_ROOT.replace(/'/g, "''")}' -WindowStyle Normal`,
  ].join('; ');

  await runPowerShell(command);
  return flowProjectUrl;
};

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    json(response, 204, {});
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      json(response, 200, { ok: true, flowProjectUrl: await getFlowProjectUrl() });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/flow-project') {
      const body = JSON.parse((await readBody(request)) || '{}');
      const flowProjectUrl = await saveFlowProjectUrl(body.flowProjectUrl);
      json(response, 200, { ok: true, flowProjectUrl });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/flow-login') {
      const flowProjectUrl = await openFlowLogin();
      json(response, 200, { ok: true, flowProjectUrl });
      return;
    }

    json(response, 404, { ok: false, error: 'Rota não encontrada.' });
  } catch (error) {
    json(response, 500, { ok: false, error: error.message || String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Flow control server listening on http://127.0.0.1:${PORT}`);
});
