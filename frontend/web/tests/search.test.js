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

test('genre URLs reset page, retain term and size, and clear filters outside artist search', async () => {
  const { genreUrl } = await import('../src/utils/search.js');
  const params = new URLSearchParams('type=artists&page=3&size=10&genre=Pop');
  const changed = new URL('https://example.test' + genreUrl('Árvore', params, 'Ação & Jazz'));
  assert.equal(changed.searchParams.get('genre'), 'Ação & Jazz');
  assert.equal(changed.searchParams.has('page'), false);
  assert.equal(changed.searchParams.get('size'), '10');
  assert.equal(new URL('https://example.test' + genreUrl('Árvore', params, '')).searchParams.has('genre'), false);
  for (const type of ['tracks', 'albums']) assert.equal(new URL('https://example.test' + searchUrl('Demo', params, type)).searchParams.has('genre'), false);
  assert.equal(params.get('page'), '3'); assert.equal(params.get('genre'), 'Pop');
});

test('album artist URLs preserve term and size, reset pages and clear artist outside album search', async () => {
  const { albumArtistUrl } = await import('../src/utils/search.js');
  const params = new URLSearchParams('type=albums&page=9&size=10&genre=Pop');
  const changed = new URL('https://example.test' + albumArtistUrl('Demo', params, 'artist /&'));
  assert.equal(changed.searchParams.get('artistId'), 'artist /&');
  assert.equal(changed.searchParams.get('size'), '10'); assert.equal(changed.searchParams.has('page'), false);
  assert.equal(changed.searchParams.has('genre'), false);
  params.set('artistId', '1');
  assert.equal(new URL('https://example.test' + albumArtistUrl('Demo', params, '')).searchParams.has('artistId'), false);
  for (const type of ['tracks', 'artists']) assert.equal(new URL('https://example.test' + searchUrl('Demo', params, type)).searchParams.has('artistId'), false);
  assert.equal(params.get('page'), '9');
});
