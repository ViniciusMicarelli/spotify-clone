// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0', AUDIO_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let output = '';
    fixture.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) resolve(match[0]); });
    fixture.once('error', reject);
    fixture.once('exit', code => reject(new Error(`Fixture exited: ${code}`)));
  });
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/track/1');
  const details = page.getByRole('region', { name: 'Informações do áudio' });
  for (const value of ['WAV · PCM', '256 kbps', '16.000 Hz', '1 (mono)', '16 bits', '8 s']) await details.getByText(value, { exact: true }).waitFor();
  await page.reload(); await details.getByText('256 kbps', { exact: true }).waitFor();
  await page.locator('main .track-list button').filter({ hasText: 'Ouvir' }).click();
  await page.locator('footer[data-state="playing"]').waitFor();
  await page.locator('.transport-controls button').filter({ hasText: 'Pausar' }).click();
  await page.locator('footer[data-state="paused"]').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for (const id of [2, 3]) {
    await page.goto(base + '/track/' + id);
    await details.getByText('Dados técnicos não disponíveis para este áudio.').waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: measured PCM metadata, reload, playback/pause, mobile, external and missing audio fallback; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
