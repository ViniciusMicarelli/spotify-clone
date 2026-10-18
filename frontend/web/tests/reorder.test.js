import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reorderTracks } from '../src/utils/reorder.js';
test('dragging moves up or down to the target position without changing membership or source', () => {
  const ids = ['a', 'b', 'c', 'd'];
  assert.deepEqual(reorderTracks(ids, 'a', 'c'), ['b', 'c', 'a', 'd']);
  assert.deepEqual(reorderTracks(ids, 'd', 'b'), ['a', 'd', 'b', 'c']);
  assert.deepEqual(ids, ['a', 'b', 'c', 'd']);
  for (const [source, target] of [['a', 'a'], ['missing', 'a'], ['a', 'missing']]) assert.equal(reorderTracks(ids, source, target), null);
  assert.equal(reorderTracks(['a', 'a'], 'a', 'b'), null);
});
test('moving within a later page preserves all off-page tracks and supports adjacent page buttons', () => {
  const ids = Array.from({ length: 121 }, (_, index) => String(index + 1));
  const result = reorderTracks(ids, '103', '119');
  assert.deepEqual(result.slice(0, 100), ids.slice(0, 100));
  assert.equal(result[118], '103');
  assert.deepEqual(result.slice(119), ids.slice(119));
  assert.equal(new Set(result).size, 121);
  const boundary = reorderTracks(ids, '121', '120');
  assert.deepEqual(boundary.slice(119), ['121', '120']);
});
