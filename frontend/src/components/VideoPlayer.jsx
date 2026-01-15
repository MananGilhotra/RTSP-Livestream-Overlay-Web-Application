import { useState, useRef, useEffect } from 'react';
import { getVideoFeedUrl } from '../services/api';

/**
 * VideoPlayer Component
 * Displays video stream with playback controls
 */
function VideoPlayer({ children, onStop }) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const imgRef = useRef(null);

    // Since MJPEG is displayed in an img tag, we simulate play/pause
    // by showing/hiding the stream
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="video-player">
            <div className="video-wrapper">
                {/* Back Button Overlay */}
                <button onClick={onStop} className="back-overlay-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                {isPlaying ? (
                    <img
                        ref={imgRef}
                        src={getVideoFeedUrl()}
                        alt="Video Stream"
                        className="video-stream"
                    />
                ) : (
                    <div className="video-paused">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        <p>Stream Paused</p>
                    </div>
                )}

                {/* Overlay layer */}
                <div className="overlay-layer">
                    {children}
                </div>
            </div>

            {/* Playback Controls */}
            <div className="playback-controls">
                <div className="controls-left">
                    <button onClick={handlePlayPause} className="control-btn play-btn">
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        )}
                    </button>

                    <button onClick={onStop} className="control-btn stop-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                    </button>

                    <div className="volume-control">
                        <button onClick={toggleMute} className="control-btn volume-btn">
                            {isMuted || volume === 0 ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>
                </div>

                <div className="controls-right">
                    <span className="live-indicator">
                        <span className="live-dot"></span>
                        LIVE
                    </span>
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;
