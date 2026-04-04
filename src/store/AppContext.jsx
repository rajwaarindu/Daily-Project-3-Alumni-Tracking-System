import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_ALUMNI, MOCK_LOGS, MOCK_REVIEWS, MOCK_SOURCES } from './MockData';

const AppContext = createContext();
const AUTH_TOKEN_KEY = 'alumtrack.authToken';

const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Permintaan gagal diproses.');
  }

  return data;
};

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [alumni, setAlumni] = useState([]);
  const [sources, setSources] = useState(MOCK_SOURCES);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [alumniLoading, setAlumniLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        if (isMounted) {
          setAuthReady(true);
        }
        return;
      }

      try {
        const data = await apiRequest('/auth/me');
        if (isMounted) {
          setAuthUser(data.user);
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        if (isMounted) {
          setAuthUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadAlumni = async () => {
    setAlumniLoading(true);
    try {
      const data = await apiRequest('/alumni');
      setAlumni(Array.isArray(data.alumni) ? data.alumni : []);
    } finally {
      setAlumniLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!authUser) {
      setAlumni([]);
      return;
    }

    loadAlumni().catch((error) => {
      addLog(error.message || 'Gagal memuat data alumni dari database.', 'error');
    });
  }, [authReady, authUser]);

  // Stats
  const stats = {
    total: alumni.length,
    identified: alumni.filter(a => a.status_pelacakan === 'Teridentifikasi dari sumber publik').length,
    needReview: alumni.filter(a => a.status_pelacakan === 'Perlu Verifikasi Manual' || reviews.some(r => r.alumni_id === a.id)).length,
    untracked: alumni.filter(a => a.status_pelacakan === 'Belum Dilacak').length
  };

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Date.now(),
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const updateAlumniStatus = (id, status, hasil = null) => {
    setAlumni(prev => prev.map(a => 
      a.id === id ? { ...a, status_pelacakan: status, hasil: hasil || a.hasil, last_tracked_date: new Date().toISOString().split('T')[0] } : a
    ));
    addLog(`Status profil ${alumni.find(a => a.id === id)?.nama_lengkap} diperbarui menjadi ${status}`, 'success');
  };

  const addAlumni = async (newAlumni) => {
    const data = await apiRequest('/alumni', {
      method: 'POST',
      body: JSON.stringify(newAlumni),
    });

    setAlumni(prev => [...prev, data.alumni]);
    addLog(`Alumni baru ditambahkan: ${newAlumni.nama_lengkap}`, 'info');
    return data.alumni;
  };

  const updateAlumni = async (id, updatedData) => {
    const data = await apiRequest(`/alumni/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData),
    });

    setAlumni(prev => prev.map(a => a.id === id ? data.alumni : a));
    addLog(`Data alumni diperbarui: ${updatedData.nama_lengkap || id}`, 'info');
    return data.alumni;
  };

  const deleteAlumni = async (id) => {
    const target = alumni.find(a => a.id === id);
    await apiRequest(`/alumni/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    setAlumni(prev => prev.filter(a => a.id !== id));
    if (target) {
      addLog(`Data alumni dihapus: ${target.nama_lengkap}`, 'warning');
    }
  };

  const verifyAlumniPpdikti = async (id, verified, detail = null) => {
    const data = await apiRequest(`/alumni/${encodeURIComponent(id)}/ppdikti-verify`, {
      method: 'POST',
      body: JSON.stringify({ verified, detail }),
    });

    setAlumni(prev => prev.map(a => a.id === id ? data.alumni : a));
    addLog(
      `Verifikasi PPDIKTI untuk ${data.alumni.nama_lengkap}: ${verified ? 'Terverifikasi' : 'Belum Terverifikasi'}`,
      verified ? 'success' : 'warning'
    );

    return data.alumni;
  };

  const storeSession = (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
  };

  const signIn = async ({ email, password }) => {
    const data = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    storeSession(data.token, data.user);
    return data.user;
  };

  const signUp = async ({ name, email, password }) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    storeSession(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Session may already be gone; clear local state regardless.
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthUser(null);
    }
  };

  const value = {
    authUser,
    authReady,
    signIn,
    signUp,
    logout,
    alumni, setAlumni,
    sources, setSources,
    reviews, setReviews,
    logs, setLogs,
    alumniLoading,
    loadAlumni,
    stats,
    addLog,
    updateAlumniStatus,
    addAlumni,
    updateAlumni,
    deleteAlumni,
    verifyAlumniPpdikti
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
