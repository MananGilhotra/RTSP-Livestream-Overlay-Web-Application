import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import VideoPlayer from './components/VideoPlayer';
import Overlay from './components/Overlay';
import ControlPanel from './components/ControlPanel';
import {
  getOverlays,
  createOverlay,
  deleteOverlay,
  setStreamSource,
  stopStream
} from './services/api';
import './App.css';

function MainApp() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authView, setAuthView] = useState('landing');
  const [streamActive, setStreamActive] = useState(false);
  const [currentSource, setCurrentSource] = useState('');

  useEffect(() => {
    if (isAuthenticated && streamActive) {
      fetchOverlays();
    }
  }, [isAuthenticated, streamActive]);

  const fetchOverlays = async (retries = 3, delay = 1000) => {
    try {
      if (retries === 3) setLoading(true);
      const data = await getOverlays();
      setOverlays(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching overlays:', err);
      if (retries > 0) {
        console.log(`Retrying fetch overlays... (${retries} attempts left)`);
        setTimeout(() => fetchOverlays(retries - 1, delay * 2), delay);
      } else {
        setError(err.message || 'Failed to load overlays.');
        setLoading(false);
      }
    }
  };

  const handleStartStream = async (source) => {
    try {
      await setStreamSource(source);
      setCurrentSource(source);
      setStreamActive(true);
    } catch (err) {
      throw err;
    }
  };

  const handleStopStream = async () => {
    try {
      await stopStream();
      setStreamActive(false);
      setCurrentSource('');
    } catch (err) {
      console.error('Error stopping stream:', err);
    }
  };

  const handleAddOverlay = async (overlayData) => {
    try {
      const newOverlay = await createOverlay(overlayData);
      setOverlays((prev) => [...prev, newOverlay]);
    } catch (err) {
      console.error('Error creating overlay:', err);
    }
  };

  const handleDeleteOverlay = async (id) => {
    try {
      await deleteOverlay(id);
      setOverlays((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error('Error deleting overlay:', err);
    }
  };

  const handleUpdateOverlay = (updatedOverlay) => {
    setOverlays((prev) =>
      prev.map((o) => (o._id === updatedOverlay._id ? updatedOverlay : o))
    );
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screens if not logged in
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onLogin={() => setAuthView('login')}
          onStartStream={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'login') {
      return <Login onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <Register onSwitchToLogin={() => setAuthView('login')} />;
  }

  // Show landing page if stream not active - FULLSCREEN
  if (!streamActive) {
    return (
      <LandingPage
        onStartStream={handleStartStream}
        user={user}
        onLogout={logout}
      />
    );
  }

  // Main app for authenticated users with active stream
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1>RTSP Livestream Overlay</h1>
          <span className="source-badge">
            {currentSource === '0' ? 'Webcam' : 'RTSP'}
          </span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-avatar">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button onClick={logout} className="logout-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="video-container">
          <VideoPlayer onStop={handleStopStream}>
            {overlays.map((overlay) => (
              <Overlay
                key={overlay._id}
                overlay={overlay}
                onUpdate={handleUpdateOverlay}
              />
            ))}
          </VideoPlayer>

          {loading && (
            <div className="status-overlay">
              <div className="loading-spinner"></div>
              <p>Loading overlays...</p>
            </div>
          )}
          {error && (
            <div className="status-overlay error">
              <p>{error}</p>
              <button onClick={fetchOverlays}>Retry</button>
            </div>
          )}
        </div>

        <ControlPanel
          overlays={overlays}
          onAdd={handleAddOverlay}
          onDelete={handleDeleteOverlay}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
