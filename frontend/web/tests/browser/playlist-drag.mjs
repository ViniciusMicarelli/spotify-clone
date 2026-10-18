// Run after building the UI. Uses the isolated backend pagination fixture.
// PLAYWRIGHT_MODULE may select an existing installation without adding app dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fixture = spawn(process.execPath, ['backend/tests/fixtures/pagination-server.js'], { cwd: new URL('../../../../', import.meta.url), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
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
  await page.goto(base + '/auth/login');
  await page.locator('input[autocomplete="username"]').fill('demo_user');
  await page.locator('input[type="password"]').fill('password123');
  const login = page.waitForResponse(response => response.url().endsWith('/auth/signin') && response.status() === 200);
  await page.locator('.auth-card form button').click();
  const { token } = await (await login).json();
  const headers = { Authorization: `Bearer ${token}` };
  const endpoint = base + '/api/v1/playlists/pagination-fixture';
  const path = base + '/playlist/pagination-fixture?page=6&size=20';
  const order = async () => (await (await page.request.get(endpoint, { headers })).json()).data.tracks;
  const before = await order();
  await page.goto(path);
  const row = id => page.locator(`.playlist-tracks article[data-track-id="${id}"]`);
  const ready = async () => { await page.locator('.playlist-tracks article .drag-handle').first().waitFor(); };
  await ready();
  if (process.env.DEBUG_DRAG) {
    page.on('console', message => console.log(message.text()));
    await page.evaluate(() => {
      for (const type of ['dragstart', 'dragover', 'drop', 'dragend']) document.addEventListener(type, event => console.log(type, event.target.closest('article')?.dataset.trackId, event.defaultPrevented));
    });
  }
  let writes = 0;
  page.on('request', request => { if (request.method() === 'PUT' && request.url().endsWith('/tracks/order')) writes++; });
  async function gesture(source, target) {
    // Center rows above the fixed player before issuing real mouse gestures.
    await row(source).evaluate(element => element.scrollIntoView({ block: 'center' }));
    const a = await row(source).locator('.drag-handle').boundingBox();
    const b = await row(target).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 15, { steps: 5 });
    await page.mouse.move(b.x + 25, b.y + b.height / 2, { steps: 15 });
    await page.mouse.up();
  }
  async function drag(source, target) {
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/tracks/order') && response.request().method() === 'PUT'),
      gesture(source, target)
    ]);
    assert.equal(response.status(), 200);
    await page.getByRole('status').filter({ hasText: 'Ordem salva.' }).waitFor();
    await ready();
  }
  // Later-page reordering must retain all 121 IDs, including those off-screen.
  await drag(before[100], before[102]);
  const down = [...before]; down.splice(102, 0, down.splice(100, 1)[0]);
  assert.deepEqual(await order(), down);
  await drag(before[100], before[101]);
  assert.deepEqual(await order(), before);
  await page.reload(); await ready();
  assert.equal(await page.locator('.playlist-tracks article').first().getAttribute('data-track-id'), before[100]);
  // Dropping onto itself and cancelling cannot send a mutation.
  const savedWrites = writes;
  await gesture(before[100], before[100]);
  assert.equal(writes, savedWrites);
  await row(before[100]).evaluate(element => element.scrollIntoView({ block: 'center' }));
  const handle = await row(before[100]).locator('.drag-handle').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 25, { steps: 5 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.equal(writes, savedWrites);
  // A rejected write leaves the saved and rendered order intact.
  await page.route('**/tracks/order', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Falha simulada ao salvar.' }) }));
  await gesture(before[100], before[102]);
  await page.getByRole('alert').filter({ hasText: 'Falha simulada ao salvar.' }).waitFor();
  assert.deepEqual(await order(), before);
  assert.equal(await page.locator('.playlist-tracks article').first().getAttribute('data-track-id'), before[100]);
  await page.unroute('**/tracks/order');
  // Existing keyboard controls also cross page boundaries.
  await page.goto(base + '/playlist/pagination-fixture?page=7&size=20'); await ready();
  const boundaryResponse = page.waitForResponse(response => response.url().endsWith('/tracks/order') && response.status() === 200);
  await page.locator('.playlist-tracks .track-order button').first().press('Enter');
  await boundaryResponse;
  const boundary = [...before]; [boundary[119], boundary[120]] = [boundary[120], boundary[119]];
  assert.deepEqual(await order(), boundary);
  // Visitors can view public content but receive no reorder handles or buttons.
  assert.equal((await page.request.put(endpoint, { headers, data: { public: true } })).status(), 200);
  const guest = await browser.newPage();
  await guest.goto(base + '/playlist/pagination-fixture');
  await guest.locator('.playlist-tracks article').first().waitFor();
  assert.equal(await guest.locator('.drag-handle,.track-order').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: native drag up/down, 121-track membership, reload, same-position drop, Escape cancellation, failed save, keyboard boundary and guest permissions; no page errors.');
} finally {
  await browser?.close();
  if (fixture.exitCode === null && fixture.signalCode === null) {
    const exited = once(fixture, 'exit');
    fixture.kill('SIGTERM');
    await exited;
  }
}
