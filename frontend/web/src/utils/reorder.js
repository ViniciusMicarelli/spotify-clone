// Move to the target's original position without losing off-page entries.
export function reorderTracks(ids, sourceId, targetId) {
  const source = ids.indexOf(sourceId), target = ids.indexOf(targetId);
  if (source < 0 || target < 0 || source === target || new Set(ids).size !== ids.length) return null;
  const next = [...ids];
  next.splice(source, 1);
  next.splice(target, 0, sourceId);
  return next;
}
