import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { Albums } from './components/Albums';
import { Songs } from './components/Songs';
import { Playlist } from './components/Playlist';

export function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<Albums />} />
          <Route path="/albums/:id" element={<Playlist />} />
          <Route path="/songs/:id" element={<Songs />} />
        </Routes>
        <Player />
      </div>
    </div>
  );
}

export default App;
