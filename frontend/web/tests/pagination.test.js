import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginationState } from '../src/utils/pagination.js';
const state = (query, total) => paginationState(new URLSearchParams(query), total);
test('page and size produce offsets while preserving a pending requested page', () => {
  assert.deepEqual(state('', 45), { requestedPage: 1, page: 1, size: 20, pages: 3, offset: 0 });
  assert.deepEqual(state('page=3&size=10', 45), { requestedPage: 3, page: 3, size: 10, pages: 5, offset: 20 });
  assert.equal(state('page=4').page, 4);
  assert.equal(state('page=4').pages, undefined);
});
test('deleting the only item on the last page clamps to the previous page', () => {
  assert.equal(state('page=2', 21).page, 2);
  assert.equal(state('page=2', 20).page, 1);
  assert.equal(state('page=900&size=10', 103).page, 11);
  assert.equal(state('page=2', 0).page, 1);
  assert.equal(state('page=2', 0).offset, 0);
});
test('malformed pages and unsupported sizes cannot generate unsafe offsets', () => {
  for (const page of ['0','-1','NaN','2.5','Infinity','9007199254740991','1e5']) {
    assert.equal(state('page='+page).requestedPage, 1);
    assert.equal(state('page='+page).offset, 0);
  }
  assert.equal(state('size=100&page=2').size, 20);
  assert.equal(state('size=50&page=2').offset, 50);
});
