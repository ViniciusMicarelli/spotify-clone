import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createListenTracker } from '../src/player/listen.js';
test('listening counts actual intervals once, ignores stalls and resumes without duplication', () => {
  const tracker = createListenTracker();
  assert.equal(tracker.sample(0, 0, true), false);
  assert.equal(tracker.sample(1, 1000, true), false);
  assert.equal(tracker.sample(1, 9000, true), false);
  tracker.breakInterval();
  assert.equal(tracker.sample(1, 15000, false), false);
  assert.equal(tracker.sample(1, 20000, true), false);
  assert.equal(tracker.sample(3, 22000, true), true);
  assert.equal(tracker.sample(5, 24000, true), false);
});
test('seeks and track attempts cannot manufacture listened time or share counters', () => {
  const tracker = createListenTracker();
  tracker.sample(0, 0, true);
  tracker.sample(1, 1000, true);
  tracker.breakInterval();
  assert.equal(tracker.sample(100, 2000, false), false);
  assert.equal(tracker.sample(100, 2100, true), false);
  assert.equal(tracker.sample(101, 3100, true), false);
  assert.equal(tracker.sample(102, 4100, true), true);
  assert.equal(createListenTracker().sample(102, 4100, true), false);
});
