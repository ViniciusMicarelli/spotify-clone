// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0', ALBUM_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  await page.goto(base + '/search/Digital%20Dreams?type=albums');
  await page.getByRole('img', { name: 'Capa de Digital Dreams', exact: true }).waitFor();
  await page.locator('.cards a[href="/album/2"]').click();
  const details = page.getByRole('region', { name: 'Sobre o álbum' });
  await details.getByText('Ano: 2024').waitFor();
  await details.getByText('Gêneros: Electronic, Instrumental').waitFor();
  await details.getByText('1 faixas · 0:10').waitFor();
  await details.getByRole('img', { name: 'Capa de Digital Dreams' }).evaluate(image => image.decode());
  await page.reload(); await details.getByText('Ano: 2024').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.goto(base + '/album/3');
  await page.getByRole('img', { name: 'Capa indisponível de Summer Vibes' }).waitFor();
  await details.getByText('Ano: Não informado').waitFor();
  await details.getByText('Gêneros: Não informados').waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: album cover in search/details, year, genres, duration, reload, mobile and broken-cover fallback; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
