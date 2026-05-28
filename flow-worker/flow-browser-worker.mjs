import { mkdir, readFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PROFILE_DIR = resolve(PROJECT_ROOT, '.flow-browser-profile');
const FLOW_URL = 'https://labs.google/fx/tools/flow';
const DEFAULT_FLOW_PROJECT_URL =
  'https://labs.google/fx/tools/flow/project/63ab691c-6565-40df-bdf5-77a0a90c2e10';
const SAMPLE_TIMEOUT_MS = 30 * 60 * 1000;
const FLOW_CONFIG_PATH = resolve(PROJECT_ROOT, '.flow-config.json');

const readLocalFlowProjectUrl = () => {
  try {
    const configText = readFileSync(FLOW_CONFIG_PATH, 'utf8');
    const localConfig = JSON.parse(configText);
    return localConfig.flowProjectUrl || '';
  } catch {
    return '';
  }
};

const config = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY,
  pollMs: Number(process.env.FLOW_BROWSER_POLL_MS || 5000),
  headless: process.env.FLOW_BROWSER_HEADLESS === '1',
  loginOnly: process.argv.includes('--login'),
  flowProjectUrl: process.env.FLOW_PROJECT_URL || readLocalFlowProjectUrl() || DEFAULT_FLOW_PROJECT_URL,
  allowNonPriorityModels: process.env.FLOW_ALLOW_NON_PRIORITY_MODELS === '1',
  offscreen: process.env.FLOW_BROWSER_OFFSCREEN === '1',
};

if (!config.supabaseUrl || !config.supabaseKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: false },
});

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
let workerHeartbeatState = {
  status: 'online',
  message: 'Gerador ligado e aguardando pedidos.',
  currentJobId: null,
};

