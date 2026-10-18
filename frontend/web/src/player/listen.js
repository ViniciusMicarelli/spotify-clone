// Accumulate actual playback intervals, excluding pauses, stalls and seeks.
export function createListenTracker() {
  let previous = null, seconds = 0, recorded = false;
  return {
    breakInterval() { previous = null; },
    sample(mediaTime, wallTime, playing) {
      if (!playing) { previous = null; return false; }
      if (previous) {
        const mediaDelta = mediaTime - previous.mediaTime;
        const wallDelta = (wallTime - previous.wallTime) / 1000;
        if (mediaDelta > 0 && wallDelta > 0) seconds += Math.min(mediaDelta, wallDelta);
      }
      previous = { mediaTime, wallTime };
      if (!recorded && seconds >= 3) { recorded = true; return true; }
      return false;
    }
  };
}
