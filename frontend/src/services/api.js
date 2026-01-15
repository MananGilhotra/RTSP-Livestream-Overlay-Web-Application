const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create headers with auth token
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
});

// ==================== AUTH API ====================

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
};

export const register = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  return response.json();
};

// ==================== OVERLAY API ====================

export const getOverlays = async () => {
  const response = await fetch(`${API_BASE_URL}/api/overlays`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch overlays');
  }
  return response.json();
};

export const createOverlay = async (overlay) => {
  const response = await fetch(`${API_BASE_URL}/api/overlays`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(overlay),
  });
  if (!response.ok) {
    throw new Error('Failed to create overlay');
  }
  return response.json();
};

export const updateOverlay = async (id, updates) => {
  const response = await fetch(`${API_BASE_URL}/api/overlays/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update overlay');
  }
  return response.json();
};

export const deleteOverlay = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/overlays/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete overlay');
  }
  return response.json();
};

// ==================== IMAGE UPLOAD ====================

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data;
};

// ==================== STREAM CONTROL ====================

export const setStreamSource = async (source) => {
  const response = await fetch(`${API_BASE_URL}/api/stream/source`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to set stream source');
  }
  return data;
};

export const getStreamSource = async () => {
  const response = await fetch(`${API_BASE_URL}/api/stream/source`);
  return response.json();
};

export const stopStream = async () => {
  const response = await fetch(`${API_BASE_URL}/api/stream/stop`, {
    method: 'POST',
  });
  return response.json();
};

export const getVideoFeedUrl = () => `${API_BASE_URL}/video_feed`;