const updateWorkerStatus = async (status, message, currentJobId = null) => {
  workerHeartbeatState = { status, message, currentJobId };

  await supabase
    .from('generation_worker_status')
    .upsert(
      {
        id: 'flow-video',
        status,
        message,
        current_job_id: currentJobId,
        flow_project_url: config.flowProjectUrl,
        online_until: new Date(Date.now() + 90_000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .catch((error) => {
      console.error(`Falha ao atualizar status do worker: ${error.message || error}`);
    });
};

class FlowError extends Error {
  constructor(message, { isRateLimited = false, isPolicyViolation = false } = {}) {
    super(message);
    this.name = 'FlowError';
    this.isRateLimited = isRateLimited;
    this.isPolicyViolation = isPolicyViolation;
  }
}

const dismissBlockingDialogs = async (page) => {
  // Fecha modais/diálogos que possam bloquear a UI (ex: "What's new", cookie banners)
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);

  const dismissNames = ['Got it', 'Close', 'Dismiss', 'OK', 'Accept', 'Continue', 'Skip'];
  for (const name of dismissNames) {
    const btn = page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') });
    if ((await btn.count()) > 0) {
      await btn.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
};

const waitForFlowProjectReady = async (page) => {
  console.log('Aguardando Flow carregar...');
  await page.waitForTimeout(15000);
  await dismissBlockingDialogs(page);

  const promptEditor = page.locator('[contenteditable="true"]').last();
  await promptEditor.waitFor({ state: 'visible', timeout: 60000 });

  const createSettingsButton = page.getByRole('button', { name: /^Video ·|^Image ·|Nano Banana|Imagen/ });
  await createSettingsButton.first().waitFor({ state: 'visible', timeout: 60000 });

  // Tenta fechar diálogos novamente após a UI ter carregado
  await dismissBlockingDialogs(page);
  const firstSnapshot = await page.evaluate(() => document.body?.innerText?.length || 0);
  await page.waitForTimeout(5000);
  const secondSnapshot = await page.evaluate(() => document.body?.innerText?.length || 0);

  if (Math.abs(secondSnapshot - firstSnapshot) > 250) {
    await page.waitForTimeout(5000);
    await dismissBlockingDialogs(page);
  }

  await promptEditor.waitFor({ state: 'visible', timeout: 60000 });
  await createSettingsButton.first().waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForTimeout(3000);
  console.log('Flow pronto.');
};

const launchFlow = async () => {
  await mkdir(PROFILE_DIR, { recursive: true });

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: config.headless,
    viewport: { width: 1440, height: 960 },
    acceptDownloads: true,
    args: config.offscreen
      ? ['--window-position=-32000,-32000', '--window-size=1440,960']
      : undefined,
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto(config.flowProjectUrl, { waitUntil: 'domcontentloaded' });
  return { context, page };
};

const ensureLoggedIn = async (page) => {
  await page.goto(config.flowProjectUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(15000);

  if (page.url().includes('accounts.google.com')) {
    throw new Error(
      'Flow is not logged in. Run npm run flow:login, sign in manually, then run npm run flow:worker.',
    );
  }

  await waitForFlowProjectReady(page);
};

const clickFirst = async (page, candidates, options = {}) => {
  for (const candidate of candidates) {
    const locator = candidate();
    if ((await locator.count()) > 0) {
      const target = typeof locator.first === 'function' ? locator.first() : locator;
      await target.click({ timeout: options.timeout || 10000 });
      return true;
    }
  }

  return false;
};

const openFlowProject = async (page) => {
  await page.goto(config.flowProjectUrl, { waitUntil: 'domcontentloaded' });
  await waitForFlowProjectReady(page);

  if (page.url().includes('accounts.google.com')) {
    throw new Error(
      'Flow is not logged in. Run npm run flow:login, sign in manually, then run npm run flow:worker.',
    );
  }

  if (!page.url().includes('/fx/tools/flow/project/')) {
    throw new Error(`Flow project did not open correctly. Current URL: ${page.url()}`);
  }
};

const setPrompt = async (page, prompt) => {
  const promptBox = page.locator('[contenteditable="true"]').last();

  if ((await promptBox.count()) === 0) {
    throw new Error('Could not find Flow prompt editor.');
  }

  await promptBox.click({ timeout: 10000 });
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(prompt, { delay: 1 });
  await page.waitForTimeout(1000);
};

const openCreateMenu = async (page) => {
  const opened = await clickFirst(page, [
    () => page.getByRole('button', { name: /^Video ·/ }),
    () => page.getByRole('button', { name: /^Image ·/ }),
    () => page.getByRole('button', { name: /Nano Banana|Imagen/i }),
  ]);

  if (!opened) {
    throw new Error('Could not open Flow model/settings menu.');
  }

  await page.waitForTimeout(1000);
};

const ensureCreateMode = async (page) => {
  const agentButton = page.getByRole('button', { name: /^Agent$/ });

  if ((await agentButton.count()) > 0) {
    const pressed = await agentButton.first().getAttribute('aria-pressed');

    if (pressed === 'true') {
      await agentButton.first().click({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }
  }
};

const effectiveModelForJob = (job) =>
  config.allowNonPriorityModels ? job.model : 'veo-3.1-lite-lower-priority';

const modelLabelForJob = (job) =>
  effectiveModelForJob(job) === 'omni-flash'
    ? 'Omni Flash'
    : effectiveModelForJob(job) === 'veo-3.1-lite'
      ? 'Veo 3.1 - Lite'
      : effectiveModelForJob(job) === 'veo-3.1-fast'
        ? 'Veo 3.1 - Fast'
        : effectiveModelForJob(job) === 'veo-3.1-quality'
          ? 'Veo 3.1 - Quality'
          : 'Veo 3.1 - Lite [Lower Priority]';

const setModel = async (page, job) => {
  const modelName = modelLabelForJob(job);
  const escapedModelName = modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const visibleModelButton = page.getByRole('button', {
    name: new RegExp(`${escapedModelName}.*arrow_drop_down`),
  });

  if ((await visibleModelButton.count()) > 0) {
    return;
  }

  const dropdownButton = page
    .getByRole('button', { name: /Veo 3\.1|Omni Flash|arrow_drop_down/i })
    .filter({ hasText: /Veo 3\.1|Omni Flash/i })
    .last();

  if ((await dropdownButton.count()) === 0) {
    throw new Error('Could not find Flow model dropdown.');
  }

  await dropdownButton.click({ timeout: 10000 });
  await page.waitForTimeout(500);

  await page
    .getByRole('menuitem', { name: new RegExp(escapedModelName) })
    .first()
    .click({ timeout: 10000 });
  await page.waitForTimeout(1000);
};

const setVideoSettings = async (page, job) => {
  const metadata = job.metadata || {};
  await ensureCreateMode(page);
  await openCreateMenu(page);

  const videoTabSelected = page.getByRole('tab', { name: /Video/i }).first();
  await videoTabSelected.click({ timeout: 10000 });
  await page.waitForTimeout(800);

  if (metadata.reference_images?.length) {
    await clickFirst(page, [() => page.getByRole('tab', { name: /Ingredients/i })]);
  } else {
    await clickFirst(page, [() => page.getByRole('tab', { name: /Frames/i })]);
  }

  const aspectRatio = metadata.aspect_ratio || '9:16';
  await clickFirst(page, [() => page.getByRole('tab', { name: new RegExp(aspectRatio.replace(':', ':')) })]);

  const quantity = String(metadata.quantity || 1);
  await clickFirst(page, [() => page.getByRole('tab', { name: quantity === '1' ? /^1x$/ : new RegExp(`x${quantity}`) })]);

  await setModel(page, job);
  await openCreateMenu(page);

  const duration = String(
    Math.min(Number(metadata.duration_seconds || 8), effectiveModelForJob(job) === 'omni-flash' ? 10 : 8),
  );
  await clickFirst(page, [() => page.getByRole('tab', { name: new RegExp(`^${duration}s$`) })]);
  await page.keyboard.press('Escape');
};

const clickGenerate = async (page) => {
  const createButton = page.getByRole('button', { name: /^arrow_forward Create$/ });

  if ((await createButton.count()) === 0) {
    throw new Error('Could not find final Flow arrow_forward Create button.');
  }

  const disabled = await createButton.first().getAttribute('disabled');
  const ariaDisabled = await createButton.first().getAttribute('aria-disabled');

  if (disabled !== null || ariaDisabled === 'true') {
    throw new Error('Final Flow Create button is still disabled.');
  }

  await createButton.first().click({ timeout: 10000 });
};

const listProjectEditHrefs = async (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/edit/"]')]
      .map((link) => link.getAttribute('href'))
      .filter(Boolean),
  );

const listReadyProjectVideos = async (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/edit/"]')]
      .map((link) => {
        const card = link.closest('button');
        const href = link.getAttribute('href');
        const text = card?.innerText || link.innerText || '';

        return href
          ? {
              href,
              text,
              failed: /\bFailed\b|Oops, something went wrong!/i.test(text),
            }
          : null;
      })
      .filter((item) => item && !item.failed),
  );

const normalizeFlowText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const hoverNewMatchingFlowCard = async (page, knownHrefs, job) => {
  const known = [...knownHrefs];
  const promptNeedle = normalizeFlowText(job?.prompt).slice(0, 32);
  const cardBox = await page.evaluate(
    ({ known, promptNeedle }) => {
      const knownSet = new Set(known);
      const links = [...document.querySelectorAll('a[href*="/edit/"]')];
      const candidates = links
        .map((link) => {
          const href = link.getAttribute('href');
          const card =
            link.closest('[role="button"]') ||
            link.closest('button') ||
            link.closest('[aria-label]') ||
            link.parentElement;
          const text = card?.innerText || card?.textContent || link.innerText || link.textContent || '';
          const normalizedText = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          const rect = card?.getBoundingClientRect();

          return href && !knownSet.has(href) && rect
            ? {
                href,
                text,
                matchesPrompt: promptNeedle ? normalizedText.includes(promptNeedle) : false,
                hasProgress: /\b\d{1,3}\s*%/.test(text),
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.matchesPrompt) - Number(a.matchesPrompt) || Number(b.hasProgress) - Number(a.hasProgress));

      const match = candidates.find((item) => item.matchesPrompt) || candidates.find((item) => item.hasProgress) || candidates[0];

      if (!match) return null;
      window.scrollBy(0, 0);
      return match;
    },
    { known, promptNeedle },
  );

  if (!cardBox) return null;

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  return cardBox;
};

const getProjectFailureState = async (page) =>
  page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const bodyTextContent = document.body?.textContent || '';
    const hasGeneratingProgress = /\b\d{1,3}\s*%/.test(`${bodyText}\n${bodyTextContent}`);

    // Contagem de cards com falha visíveis na página
    const failedCount = (bodyText.match(/\bFailed\b/g) || []).length;
    const oopsCount = (bodyText.match(/Oops, something went wrong!/g) || []).length;

    // Rate limit / cota esgotada
    const isRateLimited = [
      /you('ve| have) reached your (daily )?limit/i,
      /daily (generation |video )?limit/i,
      /quota exceeded/i,
      /too many requests/i,
      /limit reached/i,
      /out of credits/i,
      /generation limit/i,
    ].some((p) => p.test(bodyText));

    // Violação de política de conteúdo
    const isPolicyViolation =
      /content policy|safety guidelines|not allowed|violat(es|ing)|blocked by/i.test(bodyText);

    // Textos de alerta/toast visíveis (role="alert" ou role="status")
    const alertText = [...document.querySelectorAll('[role="alert"], [role="status"]')]
      .map((el) => el.innerText?.trim())
      .filter(Boolean)
      .join(' | ');

    // Texto do card mais recente que está com falha
    const failedCardText = [...document.querySelectorAll('button')]
      .filter((btn) => /\bFailed\b|Oops, something went wrong!/i.test(btn.innerText || ''))
      .map((btn) => btn.innerText?.replace(/\s+/g, ' ').trim())
      .slice(0, 1)
      .join('');

    const contextDetail = [alertText, failedCardText]
      .filter(Boolean)
      .map((s) => s.slice(0, 160))
      .join(' — ');

    const message = isRateLimited
      ? `Flow rate limit: cota diária de geração esgotada.${contextDetail ? ` (${contextDetail})` : ''}`
      : isPolicyViolation
        ? `Flow bloqueou o prompt por política de conteúdo.${contextDetail ? ` (${contextDetail})` : ''}`
        : oopsCount > 0
          ? `Flow falhou: Oops, something went wrong!${contextDetail ? ` — ${contextDetail}` : ''}`
          : `Flow falhou na geração.${contextDetail ? ` — ${contextDetail}` : ''}`;

    return { failedCount, oopsCount, isRateLimited, isPolicyViolation, hasGeneratingProgress, message };
  });

const waitForNewProjectVideoHref = async (page, knownHrefs, knownFailureState, job) => {
  const startedAt = Date.now();
  const known = new Set(knownHrefs);
  const knownFailedCount = knownFailureState.failedCount;
  const knownOopsCount = knownFailureState.oopsCount;
  const promptNeedle = normalizeFlowText(job?.prompt).slice(0, 32);
  let lastHeartbeatMin = 0;
  let readyCandidate = null;
  let readyCandidateSince = 0;

  while (Date.now() - startedAt < SAMPLE_TIMEOUT_MS) {
    const elapsedMin = Math.floor((Date.now() - startedAt) / 60000);
    if (elapsedMin > lastHeartbeatMin) {
      console.log(`Aguardando vídeo do Flow... ${elapsedMin} min decorrido(s).`);
      lastHeartbeatMin = elapsedMin;
    }

    const targetCard = await hoverNewMatchingFlowCard(page, knownHrefs, job).catch(() => null);

    if (targetCard?.hasProgress) {
      readyCandidate = null;
      readyCandidateSince = 0;
      await page.waitForTimeout(10000);
      continue;
    }

    const readyVideos = await listReadyProjectVideos(page);
    const newReadyVideos = readyVideos.filter((video) => !known.has(video.href));
    const matchingReadyVideo = newReadyVideos.find((video) =>
      normalizeFlowText(video.text).includes(promptNeedle),
    );
    const newReadyVideo = matchingReadyVideo || (newReadyVideos.length === 1 ? newReadyVideos[0] : null);

    if (newReadyVideo) {
      if (readyCandidate !== newReadyVideo.href) {
        readyCandidate = newReadyVideo.href;
        readyCandidateSince = Date.now();
        console.log('Flow card parece pronto; aguardando estabilizar antes de baixar.');
        await hoverNewMatchingFlowCard(page, knownHrefs, job).catch(() => null);
        await page.waitForTimeout(10000);
        continue;
      }

      if (Date.now() - readyCandidateSince >= 10000) {
        await hoverNewMatchingFlowCard(page, knownHrefs, job).catch(() => null);
        await page.waitForTimeout(2000);
        return newReadyVideo.href;
      }
    }

    const currentFailureState = await getProjectFailureState(page);

    const newFailure =
      currentFailureState.isRateLimited ||
      currentFailureState.isPolicyViolation ||
      (!currentFailureState.hasGeneratingProgress &&
        (currentFailureState.failedCount > knownFailedCount ||
          currentFailureState.oopsCount > knownOopsCount));

    if (newFailure) {
      throw new FlowError(currentFailureState.message, {
        isRateLimited: currentFailureState.isRateLimited,
        isPolicyViolation: currentFailureState.isPolicyViolation,
      });
    }

    await page.waitForTimeout(10000);
  }

  throw new Error('Timed out waiting for new Flow project video card.');
};

const waitForVideoUrl = async (page) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SAMPLE_TIMEOUT_MS) {
    const urls = await page.evaluate(() => {
      const videoUrls = [...document.querySelectorAll('video')]
        .map((video) => video.currentSrc || video.src)
        .filter(Boolean);
      const linkUrls = [...document.querySelectorAll('a[href]')]
        .map((link) => link.href)
        .filter((href) => /\.(mp4|mov)(\?|$)/i.test(href) || href.includes('storage.googleapis.com'));
      return [...new Set([...videoUrls, ...linkUrls])];
    });

    if (urls.length) return urls;
    await page.waitForTimeout(10000);
  }

  throw new Error('Timed out waiting for Flow video URL.');
};

const openFirstCompletedVideo = async (page) => {
  const readyLink = page.locator('a[href*="/edit/"]').first();

  if ((await readyLink.count()) === 0) {
    throw new Error('Could not find completed Flow edit link.');
  }

  await readyLink.click({ timeout: 10000 });
  await page.waitForURL(/\/edit\//, { timeout: 30000 });
  await page.waitForTimeout(3000);
};

const downloadCurrentVideo = async (page, job) => {
  const downloadButton = page.getByRole('button', { name: /download\s*Download/i }).first();

  if ((await downloadButton.count()) === 0) {
    throw new Error('Could not find Flow Download button.');
  }

  const download = await Promise.all([
    page.waitForEvent('download', { timeout: 120000 }),
    downloadButton.click({ timeout: 10000 }),
  ]).then(([downloadResult]) => downloadResult);

  const downloadPath = await download.path();

  if (!downloadPath) {
    throw new Error('Flow download did not expose a local file path.');
  }

  const bytes = await readFile(downloadPath);
  const objectPath = `videos/${job.id}-${Date.now()}.mp4`;
  const { error: uploadError } = await supabase.storage
    .from('flow-results')
    .upload(objectPath, bytes, {
      contentType: 'video/mp4',
      upsert: true,
    });

  await rm(downloadPath, { force: true }).catch(() => {});

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('flow-results').getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    throw new Error('Could not create public URL for downloaded Flow video.');
  }

  return data.publicUrl;
};

const downloadProjectCardVideo = async (page, editHref, job) => {
  const startedAt = Date.now();
  let download;
  let lastHeartbeatMin = 0;

  while (Date.now() - startedAt < SAMPLE_TIMEOUT_MS && !download) {
    const elapsedMin = Math.floor((Date.now() - startedAt) / 60000);
    if (elapsedMin > lastHeartbeatMin) {
      console.log(`Flow download: aguardando card ficar disponível... ${elapsedMin} min decorrido(s).`);
      lastHeartbeatMin = elapsedMin;
    }

    const cardLink = page.locator(`a[href="${editHref}"]`).first();

    if ((await cardLink.count()) === 0) {
      await page.waitForTimeout(10000);
      continue;
    }

    try {
      console.log(`Flow download: locating card ${editHref}`);
      const cardBox = await page.evaluate((href) => {
        const link = document.querySelector(`a[href="${href}"]`);
        const card =
          link?.closest('[role="button"]') ||
          link?.closest('button') ||
          link?.closest('[aria-label]') ||
          link?.parentElement;

        card?.scrollIntoView({ block: 'center', inline: 'center' });
        const rect = card?.getBoundingClientRect();

        return rect
          ? {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            }
          : null;
      }, editHref);

      if (!cardBox) {
        throw new Error('Could not resolve Flow card position for hover.');
      }

      console.log(
        `Flow download: hovering card at ${Math.round(cardBox.x + cardBox.width / 2)},${Math.round(
          cardBox.y + cardBox.height / 2,
        )}`,
      );
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.waitForTimeout(1200);

      const moreButtonBox = await page.evaluate((box) => {
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const buttons = [...document.querySelectorAll('button')]
          .map((button) => {
            const label = `${button.getAttribute('aria-label') || ''} ${button.innerText || ''}`.trim();
            const rect = button.getBoundingClientRect();
            const visible = rect.width > 0 && rect.height > 0;

            if (!visible || !/more_vert|more/i.test(label)) return null;

            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              distance: Math.hypot(rect.x + rect.width / 2 - centerX, rect.y + rect.height / 2 - centerY),
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance);

        return buttons[0] || null;
      }, cardBox);

      if (!moreButtonBox) {
        throw new Error('Could not find More button nearest to target Flow card.');
      }

      console.log('Flow download: clicking nearest card More button');
      await page.mouse.click(moreButtonBox.x + moreButtonBox.width / 2, moreButtonBox.y + moreButtonBox.height / 2);
      await page.waitForTimeout(2000);

      const downloadMenuItem = page.getByRole('menuitem', { name: /download\s*Download/i }).first();

      if ((await downloadMenuItem.count()) === 0 || !(await downloadMenuItem.isEnabled())) {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(10000);
        continue;
      }

      console.log('Flow download: hovering Download submenu');
      await downloadMenuItem.hover({ timeout: 10000 });
      await page.waitForTimeout(1000);

      const originalSizeItem = page.getByRole('menuitem', { name: /720p Original Size/i }).first();

      if ((await originalSizeItem.count()) === 0 || !(await originalSizeItem.isEnabled())) {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(10000);
        continue;
      }

      console.log('Flow download: clicking 720p Original Size');
      download = await Promise.all([
        page.waitForEvent('download', { timeout: 120000 }),
        originalSizeItem.click({ timeout: 10000 }),
      ]).then(([downloadResult]) => downloadResult);
      console.log('Flow download: download event captured');
    } catch (downloadError) {
      console.error(`Flow download attempt failed: ${downloadError.message || downloadError}`);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(10000);
    }
  }

  if (!download) {
    throw new Error('Timed out waiting for Flow project card download.');
  }

  const downloadPath = await download.path();
  console.log(`Flow download: local path ${downloadPath || '(none)'}`);

  if (!downloadPath) {
    throw new Error('Flow card download did not expose a local file path.');
  }

  const bytes = await readFile(downloadPath);
  const objectPath = `videos/${job.id}-${Date.now()}.mp4`;
  console.log(`Flow download: uploading ${objectPath}`);
  const { error: uploadError } = await supabase.storage
    .from('flow-results')
    .upload(objectPath, bytes, {
      contentType: 'video/mp4',
      upsert: true,
    });

  await rm(downloadPath, { force: true }).catch(() => {});

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('flow-results').getPublicUrl(objectPath);

  if (!data?.publicUrl) {
    throw new Error('Could not create public URL for downloaded Flow project video.');
  }

  return data.publicUrl;
};

const moveMouseAwayFromFlowCards = async (page) => {
  await page.mouse.move(24, 24).catch(() => {});
};

const claimNextJob = async () => {
  const { data: jobs, error: fetchError } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('type', 'video')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError) throw fetchError;
  if (!jobs?.length) return null;

  const job = jobs[0];
  const { data: claimed, error: updateError } = await supabase
    .from('generation_jobs')
    .update({ status: 'processing' })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (updateError) throw updateError;
  return claimed;
};

const completeJob = async (job, urls) => {
  const { error } = await supabase
    .from('generation_jobs')
    .update({
      status: 'completed',
      result_url: urls[0],
      metadata: {
        ...(job.metadata || {}),
        result_urls: urls,
        worker_completed_at: new Date().toISOString(),
        provider: 'google-flow-browser',
      },
      error_message: null,
    })
    .eq('id', job.id);

  if (error) throw error;
};

const completeJobFromReadyFlowVideo = async (page, job, readyVideo) => {
  const downloadedUrl = await downloadProjectCardVideo(page, readyVideo.href, job);
  await completeJob(job, [downloadedUrl]);
  await moveMouseAwayFromFlowCards(page);
};

const captureFailureScreenshot = async (page, jobId) => {
  try {
    const screenshotPath = resolve(PROJECT_ROOT, `flow-failure-${jobId}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot de falha salvo: ${screenshotPath}`);
  } catch {
    // Não crítico — ignora se falhar
  }
};

const failJob = async (job, error) => {
  const errorType = error.isRateLimited
    ? 'rate_limit'
    : error.isPolicyViolation
      ? 'policy_violation'
      : 'generic';

  await supabase
    .from('generation_jobs')
    .update({
      status: 'failed',
      error_message: error.message || String(error),
      metadata: {
        ...(job.metadata || {}),
        worker_failed_at: new Date().toISOString(),
        provider: 'google-flow-browser',
        error_type: errorType,
      },
    })
    .eq('id', job.id);
};

const processJob = async (page, job) => {
  await updateWorkerStatus('working', 'Gerando video no Google Flow.', job.id);
  await openFlowProject(page);
  const knownVideoHrefs = await listProjectEditHrefs(page);
  const knownFailureState = await getProjectFailureState(page);
  await setPrompt(page, job.prompt);
  await setVideoSettings(page, job);
  await clickGenerate(page);
  const editHref = await waitForNewProjectVideoHref(page, knownVideoHrefs, knownFailureState, job);
  const downloadedUrl = await downloadProjectCardVideo(page, editHref, job);
  const urls = [downloadedUrl];
  await completeJob(job, urls);
};

const syncReadyVideosToFailedJobs = async (page) => {
  await openFlowProject(page);
  const readyVideos = await listReadyProjectVideos(page);

  for (const readyVideo of readyVideos) {
    const title = readyVideo.text.replace(/\s+/g, ' ').trim();

    if (!title) continue;

    const { data: jobs, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('type', 'video')
      .in('status', ['failed', 'processing'])
      .ilike('prompt', `%${title.split(' ').slice(0, 4).join('%')}%`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!jobs?.length) continue;

    const job = jobs[0];
    console.log(`Syncing ready Flow video ${readyVideo.href} into job ${job.id}`);
    await completeJobFromReadyFlowVideo(page, job, readyVideo);
  }
};

const syncSpecificReadyVideo = async (page) => {
  const jobId = process.env.FLOW_SYNC_JOB_ID;
  const editHref = process.env.FLOW_SYNC_EDIT_HREF;

  if (!jobId || !editHref) {
    throw new Error('Set FLOW_SYNC_JOB_ID and FLOW_SYNC_EDIT_HREF to sync a specific Flow card.');
  }

  await openFlowProject(page);

  const { data: job, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  await completeJobFromReadyFlowVideo(page, job, { href: editHref });
};

const syncReadyVideoByPrompt = async (page) => {
  const prompt = process.env.FLOW_SYNC_PROMPT;

  if (!prompt) {
    throw new Error('Set FLOW_SYNC_PROMPT to sync a ready Flow card by prompt/title.');
  }

  await openFlowProject(page);

  const readyVideos = await listReadyProjectVideos(page);
  const promptNeedle = normalizeFlowText(prompt);
  const readyVideo = readyVideos.find((video) => normalizeFlowText(video.text).includes(promptNeedle));

  if (!readyVideo) {
    throw new Error(`Could not find a ready Flow card matching "${prompt}".`);
  }

  const { data: job, error } = await supabase
    .from('generation_jobs')
    .insert({
      type: 'video',
      status: 'processing',
      prompt,
      model: 'veo-3.1-lite-lower-priority',
      metadata: {
        mode: 'text-to-video',
        provider: 'google-flow-browser',
        quantity: 1,
        model_label: 'Veo 3.1 - Lite [Lower Priority]',
        aspect_ratio: '9:16',
        duration_seconds: 8,
        reference_images: [],
        synced_from_flow: true,
        flow_edit_href: readyVideo.href,
      },
    })
    .select('*')
    .single();

  if (error) throw error;

  console.log(`Syncing ready Flow video ${readyVideo.href} into new job ${job.id}`);
  await completeJobFromReadyFlowVideo(page, job, readyVideo);
};

const main = async () => {
  const { context, page } = await launchFlow();

  if (config.loginOnly) {
    console.log('Flow browser opened. Sign in manually, then close this terminal with Ctrl+C.');
    await new Promise(() => {});
  }

  await ensureLoggedIn(page);

  if (process.argv.includes('--sync-ready')) {
    await syncReadyVideosToFailedJobs(page);
    await context.close();
    return;
  }

  if (process.argv.includes('--sync-card')) {
    await syncSpecificReadyVideo(page);
    await context.close();
    return;
  }

  if (process.argv.includes('--sync-title')) {
    await syncReadyVideoByPrompt(page);
    await context.close();
    return;
  }

  console.log('Flow browser worker connected. Waiting for pending video jobs.');
  await updateWorkerStatus('online', 'Gerador ligado e aguardando pedidos.');

  const heartbeat = setInterval(() => {
    updateWorkerStatus(
      workerHeartbeatState.status,
      workerHeartbeatState.message,
      workerHeartbeatState.currentJobId,
    ).catch(() => {});
  }, 30000);

  while (true) {
    const job = await claimNextJob();

    if (!job) {
      await sleep(config.pollMs);
      continue;
    }

    try {
      console.log(`Processing Flow job ${job.id}`);
      console.log('NAO MEXA NO MOUSE: o worker esta usando hover e menus do Flow.');
      await processJob(page, job);
      await moveMouseAwayFromFlowCards(page);
      await updateWorkerStatus('online', 'Video concluido. Aguardando o proximo pedido.');
      console.log(`Completed Flow job ${job.id}`);
    } catch (error) {
      console.error(error);
      await captureFailureScreenshot(page, job.id);
      await failJob(job, error);
      await moveMouseAwayFromFlowCards(page);
      await updateWorkerStatus('online', 'Um pedido falhou. Aguardando o proximo pedido.');
      await page.goto(config.flowProjectUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});

      if (error.isRateLimited) {
        const backoffMs = 30 * 60 * 1000;
        console.warn(`Rate limit detectado. Aguardando ${backoffMs / 60000} min antes do próximo job.`);
        await sleep(backoffMs);
      }
    }
  }

  clearInterval(heartbeat);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
