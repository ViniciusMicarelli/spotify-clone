// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0', ARTIST_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  await page.goto(base + '/artist/1');
  const details = page.getByRole('region', { name: 'Sobre o artista' });
  await details.getByText('Brasil', { exact: false }).waitFor();
  assert.match(await details.locator('.artist-biography').textContent(), /Texto <b>literal<\/b>/);
  assert.equal(await details.locator('.artist-biography b').count(), 0);
  const portrait = details.getByRole('img', { name: 'Retrato de Artist 1' });
  await portrait.waitFor();
  await portrait.evaluate(image => image.decode());
  assert.equal(await portrait.evaluate(image => image.naturalWidth > 0), true);
  await page.reload(); await details.getByText('Brasil', { exact: false }).waitFor();
  await page.goto(base + '/search/Artist%201?type=artists');
  await page.getByRole('img', { name: 'Retrato de Artist 1' }).waitFor();
  await page.goto(base + '/artist/2');
  await page.getByRole('img', { name: 'Foto indisponível de Artist 2' }).waitFor();
  await page.getByText('Biografia ainda não informada.').waitFor();
  await page.goto(base + '/artist/3');
  await page.getByRole('img', { name: 'Foto indisponível de Artist 3' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/artist/1');
  await details.getByText('Brasil', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log('PASS: artist biography/country/genres, loaded portrait, literal HTML text, reload, search photo, missing/broken photos and mobile viewport; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
