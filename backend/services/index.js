export { auth } from './auth/index.js';
export { tracks, albums, artists } from './catalog/router.js';
import usersData from './users/users.js';
import playlistsData from './playlists/playlists.js';
export const users = usersData.router;
export const playlists = playlistsData.router;
