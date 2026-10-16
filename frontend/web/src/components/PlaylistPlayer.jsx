import { useState, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { formatDuration } from '../utils/formatDuration';
import styles from './PlaylistPlayer.module.css';

const MOCK_SONGS = [
    {
        id: 1,
        title: 'Neon Lights',
        artist: 'The Future',
        album: 'Tomorrow Nights',
        duration: 213000,
        image: 'https://picsum.photos/300/300?random=1',
    },
    {
        id: 2,
        title: 'Midnight Drive',
        artist: 'City Sounds',
        album: 'Nightlife',
        duration: 187000,
        image: 'https://picsum.photos/300/300?random=2',
    },
    {
        id: 3,
        title: 'Ocean Waves',
        artist: 'Coastal Vibes',
        album: 'Beach Days',
        duration: 245000,
        image: 'https://picsum.photos/300/300?random=3',
    },
    {
        id: 4,
        title: 'Starlight',
        artist: 'Cosmic Dreams',
        album: 'Galaxy',
        duration: 301000,
        image: 'https://picsum.photos/300/300?random=4',
    },
    {
        id: 5,
        title: 'Golden Hour',
        artist: 'Sunset Lovers',
        album: 'Dawn to Dusk',
        duration: 198000,
        image: 'https://picsum.photos/300/300?random=5',
    },
];

export function PlaylistPlayer({ playlist }) {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [favorites, setFavorites] = useState([]);

    const handlePlaySong = (song) => {
        if (!currentSong || currentSong.id !== song.id) {
            setCurrentSong(song);
            setIsPlaying(true);
        }
        setCurrentTime(0);
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSkipBack = () => {
        if (currentTime > 30000) {
            setCurrentTime(prev => prev - 30000);
        }
    };

    const handleSkipForward = () => {
        setCurrentTime(prev => Math.min(prev + 30000, playlist.duration));
    };

    const handleFavorite = (id) => {
        setFavorites(prev => {
            if (prev.includes(id)) {
                return prev.filter(favId => favId !== id);
            }
            return [...prev, id];
        });
    };

    const handleLikeSong = (id) => {
        const song = MOCK_SONGS.find(s => s.id === id);
        if (song) {
            handleFavorite(song.id);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: playlist.name,
                text: `Check out ${playlist.name} on Spotify Clone`,
                url: window.location.href,
            }).catch(() => {});
        }
    };

    const handleSeek = (e) => {
        setCurrentTime(Number(e.target.value));
    };

    const handleNext = () => {
        const currentIndex = playlist.songs.findIndex(s => s.id === currentSong?.id);
        if (currentIndex < playlist.songs.length - 1) {
            setCurrentSong(playlist.songs[currentIndex + 1]);
            setIsPlaying(true);
        }
    };

    const handlePrev = () => {
        const currentIndex = playlist.songs.findIndex(s => s.id === currentSong?.id);
        if (currentIndex > 0) {
            setCurrentSong(playlist.songs[currentIndex - 1]);
            setIsPlaying(true);
        }
    };

    const totalLikes = useMemo(() => {
        return playlist.songs.reduce((acc, song) => acc + (song.likes || 0), 0);
    }, [playlist.songs]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.topRow}>
                    <div className={styles.iconWrapper}>
                        <img src={playlist.image} alt={playlist.name} className={styles.playlistImage} />
                    </div>
                    <div className={styles.info}>
                        <h2 className={styles.title}>
                            <span>{playlist.name}</span>
                            {currentSong && (
                                <span className={styles.playing}>{currentSong.title} • {playlist.name}</span>
                            )}
                        </h2>
                    </div>
                    <div className={styles.actions}>
                        <button
                            onClick={handleShare}
                            className={styles.iconButton}
                            title="Share"
                        >
                            <Share2 size={18} />
                        </button>
                        <button
                            onClick={handleLikeSong}
                            className={`${styles.iconButton} ${favorites.includes(currentSong?.id) ? styles.filled : ''}`}
                            title="Like"
                        >
                            <Heart size={18} fill={favorites.includes(currentSong?.id) ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            onClick={handleNext}
                            className={styles.iconButton}
                            title="Next song"
                        >
                            <SkipForward size={18} />
                        </button>
                        <button
                            onClick={handlePrev}
                            className={styles.iconButton}
                            title="Previous song"
                        >
                            <SkipBack size={18} />
                        </button>
                    </div>
                </div>
                <button className={styles.mainButton}>
                    {isPlaying && currentSong ? (
                        <Pause size={20} />
                    ) : (
                        <Play size={20} />
                    )}
                </button>
            </div>

            <div className={styles.songList}>
                {playlist.songs.map((song, index) => (
                    <div
                        key={song.id}
                        className={`${styles.songRow} ${currentSong?.id === song.id ? styles.playing : ''}`}
                    >
                        <div className={styles.index}>{index + 1}</div>
                        <div className={styles.songInfo}>
                            <img src={song.image} alt={song.title} className={styles.songImage} />
                            <div className={styles.songDetails}>
                                <div className={styles.songTitle}>
                                    <span>{song.title}</span>
                                    <button
                                        onClick={() => handleLikeSong(song.id)}
                                        className={styles.likedButton}
                                    >
                                        <Heart
                                            size={12}
                                            className={favorites.includes(song.id) ? styles.liked : ''}
                                        />
                                    </button>
                                </div>
                                <span className={styles.songArtist}>{song.artist}</span>
                                <span className={styles.albumName}>{song.album}</span>
                            </div>
                            <div className={styles.songDuration}>
                                {formatDuration(song.duration)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {currentSong && (
                <div className={styles.playerBar}>
                    <div className={styles.leftControls}>
                        <button onClick={handlePrev} className={styles.controlButton}>
                            <SkipBack size={16} />
                        </button>
                        <button
                            onClick={handlePlayPause}
                            className={styles.playButton}
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button onClick={handleSkipForward} className={styles.controlButton}>
                            <SkipForward size={16} />
                        </button>
                    </div>
                    <div className={styles.midSection}>
                        {currentSong && (
                            <img src={currentSong.image} alt={currentSong.title} className={styles.currentSongImage} />
                        )}
                        <div className={styles.timeline}>
                            <input
                                type="range"
                                min={0}
                                max={playlist.duration}
                                value={currentTime}
                                onChange={handleSeek}
                                className={styles.progressBar}
                            />
                            <div className={styles.timeInfo}>
                                <span className={styles.currentTime}>
                                    {formatDuration(currentTime)}
                                </span>
                                <span className={styles.totalTime}>
                                    {formatDuration(playlist.duration)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.rightControls}>
                        {favorites.includes(currentSong?.id) && (
                            <Heart className={styles.liked} size={16} />
                        )}
                        <span className={styles.totalLikes}>
                            {totalLikes}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlaylistPlayer;
