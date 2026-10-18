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
  assert.equal(await page.getByRole('slider', { name: 'Posição na forma de onda' }).count(), 0);
  await page.locator('main .track-list button').filter({ hasText: 'Ouvir' }).click();
  const wave = page.getByRole('slider', { name: 'Posição na forma de onda' });
  await wave.waitFor();
  await page.locator('footer[data-state="playing"]').waitFor();
  await page.locator('.transport-controls button').filter({ hasText: 'Pausar' }).click();
  await page.locator('footer[data-state="paused"]').waitFor();
  assert.equal(await page.locator('.waveform rect').count(), 96);
  const box = await wave.boundingBox();
  await wave.click({ position: { x: box.width / 2, y: box.height / 2 } });
  const position = await page.locator('audio').evaluate(audio => audio.currentTime);
  assert.ok(position > 3 && position < 5);
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true);
  await wave.press('Home');
  assert.equal(await page.locator('audio').evaluate(audio => audio.currentTime), 0);
  await wave.press('ArrowRight');
  assert.ok(await page.locator('audio').evaluate(audio => audio.currentTime > 0));
  await wave.press('End');
  assert.equal(await page.locator('audio').evaluate(audio => audio.currentTime), 8);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  // A waveform request failure does not prevent audio playback or progress seeking.
  await page.route('**/tracks/1/waveform', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await page.locator('main .track-list button').filter({ hasText: 'Ouvir' }).click();
  await page.getByText('Forma de onda indisponível. Use a barra de progresso.').waitFor();
  await page.locator('footer[data-state="playing"]').waitFor();
  assert.equal(await page.getByRole('slider', { name: 'Progresso da faixa', exact: true }).isEnabled(), true);
  assert.deepEqual(errors, []);
  console.log('PASS: measured 96-peak waveform, paused mouse seeking, Home/End/arrows, mobile, API failure without interrupting playback or progress; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
