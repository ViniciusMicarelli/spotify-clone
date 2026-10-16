export const initialQueue = { tracks: [], originalOrder: [], index: -1, request: 0, shuffle: false, repeat: 'off' };
export function shuffledIds(tracks, random = Math.random) {
  const ids = tracks.map(track => track.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
function reorderRemaining(tracks, index, order) {
  const remaining = tracks.slice(index + 1);
  if (!Array.isArray(order) || order.length !== remaining.length || new Set(order).size !== remaining.length || !order.every(id => remaining.some(track => track.id === id))) return tracks;
  return [...tracks.slice(0, index + 1), ...order.map(id => remaining.find(track => track.id === id))];
}
export const canAdvance = state => state.index >= 0 && (state.index < state.tracks.length - 1 || state.repeat === 'all');
export function queueReducer(state, action) {
  if (action.type === 'select') {
    const index = action.tracks.findIndex(track => track.id === action.id);
    if (index === -1) return state;
    const tracks = structuredClone(action.tracks);
    return { ...state, tracks: state.shuffle ? reorderRemaining(tracks, index, action.order) : tracks, originalOrder: tracks.map(track => track.id), index, request: state.request + 1 };
  }
  if (action.type === 'repeat') return { ...state, repeat: { off: 'all', all: 'one', one: 'off' }[state.repeat] };
  if (action.type === 'shuffle') {
    if (!state.shuffle) return { ...state, shuffle: true, tracks: reorderRemaining(state.tracks, state.index, action.order) };
    const currentId = state.tracks[state.index]?.id;
    const tracks = state.originalOrder.map(id => state.tracks.find(track => track.id === id)).filter(Boolean);
    return { ...state, shuffle: false, tracks, index: tracks.findIndex(track => track.id === currentId) };
  }
  if (action.type === 'clear') return { ...state, tracks: [], originalOrder: [], index: -1, request: state.request + 1 };
  if (action.type === 'remove') {
    const removed = state.tracks.findIndex(track => track.id === action.id);
    if (removed < 0) return state;
    const tracks = state.tracks.filter(track => track.id !== action.id);
    const index = !tracks.length ? -1 : removed < state.index ? state.index - 1 : removed === state.index ? Math.min(state.index, tracks.length - 1) : state.index;
    return { ...state, tracks, originalOrder: state.originalOrder.filter(id => id !== action.id), index, request: state.request + (removed === state.index ? 1 : 0) };
  }
  if (state.index < 0) return state;
  if (action.type === 'ended' && state.repeat === 'one') return { ...state, request: state.request + 1 };
  let index = action.type === 'next' || action.type === 'ended' ? state.index + 1 : action.type === 'previous' ? state.index - 1 : action.type === 'jump' ? action.index : -1;
  if ((action.type === 'next' || action.type === 'ended') && index === state.tracks.length && state.repeat === 'all') index = 0;
  if (action.type === 'previous' && index < 0 && state.repeat === 'all') index = state.tracks.length - 1;
  if (!Number.isInteger(index) || index < 0 || index >= state.tracks.length) return state;
  return { ...state, index, request: state.request + 1 };
}
