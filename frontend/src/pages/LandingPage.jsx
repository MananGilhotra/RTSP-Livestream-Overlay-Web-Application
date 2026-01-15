import { useState } from 'react';

/**
 * LandingPage Component
 * Premium full-screen landing page with two-column layout
 */
function LandingPage({ onStartStream, user, onLogout }) {
    const [rtspUrl, setRtspUrl] = useState('');
    const [useWebcam, setUseWebcam] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleStartStream = async () => {
        if (!useWebcam && !rtspUrl.trim()) {
            setError('Please enter an RTSP URL or use webcam');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const source = useWebcam ? '0' : rtspUrl.trim();
            await onStartStream(source);
        } catch (err) {
            setError(err.message || 'Failed to start stream');
            setLoading(false);
        }
    };

    return (
        <div className="landing-page fullscreen">
            {/* Animated background */}
            <div className="landing-bg">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
                <div className="grid-pattern"></div>
            </div>

            {/* Top Bar */}
            <div className="landing-topbar">
                <div className="topbar-left">
                    <div className="topbar-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="topbar-brand">StreamOverlay</span>
                </div>
                {user && (
                    <div className="topbar-right">
                        <div className="topbar-user">
                            <span className="topbar-avatar">{user.email?.charAt(0).toUpperCase()}</span>
                            <span className="topbar-email">{user.email}</span>
                        </div>
                        <button onClick={onLogout} className="topbar-logout">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Two Column Layout */}
            <div className="landing-split">
                {/* Left Column - Hero */}
                <div className="landing-left">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="badge-dot"></span>
                            Live Streaming Platform
                        </div>

                        <h1 className="hero-title">
                            <span className="title-gradient">RTSP Livestream</span>
                            <br />
                            <span className="title-white">Overlay Studio</span>
                        </h1>

                        <p className="hero-description">
                            Transform your live streams with dynamic overlays. Add text, images,
                            and graphics in real-time with our powerful drag-and-drop editor.
                        </p>

                        {/* Feature Cards */}
                        <div className="feature-cards">
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>Live Streaming</h4>
                                    <p>RTSP & webcam support</p>
                                </div>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="9" y1="3" x2="9" y2="21" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>Custom Overlays</h4>
                                    <p>Text & image layers</p>
                                </div>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="5 9 2 12 5 15" />
                                        <polyline points="9 5 12 2 15 5" />
                                        <polyline points="15 19 12 22 9 19" />
                                        <polyline points="19 9 22 12 19 15" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <line x1="12" y1="2" x2="12" y2="22" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>Drag & Drop</h4>
                                    <p>Intuitive positioning</p>
                                </div>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <div>
                                    <h4>Resizable</h4>
                                    <p>Fully adjustable sizes</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <span className="stat-number">4K</span>
                                <span className="stat-text">Quality</span>
                            </div>
                            <div className="hero-stat">
                                <span className="stat-number">&lt;1s</span>
                                <span className="stat-text">Latency</span>
                            </div>
                            <div className="hero-stat">
                                <span className="stat-number">∞</span>
                                <span className="stat-text">Overlays</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stream Card */}
                <div className="landing-right">
                    <div className="stream-card-wrapper">
                        <div className="stream-card large">
                            <div className="card-glow"></div>

                            <div className="card-header">
                                <div className="card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2>Start Streaming</h2>
                                    <p>Choose your video source</p>
                                </div>
                            </div>

                            {error && <div className="card-error">{error}</div>}

                            {/* Source Toggle */}
                            <div className="source-tabs">
                                <button
                                    className={`tab ${!useWebcam ? 'active' : ''}`}
                                    onClick={() => setUseWebcam(false)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polygon points="10 8 16 12 10 16 10 8" />
                                    </svg>
                                    RTSP Stream
                                </button>
                                <button
                                    className={`tab ${useWebcam ? 'active' : ''}`}
                                    onClick={() => setUseWebcam(true)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Webcam
                                </button>
                            </div>

                            {/* RTSP URL Input */}
                            {!useWebcam && (
                                <div className="url-section">
                                    <label>Stream URL</label>
                                    <div className="url-input-wrapper">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={rtspUrl}
                                            onChange={(e) => setRtspUrl(e.target.value)}
                                            placeholder="rtsp://example.com/stream"
                                        />
                                    </div>
                                    <span className="url-hint">
                                        Enter your RTSP stream URL or use RTSP.me for testing
                                    </span>
                                </div>
                            )}

                            {/* Webcam Preview */}
                            {useWebcam && (
                                <div className="webcam-section">
                                    <div className="webcam-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </div>
                                    <h3>Device Camera</h3>
                                    <p>Stream directly from your webcam</p>
                                </div>
                            )}

                            {/* Start Button */}
                            <button
                                onClick={handleStartStream}
                                className="start-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                        Start Livestream
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Preview mockup */}
                        <div className="preview-mockup">
                            <div className="mockup-header">
                                <div className="mockup-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <span className="mockup-title">Live Preview</span>
                            </div>
                            <div className="mockup-content">
                                <div className="mockup-video">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="mockup-overlay text">Hello World</div>
                                <div className="mockup-overlay image">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;
