import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchType, searchUrl } from '../src/utils/search.js';
test('search types use an allowlist and preserve existing track URLs', () => {
  for (const query of ['', 'type=unknown', 'type=__proto__', 'type=constructor', 'type=tracks']) assert.equal(searchType(new URLSearchParams(query)), 'tracks');
  for (const type of ['artists', 'albums']) assert.equal(searchType(new URLSearchParams({ type })), type);
  assert.equal(searchUrl('Lifestyle'), '/search/Lifestyle');
  assert.equal(searchUrl('  '), '/search');
});
test('new search and type switches reset page while keeping size and safe encoded terms', () => {
  const params = new URLSearchParams('type=artists&page=7&size=10');
  assert.equal(searchUrl(' Árvore / %_? ', params), '/search/%C3%81rvore%20%2F%20%25_%3F?type=artists&size=10');
  assert.equal(searchUrl('Demo', params, 'albums'), '/search/Demo?type=albums&size=10');
  assert.equal(searchUrl('Demo', params, 'tracks'), '/search/Demo?size=10');
  assert.equal(params.get('page'), '7');
  assert.equal(params.get('type'), 'artists');
});
