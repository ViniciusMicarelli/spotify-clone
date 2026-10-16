import { useState } from "react";
import "./Library.css";

function Library({ tracks, onPlayTrack, onRemove, onAddToPlaylist }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredTracks = tracks.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.album.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = ["Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "Classical", "Indie", "Country", "Reggaeton", "Latin"];

    const filteredByCategory = (category) =>
        tracks.filter(track => track.category === category);

    const totalTracks = tracks.length;

    const [selectedTrack, setSelectedTrack] = useState(null);

    return (
        <div className="library">
            <div className="library-header">
                <h2>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path
                            fill="currentColor"
                            d="M12 3c.33 0 .64.03.94.09 1.46.28 2.58 1.4 2.86 2.86.06.3.09.61.09.94 0 1.5-1.1 2.82-2.6 3.35V12c0 2.21 1.79 4 4 4v3c-2.35 0-4.23-1.7-4.66-3.92-.04-.33-.06-.67-.06-1 0-.33.02-.67.06-1 .43-2.22 2.31-3.92 4.66-3.92V9.35C16.31 8.82 17.4 7.5 17.4 6c0-.33-.03-.64-.09-.94-.28-1.46-1.4-2.58-2.86-2.86-.3-.06-.61-.09-.94-.09 0 0 0 0 0 0zm-8 18l-2 2h2v-2h-2zm12-2h2v2h-2v-2zM6 18v2l2 2v-2l-2-2zm0-3v2l-2 2V15l2-2zm0-3v2l2 2V12l-2-2zm12-3v2l-2 2V9l2-2zm0 3v2l2 2V12l-2-2z"
                        />
                    </svg>
                    Library
                    {totalTracks > 0 && (
                        <div className="lib-play">
                            <svg viewBox="0 0 24 24" width="24" height="24" className="play-button">
                                <path
                                    fill="currentColor"
                                    d="M8 5v14l11-7z"
                                />
                            </svg>
                        </div>
                    )}
                </h2>
            </div>
        </div>
    );
}

export default Library;
