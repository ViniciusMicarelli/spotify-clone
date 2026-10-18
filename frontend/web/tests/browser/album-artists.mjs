// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0', SEARCH_FIXTURE: '1', ALBUM_ARTIST_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  await page.goto(base + '/search/' + encodeURIComponent('Álbum filtro') + '?type=albums&size=10');
  const picker = page.getByRole('region', { name: 'Filtro de artista do álbum' });
  const select = picker.getByRole('combobox', { name: 'Selecionar artista' });
  await select.locator('option[value="1"]').waitFor({ state: 'attached' });
  await select.selectOption('1'); await picker.getByRole('button', { name: 'Aplicar artista' }).click();
  await picker.getByText('Selecionado: Artist 1').waitFor();
  await page.locator('.catalog .pagination').filter({ hasText: '1–10 de 25' }).waitFor();
  await page.locator('.catalog').getByRole('button', { name: 'Próxima página' }).click();
  await page.locator('.catalog .card h2').filter({ hasText: 'Álbum filtro 11' }).waitFor();
  await page.reload(); await picker.getByText('Selecionado: Artist 1').waitFor();
  await page.locator('.catalog .card h2').filter({ hasText: 'Álbum filtro 11' }).waitFor();
  const input = page.getByRole('textbox', { name: 'Buscar músicas, artistas ou álbuns' });
  await input.fill('Álbum filtro 25'); await input.press('Enter');
  await page.locator('.catalog .pagination').filter({ hasText: '1–1 de 1' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('artistId'), '1');
  assert.equal(new URL(page.url()).searchParams.has('page'), false);
  // The picker has independent pages, exposing artists beyond its first 20.
  await picker.getByRole('button', { name: 'Próxima página' }).click();
  await select.locator('option').filter({ hasText: 'Busca exemplo 25' }).waitFor({ state: 'attached' });
  await select.selectOption({ label: 'Busca exemplo 25' });
  await picker.getByRole('button', { name: 'Aplicar artista' }).click();
  await picker.getByText('Selecionado: Busca exemplo 25').waitFor();
  await page.getByText('Nenhum resultado.', { exact: true }).waitFor();
  await input.fill('Busca exemplo'); await input.press('Enter');
  await page.locator('.catalog .card h2').filter({ hasText: 'Busca exemplo 25' }).waitFor();
  await picker.getByRole('button', { name: 'Limpar artista' }).click();
  assert.equal(new URL(page.url()).searchParams.has('artistId'), false);
  await page.goto(base + '/search?type=albums&artistId=missing');
  await picker.getByText('Selecionado: Artista indisponível').waitFor();
  await picker.getByRole('button', { name: 'Limpar artista' }).click();
  await picker.getByRole('textbox', { name: 'Buscar artista para filtrar' }).fill('Artist 2');
  await picker.getByRole('button', { name: 'Buscar artistas', exact: true }).click();
  await select.locator('option[value="2"]').waitFor({ state: 'attached' });
  await select.selectOption('2'); await picker.getByRole('button', { name: 'Aplicar artista' }).click();
  await picker.getByText('Selecionado: Artist 2').waitFor();
  await page.getByRole('navigation', { name: 'Tipos de resultado' }).getByRole('link', { name: 'Artistas', exact: true }).click();
  await page.locator('.catalog .card').first().waitFor();
  assert.equal(new URL(page.url()).searchParams.has('artistId'), false);
  await page.route('**/api/v1/artists?**', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.goto(base + '/search?type=albums');
  await picker.getByRole('button', { name: 'Recarregar artistas' }).waitFor();
  await page.unroute('**/api/v1/artists?**');
  await picker.getByRole('button', { name: 'Recarregar artistas' }).click();
  await select.locator('option[value="1"]').waitFor({ state: 'attached' });
  assert.deepEqual(errors, []);
  console.log('PASS: artist-filtered album pagination/reload, term retention/reset, picker beyond 20, empty results, search/clear, unknown artist, type switch and retry; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
