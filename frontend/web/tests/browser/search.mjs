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
  const searchInput = page.getByRole('textbox', { name: 'Buscar músicas, artistas ou álbuns' });
  const typeLink = label => page.getByRole('navigation', { name: 'Tipos de resultado' }).getByRole('link', { name: label, exact: true });
  const cards = page.locator('main .cards .card');
  const url = '/search/Busca%20exemplo?type=artists&size=10';
  await page.goto(base + url);
  await cards.nth(9).waitFor();
  assert.equal(await cards.count(), 10);
  assert.equal(await cards.first().locator('h2').textContent(), 'Busca exemplo 01');
  assert.equal(await searchInput.inputValue(), 'Busca exemplo');
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await page.locator('main .card h2', { hasText: 'Busca exemplo 11' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('page'), '2');
  await page.reload();
  await page.locator('main .card h2', { hasText: 'Busca exemplo 11' }).waitFor();
  await typeLink('Álbuns').click();
  await page.locator('main .card h2', { hasText: 'Busca exemplo 01' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.has('page'), false);
  assert.equal(new URL(page.url()).searchParams.get('size'), '10');
  assert.equal(new URL(page.url()).searchParams.get('type'), 'albums');
  await searchInput.fill('Busca exemplo 25'); await searchInput.press('Enter');
  await page.locator('.pagination').filter({ hasText: '1–1 de 1' }).waitFor();
  assert.equal(await cards.first().locator('h2').textContent(), 'Busca exemplo 25');
  await cards.first().click();
  await page.getByRole('heading', { name: 'Busca exemplo 25', exact: true }).waitFor();
  assert.match(new URL(page.url()).pathname, /^\/album\//);
  await page.goBack();
  await typeLink('Artistas').click();
  await cards.first().waitFor(); await cards.first().click();
  await page.getByRole('heading', { name: 'Busca exemplo 25', exact: true }).waitFor();
  assert.match(new URL(page.url()).pathname, /^\/artist\//);
  // URL encoding, Unicode casing and literal wildcard characters round-trip.
  await page.goto(base + '/search/' + encodeURIComponent('árvore / %_?') + '?type=artists');
  await page.locator('main .card h2', { hasText: 'Árvore / %_?' }).waitFor();
  assert.equal(await searchInput.inputValue(), 'árvore / %_?');
  await searchInput.press('Enter');
  await page.locator('main .card h2', { hasText: 'Árvore / %_?' }).waitFor();
  // A failed request can be retried without losing the current type or query.
  let fail = true;
  await page.route('**/api/v1/artists?**', route => fail ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Busca indisponível.' }) }) : route.continue());
  await page.goto(base + url);
  await page.getByRole('alert').filter({ hasText: 'Busca indisponível.' }).waitFor();
  fail = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await cards.nth(9).waitFor();
  await page.unroute('**/api/v1/artists?**');
  await typeLink('Músicas').click();
  await page.getByText('Nenhuma faixa encontrada.', { exact: true }).waitFor();
  await searchInput.fill('Digital Dreams'); await searchInput.press('Enter');
  await page.locator('main .track-list strong', { hasText: 'Digital Dreams' }).waitFor();
  assert.equal(await page.locator('main .track-list article').count(), 1);
  await page.goto(base + '/search/Digital%20Dreams?type=constructor');
  await page.locator('main .track-list strong', { hasText: 'Digital Dreams' }).waitFor();
  assert.equal(await typeLink('Músicas').getAttribute('aria-current'), 'page');
  assert.deepEqual(errors, []);
  console.log('PASS: artist/album search, 25-result pagination, reload, type reset, new term, detail links, encoded Unicode, literal wildcards, error retry and legacy track URLs; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
