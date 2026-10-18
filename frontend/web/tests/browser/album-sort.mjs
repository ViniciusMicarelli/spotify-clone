// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0', ALBUM_YEAR_FIXTURE: '1', ALBUM_SORT_FIXTURE: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  const start = '/search/' + encodeURIComponent('Álbum ano') + '?type=albums&artistId=1&size=10';
  await page.goto(base + start);
  const sort = page.getByRole('combobox', { name: 'Ordenar álbuns' });
  const expectFirst = async name => { await page.waitForFunction(expected => document.querySelector('.catalog .card h2')?.textContent === expected, name); };
  await expectFirst('Álbum ano 01');
  await sort.selectOption('name_desc'); await expectFirst('Álbum ano sem ano');
  await sort.selectOption('year_asc'); await expectFirst('Álbum ano anterior');
  await sort.selectOption('year_desc'); await expectFirst('Álbum ano 01');
  await page.locator('.catalog').getByRole('button', { name: 'Próxima página' }).click();
  await expectFirst('Álbum ano 11');
  await page.reload(); await expectFirst('Álbum ano 11');
  assert.equal(await sort.inputValue(), 'year_desc');
  await page.locator('.catalog').getByRole('button', { name: 'Próxima página' }).click();
  await page.locator('.catalog .card h2').filter({ hasText: 'Álbum ano sem ano' }).waitFor();
  assert.equal(await page.locator('.catalog .card h2').last().textContent(), 'Álbum ano sem ano');
  await sort.selectOption('name_asc'); await expectFirst('Álbum ano 01');
  assert.equal(new URL(page.url()).searchParams.has('page'), false);
  const year = page.getByRole('textbox', { name: 'Ano do álbum', exact: true });
  await year.fill('2024'); await page.getByRole('button', { name: 'Aplicar ano' }).click();
  await page.locator('.catalog .pagination').filter({ hasText: '1–10 de 25' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'name_asc');
  await sort.selectOption('name_desc'); await expectFirst('Álbum ano 25');
  assert.equal(new URL(page.url()).searchParams.get('year'), '2024');
  assert.equal(new URL(page.url()).searchParams.get('artistId'), '1');
  const input = page.getByRole('textbox', { name: 'Buscar músicas, artistas ou álbuns' });
  await input.fill('Álbum ano 25'); await input.press('Enter');
  await page.locator('.catalog .pagination').filter({ hasText: '1–1 de 1' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('sort'), 'name_desc');
  await page.goto(base + start + '&sort=invalid');
  await page.getByRole('alert').filter({ hasText: 'Ordenação inválida.' }).waitFor();
  await sort.selectOption('default'); await expectFirst('Álbum ano 01');
  assert.equal(new URL(page.url()).searchParams.has('sort'), false);
  await sort.selectOption('name_desc'); await expectFirst('Álbum ano sem ano');
  await page.getByRole('navigation', { name: 'Tipos de resultado' }).getByRole('link', { name: 'Artistas', exact: true }).click();
  await page.getByRole('combobox', { name: 'Gênero do artista' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.has('sort'), false);
  assert.deepEqual(errors, []);
  console.log('PASS: album sort modes, stable pagination/reload, missing years last, filters/term preserved, default/invalid recovery and type switch; no page errors.');

} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
