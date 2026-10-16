import React, { useState } from 'react';
import { Home, Search, Library, Plus, ArrowRight, Heart, ArrowDown } from '../Icons/index';

/**
 * Sidebar Component
 *
 * Main navigation sidebar for Spotify clone with:
 * - Logo and app switcher (Web Player, Spotify)
 * - Navigation menu (Home, Search, Your Library)
 * - Library content with collapsible lists
 * - Responsive design for mobile
 */

const Sidebar = () => {
  // State for managing active menu items
  const [selected, setSelected] = useState('home');
  const [libraryItems, setLibraryItems] = useState([
    'playlists', 'podcasts', 'events', 'daily mixes'
  ]);
  const [showLibraryItems, setShowLibraryItems] = useState(true);

  const handleSelect = (item) => {
    setSelected(item);
    // Close library dropdown when switching to non-library items
    if (
      item === 'home' ||
      item === 'search' ||
      item === 'your-library' ||
      item === 'account'
    ) {
      setShowLibraryItems(false);
    }
  };

  const handleToggleLibraryItems = () => {
    setShowLibraryItems(!showLibraryItems);
  };

  return (
    <div className="sidebar">
      {/* Logo and switcher */}
      <div className="logo-container">
        <img
          src="/images/spotify_logo"
          alt="Spotify Logo"
          width="136"
          height="40"
          className="logo"
        />
        <div className="switcher">
          <button className="switcher-item">
            <img src="/images/web_player_icon" alt="Web Player" width="24" />
            <span>Web Player</span>
            <svg viewBox="0 0 12 12" width="12" height="12" className="check">
              <circle cx="6" cy="6" r="6" fill="none" />
              <polygon points="6,3 9.2,6.4 6.7,9" fill="white" stroke="none" />
            </svg>
          </button>
          <button className="switcher-item">
            <img src="/images/spotify_logo" alt="Spotify" width="24" />
            <span>Spotify</span>
            <svg viewBox="0 0 12 12" width="12" height="12" className="check">
              <circle cx="6" cy="6" r="6" fill="#1DB954" />
              <polygon points="6,3 9.2,6.4 6.7,9" fill="white" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="nav-container">
        <div className="nav-content">
          {/* Main navigation items */}
          <button
            className="nav-item sidebar__item active"
            onClick={() => handleSelect('home')}
          >
            <Home />
            <p>Home</p>
          </button>

          <button
            className="nav-item sidebar__item"
            onClick={() => handleSelect('search')}
          >
            <Search />
            <p>Search</p>
          </button>

          <button
            className="nav-item sidebar__item"
            onClick={() => handleSelect('your-library')}
          >
            <Library />
            <p>Your Library</p>
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="white" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v7.6a2.6 2.6 0 0 1-2.6 2.6h2a2.6 2.6 0 0 0 2.6-2.6V1.2Z" />
              <path fill="#535353" d="M8 6.4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
              <path fill="white" d="M13.6 9.2H14a2.6 2.6 0 0 1 2.6 2.6v2a2.6 2.6 0 0 1-2.6 2.6h-1.2a.4.4 0 0 0-.4.4v-2.6a.4.4 0 0 0 .4-.4h1.2a2.6 2.6 0 0 0 2.6-2.6v-2a2.6 2.6 0 0 0-2.6-2.6h-1.2a.4.4 0 0 0-.4.4v2.6a.4.4 0 0 0 .4.4h.4Z" />
            </svg>
          </button>

          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M4.4 12.2a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h5.2a.4.4 0 0 0 .4-.4v-2a2.6 2.6 0 0 0-2.6-2.6H4.4Z" />
              <path fill="#535353" d="M4.4 15.8a.4.4 0 0 0-.4.4v1a.4.4 0 0 0 .4.4h5.2a.4.4 0 0 0 .4-.4v-1a2.6 2.6 0 0 0-2.6-2.6H4.4Z" />
              <path fill="white" d="M13.6 3.8H14a2.6 2.6 0 0 1 2.6 2.6v2a2.6 2.6 0 0 1-2.6 2.6h-1.2a.4.4 0 0 0-.4.4v-2.6a.4.4 0 0 0 .4-.4h1.2a2.6 2.6 0 0 0 2.6-2.6v-2a2.6 2.6 0 0 0-2.6-2.6h-1.2a.4.4 0 0 0-.4.4v2.6a.4.4 0 0 0 .4.4h.4Z" />
            </svg>
            <span className="hidden-mobile">Your Sounds</span>
          </button>

          <button className="nav-item sidebar__item active">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M8.6 6.8a.4.4 0 0 0-.8 0v3.8a4.8 4.8 0 0 1-4.8 4.8H1.8a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a4.8 4.8 0 0 1 4.8 4.8h3.2a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H9.4a4.8 4.8 0 0 1-4.8-4.8V6.8Zm2.2 2.2V9.4a3 3 0 0 0-6 0v1.6Z" />
            </svg>
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="#1DB954" d="M8.6 3.4a.4.4 0 0 0-.4-.4H5.6A.4.4 0 0 0 5.2 3.4V11.2a.4.4 0 0 0 .4.4h2.6a.4.4 0 0 0 .4-.4V3.4Z" />
              <path fill="#1DB954" d="M14.4 3.4h-3a.4.4 0 0 0-.4.4v7.2a.4.4 0 0 0 .4.4h3a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4h-.4a2.8 2.8 0 0 1-2.8-2.8h2.2a2.8 2.8 0 0 1 2.8 2.8v2a2.8 2.8 0 0 0-2.8-2.8v-.6Z" />
            </svg>
            <p>Your Collection</p>
            <svg viewBox="0 0 16 16" width="12" height="12" className="hidden-mobile">
              <path fill="#535353" d="M2 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H2.4a.4.4 0 0 0-.4.4v2Z" />
              <path fill="white" d="M6 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4v-4.4a.4.4 0 0 0-.4-.4H6.4a.4.4 0 0 0-.4.4V8Z" />
              <path fill="#535353" d="M10 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H10.4a.4.4 0 0 0-.4.4v2Z" />
              <path fill="white" d="M10.4 6a.4.4 0 0 0 .4-.4H12a.4.4 0 0 0 .4.4v4a.4.4 0 0 0-.4.4h-1.2a.4.4 0 0 0-.4-.4v-4Z" />
            </svg>
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="#535353" d="M2 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H2.4a.4.4 0 0 0-.4.4v2Z" />
              <path fill="white" d="M6 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4v-4.4a.4.4 0 0 0-.4-.4H6.4a.4.4 0 0 0-.4.4V8Z" />
              <path fill="#535353" d="M10 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H10.4a.4.4 0 0 0-.4.4v2Z" />
              <path fill="white" d="M10.4 6a.4.4 0 0 0 .4-.4H12a.4.4 0 0 0 .4.4v4a.4.4 0 0 0-.4.4h-1.2a.4.4 0 0 0-.4-.4v-4Z" />
            </svg>
            <p>Local Files</p>
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="#535353" d="M2 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H2.4a.4.4 0 0 0-.4.4v2Z" />
              <path fill="white" d="M6 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4v-4.4a.4.4 0 0 0-.4-.4H6.4a.4.4 0 0 0-.4.4V8Z" />
              <path fill="#535353" d="M10 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H10.4a.4.4 0 0 0-.4.4v2Z" />
              <path fill="white" d="M10.4 6a.4.4 0 0 0 .4-.4H12a.4.4 0 0 0 .4.4v4a.4.4 0 0 0-.4.4h-1.2a.4.4 0 0 0-.4-.4v-4Z" />
            </svg>
          </button>

          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M2.6 13.2H3a2.6 2.6 0 0 0 2.6-2.6V3h2v7.6a2.6 2.6 0 0 0 2.6 2.6h2a2.6 2.6 0 0 0 2.6-2.6V2.4h-14v.6Zm2.8 5.8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path fill="#535353" d="M2.6 13.2h2a2 2 0 0 0 2-2V5.2a2 2 0 0 0-2-2H4.6a2 2 0 0 0 2 2v6Zm2.8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path fill="white" d="M14.4 2.4h-2v5.2a4.8 4.8 0 0 1-4.8 4.8H4.2v.8h4a2.6 2.6 0 0 0 2.6-2.6h3.8v-.2a2.6 2.6 0 0 0-2.6-2.6H12Z" />
            </svg>
            <p>Collections</p>
          </button>

          <button
            className="nav-item sidebar__item"
            onClick={() => handleSelect('downloads')}
          >
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M14 12H1V2h2v2h10V2h2v10z" />
              <path fill="#535353" d="M9 1.2a.4.4 0 0 0-.4-.4H6a.4.4 0 0 0-.4.4v2.8L3.6 8 5.2 9.6 10 5.2l1.6 1.6L9 11.2V5.2Z" />
              <path fill="#1DB954" d="M7.6 9.6h1.2a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H7.6a2.6 2.6 0 0 0-2.6 2.6v3.2a2.6 2.6 0 0 0 2.6 2.6h1.2a.4.4 0 0 0 .4-.4v-3.2a.4.4 0 0 0-.4-.4H7.6Z" />
            </svg>
            <p>Downloads</p>
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="#535353" d="M3.2 9.2h9.6a.4.4 0 0 0 .4-.4V8a.4.4 0 0 0-.4-.4H3.2a.4.4 0 0 0-.4.4v.8a.4.4 0 0 0 .4.4Z" />
              <path fill="white" d="M1.2 8a.4.4 0 0 0 .4.4h12.8a.4.4 0 0 0 .4-.4V6.4a.4.4 0 0 0-.4-.4H1.6a.4.4 0 0 0-.4.4v1.6Z" />
              <path fill="#535353" d="M4.8 8a.4.4 0 0 0 .4.4h6.4a.4.4 0 0 0 .4-.4V6.4a.4.4 0 0 0-.4-.4H5.2a.4.4 0 0 0-.4.4v1.6Z" />
              <path fill="white" d="M8.4 8a.4.4 0 0 0 .4.4h6.4a.4.4 0 0 0 .4-.4V6.4a.4.4 0 0 0-.4-.4H8.8a.4.4 0 0 0-.4.4v1.6Z" />
            </svg>
          </button>
        </div>

        {/* Library section */}
        <button
          className="nav-item sidebar__item library-list-trigger"
          onClick={handleToggleLibraryItems}
        >
          <div className="content">
            <Library />
            <div className="header">
              <span className="title">Your Library</span>
              <span className="badge">+ Create</span>
            </div>
            <div className="row">
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M8.6 6.8a.4.4 0 0 0-.8 0v3.8a4.8 4.8 0 0 1-4.8 4.8H1.8a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a4.8 4.8 0 0 1 4.8 4.8h3.2a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H9.4a4.8 4.8 0 0 1-4.8-4.8V6.8Zm2.2 2.2V9.4a3 3 0 0 0-6 0v1.6Z" />
              </svg>
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M14.4 3.4h-3a.4.4 0 0 0-.4.4v7.2a.4.4 0 0 0 .4.4h3a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4h-.4a2.8 2.8 0 0 1-2.8-2.8h2.2a2.8 2.8 0 0 1 2.8 2.8v2a2.8 2.8 0 0 0-2.8-2.8v-.6Z" />
                <path fill="#535353" d="M6 13.8a4.8 4.8 0 0 1-4.8-4.8V4.2H4.6v4.8a2 2 0 0 0 2 2h2.8v6Zm7.4-5.6a.4.4 0 0 0-.4.4v4a4.8 4.8 0 0 1-4.8 4.8H2.2a2 2 0 0 1-2-2v-6.8h6.2a4.8 4.8 0 0 1 4.8 4.8v2Z" />
              </svg>
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M8.6 6.8a.4.4 0 0 0-.8 0v3.8a4.8 4.8 0 0 1-4.8 4.8H1.8a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a4.8 4.8 0 0 1 4.8 4.8h3.2a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H9.4a4.8 4.8 0 0 1-4.8-4.8V6.8Zm2.2 2.2V9.4a3 3 0 0 0-6 0v1.6Z" />
              </svg>
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M14.4 3.4h-3a.4.4 0 0 0-.4.4v7.2a.4.4 0 0 0 .4.4h3a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4h-.4a2.8 2.8 0 0 1-2.8-2.8h2.2a2.8 2.8 0 0 1 2.8 2.8v2a2.8 2.8 0 0 0-2.8-2.8v-.6Z" />
                <path fill="#535353" d="M6 13.8a4.8 4.8 0 0 1-4.8-4.8V4.2H4.6v4.8a2 2 0 0 0 2 2h2.8v6Zm7.4-5.6a.4.4 0 0 0-.4.4v4a4.8 4.8 0 0 1-4.8 4.8H2.2a2 2 0 0 1-2-2v-6.8h6.2a4.8 4.8 0 0 1 4.8 4.8v2Z" />
              </svg>
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M8.6 6.8a.4.4 0 0 0-.8 0v3.8a4.8 4.8 0 0 1-4.8 4.8H1.8a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a4.8 4.8 0 0 1 4.8 4.8h3.2a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H9.4a4.8 4.8 0 0 1-4.8-4.8V6.8Zm2.2 2.2V9.4a3 3 0 0 0-6 0v1.6Z" />
              </svg>
            </svg>
          </div>
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
          </svg>
        </button>

        {/* Library items list */}
        {showLibraryItems && (
          <ul className="library-list">
            <li className="library-item" onClick={() => handleSelect('liked-songs')}>
              <Heart />
              <p>Liked Songs</p>
            </li>
            {libraryItems.map((item, index) => (
              <li
                key={index}
                className="library-item"
                onClick={() => handleSelect(item)}
              >
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="#1DB954" d="M8 1.2a6.4 6.4 0 0 0-6.4 6.4c0 1.7.7 3.2 1.8 4.3L0 16l6.4-2.8 6.4 2.8L14.4 8a6.4 6.4 0 0 0-6.4-6.8z" />
                </svg>
                <p>Pop Mix 2024</p>
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path fill="#535353" d="M2 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H2.4a.4.4 0 0 0-.4.4v2Z" />
                  <path fill="white" d="M6 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4v-4.4a.4.4 0 0 0-.4-.4H6.4a.4.4 0 0 0-.4.4V8Z" />
                  <path fill="#535353" d="M10 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H10.4a.4.4 0 0 0-.4.4v2Z" />
                  <path fill="white" d="M10.4 6a.4.4 0 0 0 .4-.4H12a.4.4 0 0 0 .4.4v4a.4.4 0 0 0-.4.4h-1.2a.4.4 0 0 0-.4-.4v-4Z" />
                </svg>
              </li>
            ))}
            <li
              className="library-item"
              onClick={() => handleSelect('recently-played')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M14.4 3.4h-3a.4.4 0 0 0-.4.4v7.2a.4.4 0 0 0 .4.4h3a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4h-.4a2.8 2.8 0 0 1-2.8-2.8h2.2a2.8 2.8 0 0 1 2.8 2.8v2a2.8 2.8 0 0 0-2.8-2.8v-.6Z" />
              </svg>
              <p>Recently Played</p>
            </li>
            <li
              className="library-item"
              onClick={() => handleSelect('playlists')}
            >
              <svg viewBox="0 0 16 16" width="16" height="16">
                <path fill="#1DB954" d="M8.6 6.8a.4.4 0 0 0-.8 0v3.8a4.8 4.8 0 0 1-4.8 4.8H1.8a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a4.8 4.8 0 0 1 4.8 4.8h3.2a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H9.4a4.8 4.8 0 0 1-4.8-4.8V6.8Zm2.2 2.2V9.4a3 3 0 0 0-6 0v1.6Z" />
              </svg>
              <p>Weekly Wrap</p>
            </li>
          </ul>
        )}

        {/* Playlists */}
        {showLibraryItems && (
          <div className="playlists">
            <div className="playlists__list-container">
              <div className="playlists__list-header">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="white" d="M2 2h6v6h6V2H12a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a4 4 0 0 1 4-4Zm2 4h2V6H4v4Zm4 4H8v2h2Zm4-8H10v6h2Z" />
                </svg>
                <h3 className="playlists__title">Playlists</h3>
                <div className="playlists__list-options">
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M13.4 6.8a.4.4 0 0 0-.4-.4H10a.4.4 0 0 0-.4.4v4.4a.4.4 0 0 0 .4.4h3a.4.4 0 0 0 .4-.4v-3.8ZM1.2 8a.4.4 0 0 0 .4.4h2a.4.4 0 0 0 .4-.4V6.4a.4.4 0 0 0-.4-.4H1.6a.4.4 0 0 0-.4.4v1.6Zm4.4-4.8h2a.4.4 0 0 0 .4-.4V1a.4.4 0 0 0-.4-.4H5.6a.4.4 0 0 0-.4.4v1.8Z" />
                  </svg>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M10.6 11.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v2a4.8 4.8 0 0 0 4.8 4.8h1.6a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4h-1.6ZM2.6 1.2a.4.4 0 0 0-.4.4v2a4.8 4.8 0 0 1 4.8 4.8h1.6a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H7.4Zm0 2.2V5.4a3 3 0 0 1 6 0v3.8Z" />
                  </svg>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M14 12H1V2h2v2h10V2h2v10z" />
                    <path fill="#535353" d="M9 1.2a.4.4 0 0 0-.4-.4H6a.4.4 0 0 0-.4.4v2.8L3.6 8 5.2 9.6 10 5.2l1.6 1.6L9 11.2V5.2Z" />
                  </svg>
                </div>
              </div>

              {/* Recent play */}
              <div className="playlists__recent-play">
                <div className="playlists__recent-play-content">
                  <div className="playlists__recent-play-text">
                    <p>Recently played</p>
                    <button className="playlists__recent-play-button">
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#1DB954" d="M8 1.2a.4.4 0 0 0-.4-.4H4.8a.4.4 0 0 0-.4.4v7.2a.4.4 0 0 0 .4.4H8a2.8 2.8 0 0 1 2.8 2.8h-1.6a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a2.8 2.8 0 0 0 2.8-2.8v-7.2a2.8 2.8 0 0 0-2.8-2.8H8ZM6.8 9.8V5.2a1.2 1.2 0 0 1 2.4 0v4.6a1.2 1.2 0 0 1-2.4 0Z" />
                      </svg>
                      <span className="playlists__recent-play-button-text">Play from here</span>
                    </button>
                  </div>
                  <div className="playlists__recent-play-images">
                    <div className="playlists__recent-play-cover">
                      <div className="playlists__recent-play-art">
                        <img
                          src="/images/playlists/cover_1.jpg"
                          alt="Playlist Cover 1"
                          width="75"
                          height="75"
                          className="playlists__recent-play-art-img"
                        />
                        <div className="playlists__recent-play-art-overlay"></div>
                      </div>
                      <div className="playlists__recent-play-title">Liked Songs</div>
                    </div>
                    <div className="playlists__recent-play-cover">
                      <div className="playlists__recent-play-art">
                        <img
                          src="/images/playlists/cover_2.jpg"
                          alt="Playlist Cover 2"
                          width="75"
                          height="75"
                          className="playlists__recent-play-art-img"
                        />
                        <div className="playlists__recent-play-art-overlay"></div>
                      </div>
                      <div className="playlists__recent-play-title">Chill Hits</div>
                    </div>
                  </div>
                </div>
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                </svg>
              </div>

              {/* Playlists grid */}
              <div className="playlists__grid">
                <div className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_1.jpg"
                            alt="Playlist 1"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Rock Classics</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_2.jpg"
                            alt="Playlist 2"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Top Hits 2024</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_3.jpg"
                            alt="Playlist 3"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Viva Latino</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_4.jpg"
                            alt="Playlist 4"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Mood Booster</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_5.jpg"
                            alt="Playlist 5"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Hot Hits Brasil</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_6.jpg"
                            alt="Playlist 6"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Discover Weekly</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_7.jpg"
                            alt="Playlist 7"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Pop Mix 2024</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/playlists_8.jpg"
                            alt="Playlist 8"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">Indie Mix</span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="playlists__divider" />

            {/* Collections */}
            <div className="playlists__list-container">
              <div className="playlists__list-header playlists__collection-header">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="white" d="M1.6 7.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5c.8 0 1.5-.7 1.5-1.5-.1-1.1-1-2-2-2zm1.9-4.4c-.3-.6-.9-.9-1.6-.9a1.8 1.8 0 0 0-1.8 1.8c0 1 .7 1.7 1.6 1.8v2a.5.5 0 0 0 .5.5h2c.6 0 1-.4 1-1V3.1a.5.5 0 0 0-.5-.5h-1.2z"/>
                  <path fill="#fff" d="M14.1.5a2.1 2.1 0 0 0-1.6-.5h-2a.5.5 0 0 0-.5.5v3.2c0 2.5 2 4.5 4.5 4.5h.6c1.7 0 3-1.3 3-3 0-.6-.1-1.1-.4-1.6.9-1 1.4-2.3 1.4-3.8a2.1 2.1 0 0 0-.5-1.5z"/>
                </svg>
                <h3 className="playlists__title">Collections</h3>
                <div className="playlists__list-options">
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M10.6 6.8a.4.4 0 0 0-.4-.4H3a.4.4 0 0 0-.4.4v4.4a.4.4 0 0 0 .4.4h7.6a.4.4 0 0 0 .4-.4v-3.8Z"/>
                  </svg>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M2 6.8h10a.4.4 0 0 1 .4.4v4.4a.4.4 0 0 1-.4.4H2a.4.4 0 0 1-.4-.4V7.2a.4.4 0 0 1 .4-.4Z"/>
                  </svg>
                </div>
              </div>

              <ul className="playlists__grid-list">
                <li className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/collection_1.jpg"
                            alt="Collection 1"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">
                              <div className="playlists__grid-item-title-content">
                                <span className="playlists__grid-item-title-title">
                                  <span className="playlists__grid-item-title-title-text">Workout Mix</span>
                                </span>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/collection_2.jpg"
                            alt="Collection 2"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">
                              <div className="playlists__grid-item-title-content">
                                <span className="playlists__grid-item-title-title">
                                  <span className="playlists__grid-item-title-text">Driving Music</span>
                                </span>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </li>
                <li className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/collection_3.jpg"
                            alt="Collection 3"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">
                              <div className="playlists__grid-item-title-content">
                                <span className="playlists__grid-item-title-title">
                                  <span className="playlists__grid-item-title-text">Coding Vibes</span>
                                </span>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/collection_4.jpg"
                            alt="Collection 4"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">
                              <div className="playlists__grid-item-title-content">
                                <span className="playlists__grid-item-title-title">
                                  <span className="playlists__grid-item-title-text">Sleep Meditation</span>
                                </span>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </li>
                <li className="playlists__grid-item">
                  <div className="playlists__grid-item-content">
                    <div className="playlists__grid-item-art">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/collection_5.jpg"
                            alt="Collection 5"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">
                              <div className="playlists__grid-item-title-content">
                                <span className="playlists__grid-item-title-title">
                                  <span className="playlists__grid-item-title-text">Podcast Favorites</span>
                                </span>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="playlists__grid-item-content secondary">
                    <div className="playlists__grid-item-art secondary">
                      <div className="playlists__grid-item-title">
                        <div className="playlists__grid-item-title-text">
                          <img
                            src="/images/playlists/collection_6.jpg"
                            alt="Collection 6"
                            width="80"
                            height="80"
                            className="playlists__grid-item-art-img"
                          />
                          <div className="playlists__grid-item-title-overlay"></div>
                        </div>
                        <div className="playlists__grid-item-title-text">
                          <div className="playlists__grid-item-title-inner">
                            <span className="playlists__grid-item-title-title">
                              <div className="playlists__grid-item-title-content">
                                <span className="playlists__grid-item-title-title">
                                  <span className="playlists__grid-item-title-text">Classical Essentials</span>
                                </span>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="playlists__grid-item-description">
                        <ul className="playlists__grid-item-desc-list">
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                          <li>•</li>
                        </ul>
                      </div>
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                      </svg>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Divider */}
            <hr className="playlists__divider playlists__collection-divider" />

            {/* Recently Played */}
            <div className="playlists__list-container playlists__recent-playlist-container">
              <div className="playlists__list-header playlists__recent-playlist-header">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="white" d="M2 2h6v6h6V2H12a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a4 4 0 0 1 4-4Zm2 4h2V6H4v4Zm4 4H8v2h2Zm4-8H10v6h2Z" />
                </svg>
                <h3 className="playlists__title">Recently Played</h3>
                <div className="playlists__list-options">
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M13.4 6.8a.4.4 0 0 0-.4-.4H10a.4.4 0 0 0-.4.4v4.4a.4.4 0 0 0 .4.4h3a.4.4 0 0 0 .4-.4v-3.8ZM1.2 8a.4.4 0 0 0 .4.4h2a.4.4 0 0 0 .4-.4V6.4a.4.4 0 0 0-.4-.4H1.6a.4.4 0 0 0-.4.4v1.6Z"/>
                  </svg>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M10.6 11.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v2a4.8 4.8 0 0 0 4.8 4.8h1.6a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4h-1.6ZM2.6 1.2a.4.4 0 0 0-.4.4v2a4.8 4.8 0 0 1 4.8 4.8h1.6a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H7.4Z"/>
                  </svg>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M14 12H1V2h2v2h10V2h2v10z" />
                    <path fill="#535353" d="M9 1.2a.4.4 0 0 0-.4-.4H6a.4.4 0 0 0-.4.4v2.8L3.6 8 5.2 9.6 10 5.2l1.6 1.6L9 11.2V5.2Z" />
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play">
                <div className="playlists__recent-play-content">
                  <div className="playlists__recent-play-text">
                    <p>All-time top songs in 2024</p>
                    <button className="playlists__recent-play-button">
                      <svg viewBox="0 0 16 16" width="16" height="16">
                        <path fill="#1DB954" d="M8 1.2a.4.4 0 0 0-.4-.4H4.8a.4.4 0 0 0-.4.4v7.2a.4.4 0 0 0 .4.4H8a2.8 2.8 0 0 1 2.8 2.8h-1.6a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4h2a2.8 2.8 0 0 0 2.8-2.8v-7.2a2.8 2.8 0 0 0-2.8-2.8H8ZM6.8 9.8V5.2a1.2 1.2 0 0 1 2.4 0v4.6a1.2 1.2 0 0 1-2.4 0Z" />
                      </svg>
                      <span className="playlists__recent-play-button-text">Play from here</span>
                    </button>
                  </div>
                  <div className="playlists__recent-play-images">
                    <div className="playlists__recent-play-cover">
                      <div className="playlists__recent-play-art">
                        <img
                          src="/images/playlists/alltime1.jpg"
                          alt="All-time Top Song 1"
                          width="75"
                          height="75"
                          className="playlists__recent-play-art-img"
                        />
                        <div className="playlists__recent-play-art-overlay"></div>
                      </div>
                      <div className="playlists__recent-play-title">All-time Top Songs 2024</div>
                    </div>
                    <div className="playlists__recent-play-cover">
                      <div className="playlists__recent-play-art">
                        <img
                          src="/images/playlists/alltime2.jpg"
                          alt="All-time Top Song 2"
                          width="75"
                          height="75"
                          className="playlists__recent-play-art-img"
                        />
                        <div className="playlists__recent-play-art-overlay"></div>
                      </div>
                      <div className="playlists__recent-play-title">Top Hits from 2023</div>
                    </div>
                  </div>
                </div>
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                </svg>
              </div>

              <div className="playlists__recent-play-playlists">
                <div className="playlists__recent-play-playlist">
                  <div className="playlists__recent-play-playlist-image">
                    <img
                      src="/images/playlists/alltime3.jpg"
                      alt="All-time Top Song 3"
                      width="80"
                      height="80"
                      className="playlists__recent-play-playlist-image-img"
                    />
                  </div>
                  <div className="playlists__recent-play-playlist-info">
                    <div className="playlists__recent-play-playlist-title">
                      <h4>
                        <span className="playlists__recent-play-playlist-title-text">
                          <span className="playlists__recent-play-playlist-title-text-inner">
                            <span className="playlists__recent-play-playlist-title-content">
                              <span className="playlists__recent-play-playlist-title-title">
                                <span className="playlists__recent-play-playlist-title-subtitle">Liked Songs</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">2,543 songs</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
                <div className="playlists__recent-play-playlist">
                  <div className="playlists__recent-play-playlist-image">
                    <img
                      src="/images/playlists/alltime4.jpg"
                      alt="All-time Top Song 4"
                      width="80"
                      height="80"
                      className="playlists__recent-play-playlist-image-img"
                    />
                  </div>
                  <div className="playlists__recent-play-playlist-info">
                    <div className="playlists__recent-play-playlist-title">
                      <h4>
                        <span className="playlists__recent-play-playlist-title-text">
                          <span className="playlists__recent-play-playlist-title-text-inner">
                            <span className="playlists__recent-play-playlist-title-content">
                              <span className="playlists__recent-play-playlist-title-title">
                                <span className="playlists__recent-play-playlist-title-subtitle">Chill Vibes</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">1,234 songs</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
                <div className="playlists__recent-play-playlist">
                  <div className="playlists__recent-play-playlist-image">
                    <img
                      src="/images/playlists/alltime5.jpg"
                      alt="All-time Top Song 5"
                      width="80"
                      height="80"
                      className="playlists__recent-play-playlist-image-img"
                    />
                  </div>
                  <div className="playlists__recent-play-playlist-info">
                    <div className="playlists__recent-play-playlist-title">
                      <h4>
                        <span className="playlists__recent-play-playlist-title-text">
                          <span className="playlists__recent-play-playlist-title-text-inner">
                            <span className="playlists__recent-play-playlist-title-content">
                              <span className="playlists__recent-play-playlist-title-title">
                                <span className="playlists__recent-play-playlist-title-subtitle">Daily Mix 1</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Song mix based on your favorites</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
                <div className="playlists__recent-play-playlist">
                  <div className="playlists__recent-play-playlist-image">
                    <img
                      src="/images/playlists/alltime6.jpg"
                      alt="All-time Top Song 6"
                      width="80"
                      height="80"
                      className="playlists__recent-play-playlist-image-img"
                    />
                  </div>
                  <div className="playlists__recent-play-playlist-info">
                    <div className="playlists__recent-play-playlist-title">
                      <h4>
                        <span className="playlists__recent-play-playlist-title-text">
                          <span className="playlists__recent-play-playlist-title-text-inner">
                            <span className="playlists__recent-play-playlist-title-content">
                              <span className="playlists__recent-play-playlist-title-title">
                                <span className="playlists__recent-play-playlist-title-subtitle">On Repeat</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Songs you're playing now</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
                <div className="playlists__recent-play-playlist">
                  <div className="playlists__recent-play-playlist-image">
                    <img
                      src="/images/playlists/alltime7.jpg"
                      alt="All-time Top Song 7"
                      width="80"
                      height="80"
                      className="playlists__recent-play-playlist-image-img"
                    />
                  </div>
                  <div className="playlists__recent-play-playlist-info">
                    <div className="playlists__recent-play-playlist-title">
                      <h4>
                        <span className="playlists__recent-play-playlist-title-text">
                          <span className="playlists__recent-play-playlist-title-text-inner">
                            <span className="playlists__recent-play-playlist-title-content">
                              <span className="playlists__recent-play-playlist-title-title">
                                <span className="playlists__recent-play-playlist-title-subtitle">Rock Classics</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Essential rock hits</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
                <div className="playlists__recent-play-playlist">
                  <div className="playlists__recent-play-playlist-image">
                    <img
                      src="/images/playlists/alltime8.jpg"
                      alt="All-time Top Song 8"
                      width="80"
                      height="80"
                      className="playlists__recent-play-playlist-image-img"
                    />
                  </div>
                  <div className="playlists__recent-play-playlist-info">
                    <div className="playlists__recent-play-playlist-title">
                      <h4>
                        <span className="playlists__recent-play-playlist-title-text">
                          <span className="playlists__recent-play-playlist-title-text-inner">
                            <span className="playlists__recent-play-playlist-title-content">
                              <span className="playlists__recent-play-playlist-title-title">
                                <span className="playlists__recent-play-playlist-title-subtitle">Top 50 - Global</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Your weekly mixtape</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="playlists__divider playlists__made-for-you-divider" />

            {/* Made for you */}
            <div className="playlists__list-container playlists__made-for-you-container">
              <div className="playlists__list-header playlists__made-for-you-header">
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path fill="white" d="M1.6 7.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5c.8 0 1.5-.7 1.5-1.5-.1-1.1-1-2-2-2zm1.9-4.4c-.3-.6-.9-.9-1.6-.9a1.8 1.8 0 0 0-1.8 1.8c0 1 .7 1.7 1.6 1.8v2a.5.5 0 0 0 .5.5h2c.6 0 1-.4 1-1V3.1a.5.5 0 0 0-.5-.5h-1.2z"/>
                  <path fill="#fff" d="M14.1.5a2.1 2.1 0 0 0-1.6-.5h-2a.5.5 0 0 0-.5.5v3.2c0 2.5 2 4.5 4.5 4.5h.6c1.7 0 3-1.3 3-3 0-.6-.1-1.1-.4-1.6.9-1 1.4-2.3 1.4-3.8a2.1 2.1 0 0 0-.5-1.5z"/>
                </svg>
                <h3 className="playlists__title">Made for you</h3>
                <div className="playlists__list-options">
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M10.6 6.8a.4.4 0 0 0-.4-.4H3a.4.4 0 0 0-.4.4v4.4a.4.4 0 0 0 .4.4h7.6a.4.4 0 0 0 .4-.4v-3.8Z"/>
                  </svg>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="white" d="M2 6.8h10a.4.4 0 0 1 .4.4v4.4a.4.4 0 0 1-.4.4H2a.4.4 0 0 1-.4-.4V7.2a.4.4 0 0 1 .4-.4Z"/>
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play-playlist playlists__made-for-you-playlist">
                <div className="playlists__recent-play-playlist-image">
                  <img
                    src="/images/playlists/made1.jpg"
                    alt="Made for you 1"
                    width="80"
                    height="80"
                    className="playlists__recent-play-playlist-image-img"
                  />
                </div>
                <div className="playlists__recent-play-playlist-info">
                  <div className="playlists__recent-play-playlist-title">
                    <h4>
                      <span className="playlists__recent-play-playlist-title-text">
                        <span className="playlists__recent-play-playlist-title-text-inner">
                          <span className="playlists__recent-play-playlist-title-content">
                            <span className="playlists__recent-play-playlist-title-title">
                              <span className="playlists__recent-play-playlist-title-subtitle">
                                <span className="playlists__made-for-you-playlist-title-text">Discover Weekly</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Your weekly mixtape</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play-playlist playlists__made-for-you-playlist">
                <div className="playlists__recent-play-playlist-image">
                  <img
                    src="/images/playlists/made2.jpg"
                    alt="Made for you 2"
                    width="80"
                    height="80"
                    className="playlists__recent-play-playlist-image-img"
                  />
                </div>
                <div className="playlists__recent-play-playlist-info">
                  <div className="playlists__recent-play-playlist-title">
                    <h4>
                      <span className="playlists__recent-play-playlist-title-text">
                        <span className="playlists__recent-play-playlist-title-text-inner">
                          <span className="playlists__recent-play-playlist-title-content">
                            <span className="playlists__recent-play-playlist-title-title">
                              <span className="playlists__recent-play-playlist-title-subtitle">
                                <span className="playlists__made-for-you-playlist-title-text">Release Radar</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">New music from artists you follow</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play-playlist playlists__made-for-you-playlist">
                <div className="playlists__recent-play-playlist-image">
                  <img
                    src="/images/playlists/made3.jpg"
                    alt="Made for you 3"
                    width="80"
                    height="80"
                    className="playlists__recent-play-playlist-image-img"
                  />
                </div>
                <div className="playlists__recent-play-playlist-info">
                  <div className="playlists__recent-play-playlist-title">
                    <h4>
                      <span className="playlists__recent-play-playlist-title-text">
                        <span className="playlists__recent-play-playlist-title-text-inner">
                          <span className="playlists__recent-play-playlist-title-content">
                            <span className="playlists__recent-play-playlist-title-title">
                              <span className="playlists__recent-play-playlist-title-subtitle">
                                <span className="playlists__made-for-you-playlist-title-text">On Repeat</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Songs you're playing now</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play-playlist playlists__made-for-you-playlist">
                <div className="playlists__recent-play-playlist-image">
                  <img
                    src="/images/playlists/made4.jpg"
                    alt="Made for you 4"
                    width="80"
                    height="80"
                    className="playlists__recent-play-playlist-image-img"
                  />
                </div>
                <div className="playlists__recent-play-playlist-info">
                  <div className="playlists__recent-play-playlist-title">
                    <h4>
                      <span className="playlists__recent-play-playlist-title-text">
                        <span className="playlists__recent-play-playlist-title-text-inner">
                          <span className="playlists__recent-play-playlist-title-content">
                            <span className="playlists__recent-play-playlist-title-title">
                              <span className="playlists__recent-play-playlist-title-subtitle">
                                <span className="playlists__made-for-you-playlist-title-text">Daily Mix 1</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Based on your favorites</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play-playlist playlists__made-for-you-playlist">
                <div className="playlists__recent-play-playlist-image">
                  <img
                    src="/images/playlists/made5.jpg"
                    alt="Made for you 5"
                    width="80"
                    height="80"
                    className="playlists__recent-play-playlist-image-img"
                  />
                </div>
                <div className="playlists__recent-play-playlist-info">
                  <div className="playlists__recent-play-playlist-title">
                    <h4>
                      <span className="playlists__recent-play-playlist-title-text">
                        <span className="playlists__recent-play-playlist-title-text-inner">
                          <span className="playlists__recent-play-playlist-title-content">
                            <span className="playlists__recent-play-playlist-title-title">
                              <span className="playlists__recent-play-playlist-title-subtitle">
                                <span className="playlists__made-for-you-playlist-title-text">Daily Mix 2</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Based on your favorites</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>

              <div className="playlists__recent-play-playlist playlists__made-for-you-playlist">
                <div className="playlists__recent-play-playlist-image">
                  <img
                    src="/images/playlists/made6.jpg"
                    alt="Made for you 6"
                    width="80"
                    height="80"
                    className="playlists__recent-play-playlist-image-img"
                  />
                </div>
                <div className="playlists__recent-play-playlist-info">
                  <div className="playlists__recent-play-playlist-title">
                    <h4>
                      <span className="playlists__recent-play-playlist-title-text">
                        <span className="playlists__recent-play-playlist-title-text-inner">
                          <span className="playlists__recent-play-playlist-title-content">
                            <span className="playlists__recent-play-playlist-title-title">
                              <span className="playlists__recent-play-playlist-title-subtitle">
                                <span className="playlists__made-for-you-playlist-title-text">Daily Mix 3</span>
                              </span>
                            </span>
                          </span>
                        </h4>
                      </h4>
                    </div>
                    <div className="playlists__recent-play-playlist-description">
                      <div className="playlists__recent-play-playlist-desc">
                        <p>
                          <span className="playlists__recent-play-playlist-desc-text">Based on your favorites</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 16 16" width="16" height="16">
                    <path fill="#535353" d="M8 1.2a.4.4 0 0 0-.4-.4h-1.2a.4.4 0 0 0-.4.4v12.8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V1.2Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom nav items */}
        <div className="nav-bottom">
          <button className="nav-item sidebar__item active">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M2 6h2v8H2V6zm2.2 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-2h2v8h-2V6zm-1.9 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            </svg>
            <p class="hidden-mobile">Account</p>
          </button>
          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M8.7 1.6a.7.7 0 0 0-.4-.2H3.4a.7.7 0 0 0-.6.6v12.8a.7.7 0 0 0 .6.6h5a.7.7 0 0 0 .4-.2l4.6 1-1.5-11.8a.7.7 0 0 0-.5-.8z" />
            </svg>
            <p class="hidden-mobile">Premium</p>
          </button>
          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M12.6 3.4H12a2.6 2.6 0 0 1 2.6 2.6v2a2.6 2.6 0 0 1-2.6 2.6h-1.2a.4.4 0 0 0-.4.4v2.6a.4.4 0 0 0 .4.4h1.2a2.6 2.6 0 0 0 2.6-2.6v-2a2.6 2.6 0 0 0-2.6-2.6h-1.2a.4.4 0 0 0-.4.4v2.6a.4.4 0 0 0 .4.4h.4ZM8 8.2a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H5.6a.4.4 0 0 0-.4.4v2.8a.4.4 0 0 0 .4.4H8Z" />
            </svg>
            <p class="hidden-mobile">Licensing</p>
          </button>
          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M7.8 1.2a2.6 2.6 0 0 1 2.6 2.6V11H8a.4.4 0 0 1-.4-.4V8a.4.4 0 0 0-.4-.4H4.6a.4.4 0 0 0-.4.4v2.6a.4.4 0 0 0 .4.4h1.2v5.6a.4.4 0 0 1-.4.4H3.4a.4.4 0 0 1-.4-.4V6.6a2.6 2.6 0 0 1 2.6-2.6h2a2.6 2.6 0 0 1 2.6-2.6h2zM7.8 6.8a.4.4 0 0 0 .4.4v1.2a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4V7.2a.4.4 0 0 0-.4-.4H8.2a.4.4 0 0 0-.4-.4h-2a.4.4 0 0 0-.4.4V8a.4.4 0 0 0 .4.4z" />
            </svg>
            <p class="hidden-mobile">Support</p>
          </button>
          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M8 4.4a.4.4 0 0 0-.4.4v4a.4.4 0 0 0 .4.4h2a.4.4 0 0 0 .4-.4v-4a.4.4 0 0 0-.4-.4H8z" />
              <path fill="#535353" d="M8 4.4a.4.4 0 0 0-.4.4v2a.4.4 0 0 0 .4.4H9.4a.4.4 0 0 0 .4-.4v-2a.4.4 0 0 0-.4-.4H8z" />
              <path fill="white" d="M6 8a.4.4 0 0 0 .4.4h1.2a.4.4 0 0 0 .4-.4v-4a.4.4 0 0 0-.4-.4H6.4a.4.4 0 0 0-.4.4v4Z" />
              <path fill="#535353" d="M6 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4v-4a.4.4 0 0 0-.4-.4H6.4a.4.4 0 0 0-.4.4v4Z" />
              <path fill="white" d="M10 8a.4.4 0 0 0 .4.4h4a.4.4 0 0 0 .4-.4V6a.4.4 0 0 0-.4-.4H10.4a.4.4 0 0 0-.4.4v2Z" />
            </svg>
            <p class="hidden-mobile">Devices</p>
          </button>
          <button className="nav-item sidebar__item">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path fill="white" d="M1 14V1h2v12H1zm3.8 0V1h2v13H4.8zm3.7 0v-6.2h2v6.2h-2z" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
```
