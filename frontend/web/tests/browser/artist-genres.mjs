// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0', SEARCH_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  await page.goto(base + '/search?type=artists&size=10');
  const select = page.getByRole('combobox', { name: 'Gênero do artista' });
  await select.locator('option[value="Demo"]').waitFor({ state: 'attached' });
  assert.equal(await select.locator('option[value="Pop"]').count(), 1);
  await select.selectOption('Demo');
  await page.locator('.pagination').filter({ hasText: '1–10 de 25' }).waitFor();
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await page.locator('main .card h2').filter({ hasText: 'Busca exemplo 11' }).waitFor();
  await page.reload(); await select.locator('option[value="Demo"]').waitFor({ state: 'attached' });
  assert.equal(await select.inputValue(), 'Demo');
  assert.equal(new URL(page.url()).searchParams.get('page'), '2');
  const input = page.getByRole('textbox', { name: 'Buscar músicas, artistas ou álbuns' });
  await input.fill('Busca exemplo 25'); await input.press('Enter');
  await page.locator('.pagination').filter({ hasText: '1–1 de 1' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('genre'), 'Demo');
  assert.equal(new URL(page.url()).searchParams.has('page'), false);
  await select.selectOption('Pop');
  await page.getByText('Nenhum resultado.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Limpar gênero' }).click();
  await page.locator('main .card h2').filter({ hasText: 'Busca exemplo 25' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.has('genre'), false);
  await select.selectOption('Demo');
  await page.getByRole('navigation', { name: 'Tipos de resultado' }).getByRole('link', { name: 'Álbuns', exact: true }).click();
  await page.locator('main .card h2').filter({ hasText: 'Busca exemplo 25' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.has('genre'), false);
  // Unknown/deleted genre remains clearable, and a failed inventory is retryable.
  await page.route('**/artists/genres', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.goto(base + '/search?type=artists&genre=deleted');
  await page.getByRole('button', { name: 'Recarregar gêneros' }).waitFor();
  await page.getByText('Nenhum resultado.', { exact: true }).waitFor();
  await page.unroute('**/artists/genres');
  await page.getByRole('button', { name: 'Recarregar gêneros' }).click();
  await select.locator('option[value="Pop"]').waitFor({ state: 'attached' });
  assert.equal(await select.inputValue(), 'deleted');
  await page.getByRole('button', { name: 'Limpar gênero' }).click();
  await page.locator('main .cards .card').first().waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: complete genre inventory, combined search, pagination/reload, reset, empty results, clear/type switch, deleted genre and inventory retry; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
