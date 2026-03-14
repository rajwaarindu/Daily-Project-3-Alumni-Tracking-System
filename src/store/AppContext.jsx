import React, { createContext, useContext, useState } from 'react';
import { MOCK_ALUMNI, MOCK_LOGS, MOCK_REVIEWS, MOCK_SOURCES } from './MockData';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [alumni, setAlumni] = useState(MOCK_ALUMNI);
  const [sources, setSources] = useState(MOCK_SOURCES);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [logs, setLogs] = useState(MOCK_LOGS);

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

  const addAlumni = (newAlumni) => {
    setAlumni(prev => [...prev, { ...newAlumni, id: `A00${prev.length + 1}` }]);
    addLog(`Alumni baru ditambahkan: ${newAlumni.nama_lengkap}`, 'info');
  };

  const updateAlumni = (id, updatedData) => {
    setAlumni(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
    addLog(`Data alumni diperbarui: ${updatedData.nama_lengkap || id}`, 'info');
  };

  const deleteAlumni = (id) => {
    const target = alumni.find(a => a.id === id);
    if (target) {
      setAlumni(prev => prev.filter(a => a.id !== id));
      addLog(`Data alumni dihapus: ${target.nama_lengkap}`, 'warning');
    }
  };

  const value = {
    alumni, setAlumni,
    sources, setSources,
    reviews, setReviews,
    logs, setLogs,
    stats,
    addLog,
    updateAlumniStatus,
    addAlumni,
    updateAlumni,
    deleteAlumni
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
