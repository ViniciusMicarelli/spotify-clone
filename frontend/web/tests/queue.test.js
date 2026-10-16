import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialQueue, queueReducer, shuffledIds, canAdvance } from '../src/player/queue.js';

test('playback follows the selected playlist order, stops at boundaries and reselects the current track', () => {
  const tracks = [{ id: '3' }, { id: '1' }, { id: '2' }];
  let state = queueReducer(initialQueue, { type: 'select', tracks, id: '3' });
  tracks.reverse();
  assert.deepEqual(state.tracks.map(track => track.id), ['3', '1', '2']);
  assert.equal(queueReducer(state, { type: 'previous' }), state);
  state = queueReducer(state, { type: 'next' });
  assert.equal(state.tracks[state.index].id, '1');
  state = queueReducer(state, { type: 'next' });
  assert.equal(state.tracks[state.index].id, '2');
  assert.equal(queueReducer(state, { type: 'next' }), state);
  const replay = queueReducer(state, { type: 'select', tracks: state.tracks, id: '2' });
  assert.equal(replay.index, state.index);
  assert.ok(replay.request > state.request);
  const previous = queueReducer(replay, { type: 'previous' });
  assert.equal(previous.tracks[previous.index].id, '1');
});

test('empty and invalid selections do not replace the queue; jumping requests replay', () => {
  assert.equal(queueReducer(initialQueue, { type: 'next' }), initialQueue);
  assert.equal(queueReducer(initialQueue, { type: 'select', tracks: [], id: 'missing' }), initialQueue);
  const selected = queueReducer(initialQueue, { type: 'select', tracks: [{ id: '1' }, { id: '2' }], id: '2' });
  assert.equal(queueReducer(selected, { type: 'jump', index: 10 }), selected);
  const jump = queueReducer(selected, { type: 'jump', index: 0 });
  assert.equal(jump.index, 0);
  assert.ok(jump.request > selected.request);
});

test('repeat-one restarts only on natural completion while manual next still advances', () => {
  let state = queueReducer(initialQueue, { type: 'select', tracks: [{ id: '1' }, { id: '2' }], id: '1' });
  state = queueReducer(queueReducer(state, { type: 'repeat' }), { type: 'repeat' });
  assert.equal(state.repeat, 'one');
  const ended = queueReducer(state, { type: 'ended' });
  assert.equal(ended.index, 0);
  assert.ok(ended.request > state.request);
  const manual = queueReducer(ended, { type: 'next' });
  assert.equal(manual.index, 1);
  assert.equal(queueReducer(manual, { type: 'next' }), manual);
  assert.equal(queueReducer(manual, { type: 'ended' }).index, 1);
  assert.equal(queueReducer(manual, { type: 'repeat' }).repeat, 'off');
});

test('repeat-all wraps forwards and backwards; a single-track queue restarts', () => {
  let state = queueReducer(initialQueue, { type: 'select', tracks: [{ id: '1' }, { id: '2' }], id: '2' });
  state = queueReducer(state, { type: 'repeat' });
  const first = queueReducer(state, { type: 'ended' });
  assert.equal(first.index, 0);
  assert.equal(queueReducer(first, { type: 'previous' }).index, 1);
  assert.equal(queueReducer(state, { type: 'next' }).index, 0);
  const single = queueReducer(state, { type: 'select', tracks: [{ id: '1' }], id: '1' });
  const loop = queueReducer(single, { type: 'ended' });
  assert.equal(loop.index, 0);
  assert.ok(loop.request > single.request);
});

test('shuffle preserves current playback and history, then restores the original order', () => {
  const tracks = ['1', '2', '3', '4'].map(id => ({ id }));
  let state = queueReducer(initialQueue, { type: 'select', tracks, id: '2' });
  const request = state.request;
  state = queueReducer(state, { type: 'shuffle', order: ['4', '3'] });
  assert.deepEqual(state.tracks.map(t => t.id), ['1', '2', '4', '3']);
  assert.equal(state.tracks[state.index].id, '2');
  assert.equal(state.request, request);
  state = queueReducer(state, { type: 'next' });
  assert.equal(state.tracks[state.index].id, '4');
  const restored = queueReducer(state, { type: 'shuffle' });
  assert.deepEqual(restored.tracks.map(t => t.id), ['1', '2', '3', '4']);
  assert.equal(restored.tracks[restored.index].id, '4');
  assert.equal(restored.request, state.request);
  assert.equal(restored.shuffle, false);
});

test('removing other tracks does not restart audio; removing current selects its successor', () => {
  const selected = queueReducer(initialQueue, { type: 'select', tracks: ['1', '2', '3'].map(id => ({ id })), id: '2' });
  const before = queueReducer(selected, { type: 'remove', id: '1' });
  assert.equal(before.tracks[before.index].id, '2');
  assert.equal(before.request, selected.request);
  const after = queueReducer(selected, { type: 'remove', id: '3' });
  assert.equal(after.tracks[after.index].id, '2');
  assert.equal(after.request, selected.request);
  const current = queueReducer(selected, { type: 'remove', id: '2' });
  assert.equal(current.tracks[current.index].id, '3');
  assert.ok(current.request > selected.request);
  const last = queueReducer(current, { type: 'remove', id: '3' });
  assert.equal(last.tracks[last.index].id, '1');
  const empty = queueReducer(last, { type: 'remove', id: '1' });
  assert.equal(empty.index, -1);
  assert.deepEqual(empty.tracks, []);
  assert.deepEqual(selected.tracks.map(t => t.id), ['1', '2', '3']);
});

test('shuffle respects a new selection; removing and clearing preserve modes without reviving removed items', () => {
  let state = queueReducer(initialQueue, { type: 'shuffle', order: [] });
  state = queueReducer(state, { type: 'repeat' });
  state = queueReducer(state, { type: 'select', tracks: ['1', '2', '3'].map(id => ({ id })), id: '1', order: ['3', '2'] });
  assert.deepEqual(state.tracks.map(t => t.id), ['1', '3', '2']);
  state = queueReducer(state, { type: 'remove', id: '3' });
  state = queueReducer(state, { type: 'shuffle' });
  assert.deepEqual(state.tracks.map(t => t.id), ['1', '2']);
  const empty = queueReducer(state, { type: 'clear' });
  assert.deepEqual(empty.tracks, []);
  assert.equal(empty.index, -1);
  assert.equal(empty.repeat, 'all');
  assert.equal(queueReducer(empty, { type: 'ended' }), empty);
});

test('shuffle is a permutation and navigation availability follows repeat mode', () => {
  const tracks = ['1', '2', '3'].map(id => ({ id }));
  assert.deepEqual(shuffledIds(tracks, () => 0), ['2', '3', '1']);
  assert.deepEqual(tracks.map(t => t.id), ['1', '2', '3']);
  assert.equal(canAdvance(initialQueue), false);
  const last = queueReducer(initialQueue, { type: 'select', tracks, id: '3' });
  assert.equal(canAdvance(last), false);
  assert.equal(canAdvance(queueReducer(last, { type: 'repeat' })), true);
});
