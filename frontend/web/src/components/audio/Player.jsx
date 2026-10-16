import { useState } from "react";

function Player({ songs, currentSong, isPlaying, playPause, next, prev, progress, setProgress, handleProgressChange, togglePlay, handlePrev, handleNext, toggleShuffle, toggleRepeat, shuffle, repeat, isLiked, toggleLike }) {
    return (
        <div className="player__content">
            <div className="player">
                <div className="now-playing">
                    <div className="now-playing__cover">
                        <img src={currentSong ? currentSong.cover : null} alt="now playing" />
                    </div>
                    <div className="now-playing__info">
                        <div className="now-playing__info-line">
                            <p className="now-playing__name">{currentSong ? currentSong.name : "No song is playing"}</p>
                            <p className="now-playing__author">{currentSong ? currentSong.author : null}</p>
                        </div>
                    </div>
                </div>
                <div className="player__controls">
                    <div className="player__icon-small">
                        <button onClick={toggleLike} className="player__heart">
                            <svg viewBox="0 0 32 32">
                                <path fill={isLiked ? "currentColor" : "#535353"} d="M23.995 23.298c-.187.22-.648.322-1.018.213-3.227-.943-6.03-3.053-7.85-5.959-1.82 2.906-4.623 5.016-7.85 5.959-.37.108-1.005.031-1.212-.589a2.332 2.332 0 0 1 .222-2.42c2.466-3.125 6.226-5.272 10.598-5.303 4.368.03 8.134 2.18 10.62 5.306a2.33 2.33 0 0 1 .227 2.42c.072.285-.042.42-.127.572Zm5.75 2.19c1.68-2.392 2.83-5.434 3.165-8.767.377-3.92-.865-7.652-3.342-10.394a11.15 11.15 0 0 0-3.868-2.894 11.152 11.152 0 0 0-4.321-.56c-1.157-.006-2.32.18-3.476.546a11.15 11.15 0 0 0-4.32 2.894c-2.48 2.744-3.72 6.48-3.346 10.406.335 3.334 1.48 6.376 3.156 8.766 1.04 1.696 2.555 3.14 4.383 4.134 1.828-.994 3.343-2.438 4.383-4.134ZM6.7 14.92c-1.65 2.368-2.78 5.387-3.105 8.686-.095.873.386 1.683 1.122 2.053.736.37 1.617.182 2.16-.463 1.115-1.44 1.85-3.212 2.117-5.227.27-2.015.073-4.006-.512-5.828C6.7 14.92 6.7 14.92 6.7 14.92Z" />
                            </svg>
                        </button>
                        <button className="player__icon-small">
                            <svg viewBox="0 0 32 32">
                                <path fill="#e0e0e0" d="M4.5 12.422h6.96l1.856 7.548 5.716-20.96h-6.95l-1.855 7.548-1.767-7.548H4.5Zm11.333 5.473v2.935l10.025 1.415v1.935l-10.025 1.465v2.91l-1.916-0.264-10.025-1.415V21.31l11.94 2.677v-7.964Z" />
                            </svg>
                        </button>
                        <button className="player__control">
                            <svg viewBox="0 0 32 32">
                                <path fill="currentColor" d={isPlaying ? "M10.5 17.57a2.5 2.5 0 0 1 12.3-2.5 2.5 2.5 0 0 1-12.3-2.5 2.5 2.5 0 0 1 12.3-2.5 2.5 2.5 0 0 1-12.3 2.5Z" : "M20 8a2.5 2.5 0 0 1 11 2A2.5 2.5 0 0 1 20 12a2.5 2.5 0 0 1-11-2A2.5 2.5 0 0 1 20 8Zm1.5 14.43l-1.916-7.964 3.904-1.41-1.54 6.178L21.5 22.42Zm-14.95 0l3.904-1.41-1.54-6.178 3.904 1.41-1.915 6.178Z"} />
                            </svg>
                        </button>
                        <button className="player__control">
                            <svg viewBox="0 0 32 32">
                                <path fill="currentColor" d="M8 10V22h7.11V20H9.91v-3.09h7.19v-2H8Zm20 0v10l-9.25 5.24V15.24L28 10Z" />
                            </svg>
                        </button>
                        <button className="player__control">
                            <svg viewBox="0 0 32 32">
                                <path fill="currentColor" d="M23 10V22h-7.1V20h5.8v-3.09H16.7v-2h7.3Zm-19 0v10l9.25 5.24V15.24L4 10Z" />
                            </svg>
                        </button>
                    </div>
                    <div className="player__progress">
                        <svg className="player__icon" viewBox="0 0 32 32">
                            <path fill="#404040" d="M26 0h2a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h20Z" />
                            <rect fill="none" x="1" y="1" width="28" height="28" />
                        </svg>
                        <div className="player__bar">
                            <div className="player__bar-inner">
                                <div className="player__bar-fill" style={{ width: progress }} />
                                <div className="player__bar-handle">
                                    <svg className="player__icon" viewBox="0 0 32 32">
                                        <path fill="#3b8edf" d="M22.614 17.213L20.234 19.423C20.788 21.135 21.24 22.987 21.64 24.964c0.352 1.712 0.538 3.518 0.538 5.395 0 1.844-0.173 3.616-0.528 5.297a0.885 0.885 0 0 1-0.163 0.352 0.827 0.827 0 0 1-0.315 0.24 0.827 0.827 0 0 1-0.382 0.096 0.822 0.822 0 0 1-0.338-0.056C17.926 29.792 16.228 27.862 15.846 26.184a2.002 2.002 0 0 1 0.428-1.814l2.38-2.21c-0.403-1.976-0.854-3.829-1.4-5.544-0.54-1.706-1.186-3.227-1.936-4.565 1.022-1.04 2.174-2.002 3.426-2.849 1.252-0.846 2.638-1.544 4.11-2.063a0.884 0.884 0 0 1 0.816 0.15 0.827 0.827 0 0 1 0.315 0.24 0.827 0.827 0 0 1 0.24 0.378 0.825 0.825 0 0 1 0.096 0.386c-0.553 1.712-0.81 3.38-0.81 4.994 0 1.606 0.256 3.272 0.81 4.994a0.885 0.885 0 0 1-0.162 0.882 0.827 0.827 0 0 1-0.315 0.24 0.827 0.827 0 0 1-0.382 0.096 0.825 0.825 0 0 1-0.338-0.056Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="player__time">
                            <p>{currentSong && currentSong.position !== null ? Math.floor(currentSong.position / 60) + ":" + String(currentSong.position % 60).padStart(2, "0") : "0:00"}</p>
                            <p>{currentSong && currentSong.duration !== null ? Math.floor(currentSong.duration / 60) + ":" + String(currentSong.duration % 60).padStart(2, "0") : "0:00"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Player;
